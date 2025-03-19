
import { BASE_URL, TICKER_PRICE, ORDER_BOOK, EXCHANGE_INFO } from './constants';
import { fetchWithRetry } from './helpers';

// Hämta aktuellt marknadspris för en handelssymbol
export const getCurrentPrice = async (symbol: string, apiKey: string): Promise<number> => {
  try {
    const response = await fetchWithRetry(`${BASE_URL}${TICKER_PRICE}?symbol=${symbol}`, {
      method: 'GET',
      headers: {
        'X-MBX-APIKEY': apiKey
      }
    });
    
    const data = await response.json();
    return parseFloat(data.price);
  } catch (error) {
    console.error(`Failed to get current price for ${symbol}:`, error);
    
    if (error instanceof Error && error.message === 'CORS_PROXY_NEEDS_ACTIVATION') {
      throw new Error('CORS_PROXY_NEEDS_ACTIVATION');
    }
    
    throw error;
  }
};

// Hämta orderbok för att analysera marknadsdjup
export const getOrderBook = async (symbol: string, limit: number = 20, apiKey: string): Promise<any> => {
  try {
    const response = await fetchWithRetry(`${BASE_URL}${ORDER_BOOK}?symbol=${symbol}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'X-MBX-APIKEY': apiKey
      }
    });
    
    return await response.json();
  } catch (error) {
    console.error(`Failed to get order book for ${symbol}:`, error);
    
    if (error instanceof Error && error.message === 'CORS_PROXY_NEEDS_ACTIVATION') {
      throw new Error('CORS_PROXY_NEEDS_ACTIVATION');
    }
    
    throw error;
  }
};

// Analysera marknadsdjup för att avgöra om handeln är fördelaktig
export const analyzeMarketDepth = (orderBook: any, operation: 'BUY' | 'SELL'): boolean => {
  // Analysera bid/ask-förhållandet för att avgöra om handelsförhållandena är gynnsamma
  const bids = orderBook.bids.slice(0, 10);
  const asks = orderBook.asks.slice(0, 10);
  
  const bidVolume = bids.reduce((sum: number, bid: string[]) => sum + parseFloat(bid[1]), 0);
  const askVolume = asks.reduce((sum: number, ask: string[]) => sum + parseFloat(ask[1]), 0);
  
  if (operation === 'BUY') {
    // För köp, vill vi se högre bidvolym vilket indikerar köptryck
    return bidVolume > askVolume * 0.8;
  } else {
    // För sälj, vill vi se högre askvolym vilket indikerar säljtryck
    return askVolume > bidVolume * 0.8;
  }
};

// Hämta marknadsinfo för att se vilka handelspar som är tillgängliga
export const getExchangeInfo = async (apiKey: string): Promise<any> => {
  try {
    const response = await fetchWithRetry(`${BASE_URL}${EXCHANGE_INFO}`, {
      method: 'GET',
      headers: {
        'X-MBX-APIKEY': apiKey
      }
    });
    
    return await response.json();
  } catch (error) {
    console.error('Failed to get exchange info:', error);
    
    if (error instanceof Error && error.message === 'CORS_PROXY_NEEDS_ACTIVATION') {
      throw new Error('CORS_PROXY_NEEDS_ACTIVATION');
    }
    
    throw error;
  }
};

// Hämta alla handelsbara symboler med USDT som basvaluta
export const getTradableUsdtPairs = async (apiKey: string): Promise<string[]> => {
  try {
    const exchangeInfo = await getExchangeInfo(apiKey);
    
    return exchangeInfo.symbols
      .filter((symbol: any) => 
        symbol.status === 'TRADING' && 
        symbol.quoteAsset === 'USDT' &&
        symbol.isSpotTradingAllowed
      )
      .map((symbol: any) => symbol.symbol);
  } catch (error) {
    console.error('Failed to get tradable USDT pairs:', error);
    return [];
  }
};

// Beräkna volatilitet för en symbol baserat på orderbok
export const calculateVolatility = async (symbol: string, apiKey: string): Promise<number> => {
  try {
    const orderBook = await getOrderBook(symbol, 20, apiKey);
    
    // Beräkna spread som ett mått på volatilitet
    const bestBid = parseFloat(orderBook.bids[0][0]);
    const bestAsk = parseFloat(orderBook.asks[0][0]);
    const spread = ((bestAsk - bestBid) / bestBid) * 100;
    
    // Beräkna volym som ett mått på likviditet
    const bidVolume = orderBook.bids.reduce((sum: number, bid: string[]) => sum + parseFloat(bid[1]), 0);
    const askVolume = orderBook.asks.reduce((sum: number, ask: string[]) => sum + parseFloat(ask[1]), 0);
    const totalVolume = bidVolume + askVolume;
    
    // Kombinera spread och volym för att få ett volatilitetsmått
    // Hög spread och hög volym = hög volatilitet = bra för handel
    return spread * Math.log10(totalVolume);
  } catch (error) {
    console.error(`Failed to calculate volatility for ${symbol}:`, error);
    return 0;
  }
};
