"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  startAfter,
  DocumentData,
  QueryDocumentSnapshot,
  where
} from 'firebase/firestore';
import ArticleCard from './ArticleCard';
import { Loader2, RefreshCw } from 'lucide-react';
import { ArticleData } from '@/types';
import { handleFirestoreError, OperationType } from '@/lib/firebase';

interface NewsFeedProps {
  onShareArticle?: (article: ArticleData) => void;
}

export default function NewsFeed({ onShareArticle }: NewsFeedProps) {
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const fetchArticles = useCallback(async (isLoadMore = false) => {
    if (isLoadMore) {
        setLoadingMore(true);
    } else {
        setLoading(true);
    }

    try {
      const articlesRef = collection(db, 'articles');
      let q = query(
        articlesRef, 
        where('isDeleted', '==', false),
        orderBy('createdAt', 'desc'), 
        limit(10)
      );

      if (isLoadMore && lastDoc) {
        q = query(
          articlesRef, 
          where('isDeleted', '==', false),
          orderBy('createdAt', 'desc'), 
          startAfter(lastDoc), 
          limit(10)
        );
      }

      const snapshot = await getDocs(q);
      
      const fetchedArticles = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ArticleData[];

      // In home feed, filter out hidden articles
      const filteredArticles = fetchedArticles.filter(a => !a.isHidden);

      if (isLoadMore) {
        setArticles(prev => [...prev, ...filteredArticles]);
      } else {
        setArticles(filteredArticles);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === 10);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'articles');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [lastDoc]);

  useEffect(() => {
    fetchArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl flex flex-col gap-6">
      {articles.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <p className="text-gray-400">Chưa có bài viết nào. Hãy là người đầu tiên chia sẻ!</p>
        </div>
      ) : (
        articles.map(article => (
          <ArticleCard 
            key={article.id} 
            article={article} 
            onShare={onShareArticle} 
          />
        ))
      )}

      {hasMore && (
        <button
          onClick={() => fetchArticles(true)}
          disabled={loadingMore}
          className="w-full py-4 bg-white rounded-3xl border border-gray-100 text-sm font-semibold text-gray-500 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
        >
          {loadingMore ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Tải thêm bài viết
        </button>
      )}
    </div>
  );
}
