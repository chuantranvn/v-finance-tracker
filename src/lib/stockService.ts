export interface StockData {
  symbol: string;
  price: number;
  name: string;
  change?: number;
  percentChange?: number;
}

export async function fetchStockPrice(symbol: string): Promise<StockData | null> {
  if (typeof window === 'undefined') return null;
  if (!symbol || typeof symbol !== 'string') return null;
  
  try {
    const cleanSymbol = symbol.trim().toUpperCase();
    if (!cleanSymbol) return null;

    const url = `https://iboard-query.ssi.com.vn/stock/${cleanSymbol}?boardId=MAIN`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    if (!response.ok) return null;

    const json = await response.json();
    if (json.code === 'SUCCESS' && json.data) {
      return {
        symbol: symbol.toUpperCase(),
        price: json.data.matchedPrice,
        name: json.data.clientName || symbol.toUpperCase(),
      };
    }
  } catch (error) {
    console.error(`Error fetching stock ${symbol}:`, error);
  }
  return null;
}
