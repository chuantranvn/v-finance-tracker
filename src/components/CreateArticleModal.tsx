"use client";

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Image as ImageIcon, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '@/components/AuthProvider';
import { ArticleData } from '@/types';
import AuthorInfo from './AuthorInfo';
import { compressImageToBase64 } from '@/lib/utils';

interface CreateArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  sharedArticle?: ArticleData | null;
}

export default function CreateArticleModal({ isOpen, onClose, onSuccess, sharedArticle }: CreateArticleModalProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (imageFiles.length + files.length > 4) {
      setError('Bạn chỉ có thể chọn tối đa 4 ảnh');
      return;
    }

    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        setError('Có ảnh vượt quá kích thước tối đa 5MB');
        return false;
      }
      return true;
    });

    if (validFiles.length > 0) {
      setImageFiles(prev => [...prev, ...validFiles]);
      const newPreviews = validFiles.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
      setError(null);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      const newPreviews = [...prev];
      URL.revokeObjectURL(newPreviews[index]);
      newPreviews.splice(index, 1);
      return newPreviews;
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAllImages = () => {
    setImageFiles([]);
    imagePreviews.forEach(preview => URL.revokeObjectURL(preview));
    setImagePreviews([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || (!content.trim() && imageFiles.length === 0)) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const articleId = crypto.randomUUID();
      let uploadedImageUrls: string[] = [];

      if (imageFiles.length > 0) {
        // Since limit is 1MB, we share the allowed size among images (e.g. 0.8MB total)
        const sizePerImage = 0.8 / imageFiles.length;
        for (const file of imageFiles) {
           const base64Url = await compressImageToBase64(file, sizePerImage);
           uploadedImageUrls.push(base64Url);
        }
      }

      const articleRef = doc(db, 'articles', articleId);
      
      const articleData: any = {
        authorId: user.uid,
        authorPhone: user.phoneNumber,
        content: content.trim(),
        createdAt: serverTimestamp(),
        likesCount: 0,
        commentsCount: 0,
        isDeleted: false,
        sharedArticleId: sharedArticle?.id || null
      };

      if (uploadedImageUrls.length > 0) {
        articleData.imageUrls = uploadedImageUrls;
        // Keep imageUrl for backwards compatibility if there's only 1 image
        if (uploadedImageUrls.length === 1) {
           articleData.imageUrl = uploadedImageUrls[0];
        }
      }

      await setDoc(articleRef, articleData);

      setContent('');
      removeAllImages();
      onSuccess?.();
      onClose();
    } catch (err: any) {
      console.error("Error creating article:", err);
      setError(`Lỗi: ${err.message || "Không thể đăng bài. Vui lòng thử lại sau."}`);
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

              {imagePreviews.length > 0 && (
                <div className={`mb-6 grid gap-2 ${
                  imagePreviews.length === 1 ? 'grid-cols-1' :
                  imagePreviews.length === 2 ? 'grid-cols-2' :
                  imagePreviews.length === 3 ? 'grid-cols-2' :
                  'grid-cols-2'
                }`}>
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className={`relative rounded-xl overflow-hidden border border-gray-100 bg-black/5 flex items-center justify-center ${
                      imagePreviews.length === 3 && index === 0 ? 'col-span-2 aspect-video' : 'aspect-square'
                    }`}>
                      <img src={preview} alt={`Preview ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleImageChange}
                  />
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    title="Thêm ảnh"
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || (!content.trim() && imageFiles.length === 0)}
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
