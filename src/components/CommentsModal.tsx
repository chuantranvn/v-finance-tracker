"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, User, CornerDownRight, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  addDoc, 
  serverTimestamp, 
  increment, 
  updateDoc, 
  doc, 
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { useAuth } from '@/components/AuthProvider';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale/vi';
import { cn } from '@/lib/utils';
import AuthorInfo from './AuthorInfo';
import { getDisplayName } from '@/lib/userUtils';
import { handleFirestoreError, OperationType } from '@/lib/firebase';

interface CommentData {
  id: string;
  authorId: string;
  authorPhone: string;
  content: string;
  parentId?: string;
  replyToId?: string;
  replyToPhone?: string;
  likesCount?: number;
  createdAt: any;
}

const CommentItem = ({ 
  comment, 
  articleId, 
  user, 
  onReply 
}: { 
  comment: CommentData; 
  articleId: string; 
  user: any;
  onReply: (c: CommentData) => void;
}) => {
  const [localComment, setLocalComment] = useState<CommentData>(comment);
  const [isLiked, setIsLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);

  useEffect(() => {
    // Subscribe to comment changes for real-time counts
    const commentRef = doc(db, 'articles', articleId, 'comments', comment.id);
    const unsubscribe = onSnapshot(commentRef, (doc) => {
      if (doc.exists()) {
        setLocalComment({ id: doc.id, ...doc.data() } as CommentData);
      }
    });
    return () => unsubscribe();
  }, [articleId, comment.id]);

  useEffect(() => {
    if (!user) return;
    const likeRef = doc(db, 'articles', articleId, 'comments', comment.id, 'likes', user.uid);
    const unsubscribe = onSnapshot(likeRef, (doc) => {
      setIsLiked(doc.exists());
    });
    return () => unsubscribe();
  }, [user, articleId, comment.id]);

  const handleLike = async () => {
    if (!user || isLiking) return;
    setIsLiking(true);

    try {
      const batch = writeBatch(db);
      const likeRef = doc(db, 'articles', articleId, 'comments', comment.id, 'likes', user.uid);
      const commentRef = doc(db, 'articles', articleId, 'comments', comment.id);

      if (isLiked) {
        batch.delete(likeRef);
        batch.update(commentRef, { likesCount: increment(-1) });
      } else {
        batch.set(likeRef, { createdAt: new Date() });
        batch.update(commentRef, { likesCount: increment(1) });
      }

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `articles/${articleId}/comments/${comment.id}/likes`);
    } finally {
      setIsLiking(false);
    }
  };

  const isReply = !!localComment.parentId;

  return (
    <div className={cn("flex flex-col gap-1", isReply && "ml-8")}>
      <div className="flex items-start gap-2">
        <AuthorInfo 
          uid={localComment.authorId} 
          fallbackPhone={localComment.authorPhone} 
          size={isReply ? 'sm' : 'md'}
        />
        <div className="flex-1 min-w-0">
          <div className={cn(
            "rounded-2xl p-3 inline-block max-w-full",
            isReply ? "bg-blue-50/50 border border-blue-100/50" : "bg-gray-100"
          )}>
            <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
              {localComment.replyToPhone && isReply && (
                <span className="text-blue-600 font-bold mr-1">@{localComment.replyToPhone}</span>
              )}
              {isReply ? localComment.content.replace(`@${localComment.replyToPhone} `, '') : localComment.content}
            </p>
          </div>
          <div className="flex items-center gap-4 mt-1 ml-1 flex-wrap">
            <span className="text-[10px] text-gray-400" suppressHydrationWarning>
              {localComment.createdAt?.toDate ? formatDistanceToNow(localComment.createdAt.toDate(), { addSuffix: true, locale: vi }) : 'Vừa xong'}
            </span>
            <button 
              onClick={() => onReply(localComment)}
              className="text-[10px] font-bold text-gray-500 hover:text-blue-600 transition-colors"
            >
              Phản hồi
            </button>
            <button 
              onClick={handleLike}
              disabled={isLiking}
              className={cn(
                "text-[10px] font-bold transition-colors flex items-center gap-1",
                isLiked ? "text-red-500" : "text-gray-500 hover:text-red-500"
              )}
            >
              Thích {localComment.likesCount ? `(${localComment.likesCount})` : ''}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface CommentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  articleId: string;
}

export default function CommentsModal({ isOpen, onClose, articleId }: CommentsModalProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<CommentData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    const commentsRef = collection(db, 'articles', articleId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CommentData[];
      setComments(fetchedComments);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `articles/${articleId}/comments`);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen, articleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const commentsRef = collection(db, 'articles', articleId, 'comments');
      const articleRef = doc(db, 'articles', articleId);

      const commentPayload: any = {
        authorId: user.uid,
        authorPhone: user.phoneNumber,
        content: newComment.trim(),
        createdAt: serverTimestamp(),
        likesCount: 0,
      };

      if (replyingTo) {
        commentPayload.parentId = replyingTo.parentId || replyingTo.id;
        commentPayload.replyToId = replyingTo.authorId;
        commentPayload.replyToPhone = replyingTo.authorPhone;
      }

      await addDoc(commentsRef, commentPayload);
      await updateDoc(articleRef, {
        commentsCount: increment(1)
      });

      setNewComment('');
      setReplyingTo(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `articles/${articleId}/comments`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = (comment: CommentData) => {
    setReplyingTo(comment);
    setNewComment(`@${comment.authorPhone} `);
    inputRef.current?.focus();
  };

  // Group comments by parent
  const mainComments = comments.filter(c => !c.parentId);
  const replies = comments.filter(c => c.parentId);

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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl flex flex-col max-h-[85vh]"
          >
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Bình luận</h2>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : mainComments.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  Chưa có bình luận nào.
                </div>
              ) : (
                mainComments.map(comment => (
                  <div key={comment.id} className="space-y-4">
                    <CommentItem 
                      comment={comment} 
                      articleId={articleId} 
                      user={user} 
                      onReply={handleReply} 
                    />

                    {/* Replies */}
                    {replies.filter(r => r.parentId === comment.id).map(reply => (
                      <CommentItem 
                        key={reply.id}
                        comment={reply} 
                        articleId={articleId} 
                        user={user} 
                        onReply={handleReply} 
                      />
                    ))}
                  </div>
                ))
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-[2.5rem]">
              {replyingTo && (
                <div className="flex items-center justify-between mb-2 px-3 py-1.5 bg-blue-50 rounded-lg text-xs text-blue-600 font-medium">
                  <div className="flex items-center gap-1">
                    <CornerDownRight className="w-3 h-3" />
                    Đang trả lời @{replyingTo.authorPhone}
                  </div>
                  <button onClick={() => setReplyingTo(null)} className="hover:text-blue-800">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
              <form onSubmit={handleSubmit} className="flex gap-2">
                <textarea
                  ref={inputRef}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Viết bình luận..."
                  className="flex-1 bg-white border-transparent border focus:border-blue-500 rounded-2xl px-4 py-3 text-sm outline-none resize-none max-h-32 transition-all"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || isSubmitting}
                  className="w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 transition-all shadow-lg shadow-blue-200 flex-shrink-0"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
