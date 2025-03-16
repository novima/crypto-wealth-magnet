
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TradingSimulationProps {
  initialAmount: number;
  targetAmount: number;
  onComplete: (finalAmount: number) => void;
  className?: string;
}

// Simplified simulation of the trading algorithm
const simulateTrade = (currentAmount: number): { 
  success: boolean; 
  newAmount: number; 
  growthFactor: number;
} => {
  // 60% chance of success, 40% chance of failure
  const success = Math.random() < 0.6;
  const growthFactor = success ? 1.5 : 0.7;
  const newAmount = currentAmount * growthFactor;
  
  return {
    success,
    newAmount,
    growthFactor
  };
};

const TradingSimulation = ({ 
  initialAmount, 
  targetAmount, 
  onComplete,
  className 
}: TradingSimulationProps) => {
  const [currentAmount, setCurrentAmount] = useState(initialAmount);
  const [isRunning, setIsRunning] = useState(false);
  const [tradeHistory, setTradeHistory] = useState<Array<{
    id: number;
    amount: number;
    success: boolean;
    growthFactor: number;
  }>>([]);
  const [tradeCount, setTradeCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  
  // Start the simulation
  const startSimulation = () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setTradeHistory([]);
    setTradeCount(0);
    setCurrentAmount(initialAmount);
    setIsComplete(false);
  };
  
  // Run a single trade
  const runTrade = () => {
    if (!isRunning || isComplete) return;
    
    const result = simulateTrade(currentAmount);
    setCurrentAmount(result.newAmount);
    
    setTradeHistory(prev => [
      {
        id: tradeCount + 1,
        amount: result.newAmount,
        success: result.success,
        growthFactor: result.growthFactor
      },
      ...prev.slice(0, 9) // Keep last 10 trades
    ]);
    
    setTradeCount(prev => prev + 1);
    
    // Check if we've reached the target
    if (result.newAmount >= targetAmount) {
      setIsComplete(true);
      setIsRunning(false);
      onComplete(result.newAmount);
    }
  };
  
  // Reset the simulation
  const resetSimulation = () => {
    setIsRunning(false);
    setTradeHistory([]);
    setTradeCount(0);
    setCurrentAmount(initialAmount);
    setIsComplete(false);
  };
  
  return (
    <div className={cn("rounded-xl border bg-card p-4", className)}>
      <div className="mb-4">
        <h2 className="text-lg font-medium mb-1">Trading Simulation</h2>
        <p className="text-sm text-muted-foreground">
          Target: ${targetAmount.toLocaleString()}
        </p>
      </div>
      
      <div className="flex justify-between items-center mb-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-2xl font-medium tracking-tight"
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={currentAmount.toFixed(2)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              ${currentAmount.toLocaleString(undefined, { 
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </motion.span>
          </AnimatePresence>
        </motion.div>
        
        <div className="flex space-x-2">
          {!isRunning && !isComplete && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium"
              onClick={startSimulation}
            >
              Start
            </motion.button>
          )}
          
          {isRunning && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md text-sm font-medium"
              onClick={runTrade}
            >
              Execute Trade
            </motion.button>
          )}
          
          {(isComplete || isRunning) && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 border bg-background hover:bg-secondary/50 rounded-md text-sm font-medium"
              onClick={resetSimulation}
            >
              Reset
            </motion.button>
          )}
        </div>
      </div>
      
      {/* Progress indicator */}
      <div className="mb-6">
        <div className="h-2 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: `${(initialAmount / targetAmount) * 100}%` }}
            animate={{ width: `${Math.min((currentAmount / targetAmount) * 100, 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-muted-foreground">
            ${initialAmount.toLocaleString()}
          </span>
          <span className="text-xs text-muted-foreground">
            ${targetAmount.toLocaleString()}
          </span>
        </div>
      </div>
      
      {/* Trade history */}
      <div>
        <h3 className="text-sm font-medium mb-2">Recent Trades</h3>
        
        {tradeHistory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No trades yet. Start the simulation to see results.
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto subtle-scroll pr-2">
            <AnimatePresence initial={false}>
              {tradeHistory.map((trade) => (
                <motion.div
                  key={trade.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between p-2 rounded-md border bg-card/50"
                >
                  <div className="flex items-center">
                    <div className={cn(
                      "h-6 w-6 rounded-full flex items-center justify-center mr-2",
                      trade.success ? "text-green-500" : "text-red-500"
                    )}>
                      {trade.success ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    </div>
                    <span className="text-sm">Trade #{trade.id}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <span className={cn(
                      "text-sm font-medium",
                      trade.success ? "text-green-500" : "text-red-500"
                    )}>
                      {trade.success ? '+' : ''}{((trade.growthFactor - 1) * 100).toFixed(1)}%
                    </span>
                    <ArrowRight size={14} className="mx-2 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      ${trade.amount.toFixed(2)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
      
      {/* Success message */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-6 p-3 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 rounded-md text-sm"
          >
            <div className="flex items-center">
              <CheckCircle2 size={16} className="mr-2" />
              <p>Target reached! Final amount: ${currentAmount.toFixed(2)}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TradingSimulation;
