
import { useEffect } from 'react';

export const useTradeScheduler = (
  autoTradeEnabled: boolean,
  dailyTargetReached: boolean,
  isInitializing: boolean,
  consecutiveFailures: number,
  tradeSpeed: number,
  executeTrade: () => Promise<{ success: boolean; newBalance: number } | undefined>
) => {
  // Automated trading on interval
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
  }, [autoTradeEnabled, dailyTargetReached, consecutiveFailures, tradeSpeed, isInitializing, executeTrade]);
};
