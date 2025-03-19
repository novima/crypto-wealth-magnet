
// CORS-proxy konfiguration
export const CORS_PROXY = 'https://cors-anywhere.herokuapp.com/';
export const BASE_URL = CORS_PROXY + 'https://api.binance.com';

// Binance API endpoints
export const TEST_CONNECTIVITY = '/api/v3/ping';
export const ACCOUNT_INFO = '/api/v3/account';
export const NEW_ORDER = '/api/v3/order';
export const EXCHANGE_INFO = '/api/v3/exchangeInfo';
export const ORDER_BOOK = '/api/v3/depth';
export const TICKER_PRICE = '/api/v3/ticker/price';

// Retry configuration
export const MAX_RETRIES = 3;
export const RETRY_DELAY = 1000; // ms
