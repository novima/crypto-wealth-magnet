
import { BASE_URL, TEST_CONNECTIVITY, ACCOUNT_INFO } from './constants';
import { fetchWithRetry, createSignature, needsCorsActivation } from './helpers';

// Test-anslutning till Binance API
export const testConnectivity = async (): Promise<boolean> => {
  try {
    const response = await fetchWithRetry(`${BASE_URL}${TEST_CONNECTIVITY}`, {});
    return response.ok;
  } catch (error) {
    console.error('Binance API test connectivity error:', error);
    
    if (error instanceof Error && error.message === 'CORS_PROXY_NEEDS_ACTIVATION') {
      return false;
    }
    
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

    // Först kontrollera om CORS-proxy behöver aktiveras
    const corsNeedsActivation = await needsCorsActivation();
    if (corsNeedsActivation) {
      console.error('CORS proxy needs activation');
      return false;
    }

    // Sedan testa grundläggande anslutning
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
    
    if (error instanceof Error && error.message === 'CORS_PROXY_NEEDS_ACTIVATION') {
      throw new Error('CORS_PROXY_NEEDS_ACTIVATION');
    }
    
    return false;
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
    
    if (error instanceof Error && error.message === 'CORS_PROXY_NEEDS_ACTIVATION') {
      throw new Error('CORS_PROXY_NEEDS_ACTIVATION');
    }
    
    throw error;
  }
};
