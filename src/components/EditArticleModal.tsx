"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Image as ImageIcon, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ArticleData } from '@/types';

interface EditArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: ArticleData;
  onSuccess?: () => void;
}

export default function EditArticleModal({ isOpen, onClose, article, onSuccess }: EditArticleModalProps) {
  const [content, setContent] = useState(article.content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setContent(article.content);
    }
  }, [isOpen, article]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const articleRef = doc(db, 'articles', article.id);
      
      await updateDoc(articleRef, {
        content: content.trim(),
        updatedAt: serverTimestamp()
      });

      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error("Error updating article:", err);
      setError("Không thể cập nhật bài viết. Vui lòng thử lại sau.");
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
            className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Chỉnh sửa bài viết</h2>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                  {error}
                </div>
              )}

              <textarea
                placeholder="Bạn muốn thay đổi nội dung gì?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl mb-6 transition-all outline-none resize-none"
                required
              />

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
                    <Save className="w-5 h-5" />
                  )}
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
