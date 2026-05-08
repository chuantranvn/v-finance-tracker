export interface BookmarkData {
  id: string;
  symbol: string;
  companyName?: string;
  autoUpdate?: boolean;
  isHidden?: boolean;
  shares: number;
  buyPrice: number; // in VND
  currentPrice: number; // in VND
  timestamp: number;
}
