'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, MailOpen } from 'lucide-react';

interface ReportResolvedModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
}

export default function ReportResolvedModal({ isOpen, onClose, username }: ReportResolvedModalProps) {
  const [stage, setStage] = useState<'closed' | 'opening' | 'text'>('closed');

  useEffect(() => {
    if (isOpen) {
      setStage('opening');
      const timer = setTimeout(() => setStage('text'), 1000);
      return () => clearTimeout(timer);
    } else {
      setStage('closed');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div 
          className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl relative overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {stage === 'closed' || stage === 'opening' ? (
            <motion.div className="flex flex-col items-center justify-center h-40">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                transition={{ duration: 0.5 }}
              >
                <Mail size={48} className="text-blue-600" />
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <MailOpen size={32} className="text-blue-600 mb-4" />
              <h2 className="text-2xl font-bold mb-4">Dear {username},</h2>
              <p className="text-gray-700 leading-relaxed">
                Chúng tôi xin thông báo rằng báo cáo của bạn về bài viết đã được xem xét và xử lý. Cảm ơn bạn đã đóng góp để xây dựng cộng đồng an toàn hơn.
              </p>
              <button 
                onClick={onClose} 
                className="mt-6 w-full py-2 bg-gray-900 text-white rounded-xl font-medium"
              >
                Đóng
              </button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
