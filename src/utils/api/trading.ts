
import { BASE_URL, NEW_ORDER } from './constants';
import { fetchWithRetry, createSignature } from './helpers';
import { getExchangeInfo, getCurrentPrice } from './marketData';

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
