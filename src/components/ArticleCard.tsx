"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, Heart, Share2, MoreHorizontal, Loader2, Edit2, Trash2, EyeOff, Eye, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale/vi';
import CommentsModal from './CommentsModal';
import ReportModal from './ReportModal';
import { useAuth } from './AuthProvider';
import { db, addNotification } from '@/lib/firebase';
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
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  const [sharedArticleContent, setSharedArticleContent] = useState<ArticleData | null>(null);
  const [isSharedArticleLoading, setIsSharedArticleLoading] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const imagesToView = useMemo(() => {
    if (article.imageUrls && article.imageUrls.length > 0) return article.imageUrls;
    if (article.imageUrl) return [article.imageUrl];
    return [];
  }, [article.imageUrls, article.imageUrl]);

  const sharedImagesToView = useMemo(() => {
    if (!sharedArticleContent) return [];
    if (sharedArticleContent.imageUrls && sharedArticleContent.imageUrls.length > 0) return sharedArticleContent.imageUrls;
    if (sharedArticleContent.imageUrl) return [sharedArticleContent.imageUrl];
    return [];
  }, [sharedArticleContent]);

  const isAuthor = user?.uid === article.authorId;

  useEffect(() => {
    // Sync with database for real-time updates (likesCount, commentsCount)
    const articleRef = doc(db, 'articles', initialArticle.id);
    const unsubscribe = onSnapshot(articleRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setArticle({ ...data, id: snapshot.id } as ArticleData);
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
        await addNotification(db, 'like', article.id, user.uid, article.authorId);
      }

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `articles/${article.id}/likes`);
    } finally {
      setIsLiking(false);
    }
  };

  const handleToggleHide = async () => {
    if (!isAuthor || isHiding) return;
    setIsHiding(true);
    try {
      const articleRef = doc(db, 'articles', article.id);
      await updateDoc(articleRef, {
        isHidden: !article.isHidden,
        updatedAt: new Date()
      });
      setShowMenu(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `articles/${article.id}`);
      alert("Không thể thay đổi trạng thái ẩn hiện. Vui lòng thử lại.");
    } finally {
      setIsHiding(false);
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
    if (!isMounted || !article.createdAt) return null;
    return article.createdAt.toDate ? article.createdAt.toDate() : new Date(initialArticle.createdAt?.seconds * 1000 || Date.now());
  }, [article.createdAt, initialArticle.createdAt, isMounted]);

  if (article.isDeleted) return null;
  
  const isBlocked = article.isBlockedByAdmin;

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "rounded-3xl p-6 shadow-sm border transition-shadow w-full",
          isBlocked ? "bg-gray-100 border-red-300" : "bg-white border-gray-100 hover:shadow-md"
        )}
      >
        {isBlocked && (
          <div className="mb-4 p-2 bg-red-100 border border-red-500 text-red-700 font-bold rounded-lg text-sm text-center">
            Bài viết đã bị ẩn bởi quản trị viên
          </div>
        )}
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col gap-1">
            <AuthorInfo 
              uid={article.authorId} 
              fallbackPhone={article.authorPhone} 
              size="lg"
            />
              {isMounted && date ? (
                <div className="flex items-center gap-2 ml-12">
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(date, { addSuffix: true, locale: vi })}
                  </span>
                  {article.isHidden && isAuthor && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 bg-orange-50 text-orange-600 rounded text-[10px] font-bold uppercase tracking-wider">
                      <EyeOff className="w-2.5 h-2.5" />
                      Ẩn
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-xs text-gray-400 ml-12 opacity-0">.</span>
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
                        onClick={handleToggleHide}
                        disabled={isHiding}
                        className="w-full px-4 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors"
                      >
                        {isHiding ? (
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        ) : article.isHidden ? (
                          <>
                            <Eye className="w-4 h-4 text-green-500" />
                            Hiện trên trang chủ
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-4 h-4 text-orange-500" />
                            Ẩn khỏi trang chủ
                          </>
                        )}
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
                        setIsReportModalOpen(true);
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

        <p className={cn("text-gray-700 whitespace-pre-wrap leading-relaxed", (article.sharedArticleId || article.imageUrl || (article.imageUrls && article.imageUrls.length > 0)) ? "mb-4" : "mb-6")}>
          {article.content}
        </p>

        {article.imageUrls && article.imageUrls.length > 1 ? (
          <div className={`mb-6 grid gap-2 ${
            article.imageUrls.length === 2 ? 'grid-cols-2' :
            article.imageUrls.length === 3 ? 'grid-cols-2' :
            'grid-cols-2'
          }`}>
            {article.imageUrls.map((url, index) => (
              <div 
                key={index} 
                onClick={() => setSelectedImageIndex(index)}
                className={`rounded-xl overflow-hidden border border-gray-100 bg-black/5 flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity ${
                  article.imageUrls!.length === 3 && index === 0 ? 'col-span-2 aspect-video' : 'aspect-square'
                }`}
              >
                <img src={url} alt={`Attachment ${index + 1}`} className="w-full h-full object-cover" loading="lazy" />
              </div>
            ))}
          </div>
        ) : article.imageUrl || (article.imageUrls && article.imageUrls.length === 1) ? (
          <div 
            onClick={() => setSelectedImageIndex(0)}
            className="mb-6 rounded-2xl overflow-hidden border border-gray-100 bg-black/5 flex items-center justify-center max-h-[500px] cursor-pointer hover:opacity-90 transition-opacity"
          >
            <img 
              src={article.imageUrls?.[0] || article.imageUrl} 
              alt="Article attachment" 
              className="w-full h-full object-contain"
              loading="lazy"
            />
          </div>
        ) : null}

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
                {sharedArticleContent.imageUrls && sharedArticleContent.imageUrls.length > 1 ? (
                  <div className="mt-2 grid grid-cols-2 gap-1">
                    {sharedArticleContent.imageUrls.slice(0, 2).map((url, i) => (
                      <div 
                        key={i} 
                        onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(i); }}
                        className="rounded-lg overflow-hidden border border-gray-100 bg-black/5 flex items-center justify-center aspect-video cursor-pointer hover:opacity-90 transition-opacity"
                      >
                        <img src={url} alt={`Shared attachment ${i}`} className="w-full h-full object-cover" loading="lazy" />
                      </div>
                    ))}
                  </div>
                ) : (sharedArticleContent.imageUrl || (sharedArticleContent.imageUrls && sharedArticleContent.imageUrls.length === 1)) ? (
                  <div 
                    onClick={(e) => { e.stopPropagation(); setSelectedImageIndex(0); }}
                    className="mt-2 rounded-xl overflow-hidden border border-gray-100 bg-black/5 flex items-center justify-center max-h-32 cursor-pointer hover:opacity-90 transition-opacity"
                  >
                     <img 
                       src={sharedArticleContent.imageUrls?.[0] || sharedArticleContent.imageUrl} 
                       alt="Shared attachment" 
                       className="max-w-full max-h-32 object-contain" 
                       loading="lazy"
                     />
                  </div>
                ) : null}
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
        articleAuthorId={article.authorId}
      />

      <ReportModal 
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        postId={article.id}
      />

      {isAuthor && (
        <EditArticleModal 
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          article={article}
        />
      )}

      {/* Image Viewer Lightbox */}
      <AnimatePresence>
        {selectedImageIndex !== null && imagesToView.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center backdrop-blur-sm"
          >
            <button
              onClick={() => setSelectedImageIndex(null)}
              className="absolute top-4 right-4 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all z-50"
            >
              <X className="w-6 h-6" />
            </button>

            {imagesToView.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex((prev) => (prev! === 0 ? imagesToView.length - 1 : prev! - 1));
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all z-50"
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImageIndex((prev) => (prev! === imagesToView.length - 1 ? 0 : prev! + 1));
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-all z-50"
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}

            <motion.div 
              key={selectedImageIndex}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center p-4 md:p-12"
              onClick={() => setSelectedImageIndex(null)}
            >
              <img
                src={imagesToView[selectedImageIndex]}
                alt={`Full preview ${selectedImageIndex + 1}`}
                className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-sm select-none"
                onClick={(e) => e.stopPropagation()}
              />
              
              {imagesToView.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-50 bg-black/50 px-4 py-2 rounded-full backdrop-blur-md">
                  {imagesToView.map((_, idx) => (
                    <div 
                      key={idx}
                      className={`w-2 h-2 rounded-full transition-all ${idx === selectedImageIndex ? 'bg-white scale-125' : 'bg-white/40'}`}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

