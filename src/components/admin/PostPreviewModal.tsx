'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
}

export default function PostPreviewModal({ isOpen, onClose, postId }: Props) {
  const [post, setPost] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen || !postId) return;
    
    const fetchPost = async () => {
      setLoading(true);
      try {
        const postDoc = await getDoc(doc(db, 'articles', postId));
        if (postDoc.exists()) {
          setPost({ id: postDoc.id, ...postDoc.data() });
        } else {
          setPost(null);
        }
      } catch (e) {
        console.error("Error fetching post:", e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPost();
  }, [isOpen, postId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[80vh] overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">Xem trước bài viết</h3>
        
        {loading ? (
          <p>Đang tải bài viết...</p>
        ) : post ? (
          <div className="space-y-4">
            <h4 className="text-lg font-bold">{post.title}</h4>
            <div className="prose max-w-none text-gray-700">
              {post.content}
            </div>
            {post.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.imageUrl} alt="Post" className="rounded-lg w-full" />
            )}
          </div>
        ) : (
          <p className="text-red-500">Không tìm thấy bài viết hoặc bài viết đã bị xóa.</p>
        )}

        <div className="flex justify-end mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">Đóng</button>
        </div>
      </div>
    </div>
  );
}
