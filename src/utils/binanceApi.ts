
// Utility för att kommunicera med Binance API
import CryptoJS from 'crypto-js';

// Binance API endpoints
const BASE_URL = 'https://api.binance.com';
const TEST_CONNECTIVITY = '/api/v3/ping';
const ACCOUNT_INFO = '/api/v3/account';
const NEW_ORDER = '/api/v3/order';
const EXCHANGE_INFO = '/api/v3/exchangeInfo';

// För att skapa signatur för Binance API-anrop
const createSignature = (queryString: string, apiSecret: string): string => {
  return CryptoJS.HmacSHA256(queryString, apiSecret).toString(CryptoJS.enc.Hex);
};

// Test-anslutning till Binance API
export const testConnectivity = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${BASE_URL}${TEST_CONNECTIVITY}`);
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
      return false;
    }

    // Först testa grundläggande anslutning
    const isConnected = await testConnectivity();
    if (!isConnected) {
      return false;
    }

    // Skapa timestamp och querystring för signatur
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    
    // Skapa signatur med API Secret
    const signature = createSignature(queryString, apiSecret);
    
    // Hämta kontoinformation för att validera nycklarna
    const response = await fetch(`${BASE_URL}${ACCOUNT_INFO}?${queryString}&signature=${signature}`, {
      method: 'GET',
      headers: {
        'X-MBX-APIKEY': apiKey
      }
    });
    
    if (!response.ok) {
      console.error('Binance API validation failed:', await response.text());
      return false;
    }
    
    const data = await response.json();
    console.log('Binance API validation successful:', data);
    return true;
  } catch (error) {
    console.error('Binance API validation error:', error);
    return false;
  }
};

// Hämta marknadsinfo för att se vilka handelspar som är tillgängliga
export const getExchangeInfo = async (apiKey: string): Promise<any> => {
  try {
    const response = await fetch(`${BASE_URL}${EXCHANGE_INFO}`, {
      method: 'GET',
      headers: {
        'X-MBX-APIKEY': apiKey
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Failed to get exchange info:', error);
    throw error;
  }
};

// Utföra en köp- eller säljorder på Binance
export const executeOrder = async (
  apiKey: string,
  apiSecret: string,
  symbol: string,
  side: 'BUY' | 'SELL',
  quantity: number,
  price?: number
): Promise<any> => {
  try {
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
    const response = await fetch(`${BASE_URL}${NEW_ORDER}?${queryString}&signature=${signature}`, {
      method: 'POST',
      headers: {
        'X-MBX-APIKEY': apiKey
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Binance order execution failed:', errorText);
      throw new Error(`Order execution failed: ${errorText}`);
    }
    
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
    
    const response = await fetch(`${BASE_URL}${ACCOUNT_INFO}?${queryString}&signature=${signature}`, {
      method: 'GET',
      headers: {
        'X-MBX-APIKEY': apiKey
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
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
