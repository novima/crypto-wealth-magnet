
import { useCallback } from 'react';
import { useTradingState, ApiConfig } from './useTradingState';
import { useTradeExecution } from './useTradeExecution';
import { useMarketAnalysis } from './useMarketAnalysis';
import { useTradeManager } from './useTradeManager';
import { useTargetManagement } from './useTargetManagement';
import { useTradeScheduler } from './useTradeScheduler';
import { useBalanceUpdater } from './useBalanceUpdater';
import { useTradeSettings } from './useTradeSettings';

export const useTrading = (
  apiConfig: ApiConfig,
  initialAmount: number,
  targetAmount: number,
  onComplete?: (finalAmount: number) => void
) => {
  const tradingState = useTradingState(apiConfig, initialAmount);
  
  const {
    currentBalance, setCurrentBalance,
    autoTradeEnabled, setAutoTradeEnabled,
    tradeHistory, setTradeHistory,
    tradeCount, setTradeCount,
    dailyTargetReached, setDailyTargetReached,
    dayCount, setDayCount,
    tradeSpeed, setTradeSpeed,
    totalProfitReserved, setTotalProfitReserved,
    availableMarkets, volatileMarkets, setVolatileMarkets,
    isInitializing,
    lastFailedAttempt, setLastFailedAttempt,
    consecutiveFailures, setConsecutiveFailures,
    updateActualBalance,
    toast
  } = tradingState;

  // Market analysis hook to identify volatile markets
  useMarketAnalysis(availableMarkets, apiConfig.apiKey, setVolatileMarkets);

  // Trade execution logic
  const {
    selectMarket,
    reserveProfitToBinanceAccount,
    executeSingleTrade,
    fetchActualBalance
  } = useTradeExecution(
    apiConfig,
    availableMarkets,
    volatileMarkets,
    currentBalance,
    totalProfitReserved,
    setTotalProfitReserved,
    setTradeHistory,
    toast
  );

  // Trade manager for executing trades
  const {
    isTrading,
    executeTrade
  } = useTradeManager(
    apiConfig,
    currentBalance,
    setCurrentBalance,
    setTradeHistory,
    tradeCount,
    setTradeCount,
    consecutiveFailures,
    setConsecutiveFailures,
    lastFailedAttempt,
    setLastFailedAttempt,
    toast,
    selectMarket,
    executeSingleTrade,
    fetchActualBalance,
    updateActualBalance
  );

  // Target management for handling daily goals
  const {
    handleDailyTargetReached,
    progress
  } = useTargetManagement(
    currentBalance,
    targetAmount,
    initialAmount,
    dailyTargetReached,
    setDailyTargetReached,
    dayCount,
    setDayCount,
    totalProfitReserved,
    setTotalProfitReserved,
    setTradeHistory,
    reserveProfitToBinanceAccount,
    setCurrentBalance,
    toast,
    onComplete
  );

  // Hook for checking if a trade has reached the daily target
  const executeTradeWithTargetCheck = useCallback(async () => {
    const result = await executeTrade();
    if (result?.success) {
      await handleDailyTargetReached(result.newBalance);
    }
    return result;
  }, [executeTrade, handleDailyTargetReached]);

  // Scheduler for automatic trading
  useTradeScheduler(
    autoTradeEnabled,
    dailyTargetReached,
    isInitializing,
    consecutiveFailures,
    tradeSpeed,
    executeTradeWithTargetCheck
  );

  // Balance updater for periodic balance updates
  const { refreshBalance } = useBalanceUpdater(
    apiConfig,
    isTrading,
    updateActualBalance,
    toast
  );

  // Settings manager for trade speed
  const { handleSpeedChange } = useTradeSettings(setTradeSpeed, toast);

  return {
    ...tradingState,
    executeTrade: executeTradeWithTargetCheck,
    handleSpeedChange,
    refreshBalance,
    progress
  };
};
