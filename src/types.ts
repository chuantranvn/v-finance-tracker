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

export interface ArticleData {
  id: string;
  authorId: string;
  authorPhone: string;
  content: string;
  createdAt: any;
  likesCount: number;
  commentsCount: number;
  isDeleted?: boolean;
  sharedArticleId?: string | null;
}
