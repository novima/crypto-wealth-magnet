
// Utility för att kommunicera med Binance API
import CryptoJS from 'crypto-js';

// Binance API endpoints
const BASE_URL = 'https://api.binance.com';
const TEST_CONNECTIVITY = '/api/v3/ping';
const ACCOUNT_INFO = '/api/v3/account';
const NEW_ORDER = '/api/v3/order';
const EXCHANGE_INFO = '/api/v3/exchangeInfo';
const ORDER_BOOK = '/api/v3/depth';
const TICKER_PRICE = '/api/v3/ticker/price';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

// För att skapa signatur för Binance API-anrop
const createSignature = (queryString: string, apiSecret: string): string => {
  return CryptoJS.HmacSHA256(queryString, apiSecret).toString(CryptoJS.enc.Hex);
};

// Förbättrad fetch-funktion med retry-logik
const fetchWithRetry = async (url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      console.log(`Retry attempt remaining: ${retries}. Retrying in ${RETRY_DELAY}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
};

// Test-anslutning till Binance API
export const testConnectivity = async (): Promise<boolean> => {
  try {
    const response = await fetchWithRetry(`${BASE_URL}${TEST_CONNECTIVITY}`, {});
    return response.ok;
  } catch (error) {
    console.error('Binance API test connectivity error:', error);
    return false;
  }
};

// Validera API-nycklar genom att försöka hämta kontoinformation
export const validateApiKeys = async (apiKey: string, apiSecret: string): Promise<boolean> => {
  try {
    // Se till att vi har giltiga nycklar
    if (!apiKey || !apiSecret || apiKey.length < 10 || apiSecret.length < 10) {
      console.error('Invalid API keys: Keys are too short or missing');
      return false;
    }

    // Först testa grundläggande anslutning
    const isConnected = await testConnectivity();
    if (!isConnected) {
      console.error('Failed to connect to Binance API');
      return false;
    }

    // Skapa timestamp och querystring för signatur
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    
    // Skapa signatur med API Secret
    const signature = createSignature(queryString, apiSecret);
    
    // Hämta kontoinformation för att validera nycklarna
    const response = await fetchWithRetry(`${BASE_URL}${ACCOUNT_INFO}?${queryString}&signature=${signature}`, {
      method: 'GET',
      headers: {
        'X-MBX-APIKEY': apiKey
      }
    });
    
    const data = await response.json();
    console.log('Binance API validation successful:', data);
    return true;
  } catch (error) {
    console.error('Binance API validation error:', error);
    return false;
  }
};

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
    throw error;
  }
};

// Förbättrad funktion för att beräkna optimal handelsstorlek baserat på kontostorlek
export const calculateOptimalQuantity = async (
  symbol: string, 
  availableBalance: number, 
  percentOfBalance: number,
  apiKey: string
): Promise<number> => {
  try {
    // Hämta aktuellt pris
    const currentPrice = await getCurrentPrice(symbol, apiKey);
    
    // Hämta symbolinformation för att få minsta handelsstorlek
    const exchangeInfo = await getExchangeInfo(apiKey);
    const symbolInfo = exchangeInfo.symbols.find((s: any) => s.symbol === symbol);
    
    if (!symbolInfo) {
      throw new Error(`Symbol ${symbol} information not found`);
    }
    
    // Hitta minsta tillåtna orderkvantitet
    const lotSizeFilter = symbolInfo.filters.find((f: any) => f.filterType === 'LOT_SIZE');
    const minQty = parseFloat(lotSizeFilter.minQty);
    const stepSize = parseFloat(lotSizeFilter.stepSize);
    
    // Beräkna hur mycket av kontot vi vill handla med
    const amountToTrade = availableBalance * (percentOfBalance / 100);
    
    // Beräkna kvantitet baserat på aktuellt pris
    let quantity = amountToTrade / currentPrice;
    
    // Avrunda till närmaste tillåtna stegstorleken
    quantity = Math.floor(quantity / stepSize) * stepSize;
    
    // Se till att vi inte handlar under minkvantiteten
    if (quantity < minQty) {
      quantity = minQty;
    }
    
    // Formatera till rätt antal decimaler baserat på stepSize
    const decimalPlaces = stepSize.toString().includes('.') 
      ? stepSize.toString().split('.')[1].length 
      : 0;
    
    return parseFloat(quantity.toFixed(decimalPlaces));
  } catch (error) {
    console.error('Failed to calculate optimal quantity:', error);
    // Vid fel, använd en säker liten kvantitet
    return 0.001; // Säker minimal kvantitet för de flesta coins
  }
};

// Utföra en köp- eller säljorder på Binance med förbättrad felhantering
export const executeOrder = async (
  apiKey: string,
  apiSecret: string,
  symbol: string,
  side: 'BUY' | 'SELL',
  quantity: number,
  price?: number
): Promise<any> => {
  try {
    console.log(`Executing ${side} order for ${quantity} of ${symbol}`);
    
    // Skapa timestamp och grundläggande querystring för signatur
    const timestamp = Date.now();
    
    // Bygg querystring baserat på om det är en limit eller market order
    let queryString = `symbol=${symbol}&side=${side}&timestamp=${timestamp}`;
    
    if (price) {
      // Limit order med specificerat pris
      queryString += `&type=LIMIT&timeInForce=GTC&quantity=${quantity}&price=${price}`;
    } else {
      // Market order utan specificerat pris
      queryString += `&type=MARKET&quantity=${quantity}`;
    }
    
    // Skapa signatur
    const signature = createSignature(queryString, apiSecret);
    
    // Gör API-anrop för att skapa ordern
    const response = await fetchWithRetry(`${BASE_URL}${NEW_ORDER}?${queryString}&signature=${signature}`, {
      method: 'POST',
      headers: {
        'X-MBX-APIKEY': apiKey
      }
    });
    
    const orderData = await response.json();
    console.log('Binance order executed successfully:', orderData);
    return orderData;
  } catch (error) {
    console.error('Binance order execution error:', error);
    throw error;
  }
};

// Hämta kontosaldo från Binance
export const getAccountBalance = async (apiKey: string, apiSecret: string): Promise<any> => {
  try {
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = createSignature(queryString, apiSecret);
    
    const response = await fetchWithRetry(`${BASE_URL}${ACCOUNT_INFO}?${queryString}&signature=${signature}`, {
      method: 'GET',
      headers: {
        'X-MBX-APIKEY': apiKey
      }
    });
    
    const data = await response.json();
    return data.balances;
  } catch (error) {
    console.error('Failed to get account balance:', error);
    throw error;
  }
};

// Överför vinster till användarens Binance-konto (i en riktig implementation skulle detta vara en intern överföring,
// men i vårt fall så är pengarna redan på Binance-kontot, så vi loggar bara detta)
export const transferProfitToBinanceAccount = async (
  amount: number,
  currency: string = 'USDT'
): Promise<boolean> => {
  try {
    // I en riktig implementation skulle vi göra en faktisk överföring här
    // Men eftersom pengarna redan är på Binance-kontot så loggar vi bara
    console.log(`Vinst på ${amount.toFixed(2)} ${currency} har markerats som "realiserad" på ditt Binance-konto`);
    return true;
  } catch (error) {
    console.error('Failed to transfer profit:', error);
    return false;
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

