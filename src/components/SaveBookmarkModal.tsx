"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface SaveBookmarkModalProps {
  isOpen: boolean;
  symbolInput: string;
  setSymbolInput: (val: string) => void;
  shares: number;
  buyPrice: string;
  currentPrice: string;
  onSave: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function SaveBookmarkModal({
  isOpen,
  symbolInput,
  setSymbolInput,
  shares,
  buyPrice,
  currentPrice,
  onSave,
  onClose
}: SaveBookmarkModalProps) {
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
            className="bg-white p-6 md:p-8 rounded-[24px] md:rounded-[32px] shadow-2xl border border-gray-100 w-full max-w-sm"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Lưu Bookmark</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-800 bg-gray-100 rounded-full p-2 transition-colors">
                <X size={16} />
              </button>
            </div>
            
            <form onSubmit={onSave}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs md:text-sm font-bold text-gray-500">Mã Cổ Phiếu / Tên</label>
                  <input 
                    type="text"
                    autoFocus
                    value={symbolInput}
                    onChange={(e) => setSymbolInput(e.target.value)}
                    placeholder="Ví dụ: FPT"
                    maxLength={100}
                    className="w-full bg-gray-50 border border-gray-200 rounded-[14px] md:rounded-[16px] py-3.5 md:py-4 px-4 md:px-5 text-lg md:text-xl font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black text-black"
                  />
                </div>

                <div className="bg-gray-100/50 p-4 rounded-[14px] md:rounded-[16px] border border-gray-200/50 mt-6 mb-6">
                  <p className="text-[10px] md:text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">Thông tin lưu trữ</p>
                  <p className="text-sm md:text-base font-bold text-gray-800 mb-1">{shares.toLocaleString()} cổ phiếu</p>
                  <p className="text-xs text-gray-600 font-medium">Mua: {(buyPrice ? parseFloat(buyPrice.replace(/,/g, '')) : 0).toLocaleString()}k • Bán: {(currentPrice ? parseFloat(currentPrice.replace(/,/g, '')) : 0).toLocaleString()}k</p>
                </div>
                
                <button 
                  type="submit"
                  disabled={!symbolInput.trim()}
                  className="w-full bg-black text-white font-bold py-3.5 md:py-4 rounded-[14px] md:rounded-[16px] hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:hover:bg-black shadow-lg"
                >
                  Xác nhận lưu
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
