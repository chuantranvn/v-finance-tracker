"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Heart, Share2, MoreHorizontal, Loader2, Edit2, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale/vi';
import CommentsModal from './CommentsModal';
import { useAuth } from './AuthProvider';
import { db } from '@/lib/firebase';
import { doc, writeBatch, onSnapshot, increment, updateDoc, getDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import AuthorInfo from './AuthorInfo';
import { ArticleData } from '@/types';
import EditArticleModal from './EditArticleModal';
import { handleFirestoreError, OperationType } from '@/lib/firebase';

export default function ArticleCard({ article: initialArticle, onShare }: { article: ArticleData; onShare?: (article: ArticleData) => void }) {
  const { user } = useAuth();
  const [article, setArticle] = useState<ArticleData>(initialArticle);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sharedArticleContent, setSharedArticleContent] = useState<ArticleData | null>(null);
  const [isSharedArticleLoading, setIsSharedArticleLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isAuthor = user?.uid === article.authorId;

  useEffect(() => {
    // Sync with database for real-time updates (likesCount, commentsCount)
    const articleRef = doc(db, 'articles', initialArticle.id);
    const unsubscribe = onSnapshot(articleRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data() as ArticleData;
        setArticle({ id: doc.id, ...data });
      }
    });
    return () => unsubscribe();
  }, [initialArticle.id]);

  useEffect(() => {
    // Fetch shared article if exists
    if (article.sharedArticleId) {
      setIsSharedArticleLoading(true);
      const sharedRef = doc(db, 'articles', article.sharedArticleId);
      getDoc(sharedRef).then((snap) => {
        if (snap.exists()) {
          setSharedArticleContent({ id: snap.id, ...snap.data() } as ArticleData);
        } else {
          setSharedArticleContent(null);
        }
        setIsSharedArticleLoading(false);
      }).catch(err => {
        console.error("Error fetching shared article:", err);
        setIsSharedArticleLoading(false);
      });
    }
  }, [article.sharedArticleId]);

  useEffect(() => {
    if (!user) return;
    const likeRef = doc(db, 'articles', article.id, 'likes', user.uid);
    const unsubscribe = onSnapshot(likeRef, (doc) => {
      setIsLiked(doc.exists());
    });
    return () => unsubscribe();
  }, [user, article.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLike = async () => {
    if (!user || isLiking) return;
    setIsLiking(true);

    try {
      const batch = writeBatch(db);
      const likeRef = doc(db, 'articles', article.id, 'likes', user.uid);
      const articleRef = doc(db, 'articles', article.id);

      if (isLiked) {
        batch.delete(likeRef);
        batch.update(articleRef, { likesCount: increment(-1) });
      } else {
        batch.set(likeRef, { createdAt: new Date() });
        batch.update(articleRef, { likesCount: increment(1) });
      }

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `articles/${article.id}/likes`);
    } finally {
      setIsLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!isAuthor || isDeleting) return;
    if (!confirm("Bạn có chắc chắn muốn xoá bài viết này?")) return;

    setIsDeleting(true);
    try {
      const articleRef = doc(db, 'articles', article.id);
      await updateDoc(articleRef, {
        isDeleted: true,
        updatedAt: new Date()
      });
      setShowMenu(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `articles/${article.id}`);
      alert("Không thể xoá bài viết. Vui lòng thử lại.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleShareClick = () => {
    if (onShare) {
      onShare(article);
    }
  };

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const date = useMemo(() => {
    if (!article.createdAt) return new Date();
    return article.createdAt.toDate ? article.createdAt.toDate() : new Date(initialArticle.createdAt?.seconds * 1000 || Date.now());
  }, [article.createdAt, initialArticle.createdAt]);

  if (article.isDeleted) return null;

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow w-full"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col gap-1">
            <AuthorInfo 
              uid={article.authorId} 
              fallbackPhone={article.authorPhone} 
              size="lg"
            />
              {isMounted ? (
                <span className="text-xs text-gray-400 ml-12">
                  {formatDistanceToNow(date, { addSuffix: true, locale: vi })}
                </span>
              ) : (
                <span className="text-xs text-gray-400 ml-12">Đang tải...</span>
              )}
          </div>
          
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-400 hover:bg-gray-50 rounded-full transition-colors"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden"
                >
                  {isAuthor ? (
                    <>
                      <button 
                        onClick={() => {
                          setIsEditModalOpen(true);
                          setShowMenu(false);
                        }}
                        className="w-full px-4 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-blue-500" />
                        Chỉnh sửa
                      </button>
                      <button 
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="w-full px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        Xoá bài viết
                      </button>
                    </>
                  ) : (
                    <button 
                      onClick={() => {
                        alert("Tính năng báo cáo đang được phát triển.");
                        setShowMenu(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                    >
                      Báo cáo bài viết
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <p className={cn("text-gray-700 whitespace-pre-wrap leading-relaxed", article.sharedArticleId ? "mb-4" : "mb-6")}>
          {article.content}
        </p>

        {article.sharedArticleId && (
          <div className="mb-6 p-4 bg-[#f8f9fa] rounded-2xl border border-gray-100 group/shared">
            {isSharedArticleLoading ? (
               <div className="flex items-center justify-center py-4">
                 <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
               </div>
            ) : sharedArticleContent && !sharedArticleContent.isDeleted ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-gray-200 rounded-full overflow-hidden">
                    <AuthorInfo uid={sharedArticleContent.authorId} onlyAvatar />
                  </div>
                  <span className="text-xs font-bold text-gray-800">
                    <AuthorInfo uid={sharedArticleContent.authorId} onlyName />
                  </span>
                </div>
                <p className="text-sm text-gray-600 line-clamp-3">
                  {sharedArticleContent.content}
                </p>
              </div>
            ) : (
              <div className="py-2 text-sm text-gray-400 flex items-center gap-2 italic">
                <Trash2 className="w-4 h-4" />
                Bài viết này không còn tồn tại hoặc đã bị ẩn đi do tác giả
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-6 pt-4 border-t border-gray-50">
          <button 
            onClick={handleLike}
            disabled={isLiking}
            className={cn(
              "flex items-center gap-2 transition-colors group",
              isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
            )}
          >
            <div className={cn(
              "p-2 rounded-lg transition-colors",
              isLiked ? "bg-red-50" : "group-hover:bg-red-50"
            )}>
              <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
            </div>
            <span className="text-sm font-medium">{article.likesCount || 0}</span>
          </button>

          <button 
            onClick={() => setIsCommentsOpen(true)}
            className="flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors group"
          >
            <div className="p-2 group-hover:bg-blue-50 rounded-lg transition-colors">
              <MessageCircle className="w-5 h-5" />
            </div>
            <span className="text-sm font-medium">{article.commentsCount || 0}</span>
          </button>

          <button 
            onClick={handleShareClick}
            className="flex items-center gap-2 text-gray-500 hover:text-green-500 transition-colors group ml-auto"
          >
            <div className="p-2 group-hover:bg-green-50 rounded-lg transition-colors">
              <Share2 className="w-5 h-5" />
            </div>
          </button>
        </div>
      </motion.div>


      <CommentsModal 
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        articleId={article.id}
      />

      {isAuthor && (
        <EditArticleModal 
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          article={article}
        />
      )}
    </>
  );
}

