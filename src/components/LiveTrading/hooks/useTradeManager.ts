
import { useCallback, useState } from 'react';
import { Trade } from './useTradingState';

export const useTradeManager = (
  apiConfig: { exchange: string; apiKey: string; apiSecret: string },
  currentBalance: number,
  setCurrentBalance: (value: number) => void,
  setTradeHistory: (updateFn: (prev: Trade[]) => Trade[]) => void,
  tradeCount: number,
  setTradeCount: (value: number) => void,
  consecutiveFailures: number,
  setConsecutiveFailures: (value: number) => void,
  lastFailedAttempt: Date | null,
  setLastFailedAttempt: (value: Date | null) => void,
  toast: any,
  selectMarket: () => string,
  executeSingleTrade: (market: string, operation: 'buy' | 'sell') => Promise<{
    tradedAmount: number;
    newBalance: number;
    success: boolean;
  }>,
  fetchActualBalance: () => Promise<number>,
  updateActualBalance: () => Promise<number | null>
) => {
  const [isTrading, setIsTrading] = useState<boolean>(false);

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

    if (isTrading) return;

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
      // Get latest balance before trading
      const actualBalance = await fetchActualBalance();
      if (actualBalance > 0) {
        setCurrentBalance(actualBalance);
      }
      
      const market = selectMarket();
      const operation: 'buy' | 'sell' = Math.random() > 0.25 ? 'buy' : 'sell';
      
      console.log(`Försöker utföra ${operation} på ${market} med aktuellt saldo: ${currentBalance.toFixed(2)} USDT`);
      
      try {
        const tradeResult = await executeSingleTrade(market, operation);
        
        // Get updated balance after trade
        const newActualBalance = await fetchActualBalance();
        if (newActualBalance > 0) {
          setCurrentBalance(newActualBalance);
        } else {
          setCurrentBalance(tradeResult.newBalance);
        }
        
        setConsecutiveFailures(0);
        setLastFailedAttempt(null);
        
        const newTrade: Trade = {
          id: tradeCount + 1,
          timestamp: new Date(),
          operation,
          market,
          amount: tradeResult.tradedAmount,
          success: tradeResult.success,
          balanceAfter: newActualBalance > 0 ? newActualBalance : tradeResult.newBalance,
          message: tradeResult.success 
            ? `Lyckad ${operation === 'buy' ? 'köp' : 'sälj'} order på ${market}`
            : `${operation === 'buy' ? 'Köp' : 'Sälj'} på ${market} genomförd med mindre än optimal avkastning`
        };
        
        setTradeHistory(prev => [newTrade, ...prev.slice(0, 14)]);
        setTradeCount(prev => prev + 1);
        
        if (!tradeResult.success) {
          toast({
            title: "Handel genomförd med varning",
            description: `${newTrade.message}. Ny balans: $${newTrade.balanceAfter.toFixed(2)}`,
            variant: "destructive"
          });
        } else if (tradeCount % 5 === 0) {
          toast({
            title: "Handel framgångsrik",
            description: `${newTrade.message}. Ny balans: $${newTrade.balanceAfter.toFixed(2)}`,
          });
        }
        
        return {
          success: true,
          newBalance: newActualBalance > 0 ? newActualBalance : tradeResult.newBalance
        };
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
        
        return { success: false, newBalance: failedTrade.balanceAfter };
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
      
      return { success: false, newBalance: currentBalance };
    } finally {
      setIsTrading(false);
    }
  }, [
    apiConfig, isTrading, consecutiveFailures, lastFailedAttempt, currentBalance, 
    tradeCount, selectMarket, executeSingleTrade, fetchActualBalance,
    setCurrentBalance, setConsecutiveFailures, setLastFailedAttempt,
    setTradeHistory, setTradeCount, toast
  ]);

  return {
    isTrading,
    executeTrade
  };
};
