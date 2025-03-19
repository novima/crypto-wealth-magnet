
import { useCallback } from 'react';

export const useTradeSettings = (
  setTradeSpeed: (value: number) => void,
  toast: any
) => {
  const handleSpeedChange = useCallback((newSpeed: number) => {
    setTradeSpeed(newSpeed);
    toast({
      title: "Handelshastighet ändrad",
      description: `Algoritmen utför nu ${newSpeed} trades per minut`,
    });
  }, [setTradeSpeed, toast]);

  return { handleSpeedChange };
};
