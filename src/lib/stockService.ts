export interface StockData {
  symbol: string;
  price: number;
  name: string;
  change?: number;
  percentChange?: number;
}

export async function fetchStockPrice(symbol: string): Promise<StockData | null> {
  try {
    const response = await fetch(`/api/stock/${symbol.toUpperCase()}`);
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
