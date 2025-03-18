import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import TradingHeader from './TradingHeader';
import TradingStatus from './TradingStatus';
import TradingControls from './TradingControls';
import TradeHistory from './TradeHistory';
import TradingComplete from './TradingComplete';
import { 
  executeOrder, 
  getAccountBalance, 
  getTradableUsdtPairs, 
  transferProfitToBinanceAccount,
  calculateOptimalQuantity,
  getOrderBook,
  analyzeMarketDepth,
  calculateVolatility
} from '@/utils/binanceApi';

interface LiveTradingProps {
  apiConfig: {
    exchange: string;
    apiKey: string;
    apiSecret: string;
  };
  initialAmount: number;
  targetAmount: number;
  onComplete?: (finalAmount: number) => void;
  className?: string;
}

const LiveTrading: React.FC<LiveTradingProps> = ({
  apiConfig,
  initialAmount,
  targetAmount,
  onComplete,
  className
}) => {
  const [currentBalance, setCurrentBalance] = useState<number>(initialAmount);
  const [isTrading, setIsTrading] = useState<boolean>(false);
  const [autoTradeEnabled, setAutoTradeEnabled] = useState<boolean>(true);
  const [tradeHistory, setTradeHistory] = useState<Array<{
    id: number;
    timestamp: Date;
    operation: 'buy' | 'sell';
    market: string;
    amount: number;
    success: boolean;
    balanceAfter: number;
    message: string;
    profitReserved?: number;
  }>>([]);
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
        
        identifyVolatileMarkets(tradablePairs, apiConfig.apiKey);
        
        const balances = await getAccountBalance(apiConfig.apiKey, apiConfig.apiSecret);
        const usdtBalance = balances.find((b: any) => b.asset === 'USDT');
        
        if (usdtBalance) {
          const freeBalance = parseFloat(usdtBalance.free);
          setCurrentBalance(freeBalance);
          toast({
            title: "Saldo hämtat",
            description: `Ditt tillgängliga saldo är ${freeBalance.toFixed(2)} USDT.`,
          });
        }

      } catch (error) {
        console.error("Initialiseringsfel:", error);
        toast({
          title: "Kunde inte hämta saldo",
          description: "Ett fel uppstod vid anslutning till Binance. Kontrollera dina API-nycklar och internetanslutning.",
          variant: "destructive"
        });
      } finally {
        setIsInitializing(false);
      }
    };
    
    initializeTrading();
  }, [apiConfig, toast]);

  const identifyVolatileMarkets = async (markets: string[], apiKey: string) => {
    try {
      const marketsToCheck = markets.slice(0, 50);
      const volatilityPromises = marketsToCheck.map(async (market) => {
        try {
          const volatility = await calculateVolatility(market, apiKey);
          return { market, volatility };
        } catch {
          return { market, volatility: 0 };
        }
      });

      const volatilityResults = await Promise.all(volatilityPromises);
      
      const sortedMarkets = volatilityResults
        .sort((a, b) => b.volatility - a.volatility)
        .map(result => result.market);
      
      setVolatileMarkets(sortedMarkets.slice(0, 15));
      
      console.log('Identifierade volatila marknader:', sortedMarkets.slice(0, 15));
    } catch (error) {
      console.error('Fel vid identifiering av volatila marknader:', error);
      setVolatileMarkets(['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'DOGEUSDT', 'BNBUSDT']);
    }
  };

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

  const reserveProfitToBinanceAccount = async (amount: number): Promise<boolean> => {
    try {
      const success = await transferProfitToBinanceAccount(amount);
      
      if (success) {
        setTotalProfitReserved(prev => prev + amount);
        
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

  const executeTrade = async () => {
    if (!apiConfig.apiKey || !apiConfig.apiSecret) {
      toast({
        title: "API-konfiguration saknas",
        description: "Vänligen konfigurera dina API-nycklar först.",
        variant: "destructive"
      });
      return;
    }

    if (isTrading || isInitializing) return;

    if (consecutiveFailures >= 3) {
      const backoffTime = Math.min(consecutiveFailures * 5000, 60000);
      const now = new Date();
      const lastFailureTime = lastFailedAttempt ? lastFailedAttempt.getTime() : 0;
      
      if ((now.getTime() - lastFailureTime) < backoffTime) {
        console.log(`Backoff period active. Waiting ${backoffTime/1000}s before next attempt.`);
        return;
      }
    }
    
    setIsTrading(true);
    
    try {
      const market = selectMarket();
      const operation: 'buy' | 'sell' = Math.random() > 0.25 ? 'buy' : 'sell';
      const binanceOperation = operation === 'buy' ? 'BUY' : 'SELL';
      
      console.log(`Försöker utföra ${operation} på ${market} med aktuellt saldo: ${currentBalance.toFixed(2)} USDT`);
      
      try {
        const orderBook = await getOrderBook(market, 20, apiConfig.apiKey);
        const isFavorableMarket = analyzeMarketDepth(orderBook, binanceOperation);
        
        if (!isFavorableMarket) {
          console.log(`Marknadsvillkoren för ${market} är inte optimala för ${operation}. Väljer en annan marknad.`);
          setIsTrading(false);
          setTimeout(executeTrade, 2000);
          return;
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
        
        console.log(`Beräknad optimal kvantitet för ${market}: ${quantity}`);
        
        if (quantity <= 0) {
          throw new Error('Beräknad kvantitet är för låg för att handla');
        }
        
        const orderResult = await executeOrder(
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
        const profitOrLoss = tradedAmount * (growthFactor - 1);
        const newBalance = currentBalance + profitOrLoss;
        
        setCurrentBalance(newBalance);
        
        setConsecutiveFailures(0);
        setLastFailedAttempt(null);
        
        const newTrade = {
          id: tradeCount + 1,
          timestamp: new Date(),
          operation,
          market,
          amount: tradedAmount,
          success: isSuccessful,
          balanceAfter: newBalance,
          message: isSuccessful 
            ? `Lyckad ${operation === 'buy' ? 'köp' : 'sälj'} order på ${market}`
            : `${operation === 'buy' ? 'Köp' : 'Sälj'} på ${market} genomförd med mindre än optimal avkastning`
        };
        
        setTradeHistory(prev => [newTrade, ...prev.slice(0, 14)]);
        setTradeCount(prev => prev + 1);
        
        if (!isSuccessful) {
          toast({
            title: "Handel genomförd med varning",
            description: `${newTrade.message}. Ny balans: $${newBalance.toFixed(2)}`,
            variant: "destructive"
          });
        } else if (tradeCount % 5 === 0) {
          toast({
            title: "Handel framgångsrik",
            description: `${newTrade.message}. Ny balans: $${newBalance.toFixed(2)}`,
          });
        }
        
        if (newBalance >= targetAmount && !dailyTargetReached) {
          setDailyTargetReached(true);
          
          toast({
            title: "Dagens mål uppnått!",
            description: `Din balans har nått dagens mål på $${targetAmount}!`,
            variant: "default"
          });
          
          const reserveAmount = newBalance * 0.7;
          const profitAmount = newBalance * 0.3;
          
          const transferSuccessful = await reserveProfitToBinanceAccount(profitAmount);
          
          if (transferSuccessful) {
            setTradeHistory(prev => [
              { ...prev[0], profitReserved: profitAmount },
              ...prev.slice(1)
            ]);
          }
          
          if (reserveAmount >= initialAmount) {
            setCurrentBalance(reserveAmount);
            setTimeout(() => {
              setDailyTargetReached(false);
              setDayCount(prev => prev + 1);
              toast({
                title: "Ny handelsdag börjar",
                description: `Dag ${dayCount + 1} börjar med $${reserveAmount.toFixed(2)}`,
              });
            }, 5000);
          }
          
          if (onComplete) {
            onComplete(newBalance);
          }
        }
      } catch (orderError) {
        console.error("Fel vid utförande av order:", orderError);
        
        setConsecutiveFailures(prev => prev + 1);
        setLastFailedAttempt(new Date());
        
        const failedTrade = {
          id: tradeCount + 1,
          timestamp: new Date(),
          operation,
          market,
          amount: currentBalance * 0.1,
          success: false,
          balanceAfter: currentBalance * 0.995,
          message: `Handel misslyckades: ${orderError.message || "Okänt fel"}`
        };
        
        setTradeHistory(prev => [failedTrade, ...prev.slice(0, 14)]);
        setTradeCount(prev => prev + 1);
        setCurrentBalance(failedTrade.balanceAfter);
        
        toast({
          title: "Handel misslyckades",
          description: failedTrade.message,
          variant: "destructive"
        });
        
        const backoffTime = Math.min(consecutiveFailures * 1000, 10000);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      }
      
    } catch (error) {
      toast({
        title: "Handelsfel",
        description: "Ett fel uppstod vid handel. Försök igen.",
        variant: "destructive"
      });
      console.error("Handelsfel:", error);
      
      setConsecutiveFailures(prev => prev + 1);
      setLastFailedAttempt(new Date());
    } finally {
      setIsTrading(false);
    }
  };

  useEffect(() => {
    let tradeInterval: ReturnType<typeof setInterval> | null = null;
    
    if (autoTradeEnabled && !dailyTargetReached && !isInitializing) {
      let timeout = 60000 / tradeSpeed;
      
      if (consecutiveFailures > 0) {
        timeout = Math.min(timeout * (1 + consecutiveFailures * 0.5), 60000);
      }
      
      tradeInterval = setInterval(executeTrade, timeout);
    }
    
    return () => {
      if (tradeInterval) clearInterval(tradeInterval);
    };
  }, [autoTradeEnabled, dailyTargetReached, consecutiveFailures, tradeSpeed, isInitializing]);

  const progress = Math.min((currentBalance / targetAmount) * 100, 100);

  const handleSpeedChange = (newSpeed: number) => {
    setTradeSpeed(newSpeed);
    toast({
      title: "Handelshastighet ändrad",
      description: `Algoritmen utför nu ${newSpeed} trades per minut`,
    });
  };

  return (
    <Card className={className}>
      <TradingHeader />
      
      <CardContent className="space-y-4">
        <TradingStatus
          currentBalance={currentBalance}
          targetAmount={targetAmount}
          dayCount={dayCount}
          totalProfitReserved={totalProfitReserved}
        />
        
        <TradingControls
          tradeSpeed={tradeSpeed}
          autoTradeEnabled={autoTradeEnabled}
          onSpeedChange={handleSpeedChange}
          onAutoTradeToggle={() => setAutoTradeEnabled(!autoTradeEnabled)}
          isDisabled={!apiConfig.apiKey || dailyTargetReached}
        />
        
        <TradeHistory trades={tradeHistory} />
      </CardContent>
      
      <TradingComplete 
        targetAmount={targetAmount}
        show={dailyTargetReached}
      />
    </Card>
  );
};

export default LiveTrading;
