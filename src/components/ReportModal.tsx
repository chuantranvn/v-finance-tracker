'use client';

import React, { useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from './AuthProvider';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
}

export default function ReportModal({ isOpen, onClose, postId }: ReportModalProps) {
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!user || !reason.trim()) return;
    
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'reports'), {
        postId,
        reporterId: user.uid,
        reason: reason.trim(),
        timestamp: serverTimestamp(),
        status: 'pending'
      });
      onClose();
      setReason('');
      alert('Đã báo cáo bài viết. Cảm ơn bạn!');
    } catch (error) {
      console.error("Error reporting post:", error);
      alert('Không thể báo cáo. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h2 className="text-lg font-bold mb-4">Báo cáo bài viết</h2>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Lý do báo cáo..."
          className="w-full h-32 p-3 border border-gray-200 rounded-xl mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-xl font-medium">Hủy</button>
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !reason.trim()} 
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium disabled:opacity-50"
          >
            {isSubmitting ? 'Đang gửi...' : 'Gửi báo cáo'}
          </button>
        </div>
      </div>
    </div>
  );
}
