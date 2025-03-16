
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, DollarSign, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
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

// Denna del skulle ersättas med faktiska API-anrop till kryptobörsen
const mockTradeWithExchange = async (
  operation: 'buy' | 'sell',
  amount: number,
  market: string
): Promise<{
  success: boolean;
  newBalance: number;
  message: string;
}> => {
  // Simulera ett nätverksfördröjning
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
  
  // Simulera handelsresultat (i en riktig implementation skulle detta vara faktiska API-anrop)
  const success = Math.random() < 0.7; // 70% framgångsfrekvens
  
  if (success) {
    const growthFactor = 1.2 + Math.random() * 0.6; // 1.2x to 1.8x tillväxt
    return {
      success: true,
      newBalance: amount * growthFactor,
      message: `Lyckad ${operation === 'buy' ? 'köp' : 'sälj'} order`
    };
  } else {
    const lossFactor = 0.7 + Math.random() * 0.2; // 0.7x to 0.9x förlust
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
  const { toast } = useToast();

  // Utför en enskild handel
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
      // Bestäm om det är bäst att köpa eller sälja baserat på marknadsförhållanden
      // I en verklig implementation skulle detta baseras på teknisk analys eller signaler
      const operation: 'buy' | 'sell' = Math.random() > 0.5 ? 'buy' : 'sell';
      const market = 'BTC/USDT'; // Exempel marknad
      
      // Utför handeln via börsen
      const result = await mockTradeWithExchange(operation, currentBalance, market);
      
      // Uppdatera balans och handelshistorik
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
      
      // Notifiera användaren
      toast({
        title: result.success ? "Handel genomförd" : "Handel slutförd med varning",
        description: `${result.message}. Ny balans: $${result.newBalance.toFixed(2)}`,
        variant: result.success ? "default" : "destructive"
      });
      
      // Kontrollera om målet har uppnåtts
      if (result.newBalance >= targetAmount && !targetReached) {
        setTargetReached(true);
        setAutoTradeEnabled(false);
        
        toast({
          title: "Mål uppnått!",
          description: `Din balans har nått målet på $${targetAmount}!`,
          variant: "default"
        });
        
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
    
    if (autoTradeEnabled && !targetReached) {
      tradeInterval = setInterval(() => {
        executeTrade();
      }, 10000); // Handel var 10:e sekund
    }
    
    return () => {
      if (tradeInterval) clearInterval(tradeInterval);
    };
  }, [autoTradeEnabled, targetReached]);

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
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-between items-center"
        >
          <ValueDisplay
            label="Nuvarande balans"
            value={currentBalance}
            prefix="$"
            decimals={2}
          />
          
          <div className="flex flex-col items-end">
            <ValueDisplay
              label="Mål"
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
        
        {/* Trading controls */}
        <div className="flex flex-col sm:flex-row gap-2 mt-4">
          <Button 
            onClick={executeTrade}
            disabled={isTrading || !apiConfig.apiKey}
            className="flex-1"
          >
            Utför en handel
          </Button>
          
          <Button
            variant={autoTradeEnabled ? "destructive" : "outline"}
            onClick={() => setAutoTradeEnabled(!autoTradeEnabled)}
            disabled={!apiConfig.apiKey || targetReached}
            className="flex-1"
          >
            {autoTradeEnabled ? "Stoppa auto-handel" : "Starta auto-handel"}
          </Button>
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
      
      {/* Success message */}
      {targetReached && (
        <CardFooter>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full p-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-md"
          >
            <div className="flex items-center">
              <CheckCircle2 size={16} className="mr-2" />
              <p>Grattis! Du har nått ditt mål på ${targetAmount}.</p>
            </div>
          </motion.div>
        </CardFooter>
      )}
    </Card>
  );
};

export default LiveTrading;
