
import { useEffect, useCallback } from 'react';

export const useBalanceUpdater = (
  apiConfig: { exchange: string; apiKey: string; apiSecret: string },
  isTrading: boolean,
  updateActualBalance: () => Promise<number | null>,
  toast: any
) => {
  // Periodically update balance from Binance
  useEffect(() => {
    if (!apiConfig.apiKey || !apiConfig.apiSecret) return;
    
    // Update balance initially
    updateActualBalance();
    
    // Set up interval to update balance every 30 seconds
    const balanceUpdateInterval = setInterval(() => {
      if (!isTrading) {
        updateActualBalance();
      }
    }, 30000);
    
    return () => clearInterval(balanceUpdateInterval);
  }, [apiConfig.apiKey, apiConfig.apiSecret, isTrading, updateActualBalance]);

  // Add a function to manually refresh the balance
  const refreshBalance = useCallback(async () => {
    if (isTrading) {
      toast({
        title: "Kan inte uppdatera saldo",
        description: "Vänta tills pågående handel är klar innan du uppdaterar saldo.",
      });
      return;
    }
    
    toast({
      title: "Uppdaterar saldo...",
      description: "Hämtar ditt aktuella saldo från Binance.",
    });
    
    await updateActualBalance();
  }, [isTrading, updateActualBalance, toast]);

  return { refreshBalance };
};
