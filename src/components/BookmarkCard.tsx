"use client";

import React, { useEffect } from 'react';
import { Trash2, Check, EyeOff, Eye } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { BookmarkData } from '@/types';
import { fetchStockPrice } from '@/lib/stockService';

interface BookmarkCardProps {
  bookmark: BookmarkData;
  isSelectionMode: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDeleteSingle: (id: string, e: React.MouseEvent) => void;
  onLoadBookmark: (b: BookmarkData) => void;
  onToggleAutoUpdate: (id: string, e?: React.MouseEvent) => void;
  onToggleHide: (id: string, e?: React.MouseEvent) => void;
  onUpdatePrice: (id: string, price: number, name: string) => void;
}

export default function BookmarkCard({
  bookmark: b,
  isSelectionMode,
  isSelected,
  onSelect,
  onDeleteSingle,
  onLoadBookmark,
  onToggleAutoUpdate,
  onToggleHide,
  onUpdatePrice
}: BookmarkCardProps) {
  useEffect(() => {
    if (!b.autoUpdate) return;

    const fetchPrice = async () => {
      const result = await fetchStockPrice(b.symbol);
      if (result) {
        onUpdatePrice(b.id, result.price, result.name);
      }
    };

    // Polling every 5 seconds for more real-time experience if auto-update is on
    const interval = setInterval(fetchPrice, 5000);
    // Initial fetch if it's new/active
    if (Date.now() - b.timestamp < 5000) {
        fetchPrice();
    }
    
    return () => clearInterval(interval);
  }, [b.id, b.symbol, b.autoUpdate, onUpdatePrice, b.timestamp]);

  const totalInv = b.shares * b.buyPrice;
  const currVal = b.shares * b.currentPrice;
  const prof = currVal - totalInv;
  const profPct = totalInv > 0 ? (prof / totalInv) * 100 : 0;
  const isProf = prof > 0;
  const isNeut = prof === 0;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      onClick={() => {
        if (isSelectionMode) {
          onSelect(b.id);
        } else {
          onLoadBookmark(b);
        }
      }}
      className={cn(
        "bg-white rounded-[24px] p-6 shadow-[0_8px_20px_-10px_rgba(0,0,0,0.05)] cursor-pointer group relative overflow-hidden flex flex-col transition-all",
        isSelectionMode ? "hover:shadow-md" : "hover:shadow-lg hover:-translate-y-1",
        isSelectionMode && isSelected ? "ring-2 ring-black border-transparent" : "border border-gray-100"
      )}
    >
      {isSelectionMode && (
        <div className="absolute top-6 right-6 z-20">
          <div className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center border-2 transition-colors",
            isSelected ? "border-black bg-black text-white" : "border-gray-300 bg-white"
          )}>
            {isSelected && <Check size={14} strokeWidth={3} />}
          </div>
        </div>
      )}
      
      <div className="flex items-start justify-between mb-6 relative z-10">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-[12px] flex items-center justify-center font-bold tracking-wider text-sm shadow-sm transition-colors",
            isNeut ? "bg-black text-white ring-1 ring-black/5" : 
            isProf ? "bg-green-600 text-white ring-1 ring-green-700/10" : 
            "bg-red-500 text-white ring-1 ring-red-600/10"
          )}>
            {b.symbol.slice(0,3)}
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className={cn(
                "font-bold text-lg leading-tight truncate",
                isNeut ? "text-gray-900" : isProf ? "text-green-600" : "text-red-500"
              )}>{b.symbol}</h3>
              {(!isSelectionMode) && (
                <button
                  onClick={(e) => onToggleAutoUpdate(b.id, e)}
                  title={b.autoUpdate ? "Đang theo dõi trực tiếp" : "Bật theo dõi trực tiếp"}
                  className={cn(
                    "flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tighter transition-all",
                    b.autoUpdate 
                      ? "bg-green-100 text-green-700 ring-1 ring-green-200" 
                      : "bg-gray-100 text-gray-400 ring-1 ring-gray-200"
                  )}
                >
                  <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    b.autoUpdate ? "bg-green-500 animate-pulse" : "bg-gray-400"
                  )} />
                  {b.autoUpdate ? "Live" : "Idle"}
                </button>
              )}
            </div>
            {b.companyName && b.companyName !== b.symbol && (
              <p className="text-[11px] font-semibold text-gray-400 break-words line-clamp-2 pr-1">
                {b.companyName}
              </p>
            )}
            <p className="text-xs font-medium text-gray-500 mt-0.5">{b.shares.toLocaleString()} cổ phiếu</p>
          </div>
        </div>
        {!isSelectionMode && (
          <div className="flex gap-1">
            <button 
              onClick={(e) => onToggleHide(b.id, e)}
              className="text-gray-400 hover:text-black hover:bg-gray-50 p-2.5 rounded-full transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 z-50 relative bg-white md:bg-transparent ring-1 ring-gray-100 md:ring-0 shadow-sm md:shadow-none"
              title={b.isHidden ? "Hiện danh mục" : "Ẩn danh mục"}
            >
              {b.isHidden ? <Eye size={16} /> : <EyeOff size={16} />}
            </button>
            <button 
              onClick={(e) => onDeleteSingle(b.id, e)}
              className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2.5 rounded-full transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 z-50 relative bg-white md:bg-transparent ring-1 ring-gray-100 md:ring-0 shadow-sm md:shadow-none"
              title="Xóa danh mục"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
        <div>
          <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-1">Giá Mua</p>
          <p className="font-mono font-medium text-gray-800 text-sm">{(b.buyPrice / 1000).toLocaleString()}k</p>
        </div>
        <div>
          <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-1">Hiện Tại</p>
          <p className="font-mono font-medium text-gray-800 text-sm">{(b.currentPrice / 1000).toLocaleString()}k</p>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between relative z-10">
        <div>
          <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 mb-1">Lãi / Lỗ</p>
          <p className={cn(
            "font-mono font-bold tracking-tight",
            isNeut ? "text-gray-800" : isProf ? "text-green-600" : "text-red-500"
          )}>
            {prof > 0 ? '+' : ''}{(prof / 1000).toLocaleString(undefined, { maximumFractionDigits: 0 })}k
          </p>
        </div>
        <div className={cn(
          "px-2.5 py-1 rounded-md text-xs font-bold",
          isNeut ? "bg-gray-100 text-gray-600" : isProf ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
        )}>
          {profPct > 0 ? '+' : ''}{profPct.toFixed(2)}%
        </div>
      </div>

      {/* Background glow on card */}
      <div className={cn(
          "absolute -bottom-12 -right-12 w-32 h-32 rounded-full blur-[40px] opacity-20 pointer-events-none transition-colors",
          isNeut ? "bg-gray-400" : isProf ? "bg-green-500" : "bg-red-500"
      )}/>
    </motion.div>
  );
}
