"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { BookmarkData, ArticleData } from '@/types';
import { fetchStockPrice } from '@/lib/stockService';
import ConfirmModal from '@/components/ConfirmModal';
import SaveBookmarkModal from '@/components/SaveBookmarkModal';
import BookmarksList from '@/components/BookmarksList';
import Calculator from '@/components/Calculator';
import Login from '@/components/Login';
import { useAuth } from '@/components/AuthProvider';
import { LogOut, User as UserIcon } from 'lucide-react';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

import UserMenu from '@/components/UserMenu';
import NewsFeed from '@/components/NewsFeed';
import CreateArticleModal from '@/components/CreateArticleModal';
import MyActivityView from '@/components/MyActivityView';
import Logo from '@/components/Logo';
import { Plus } from 'lucide-react';

export default function Page() {
  const { user, loading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  // Navigation state
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>([]);

  const [view, setView] = useState<'home' | 'calc' | 'list' | 'profile'>('home');

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
  const [isCreateArticleOpen, setIsCreateArticleOpen] = useState(false);
  const [sharingArticle, setSharingArticle] = useState<ArticleData | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ message: string; onConfirm: () => void } | null>(null);

  // AI state
  const [isAutoPrice, setIsAutoPrice] = useState(false);
  const [stockSymbolAI, setStockSymbolAI] = useState('');
  const [isAILoading, setIsAILoading] = useState(false);
  const [companyName, setCompanyName] = useState('');

  // Profile sync with Firestore
  useEffect(() => {
    const syncProfile = async () => {
      if (user && mounted) {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            phoneNumber: user.phoneNumber,
            displayName: user.displayName || `User ${user.uid.slice(0, 4)}`,
            photoURL: user.photoURL || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
      }
    };
    syncProfile();
  }, [user, mounted]);

  // Initial load
  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('vfinance_calc_bookmarks');
      if (saved) {
        const parsed = JSON.parse(saved);
        setBookmarks(parsed);
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
      id: mounted ? crypto.randomUUID() : Math.random().toString(36).substring(2),
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

  const handleSignOut = async () => {
    setConfirmDialog({
      message: 'Bạn có chắc chắn muốn đăng xuất?',
      onConfirm: async () => {
        await signOut(auth);
        setConfirmDialog(null);
      }
    });
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
        <p className="mt-4 font-medium text-gray-500">Đang khởi động...</p>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
        <p className="mt-4 font-medium text-gray-500">Đang kiểm tra tài khoản...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-6">
        <Login />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans flex flex-col items-center">
      {/* Sticky Top Navigation */}
      <div className="sticky top-0 z-50 w-full bg-[#f5f5f7]/80 backdrop-blur-md border-b border-gray-100 flex justify-center">
        <div className="w-full max-w-[1400px] flex items-center justify-between py-4 px-4 md:px-8">
          <div 
            className="flex items-center cursor-pointer transition-transform active:scale-95"
            onClick={() => {
              setView('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <Logo className="w-32 h-auto md:w-44 md:h-auto" />
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => setIsCreateArticleOpen(true)}
              className="p-3 md:p-3.5 bg-white text-blue-600 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex items-center justify-center active:scale-95"
              title="Đăng bài mới"
            >
              <Plus className="w-5 h-5" />
            </button>

            <UserMenu 
              uid={user.uid}
              phoneNumber={user.phoneNumber}
              onSignOut={handleSignOut}
              onShowHome={() => {
                setView('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onShowInfo={() => {
                setView('profile');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full flex-1 flex flex-col items-center p-4 md:p-6">
        {view === 'home' && (
          <NewsFeed 
            onShareArticle={(article) => {
              setSharingArticle(article);
              setIsCreateArticleOpen(true);
            }} 
          />
        )}
        
        {view === 'profile' && (
          <MyActivityView 
            onBack={() => setView('home')} 
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
            onShareArticle={(article) => {
              setSharingArticle(article);
              setIsCreateArticleOpen(true);
            }}
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
      </div>

      <CreateArticleModal 
        isOpen={isCreateArticleOpen}
        sharedArticle={sharingArticle}
        onClose={() => {
          setIsCreateArticleOpen(false);
          setSharingArticle(null);
        }}
        onSuccess={() => {
          // Force refresh NewsFeed by toggling view briefly
          if (view === 'home') {
            setView('list');
            setTimeout(() => {
              setView('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }, 10);
          } else {
            setView('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
          setIsCreateArticleOpen(false);
          setSharingArticle(null);
        }}
      />

      {/* Global Confirm Modal Overlay */}
      <ConfirmModal
        isOpen={confirmDialog !== null}
        message={confirmDialog?.message || ''}
        onConfirm={confirmDialog?.onConfirm || (() => {})}
        onCancel={() => setConfirmDialog(null)}
      />
    </div>
  );
}

