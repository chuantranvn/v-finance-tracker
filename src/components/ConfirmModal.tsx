"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmModalProps {
  isOpen: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({ isOpen, message, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-white/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-6"
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white p-6 md:p-8 rounded-[24px] md:rounded-[32px] shadow-2xl border border-gray-100 w-full max-w-sm text-center"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-2 md:mb-4">Xác nhận</h3>
            <p className="text-sm md:text-base text-gray-600 mb-6 md:mb-8 font-medium">{message}</p>
            <div className="flex items-center gap-2 md:gap-3">
              <button 
                onClick={onCancel}
                className="flex-1 bg-gray-100 text-gray-700 font-bold py-3.5 md:py-4 rounded-[14px] md:rounded-[16px] hover:bg-gray-200 transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={onConfirm}
                className="flex-1 bg-red-500 text-white font-bold py-3.5 md:py-4 rounded-[14px] md:rounded-[16px] hover:bg-red-600 transition-colors tracking-wide shadow-md"
              >
                Xóa
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
