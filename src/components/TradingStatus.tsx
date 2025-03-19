
import React from 'react';
import { motion } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ValueDisplay from './ValueDisplay';

interface TradingStatusProps {
  currentBalance: number;
  targetAmount: number;
  dayCount: number;
  totalProfitReserved: number;
  onRefreshBalance?: () => void;
}

const TradingStatus: React.FC<TradingStatusProps> = ({
  currentBalance,
  targetAmount,
  dayCount,
  totalProfitReserved,
  onRefreshBalance
}) => {
  const progress = Math.min((currentBalance / targetAmount) * 100, 100);

  return (
    <div className="space-y-4">
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
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <ValueDisplay
              label="Nuvarande balans"
              value={currentBalance}
              prefix="$"
              decimals={2}
            />
            {onRefreshBalance && (
              <Button 
                onClick={onRefreshBalance} 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 mt-1"
                title="Uppdatera saldo från Binance"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            )}
          </div>
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
    </div>
  );
};

export default TradingStatus;
