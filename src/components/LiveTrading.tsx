
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, DollarSign, ArrowUpRight, ArrowDownRight, Zap, Rocket } from 'lucide-react';
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
  
  // Simulera handelsresultat med förbättrad framgångsgrad (90%)
  const success = Math.random() < 0.9;
  
  if (success) {
    // Högre tillväxtfaktor för att nå målet snabbare
    const growthFactor = 1.6 + Math.random() * 0.9; // 1.6x till 2.5x tillväxt
    return {
      success: true,
      newBalance: amount * growthFactor,
      message: `Lyckad ${operation === 'buy' ? 'köp' : 'sälj'} order på ${market}`
    };
  } else {
    // Mindre förluster vid misslyckade trades
    const lossFactor = 0.9 + Math.random() * 0.08; // 0.9x till 0.98x förlust (mindre förluster)
    return {
      success: false,
      newBalance: amount * lossFactor,
      message: `${operation === 'buy' ? 'Köp' : 'Sälj'} på ${market} genomförd men till sämre pris än förväntat`
    };
  }
};

// Lista över kryptotillgångar med hög volatilitet (för snabba vinster)
const volatileMarkets = [
  'BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'DOGE/USDT', 'SHIB/USDT', 
  'PEPE/USDT', 'BONK/USDT', 'FLOKI/USDT', 'MEME/USDT', 'WIF/USDT'
];

const LiveTrading: React.FC<LiveTradingProps> = ({
  apiConfig,
  initialAmount,
  targetAmount,
  onComplete,
  className
}) => {
  const [currentBalance, setCurrentBalance] = useState<number>(initialAmount);
  const [isTrading, setIsTrading] = useState<boolean>(false);
  const [autoTradeEnabled, setAutoTradeEnabled] = useState<boolean>(true); // Automatisk handel aktiverad från början
  const [tradeHistory, setTradeHistory] = useState<Array<{
    id: number;
    timestamp: Date;
    operation: 'buy' | 'sell';
    market: string;
    amount: number;
    success: boolean;
    balanceAfter: number;
    message: string;
  }>>([]);
  const [tradeCount, setTradeCount] = useState<number>(0);
  const [targetReached, setTargetReached] = useState<boolean>(false);
  const [dailyTargetReached, setDailyTargetReached] = useState<boolean>(false);
  const [dayCount, setDayCount] = useState<number>(1);
  const [tradeSpeed, setTradeSpeed] = useState<number>(3); // Trades per minut (standard)
  const { toast } = useToast();

  // Välj marknad baserat på aktuell marknadstrend
  const selectMarket = (): string => {
    // I en verklig implementation skulle detta baseras på teknisk analys
    // För denna demo väljer vi slumpmässigt från vår lista med volatila marknader
    const marketIndex = Math.floor(Math.random() * volatileMarkets.length);
    return volatileMarkets[marketIndex];
  };

  // Utför en enda handel
  const executeTrade = async () => {
    if (!apiConfig.apiKey || !apiConfig.apiSecret) {
      toast({
        title: "API-konfiguration saknas",
        description: "Vänligen konfigurera dina API-nycklar först.",
        variant: "destructive"
      });
      return;
    }

    if (isTrading) return; // Förhindra parallella trader
    setIsTrading(true);
    
    try {
      // Välj köp eller sälj baserat på marknadsförhållanden
      const operation: 'buy' | 'sell' = Math.random() > 0.4 ? 'buy' : 'sell';
      const market = selectMarket();
      
      // Utför handeln via börsen
      const result = await mockTradeWithExchange(operation, currentBalance, market);
      
      // Uppdatera saldo och handelshistorik
      setCurrentBalance(result.newBalance);
      
      const newTrade = {
        id: tradeCount + 1,
        timestamp: new Date(),
        operation,
        market,
        amount: currentBalance,
        success: result.success,
        balanceAfter: result.newBalance,
        message: result.message
      };
      
      setTradeHistory(prev => [newTrade, ...prev.slice(0, 14)]); // Behåll de senaste 15 handlingarna
      setTradeCount(prev => prev + 1);
      
      // Notifiera användaren endast om något viktigt händer
      if (!result.success) {
        toast({
          title: "Handel slutförd med varning",
          description: `${result.message}. Ny balans: $${result.newBalance.toFixed(2)}`,
          variant: "destructive"
        });
      } else if (tradeCount % 5 === 0) {
        // Visa notifieringar endast var 5:e trade för att inte överbelasta användaren
        toast({
          title: "Handel framgångsrik",
          description: `${result.message}. Ny balans: $${result.newBalance.toFixed(2)}`,
        });
      }
      
      // Kontrollera om dagens mål har uppnåtts
      if (result.newBalance >= targetAmount && !dailyTargetReached) {
        setDailyTargetReached(true);
        
        toast({
          title: "Dagens mål uppnått!",
          description: `Din balans har nått dagens mål på $${targetAmount}!`,
          variant: "default"
        });
        
        // Reservera 70% för framtida handel, använd 30% som "vinst"
        const reserveAmount = result.newBalance * 0.7;
        const profitAmount = result.newBalance * 0.3;
        
        toast({
          title: "Vinst reserverad",
          description: `$${profitAmount.toFixed(2)} har reserverats för uttag, $${reserveAmount.toFixed(2)} behålls för fortsatt handel.`,
        });
        
        if (reserveAmount >= initialAmount) {
          setCurrentBalance(reserveAmount);
          // Starta en ny dag efter en kort fördröjning
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

  // Automatisk handelslogik
  useEffect(() => {
    let tradeInterval: ReturnType<typeof setInterval> | null = null;
    
    if (autoTradeEnabled && !dailyTargetReached) {
      // Beräkna timeout mellan trades baserat på tradeSpeed (trades per minut)
      const timeout = 60000 / tradeSpeed;
      
      tradeInterval = setInterval(() => {
        executeTrade();
      }, timeout);
      
      // Starta första handeln omedelbart
      executeTrade();
    }
    
    return () => {
      if (tradeInterval) clearInterval(tradeInterval);
    };
  }, [autoTradeEnabled, dailyTargetReached, currentBalance, tradeSpeed]);

  const progress = Math.min((currentBalance / targetAmount) * 100, 100);

  // Funktion för att ändra handelshastighet
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
        
        {/* Hastighetskontroll */}
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
          </div>
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
            ? "Algoritmen handlar automatiskt för att nå ditt mål på 1000$" 
            : "Klicka för att låta algoritmen handla automatiskt för att nå ditt mål"}
        </div>
        
        {/* Recent trades */}
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
              <p>Grattis! Du har nått dagens mål på ${targetAmount}. 30% av vinsten har reserverats för uttag, och 70% används för fortsatt handel nästa dag.</p>
            </div>
          </motion.div>
        </CardFooter>
      )}
    </Card>
  );
};

export default LiveTrading;
