"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { BookmarkData } from '@/types';
import { fetchStockPrice } from '@/lib/stockService';
import ConfirmModal from '@/components/ConfirmModal';
import SaveBookmarkModal from '@/components/SaveBookmarkModal';
import BookmarksList from '@/components/BookmarksList';
import Calculator from '@/components/Calculator';

export default function App() {
  const [mounted, setMounted] = useState(false);
  // Navigation state
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>([]);

  const [view, setView] = useState<'calc' | 'list'>('calc');

  // Calc state
  const [sharesInput, setSharesInput] = useState<string>('');
  const [buyPrice, setBuyPrice] = useState<string>('');
  const [currentPrice, setCurrentPrice] = useState<string>('');
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [symbolInput, setSymbolInput] = useState('');

  const [editingBookmarkId, setEditingBookmarkId] = useState<string | null>(null);
  const [editingSymbol, setEditingSymbol] = useState<string>('');

  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);

  // AI state
  const [isAutoPrice, setIsAutoPrice] = useState(false);
  const [stockSymbolAI, setStockSymbolAI] = useState('');
  const [isAILoading, setIsAILoading] = useState(false);
  const [companyName, setCompanyName] = useState('');

  // Initial load
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('vfinance_calc_bookmarks');
      if (saved) {
        const parsed = JSON.parse(saved);
        setBookmarks(parsed);
        if (parsed.length > 0) {
          setView('list');
        }
      }
    } catch (e) {
      console.error("Failed to load bookmarks", e);
    }
  }, []);

  // Persist bookmarks
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('vfinance_calc_bookmarks', JSON.stringify(bookmarks));
    }
  }, [bookmarks, mounted]);

  const {
    shares,
    totalInvestment,
    currentValue,
    profit,
    profitPercent,
    isNeutral
  } = useMemo(() => {
    const sharesNum = parseFloat(sharesInput.replace(/,/g, '')) || 0;
    const bPriceNum = (parseFloat(buyPrice.replace(/,/g, '')) || 0) * 1000;
    const cPriceNum = (parseFloat(currentPrice.replace(/,/g, '')) || 0) * 1000;

    const totalInv = sharesNum * bPriceNum;
    let currVal = 0;
    let prof = 0;
    let profPct = 0;

    if (sharesNum > 0 && cPriceNum > 0) {
      currVal = sharesNum * cPriceNum;
      prof = currVal - totalInv;
      profPct = totalInv > 0 ? (prof / totalInv) * 100 : 0;
    }

    const neutral = prof === 0 && (cPriceNum === 0 || bPriceNum === cPriceNum);

    return {
      shares: sharesNum,
      totalInvestment: totalInv,
      currentValue: currVal,
      profit: prof,
      profitPercent: profPct,
      isNeutral: cPriceNum === 0 ? true : neutral
    };
  }, [sharesInput, buyPrice, currentPrice]);

  const handleSaveBookmark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbolInput.trim()) return;

    const newBookmark: BookmarkData = {
      id: crypto.randomUUID(),
      symbol: symbolInput.trim().toUpperCase(),
      companyName: companyName || symbolInput.trim().toUpperCase(),
      autoUpdate: true,
      shares,
      buyPrice: (parseFloat(buyPrice.replace(/,/g, '')) || 0) * 1000,
      currentPrice: (parseFloat(currentPrice.replace(/,/g, '')) || 0) * 1000,
      timestamp: Date.now()
    };

    setBookmarks(prev => [newBookmark, ...prev]);
    setIsSaveModalOpen(false);
    setSymbolInput('');
    setView('list');
  };

  const handleUpdateBookmark = () => {
    if (!editingBookmarkId) return;
    setBookmarks(prev => prev.map(b => 
      b.id === editingBookmarkId 
        ? {
            ...b,
            symbol: editingSymbol.trim().toUpperCase() || b.symbol,
            companyName: companyName || b.companyName,
            shares,
            buyPrice: (parseFloat(buyPrice.replace(/,/g, '')) || 0) * 1000,
            currentPrice: (parseFloat(currentPrice.replace(/,/g, '')) || 0) * 1000,
            timestamp: Date.now()
          }
        : b
    ));
    setView('list');
  };

  const handleToggleAutoUpdate = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setBookmarks(prev => prev.map(b => b.id === id ? { ...b, autoUpdate: !b.autoUpdate } : b));
  };

  const handleToggleHideBookmark = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setBookmarks(prev => prev.map(b => b.id === id ? { ...b, isHidden: !b.isHidden } : b));
  };

  const formatNumber = (val: string) => {
    const num = val.replace(/,/g, '');
    if (!isNaN(Number(num)) && num.length > 0) {
       const parts = num.split('.');
       parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
       return parts.join('.');
    }
    return val;
  };

  const handleLoadBookmark = (b: BookmarkData) => {
    setSharesInput(formatNumber(b.shares.toString()));
    setBuyPrice(formatNumber((b.buyPrice / 1000).toString()));
    setCurrentPrice(formatNumber((b.currentPrice / 1000).toString()));
    setEditingBookmarkId(b.id);
    setEditingSymbol(b.symbol);
    setCompanyName(b.companyName || b.symbol);
    setStockSymbolAI(b.symbol);
    setView('calc');
  };

  const handleDeleteBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setConfirmDialog({
      message: 'Bạn có chắc chắn muốn xóa thẻ này?',
      onConfirm: () => {
        setBookmarks(prev => prev.filter(b => b.id !== id));
        setConfirmDialog(null);
      }
    });
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    setConfirmDialog({
      message: `Bạn có chắc chắn muốn xóa ${selectedIds.size} danh mục đã chọn?`,
      onConfirm: () => {
        setBookmarks(prev => prev.filter(b => !selectedIds.has(b.id)));
        setIsSelectionMode(false);
        setSelectedIds(new Set());
        setConfirmDialog(null);
      }
    });
  };

  const handleDeleteAll = () => {
    setConfirmDialog({
      message: 'Bạn có chắc chắn muốn xóa tất cả danh mục? Hành động này không thể hoàn tác.',
      onConfirm: () => {
        setBookmarks([]);
        setConfirmDialog(null);
      }
    });
  };

  const resetCalcAndGoToNew = () => {
    setSharesInput(''); 
    setBuyPrice(''); 
    setCurrentPrice('');
    setEditingBookmarkId(null);
    setEditingSymbol('');
    setStockSymbolAI('');
    setCompanyName('');
    setSymbolInput('');
    setView('calc');
  };

  const handleAIGetPrice = async () => {
    if (!stockSymbolAI.trim()) return;
    setIsAILoading(true);
    setCompanyName('');
    
    try {
      const symbol = stockSymbolAI.toUpperCase();
      const result = await fetchStockPrice(symbol);

      if (result) {
        const { price, name } = result;
        setCurrentPrice(formatNumber((price / 1000).toString()));
        setCompanyName(name);
        setSymbolInput(symbol);
        if (editingBookmarkId) {
          setEditingSymbol(symbol);
        }
      } else {
        throw new Error("Không tìm thấy mã hoặc lỗi kết nối");
      }
    } catch (error: any) {
      console.error("Lỗi khi lấy dữ liệu:", error.message);
      setCompanyName('Lỗi khi lấy dữ liệu SSI');
    } finally {
      setIsAILoading(false);
    }
  };

  const handleUpdatePrice = (id: string, price: number, name: string) => {
    setBookmarks(prev => prev.map(b => 
      b.id === id ? { ...b, currentPrice: price, companyName: name || b.companyName } : b
    ));
  };

  // Background updates handled by cards directly now

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans flex items-center justify-center p-4 md:p-6">
      {!mounted ? (
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
          <p className="font-medium text-gray-500">Đang khởi động...</p>
        </div>
      ) : (
        <>
          {view === 'list' && (
              <BookmarksList
                bookmarks={bookmarks}
                isSelectionMode={isSelectionMode}
                selectedIds={selectedIds}
                setIsSelectionMode={setIsSelectionMode}
                setSelectedIds={setSelectedIds}
                onDeleteSelected={handleDeleteSelected}
                onDeleteAll={handleDeleteAll}
                onDeleteSingle={handleDeleteBookmark}
                onAddNew={resetCalcAndGoToNew}
                onLoadBookmark={handleLoadBookmark}
                onToggleAutoUpdate={handleToggleAutoUpdate}
                onToggleHide={handleToggleHideBookmark}
                onUpdatePrice={handleUpdatePrice}
              />
          )}

          {view === 'calc' && (
            <>
              <Calculator
                sharesInput={sharesInput}
                setSharesInput={setSharesInput}
                buyPrice={buyPrice}
                setBuyPrice={setBuyPrice}
                currentPrice={currentPrice}
                setCurrentPrice={setCurrentPrice}
                shares={shares}
                totalInvestment={totalInvestment}
                currentValue={currentValue}
                profit={profit}
                profitPercent={profitPercent}
                isNeutral={isNeutral}
                isAutoPrice={isAutoPrice}
                setIsAutoPrice={setIsAutoPrice}
                stockSymbolAI={stockSymbolAI}
                setStockSymbolAI={setStockSymbolAI}
                isAILoading={isAILoading}
                companyName={companyName}
                handleAIGetPrice={handleAIGetPrice}
                editingBookmarkId={editingBookmarkId}
                editingSymbol={editingSymbol}
                setEditingSymbol={setEditingSymbol}
                onBack={() => setView('list')}
                onUpdateBookmark={handleUpdateBookmark}
                onSaveBookmarkClick={() => setIsSaveModalOpen(true)}
              />

              <SaveBookmarkModal
                isOpen={isSaveModalOpen}
                symbolInput={symbolInput}
                setSymbolInput={setSymbolInput}
                shares={shares}
                buyPrice={buyPrice}
                currentPrice={currentPrice}
                onSave={handleSaveBookmark}
                onClose={() => setIsSaveModalOpen(false)}
              />
            </>
          )}
          {/* Global Confirm Modal Overlay */}
          <ConfirmModal
            isOpen={confirmDialog !== null}
            message={confirmDialog?.message || ''}
            onConfirm={confirmDialog?.onConfirm || (() => {})}
            onCancel={() => setConfirmDialog(null)}
          />
        </>
      )}
    </div>
  );
}

