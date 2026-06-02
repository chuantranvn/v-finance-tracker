"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ArticleData } from '@/types';
import ArticleCard from '@/components/ArticleCard';
import { Loader2, ArrowLeft } from 'lucide-react';

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const articleId = params.articleId as string;
  const [article, setArticle] = useState<ArticleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!articleId) return;

    const fetchArticle = async () => {
      try {
        const articleRef = doc(db, 'articles', articleId);
        const docSnap = await getDoc(articleRef);

        if (docSnap.exists()) {
          setArticle({ id: docSnap.id, ...docSnap.data() } as ArticleData);
        } else {
          setError('Không tìm thấy bài viết');
        }
      } catch (err) {
        setError('Có lỗi xảy ra khi tải bài viết');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [articleId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{error || 'Không tìm thấy bài viết'}</h1>
        <button onClick={() => router.push('/')} className="text-blue-600 font-medium">Về trang chủ</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] p-4 md:p-6 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <button 
            onClick={() => router.push('/')}
            className="flex items-center text-gray-600 hover:text-blue-600 transition-colors gap-2 font-medium mb-4"
        >
            <ArrowLeft className="w-5 h-5" />
            Về trang chủ
        </button>
        <ArticleCard article={article} />
      </div>
    </div>
  );
}
