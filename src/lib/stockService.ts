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

        const workerUrl = `https://still-lake-4d40.adjim-loanthe.workers.dev?symbol=${cleanSymbol}`;

        const response = await fetch(workerUrl, {
            method: 'GET',
        });

        if (!response.ok) return null;

        const json = await response.json();

        if (json.code === 'SUCCESS' && json.data) {
            return {
                symbol: cleanSymbol,
                price: json.data.matchedPrice,
                name: json.data.clientName || cleanSymbol,
            };
        }
    } catch (error) {
        console.error(`Error fetching stock ${symbol} via Worker:`, error);
    }
    return null;
}
