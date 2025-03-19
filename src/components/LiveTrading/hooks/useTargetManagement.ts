
import { useCallback } from 'react';

export const useTargetManagement = (
  currentBalance: number,
  targetAmount: number,
  initialAmount: number,
  dailyTargetReached: boolean,
  setDailyTargetReached: (value: boolean) => void,
  dayCount: number,
  setDayCount: (value: number) => void,
  totalProfitReserved: number,
  setTotalProfitReserved: (value: number) => void,
  setTradeHistory: (updateFn: (prev: any[]) => any[]) => void,
  reserveProfitToBinanceAccount: (amount: number) => Promise<boolean>,
  setCurrentBalance: (value: number) => void,
  toast: any,
  onComplete?: (finalAmount: number) => void
) => {
  
  // Handle reaching daily target
  const handleDailyTargetReached = useCallback(async (currentActualBalance: number) => {
    if (currentActualBalance < targetAmount || dailyTargetReached) {
      return false;
    }
    
    setDailyTargetReached(true);
    
    toast({
      title: "Dagens mål uppnått!",
      description: `Din balans har nått dagens mål på $${targetAmount}!`,
      variant: "default"
    });
    
    const reserveAmount = currentActualBalance * 0.7;
    const profitAmount = currentActualBalance * 0.3;
    
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
      onComplete(currentActualBalance);
    }
    
    return true;
  }, [
    targetAmount, dailyTargetReached, initialAmount, dayCount,
    setDailyTargetReached, setDayCount, setCurrentBalance,
    setTradeHistory, reserveProfitToBinanceAccount, onComplete, toast
  ]);

  const progress = Math.min((currentBalance / targetAmount) * 100, 100);

  return {
    handleDailyTargetReached,
    progress
  };
};
