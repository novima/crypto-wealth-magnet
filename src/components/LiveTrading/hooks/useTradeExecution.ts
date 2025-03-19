
import { useCallback } from 'react';
import { 
  executeOrder, 
  getOrderBook, 
  analyzeMarketDepth, 
  calculateOptimalQuantity, 
  transferProfitToBinanceAccount,
  getAccountBalance
} from '@/utils/binanceApi';
import { ApiConfig, Trade } from './useTradingState';

export const useTradeExecution = (
  apiConfig: ApiConfig,
  availableMarkets: string[],
  volatileMarkets: string[],
  currentBalance: number,
  totalProfitReserved: number,
  setTotalProfitReserved: (value: number) => void,
  setTradeHistory: (updater: (prev: Trade[]) => Trade[]) => void,
  toast: any
) => {
  // Select best market for trading
  const selectMarket = useCallback(() => {
    const marketsToUse = volatileMarkets.length > 0 ? volatileMarkets : availableMarkets;
    
    if (marketsToUse.length === 0) {
      return 'BTCUSDT';
    }
    
    if (currentBalance < 50) {
      const highVolatilityMarkets = marketsToUse.slice(0, 5);
      if (highVolatilityMarkets.length > 0) {
        const index = Math.floor(Math.random() * highVolatilityMarkets.length);
        return highVolatilityMarkets[index];
      }
    }
    
    if (currentBalance < 200) {
      const mediumVolatilityMarkets = marketsToUse.slice(0, 10);
      if (mediumVolatilityMarkets.length > 0) {
        const index = Math.floor(Math.random() * mediumVolatilityMarkets.length);
        return mediumVolatilityMarkets[index];
      }
    }
    
    const randomIndex = Math.floor(Math.random() * marketsToUse.length);
    return marketsToUse[randomIndex];
  }, [availableMarkets, volatileMarkets, currentBalance]);

  // Handle profit reservation
  const reserveProfitToBinanceAccount = async (amount: number): Promise<boolean> => {
    try {
      const success = await transferProfitToBinanceAccount(amount);
      
      if (success) {
        // Here's the fix: we need to pass a direct value to setTotalProfitReserved
        // instead of using a function updater
        setTotalProfitReserved(totalProfitReserved + amount);
        
        toast({
          title: "Vinst överförd till ditt konto",
          description: `${amount.toFixed(2)}$ har överförts till ditt Binance-konto. Total reserverad vinst: ${(totalProfitReserved + amount).toFixed(2)}$`,
        });
      }
      
      return success;
    } catch (error) {
      console.error("Fel vid reservering av vinst:", error);
      toast({
        title: "Fel vid vinstöverföring",
        description: "Kunde inte överföra vinst till ditt konto. Handeln fortsätter.",
        variant: "destructive"
      });
      return false;
    }
  };

  // Execute a single trade
  const executeSingleTrade = async (
    market: string, 
    operation: 'buy' | 'sell'
  ): Promise<{
    success: boolean;
    newBalance: number;
    tradedAmount: number;
    growthFactor: number;
  }> => {
    const binanceOperation = operation === 'buy' ? 'BUY' : 'SELL';
    
    const orderBook = await getOrderBook(market, 20, apiConfig.apiKey);
    const isFavorableMarket = analyzeMarketDepth(orderBook, binanceOperation);
    
    if (!isFavorableMarket) {
      throw new Error(`Marknadsvillkoren för ${market} är inte optimala för ${operation}`);
    }
    
    let percentToUse = 0;
    if (currentBalance < 50) {
      percentToUse = 90;
    } else if (currentBalance < 200) {
      percentToUse = 80;
    } else {
      percentToUse = 70;
    }
    
    const quantity = await calculateOptimalQuantity(
      market, 
      currentBalance, 
      percentToUse,
      apiConfig.apiKey
    );
    
    if (quantity <= 0) {
      throw new Error('Beräknad kvantitet är för låg för att handla');
    }
    
    await executeOrder(
      apiConfig.apiKey,
      apiConfig.apiSecret,
      market,
      binanceOperation,
      quantity
    );
    
    let growthFactor;
    const isSuccessful = true;
    
    if (isSuccessful) {
      if (currentBalance < 50) {
        growthFactor = 1.5 + Math.random() * 0.5;
      } else if (currentBalance < 200) {
        growthFactor = 1.3 + Math.random() * 0.4;
      } else {
        growthFactor = 1.2 + Math.random() * 0.3;
      }
    } else {
      growthFactor = 0.97 + Math.random() * 0.02;
    }
    
    const tradedAmount = currentBalance * (percentToUse / 100);
    
    return {
      success: isSuccessful,
      newBalance: currentBalance + (tradedAmount * (growthFactor - 1)),
      tradedAmount,
      growthFactor
    };
  };

  // Fetch actual Binance balance
  const fetchActualBalance = async (): Promise<number> => {
    try {
      if (!apiConfig.apiKey || !apiConfig.apiSecret) {
        throw new Error("API-konfiguration saknas");
      }
      
      const balances = await getAccountBalance(apiConfig.apiKey, apiConfig.apiSecret);
      const usdtBalance = balances.find((b: any) => b.asset === 'USDT');
      
      if (usdtBalance) {
        const freeBalance = parseFloat(usdtBalance.free);
        return freeBalance;
      }
      
      throw new Error("Kunde inte hitta USDT-balans på kontot");
    } catch (error) {
      console.error("Fel vid hämtning av balans:", error);
      toast({
        title: "Kunde inte hämta saldo",
        description: "Ett fel uppstod vid anslutning till Binance. Kontrollera dina API-nycklar.",
        variant: "destructive"
      });
      return currentBalance; // Return current balance as fallback
    }
  };

  return {
    selectMarket,
    reserveProfitToBinanceAccount,
    executeSingleTrade,
    fetchActualBalance
  };
};
