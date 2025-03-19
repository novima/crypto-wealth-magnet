
import CryptoJS from 'crypto-js';
import { CORS_PROXY, MAX_RETRIES, RETRY_DELAY } from './constants';

// För att skapa signatur för Binance API-anrop
export const createSignature = (queryString: string, apiSecret: string): string => {
  return CryptoJS.HmacSHA256(queryString, apiSecret).toString(CryptoJS.enc.Hex);
};

// Kontrollera om användaren behöver aktivera CORS-proxyn
export const needsCorsActivation = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${CORS_PROXY}https://api.binance.com/api/v3/ping`);
    return response.status === 403 && (await response.text()).includes('/corsdemo');
  } catch (error) {
    console.error('Error checking CORS proxy:', error);
    return true;
  }
};

// Förbättrad fetch-funktion med retry-logik och CORS proxy
export const fetchWithRetry = async (url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> => {
  try {
    const corsOptions = {
      ...options,
      headers: {
        ...options.headers,
        'Origin': window.location.origin,
      },
    };
    
    const response = await fetch(url, corsOptions);
    
    // Särskild hantering för CORS-proxy fel
    if (response.status === 403) {
      const text = await response.text();
      if (text.includes('/corsdemo')) {
        throw new Error('CORS_PROXY_NEEDS_ACTIVATION');
      }
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    
    return response;
  } catch (error) {
    if (error instanceof Error && error.message === 'CORS_PROXY_NEEDS_ACTIVATION') {
      throw error; // Vi hanterar detta fel specifikt högre upp
    }
    
    if (retries > 0) {
      console.log(`Retry attempt remaining: ${retries}. Retrying in ${RETRY_DELAY}ms...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
};
