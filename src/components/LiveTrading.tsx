
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, DollarSign, ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import ValueDisplay from './ValueDisplay';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

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

// This would be replaced with actual API calls to the crypto exchange
const mockTradeWithExchange = async (
  operation: 'buy' | 'sell',
  amount: number,
  market: string
): Promise<{
  success: boolean;
  newBalance: number;
  message: string;
}> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
  
  // Simulate trading result with improved success rate (80%)
  const success = Math.random() < 0.8;
  
  if (success) {
    // Higher growth factor to reach the target faster
    const growthFactor = 1.5 + Math.random() * 0.8; // 1.5x to 2.3x growth
    return {
      success: true,
      newBalance: amount * growthFactor,
      message: `Lyckad ${operation === 'buy' ? 'köp' : 'sälj'} order`
    };
  } else {
    const lossFactor = 0.8 + Math.random() * 0.1; // 0.8x to 0.9x loss (milder losses)
    return {
      success: false,
      newBalance: amount * lossFactor,
      message: `${operation === 'buy' ? 'Köp' : 'Sälj'} genomförd men till sämre pris än förväntat`
    };
  }
};

const LiveTrading: React.FC<LiveTradingProps> = ({
  apiConfig,
  initialAmount,
  targetAmount,
  onComplete,
  className
}) => {
  const [currentBalance, setCurrentBalance] = useState<number>(initialAmount);
  const [isTrading, setIsTrading] = useState<boolean>(false);
  const [autoTradeEnabled, setAutoTradeEnabled] = useState<boolean>(false);
  const [tradeHistory, setTradeHistory] = useState<Array<{
    id: number;
    timestamp: Date;
    operation: 'buy' | 'sell';
    amount: number;
    success: boolean;
    balanceAfter: number;
    message: string;
  }>>([]);
  const [tradeCount, setTradeCount] = useState<number>(0);
  const [targetReached, setTargetReached] = useState<boolean>(false);
  const [dailyTargetReached, setDailyTargetReached] = useState<boolean>(false);
  const [dayCount, setDayCount] = useState<number>(1);
  const { toast } = useToast();

  // Execute a single trade
  const executeTrade = async () => {
    if (!apiConfig.apiKey || !apiConfig.apiSecret) {
      toast({
        title: "API-konfiguration saknas",
        description: "Vänligen konfigurera dina API-nycklar först.",
        variant: "destructive"
      });
      return;
    }

    setIsTrading(true);
    
    try {
      // Determine whether to buy or sell based on market conditions
      // In a real implementation, this would be based on technical analysis or signals
      const operation: 'buy' | 'sell' = Math.random() > 0.5 ? 'buy' : 'sell';
      const market = 'BTC/USDT'; // Example market
      
      // Execute the trade via the exchange
      const result = await mockTradeWithExchange(operation, currentBalance, market);
      
      // Update balance and trade history
      setCurrentBalance(result.newBalance);
      
      const newTrade = {
        id: tradeCount + 1,
        timestamp: new Date(),
        operation,
        amount: currentBalance,
        success: result.success,
        balanceAfter: result.newBalance,
        message: result.message
      };
      
      setTradeHistory(prev => [newTrade, ...prev.slice(0, 9)]);
      setTradeCount(prev => prev + 1);
      
      // Notify the user
      toast({
        title: result.success ? "Handel genomförd" : "Handel slutförd med varning",
        description: `${result.message}. Ny balans: $${result.newBalance.toFixed(2)}`,
        variant: result.success ? "default" : "destructive"
      });
      
      // Check if the daily target has been reached
      if (result.newBalance >= targetAmount && !dailyTargetReached) {
        setDailyTargetReached(true);
        
        toast({
          title: "Dagens mål uppnått!",
          description: `Din balans har nått dagens mål på $${targetAmount}!`,
          variant: "default"
        });
        
        // Reserve 70% for future trading, use 30% as "profit"
        const reserveAmount = result.newBalance * 0.7;
        const profitAmount = result.newBalance * 0.3;
        
        toast({
          title: "Vinst reserverad",
          description: `$${profitAmount.toFixed(2)} har reserverats för uttag, $${reserveAmount.toFixed(2)} behålls för fortsatt handel.`,
        });
        
        if (reserveAmount >= initialAmount) {
          setCurrentBalance(reserveAmount);
          // Start a new day after a short delay
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
          onComplete(result.newBalance);
        }
      }
      
    } catch (error) {
      toast({
        title: "Handelsfel",
        description: "Ett fel uppstod vid handel. Försök igen.",
        variant: "destructive"
      });
    } finally {
      setIsTrading(false);
    }
  };

  // Auto-trading logic
  useEffect(() => {
    let tradeInterval: ReturnType<typeof setInterval> | null = null;
    
    if (autoTradeEnabled && !dailyTargetReached) {
      tradeInterval = setInterval(() => {
        executeTrade();
      }, 5000); // Trade every 5 seconds (faster for simulation)
    }
    
    return () => {
      if (tradeInterval) clearInterval(tradeInterval);
    };
  }, [autoTradeEnabled, dailyTargetReached, currentBalance]);

  const progress = Math.min((currentBalance / targetAmount) * 100, 100);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign size={20} />
          Live-handel
        </CardTitle>
        <CardDescription>
          Handel med riktiga pengar via {apiConfig.exchange}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <Alert variant="default" className="bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400 border-amber-200 dark:border-amber-800/30">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Detta är en simulering</AlertTitle>
          <AlertDescription>
            Notera att avkastningen i denna simulering är orealistiskt hög. Verklig handel kommer att generera lägre avkastning och medför risk.
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
          </div>
        </motion.div>
        
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>{Math.min(progress, 100).toFixed(1)}%</span>
            <span>100%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        {/* One-click auto-trading button */}
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
            ? "Algoritmen kommer handla automatiskt för att nå ditt mål" 
            : "Klicka för att låta algoritmen handla automatiskt för att nå ditt mål"}
        </div>
        
        {/* Recent trades */}
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-3">Senaste handeln</h3>
          
          {tradeHistory.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground text-sm bg-secondary/30 rounded-md">
              Inga handlingar utförda än. Starta handeln för att se resultat.
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
                        {trade.operation === 'buy' ? 'Köp' : 'Sälj'} #{trade.id}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {trade.timestamp.toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`text-sm font-medium ${
                      trade.success ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    }`}>
                      {((trade.balanceAfter / trade.amount - 1) * 100).toFixed(1)}%
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
      
      {/* Daily target reached message */}
      {dailyTargetReached && (
        <CardFooter>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full p-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-md"
          >
            <div className="flex items-center">
              <CheckCircle2 size={16} className="mr-2" />
              <p>Grattis! Du har nått dagens mål på ${targetAmount}. 30% av vinsten har reserverats för uttag, och 70% används för fortsatt handel imorgon.</p>
            </div>
          </motion.div>
        </CardFooter>
      )}
    </Card>
  );
};

export default LiveTrading;
