"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Image as ImageIcon, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useAuth } from '@/components/AuthProvider';
import { ArticleData } from '@/types';
import AuthorInfo from './AuthorInfo';

interface CreateArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  sharedArticle?: ArticleData | null;
}

export default function CreateArticleModal({ isOpen, onClose, onSuccess, sharedArticle }: CreateArticleModalProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const articleId = crypto.randomUUID();
      const articleRef = doc(db, 'articles', articleId);
      
      await setDoc(articleRef, {
        authorId: user.uid,
        authorPhone: user.phoneNumber,
        content: content.trim(),
        createdAt: serverTimestamp(),
        likesCount: 0,
        commentsCount: 0,
        isDeleted: false,
        sharedArticleId: sharedArticle?.id || null
      });

      setContent('');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error("Error creating article:", err);
      setError("Không thể đăng bài. Vui lòng thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
              <h2 className="text-xl font-bold text-gray-900">
                {sharedArticle ? 'Chia sẻ bài viết' : 'Tạo bài viết mới'}
              </h2>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto">
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                  {error}
                </div>
              )}

              <textarea
                placeholder={sharedArticle ? "Thêm nhận định của bạn về bài viết này..." : "Bạn đang nghĩ gì về thị trường hôm nay?"}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={sharedArticle ? 3 : 5}
                className="w-full px-4 py-3 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl mb-6 transition-all outline-none resize-none"
                required
              />

              {sharedArticle && (
                <div className="mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100 italic">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 bg-gray-200 rounded-full overflow-hidden">
                      <AuthorInfo uid={sharedArticle.authorId} onlyAvatar />
                    </div>
                    <span className="text-sm font-semibold text-gray-700">
                       <AuthorInfo uid={sharedArticle.authorId} onlyName />
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {sharedArticle.content}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title="Thêm ảnh (Sắp có)"
                    disabled
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !content.trim()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-200"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    sharedArticle ? <Send className="w-5 h-5" /> : <Send className="w-5 h-5" />
                  )}
                  {sharedArticle ? 'Chia sẻ ngay' : 'Đăng bài'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
