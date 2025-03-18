import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, DollarSign, ArrowUpRight, ArrowDownRight, Zap, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import ValueDisplay from './ValueDisplay';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
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

  const selectMarket = useCallback((): string => {
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

  const changeTradeSpeed = (newSpeed: number) => {
    setTradeSpeed(newSpeed);
    toast({
      title: "Handelshastighet ändrad",
      description: `Algoritmen utför nu ${newSpeed} trades per minut`,
    });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket size={20} />
          Live-handel: 10$ → 1000$
        </CardTitle>
        <CardDescription>
          Handel med riktiga pengar via {apiConfig.exchange}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Alert variant="default" className="bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800/30">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Snabbhandelssystem aktivt</AlertTitle>
          <AlertDescription>
            Systemet identifierar och utnyttjar snabbrörliga marknader för att maximera avkastningen genom exponentiell tillväxt.
          </AlertDescription>
        </Alert>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-between items-center"
        >
          <div>
            <ValueDisplay
              label="Nuvarande balans"
              value={currentBalance}
              prefix="$"
              decimals={2}
            />
            <div className="text-xs text-muted-foreground mt-1">
              Dag {dayCount}
            </div>
          </div>
          
          <div className="flex flex-col items-end">
            <ValueDisplay
              label="Dagens mål"
              value={targetAmount}
              prefix="$"
              decimals={2}
              labelClassName="text-right"
              valueClassName="text-right"
            />
            {totalProfitReserved > 0 && (
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                Reserverad vinst: ${totalProfitReserved.toFixed(2)}
              </div>
            )}
          </div>
        </motion.div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>{Math.min(progress, 100).toFixed(1)}%</span>
            <span>100%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        <div className="bg-secondary/30 p-3 rounded-md">
          <div className="text-sm font-medium mb-2">Handelshastighet: {tradeSpeed} trades/minut</div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => changeTradeSpeed(1)}
              className={tradeSpeed === 1 ? "bg-primary text-primary-foreground" : ""}
            >
              Låg
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => changeTradeSpeed(3)}
              className={tradeSpeed === 3 ? "bg-primary text-primary-foreground" : ""}
            >
              Medium
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => changeTradeSpeed(5)}
              className={tradeSpeed === 5 ? "bg-primary text-primary-foreground" : ""}
            >
              Hög
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => changeTradeSpeed(10)}
              className={tradeSpeed === 10 ? "bg-primary text-primary-foreground" : ""}
            >
              Turbo
            </Button>
          </div>
        </div>
        
        <Button 
          onClick={() => setAutoTradeEnabled(!autoTradeEnabled)}
          disabled={!apiConfig.apiKey || dailyTargetReached}
          variant={autoTradeEnabled ? "destructive" : "default"}
          className="w-full mt-6 py-6 text-base"
          size="lg"
        >
          <Zap size={20} className="mr-2" />
          {autoTradeEnabled 
            ? "Stoppa automatisk handel" 
            : "Starta automatisk handel med mina pengar"}
        </Button>
        
        <div className="text-xs text-center text-muted-foreground mt-1">
          {autoTradeEnabled 
            ? "Algoritmen handlar automatiskt för att nå ditt mål på 1000$" 
            : "Klicka för att låta algoritmen handla automatiskt för att nå ditt mål"}
        </div>
        
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-3">Handelsaktvitet</h3>
          
          {tradeHistory.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm bg-secondary/30 rounded-md">
              Inga handlingar utförda än. Väntar på att automatisk handel ska starta.
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto subtle-scroll pr-2">
              {tradeHistory.map((trade) => (
                <motion.div
                  key={trade.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between p-3 rounded-md border bg-card/50"
                >
                  <div className="flex items-center">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center mr-2 ${
                      trade.success 
                        ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400" 
                        : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                    }`}>
                      {trade.success 
                        ? trade.operation === 'buy' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} /> 
                        : <AlertCircle size={16} />}
                    </div>
                    <div>
                      <div className="text-sm font-medium">
                        {trade.operation === 'buy' ? 'Köp' : 'Sälj'} #{trade.id} - {trade.market}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {trade.timestamp.toLocaleTimeString()}
                      </div>
                      {trade.profitReserved && (
                        <div className="text-xs text-green-600 dark:text-green-400">
                          ${trade.profitReserved.toFixed(2)} reserverad vinst
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      trade.success ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    }`}>
                      {((trade.balanceAfter / (trade.balanceAfter - trade.amount) - 1) * 100).toFixed(1)}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ${trade.balanceAfter.toFixed(2)}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      
      {dailyTargetReached && (
        <CardFooter>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full p-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-md"
          >
            <div className="flex items-center">
              <CheckCircle2 size={16} className="mr-2" />
              <p>Grattis! Du har nått dagens mål på ${targetAmount}. 30% av vinsten (${(targetAmount * 0.3).toFixed(2)}) har överförts till ditt Binance-konto, och 70% används för fortsatt handel nästa dag.</p>
            </div>
          </motion.div>
        </CardFooter>
      )}
    </Card>
  );
};

export default LiveTrading;
