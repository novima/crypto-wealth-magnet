
import { useEffect } from 'react';
import { calculateVolatility } from '@/utils/binanceApi';

export const useMarketAnalysis = (
  markets: string[],
  apiKey: string,
  setVolatileMarkets: (markets: string[]) => void
) => {
  useEffect(() => {
    const identifyVolatileMarkets = async () => {
      try {
        const marketsToCheck = markets.slice(0, 50);
        const volatilityPromises = marketsToCheck.map(async (market) => {
          try {
            const volatility = await calculateVolatility(market, apiKey);
            return { market, volatility };
          } catch {
            return { market, volatility: 0 };
          }
        });

        const volatilityResults = await Promise.all(volatilityPromises);
        
        const sortedMarkets = volatilityResults
          .sort((a, b) => b.volatility - a.volatility)
          .map(result => result.market);
        
        setVolatileMarkets(sortedMarkets.slice(0, 15));
        
        console.log('Identifierade volatila marknader:', sortedMarkets.slice(0, 15));
      } catch (error) {
        console.error('Fel vid identifiering av volatila marknader:', error);
        setVolatileMarkets(['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'DOGEUSDT', 'BNBUSDT']);
      }
    };

    if (markets.length > 0 && apiKey) {
      identifyVolatileMarkets();
    }
  }, [markets, apiKey, setVolatileMarkets]);
};
