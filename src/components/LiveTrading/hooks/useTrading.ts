
import { useState, useEffect, useCallback } from 'react';
import { useTradingState, ApiConfig, Trade } from './useTradingState';
import { useTradeExecution } from './useTradeExecution';
import { useMarketAnalysis } from './useMarketAnalysis';

export const useTrading = (
  apiConfig: ApiConfig,
  initialAmount: number,
  targetAmount: number,
  onComplete?: (finalAmount: number) => void
) => {
  const tradingState = useTradingState(apiConfig, initialAmount);
  const {
    currentBalance, setCurrentBalance,
    isTrading, setIsTrading,
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
    toast
  } = tradingState;

  // Market analysis hook to identify volatile markets
  useMarketAnalysis(availableMarkets, apiConfig.apiKey, setVolatileMarkets);

  // Trade execution logic
  const {
    selectMarket,
    reserveProfitToBinanceAccount,
    executeSingleTrade
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

  // Execute a trade
  const executeTrade = useCallback(async () => {
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
      
      console.log(`Försöker utföra ${operation} på ${market} med aktuellt saldo: ${currentBalance.toFixed(2)} USDT`);
      
      try {
        const tradeResult = await executeSingleTrade(market, operation);
        setCurrentBalance(tradeResult.newBalance);
        
        setConsecutiveFailures(0);
        setLastFailedAttempt(null);
        
        const newTrade: Trade = {
          id: tradeCount + 1,
          timestamp: new Date(),
          operation,
          market,
          amount: tradeResult.tradedAmount,
          success: tradeResult.success,
          balanceAfter: tradeResult.newBalance,
          message: tradeResult.success 
            ? `Lyckad ${operation === 'buy' ? 'köp' : 'sälj'} order på ${market}`
            : `${operation === 'buy' ? 'Köp' : 'Sälj'} på ${market} genomförd med mindre än optimal avkastning`
        };
        
        setTradeHistory(prev => [newTrade, ...prev.slice(0, 14)]);
        setTradeCount(prev => prev + 1);
        
        if (!tradeResult.success) {
          toast({
            title: "Handel genomförd med varning",
            description: `${newTrade.message}. Ny balans: $${tradeResult.newBalance.toFixed(2)}`,
            variant: "destructive"
          });
        } else if (tradeCount % 5 === 0) {
          toast({
            title: "Handel framgångsrik",
            description: `${newTrade.message}. Ny balans: $${tradeResult.newBalance.toFixed(2)}`,
          });
        }
        
        if (tradeResult.newBalance >= targetAmount && !dailyTargetReached) {
          setDailyTargetReached(true);
          
          toast({
            title: "Dagens mål uppnått!",
            description: `Din balans har nått dagens mål på $${targetAmount}!`,
            variant: "default"
          });
          
          const reserveAmount = tradeResult.newBalance * 0.7;
          const profitAmount = tradeResult.newBalance * 0.3;
          
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
            onComplete(tradeResult.newBalance);
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
          message: `Handel misslyckades: ${orderError instanceof Error ? orderError.message : "Okänt fel"}`
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
  }, [
    apiConfig, isTrading, isInitializing, consecutiveFailures, 
    lastFailedAttempt, currentBalance, tradeCount, dailyTargetReached,
    dayCount, targetAmount, initialAmount, onComplete,
    selectMarket, executeSingleTrade, reserveProfitToBinanceAccount,
    setCurrentBalance, setConsecutiveFailures, setLastFailedAttempt,
    setTradeHistory, setTradeCount, setDailyTargetReached, setDayCount,
    toast
  ]);

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

  const handleSpeedChange = (newSpeed: number) => {
    setTradeSpeed(newSpeed);
    toast({
      title: "Handelshastighet ändrad",
      description: `Algoritmen utför nu ${newSpeed} trades per minut`,
    });
  };

  return {
    ...tradingState,
    executeTrade,
    handleSpeedChange,
    progress: Math.min((currentBalance / targetAmount) * 100, 100)
  };
};
