"use client";

import React from 'react';
import { Calculator as CalculatorIcon, ArrowRight, Wallet, TrendingUp, TrendingDown, Percent, DollarSign, BookmarkPlus, Bookmark, ChevronLeft, Sparkles, Loader2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CalculatorProps {
  sharesInput: string;
  setSharesInput: (val: string) => void;
  buyPrice: string;
  setBuyPrice: (val: string) => void;
  currentPrice: string;
  setCurrentPrice: (val: string) => void;
  
  shares: number;
  totalInvestment: number;
  currentValue: number;
  profit: number;
  profitPercent: number;
  isNeutral: boolean;
  
  isAutoPrice: boolean;
  setIsAutoPrice: (val: boolean) => void;
  stockSymbolAI: string;
  setStockSymbolAI: (val: string) => void;
  isAILoading: boolean;
  companyName: string;
  handleAIGetPrice: () => void;

  editingBookmarkId: string | null;
  editingSymbol: string;
  setEditingSymbol: (val: string) => void;
  
  onBack: () => void;
  onUpdateBookmark: () => void;
  onSaveBookmarkClick: () => void;
}

export default function Calculator({
  sharesInput,
  setSharesInput,
  buyPrice,
  setBuyPrice,
  currentPrice,
  setCurrentPrice,
  shares,
  totalInvestment,
  currentValue,
  profit,
  profitPercent,
  isNeutral,
  isAutoPrice,
  setIsAutoPrice,
  stockSymbolAI,
  setStockSymbolAI,
  isAILoading,
  companyName,
  handleAIGetPrice,
  editingBookmarkId,
  editingSymbol,
  setEditingSymbol,
  onBack,
  onUpdateBookmark,
  onSaveBookmarkClick,
}: CalculatorProps) {

  const formatNumber = (val: string) => {
    const num = val.replace(/,/g, '');
    if (!isNaN(Number(num)) && num.length > 0) {
       const parts = num.split('.');
       parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
       return parts.join('.');
    }
    return val;
  };

  const handleInput = (setter: (val: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9.]/g, '');
    if ((rawVal.match(/\./g) || []).length > 1) return;
    setter(formatNumber(rawVal));
  };

  const isProfit = profit > 0;
  const isLoss = profit < 0;

  return (
    <div className="w-full max-w-5xl flex flex-col gap-4 relative z-0 md:px-0">
      
      <button 
        onClick={onBack}
        className="self-start flex items-center gap-2 text-gray-500 hover:text-black font-medium transition-colors mb-2 px-1 md:px-2"
      >
        <ChevronLeft size={18} />
        Quay lại danh mục
      </button>

      <div className="w-full bg-white rounded-[24px] md:rounded-[32px] overflow-hidden shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-gray-100/50 flex flex-col md:flex-row relative">
        {/* Left Side: Inputs */}
        <div className="w-full md:w-5/12 p-6 md:p-12 md:border-r border-gray-100 flex flex-col justify-between bg-gray-50/50 relative z-10">
          <div>
            <div className="flex items-center justify-between mb-8 md:mb-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-black rounded-[14px] md:rounded-[16px] flex items-center justify-center text-white shadow-md">
                  <CalculatorIcon size={20} className="text-white" />
                </div>
                <div>
                  <h1 className="text-lg md:text-xl font-bold tracking-tight text-black">
                    {editingBookmarkId ? `Cập Nhật: ${editingSymbol}` : 'Tính Toán Lãi/Lỗ'}
                  </h1>
                  <p className="text-xs md:text-sm font-medium text-gray-500">Mô phỏng đầu tư</p>
                </div>
              </div>
            </div>

            <div className="space-y-6 md:space-y-8">
              {editingBookmarkId && (
                <div className="space-y-2 md:space-y-3">
                  <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    <Bookmark size={14} className="text-gray-400" />
                    Mã Cổ Phiếu / Tên Bookmark
                  </label>
                  <input 
                    type="text"
                    value={editingSymbol}
                    onChange={(e) => setEditingSymbol(e.target.value.toUpperCase())}
                    placeholder="Ví dụ: FPT"
                    className="w-full bg-white border border-gray-200 rounded-[14px] md:rounded-[16px] py-3.5 md:py-4 px-4 md:px-5 text-lg md:text-xl font-bold uppercase focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-black shadow-sm"
                  />
                </div>
              )}

              <div className="space-y-2 md:space-y-3">
                <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Wallet size={14} className="text-gray-400" />
                  Số Lượng Cổ Phiếu
                </label>
                <input 
                  type="text"
                  value={sharesInput}
                  onChange={handleInput(setSharesInput)}
                  placeholder="0"
                  className="w-full bg-white border border-gray-200 rounded-[14px] md:rounded-[16px] py-3.5 md:py-4 px-4 md:px-5 text-lg md:text-xl font-mono font-medium focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-black shadow-sm"
                />
              </div>

              <div className="space-y-2 md:space-y-3">
                <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <DollarSign size={14} className="text-gray-400" />
                  Giá Mua Vị Thế (x1,000 VNĐ)
                </label>
                <input 
                  type="text"
                  value={buyPrice}
                  onChange={handleInput(setBuyPrice)}
                  placeholder="0"
                  className="w-full bg-white border border-gray-200 rounded-[14px] md:rounded-[16px] py-3.5 md:py-4 px-4 md:px-5 text-lg md:text-xl font-mono font-medium focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all text-black shadow-sm"
                />
              </div>

              <div className="space-y-3 md:space-y-4">
                <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Percent size={14} className="text-gray-400" />
                    Giá Hiện Tại / Bán (x1,000 VNĐ)
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group w-fit">
                  <div className="relative">
                    <input type="checkbox" className="peer sr-only" checked={isAutoPrice} onChange={(e) => setIsAutoPrice(e.target.checked)} />
                    <div className="block w-9 h-5 md:w-10 md:h-6 bg-gray-200 rounded-full peer-checked:bg-purple-500 transition-colors"></div>
                    <div className="absolute left-1 top-0.5 md:top-1 bg-white w-4 h-4 rounded-full transition-transform peer-checked:translate-x-4 shadow-sm"></div>
                  </div>
                  <span className="text-[13px] md:text-sm font-semibold text-gray-600 group-hover:text-purple-600 transition-colors flex items-center gap-1">
                    <Sparkles size={14} className="text-purple-500" /> Auto get price stock
                  </span>
                </label>

                {isAutoPrice && (
                  <div className="flex flex-col gap-3 p-4 md:p-5 bg-purple-50/50 rounded-[16px] md:rounded-[20px] border border-purple-100/50 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
                    <label className="text-[10px] md:text-xs font-bold text-purple-800 uppercase tracking-wider">Mã Cổ Phiếu Cần Tìm</label>
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        value={stockSymbolAI}
                        onChange={(e) => setStockSymbolAI(e.target.value.toUpperCase())}
                        placeholder="VD: FPT"
                        className="w-full bg-white border border-purple-100 rounded-[10px] md:rounded-[12px] py-2.5 md:py-3 px-3.5 md:px-4 text-base md:text-lg font-mono font-bold focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-purple-900 uppercase placeholder:text-purple-200"
                      />
                      <button 
                        onClick={handleAIGetPrice}
                        disabled={!stockSymbolAI || isAILoading}
                        className="shrink-0 bg-purple-600 text-white px-4 md:px-5 rounded-[10px] md:rounded-[12px] font-bold hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                      >
                        {isAILoading ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <Sparkles size={18} />
                        )}
                      </button>
                    </div>
                    {companyName && (
                      <div className={cn(
                        "flex items-center gap-1 mt-0.5 font-medium",
                        companyName.includes('Lỗi') || companyName.includes('Không tìm thấy') ? "text-red-500" : "text-purple-700"
                      )}>
                        {!companyName.includes('Lỗi') && !companyName.includes('Không tìm thấy') && <Check size={14} />} 
                        <span className="text-[12px] md:text-sm line-clamp-1">{companyName}</span>
                      </div>
                    )}
                  </div>
                )}

                <input 
                  type="text"
                  value={currentPrice}
                  onChange={handleInput(setCurrentPrice)}
                  disabled={isAutoPrice}
                  placeholder="0"
                  className={cn(
                    "w-full border rounded-[14px] md:rounded-[16px] py-3.5 md:py-4 px-4 md:px-5 text-lg md:text-xl font-mono font-medium focus:outline-none transition-all shadow-sm",
                    isAutoPrice 
                      ? "bg-gray-50 border-gray-100 text-gray-400 cursor-not-allowed" 
                      : "bg-white border-gray-200 text-black focus:ring-2 focus:ring-black/5 focus:border-black"
                  )}
                />
              </div>
            </div>
          </div>

          {shares > 0 && (
            <div className="mt-8 md:mt-12 pt-6 border-t border-gray-200/50">
              {editingBookmarkId ? (
                <button 
                  onClick={onUpdateBookmark}
                  className="w-full flex items-center justify-center gap-2 py-3.5 md:py-4 rounded-[14px] md:rounded-[16px] bg-black text-white font-medium hover:bg-gray-800 transition-colors shadow-md"
                >
                  <Bookmark size={18} />
                  Cập nhật Bookmark
                </button>
              ) : (
                <button 
                  onClick={onSaveBookmarkClick}
                  className="w-full flex items-center justify-center gap-2 py-3.5 md:py-4 rounded-[14px] md:rounded-[16px] bg-black text-white font-medium hover:bg-gray-800 transition-colors shadow-md"
                >
                  <BookmarkPlus size={18} />
                  Lưu thành Bookmark
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Results */}
        <div className="w-full md:w-7/12 p-6 md:p-12 bg-white relative overflow-hidden flex flex-col justify-center">
          {/* Subtle Dynamic Background Glow */}
          <div className={cn(
            "absolute top-[-20%] right-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full blur-[80px] md:blur-[100px] transition-colors duration-1000 opacity-20 pointer-events-none",
            isNeutral ? "bg-gray-300" : isProfit ? "bg-green-500" : "bg-red-500"
          )} />

          <div className="relative z-10 space-y-8 md:space-y-10">
            {/* Top Stat: Total Investment */}
            <div>
              <h3 className="text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 md:mb-3">Vốn Đầu Tư Ban Đầu</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl md:text-5xl font-light tracking-tight text-black flex items-center">
                  {totalInvestment.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span className="text-[10px] md:text-sm font-semibold text-gray-400 uppercase tracking-widest">VNĐ</span>
              </div>
            </div>

            <div className="w-full h-px bg-gray-100" />

            {/* Split Stats: Profit / % */}
            <div className="grid grid-cols-2 gap-4 md:gap-8">
              <div>
                <h3 className="text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 md:mb-4">Lợi Nhuận</h3>
                <div className={cn(
                  "text-xl md:text-3xl font-medium tracking-tight break-all",
                  isNeutral ? "text-gray-800" : isProfit ? "text-green-600" : "text-red-500"
                )}>
                  {profit > 0 ? '+' : ''}{profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
              </div>

              <div>
                <h3 className="text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 md:mb-4">Hiệu Suất</h3>
                <div className="flex items-center gap-2 md:gap-3">
                  <div className={cn(
                    "hidden xs:flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full shrink-0",
                    isNeutral ? "bg-gray-100 text-gray-500" : isProfit ? "bg-green-50 text-green-600" : "bg-red-50 text-red-700"
                  )}>
                    {isNeutral && <ArrowRight size={16} strokeWidth={2.5} />}
                    {isProfit && <TrendingUp size={16} strokeWidth={2.5} />}
                    {profit < 0 && <TrendingDown size={16} strokeWidth={2.5} />}
                  </div>
                  <div className={cn(
                    "text-xl md:text-3xl font-medium tracking-tight",
                    isNeutral ? "text-gray-800" : isProfit ? "text-green-600" : "text-red-500"
                  )}>
                    {profitPercent > 0 ? '+' : ''}{profitPercent.toFixed(2)}%
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-gray-100" />

            {/* Bottom Stat: Current Value */}
            <div>
              <h3 className="text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-2 md:mb-3">Tổng Thu Về</h3>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl md:text-4xl font-medium tracking-tight text-gray-800">
                  {currentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span className="text-[10px] md:text-xs font-semibold text-gray-400 uppercase tracking-widest">VNĐ</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
