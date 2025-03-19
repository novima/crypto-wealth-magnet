
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { 
  getTradableUsdtPairs, 
  getAccountBalance
} from '@/utils/binanceApi';

export interface ApiConfig {
  exchange: string;
  apiKey: string;
  apiSecret: string;
}

export interface Trade {
  id: number;
  timestamp: Date;
  operation: 'buy' | 'sell';
  market: string;
  amount: number;
  success: boolean;
  balanceAfter: number;
  message: string;
  profitReserved?: number;
}

export const useTradingState = (
  apiConfig: ApiConfig,
  initialAmount: number
) => {
  const [currentBalance, setCurrentBalance] = useState<number>(initialAmount);
  const [isTrading, setIsTrading] = useState<boolean>(false);
  const [autoTradeEnabled, setAutoTradeEnabled] = useState<boolean>(true);
  const [tradeHistory, setTradeHistory] = useState<Trade[]>([]);
  const [tradeCount, setTradeCount] = useState<number>(0);
  const [targetReached, setTargetReached] = useState<boolean>(false);
  const [dailyTargetReached, setDailyTargetReached] = useState<boolean>(false);
  const [dayCount, setDayCount] = useState<number>(1);
  const [tradeSpeed, setTradeSpeed] = useState<number>(5);
  const [totalProfitReserved, setTotalProfitReserved] = useState<number>(0);
  const [availableMarkets, setAvailableMarkets] = useState<string[]>([]);
  const [volatileMarkets, setVolatileMarkets] = useState<string[]>([]);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [lastFailedAttempt, setLastFailedAttempt] = useState<Date | null>(null);
  const [consecutiveFailures, setConsecutiveFailures] = useState<number>(0);
  const { toast } = useToast();

  // Initialize trading state and fetch real balance from Binance
  useEffect(() => {
    const initializeTrading = async () => {
      if (!apiConfig.apiKey || !apiConfig.apiSecret) {
        toast({
          title: "API-konfiguration saknas",
          description: "Vänligen konfigurera dina API-nycklar först.",
          variant: "destructive"
        });
        setIsInitializing(false);
        return;
      }

      try {
        setIsInitializing(true);
        
        const tradablePairs = await getTradableUsdtPairs(apiConfig.apiKey);
        setAvailableMarkets(tradablePairs);
        
        // Fetch actual Binance balance
        await updateActualBalance();
        
      } catch (error) {
        console.error("Initialiseringsfel:", error);
        toast({
          title: "Kunde inte hämta saldo",
          description: "Ett fel uppstod vid anslutning till Binance. Kontrollera dina API-nycklar och internetanslutning.",
          variant: "destructive"
        });
        // Fallback to initial amount if fetching fails
        setCurrentBalance(initialAmount);
      } finally {
        setIsInitializing(false);
      }
    };
    
    initializeTrading();
  }, [apiConfig.apiKey, apiConfig.apiSecret, toast, initialAmount]);

  // Function to update balance from Binance
  const updateActualBalance = async () => {
    try {
      if (!apiConfig.apiKey || !apiConfig.apiSecret) {
        return;
      }
      
      const balances = await getAccountBalance(apiConfig.apiKey, apiConfig.apiSecret);
      const usdtBalance = balances.find((b: any) => b.asset === 'USDT');
      
      if (usdtBalance) {
        const freeBalance = parseFloat(usdtBalance.free);
        setCurrentBalance(freeBalance);
        toast({
          title: "Saldo uppdaterat",
          description: `Ditt tillgängliga saldo är ${freeBalance.toFixed(2)} USDT.`,
        });
      }
    } catch (error) {
      console.error("Fel vid hämtning av saldo:", error);
    }
  };

  return {
    currentBalance,
    setCurrentBalance,
    isTrading,
    setIsTrading,
    autoTradeEnabled,
    setAutoTradeEnabled,
    tradeHistory,
    setTradeHistory,
    tradeCount,
    setTradeCount,
    targetReached,
    setTargetReached,
    dailyTargetReached,
    setDailyTargetReached,
    dayCount,
    setDayCount,
    tradeSpeed,
    setTradeSpeed,
    totalProfitReserved,
    setTotalProfitReserved,
    availableMarkets,
    setAvailableMarkets, 
    volatileMarkets,
    setVolatileMarkets,
    isInitializing,
    setIsInitializing,
    lastFailedAttempt,
    setLastFailedAttempt,
    consecutiveFailures,
    setConsecutiveFailures,
    updateActualBalance,
    toast
  };
};
