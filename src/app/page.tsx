"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
import { doc, getDoc, setDoc, serverTimestamp, collection, onSnapshot, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { useRef } from 'react';

import UserMenu from '@/components/UserMenu';
import NewsFeed from '@/components/NewsFeed';
import NotificationsBell from '@/components/NotificationsBell';
import CreateArticleModal from '@/components/CreateArticleModal';
import MyActivityView from '@/components/MyActivityView';
import Logo from '@/components/Logo';
import { Plus } from 'lucide-react';

export default function Page() {
  const { user, loading: authLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<'home' | 'calc' | 'profile'>('home');
  const [profileTab, setProfileTab] = useState<'profile' | 'posts' | 'bookmarks'>('posts');
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>([]);
  const firstUpdateRef = useRef<Record<string, boolean>>({});

  const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  };

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

  // Initial load
  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Sync Bookmarks from Firestore
  useEffect(() => {
    if (!user || !mounted) return;

    const bookmarksRef = collection(db, 'users', user.uid, 'bookmarks');
    const unsubscribe = onSnapshot(bookmarksRef, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ ...doc.data() } as BookmarkData));
      const sorted = docs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      
      // Load from localStorage as fallback for current prices if firestore is stale
      const localSaved = localStorage.getItem(`vfinance_prices_${user.uid}`);
      if (localSaved) {
        try {
          const prices = JSON.parse(localSaved);
          setBookmarks(sorted.map(b => prices[b.id] !== undefined ? { ...b, currentPrice: prices[b.id] } : b));
        } catch (e) {
          setBookmarks(sorted);
        }
      } else {
        setBookmarks(sorted);
      }
    });

    return () => unsubscribe();
  }, [user, mounted]);

  // Persistence of current prices to local storage for quick session Resume
  useEffect(() => {
    if (mounted && user) {
      const prices: Record<string, number> = {};
      bookmarks.forEach(b => {
        prices[b.id] = b.currentPrice;
      });
      localStorage.setItem(`vfinance_prices_${user.uid}`, JSON.stringify(prices));
    }
  }, [bookmarks, mounted, user]);

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

  const handleSaveBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symbolInput.trim() || !user) return;

    const id = generateId();
    const cPrice = (parseFloat(currentPrice.replace(/,/g, '')) || 0) * 1000;
    const newBookmark: BookmarkData = {
      id,
      symbol: symbolInput.trim().toUpperCase(),
      companyName: companyName || symbolInput.trim().toUpperCase(),
      autoUpdate: true,
      shares,
      buyPrice: (parseFloat(buyPrice.replace(/,/g, '')) || 0) * 1000,
      currentPrice: cPrice,
      timestamp: Date.now()
    };

    try {
      // 1. Save to Firestore
      await setDoc(doc(db, 'users', user.uid, 'bookmarks', id), {
        ...newBookmark,
        userId: user.uid
      });

      // 2. Save to Local Storage price cache immediately
      const localSaved = localStorage.getItem(`vfinance_prices_${user.uid}`);
      let prices = localSaved ? JSON.parse(localSaved) : {};
      prices[id] = cPrice;
      localStorage.setItem(`vfinance_prices_${user.uid}`, JSON.stringify(prices));

      setIsSaveModalOpen(false);
      setSymbolInput('');
      setProfileTab('bookmarks');
      setView('profile');
    } catch (err) {
      console.error("Error saving bookmark", err);
    }
  };

  const handleUpdateBookmark = useCallback(async () => {
    if (!editingBookmarkId || !user) return;
    
    try {
      const bookmarkRef = doc(db, 'users', user.uid, 'bookmarks', editingBookmarkId);
      const cPrice = (parseFloat(currentPrice.replace(/,/g, '')) || 0) * 1000;
      
      // 1. Update Firestore
      await updateDoc(bookmarkRef, {
        symbol: editingSymbol.trim().toUpperCase(),
        companyName: companyName,
        shares,
        buyPrice: (parseFloat(buyPrice.replace(/,/g, '')) || 0) * 1000,
        currentPrice: cPrice,
        timestamp: Date.now()
      });

      // 2. Update Local Storage price cache immediately
      const localSaved = localStorage.getItem(`vfinance_prices_${user.uid}`);
      let prices = localSaved ? JSON.parse(localSaved) : {};
      prices[editingBookmarkId] = cPrice;
      localStorage.setItem(`vfinance_prices_${user.uid}`, JSON.stringify(prices));

      setProfileTab('bookmarks');
      setView('profile');
    } catch (err) {
      console.error("Error updating bookmark", err);
    }
  }, [editingBookmarkId, user, editingSymbol, companyName, shares, buyPrice, currentPrice]);

  const handleToggleAutoUpdate = useCallback(async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!user) return;
    try {
      const b = bookmarks.find(x => x.id === id);
      if (b) {
        await updateDoc(doc(db, 'users', user.uid, 'bookmarks', id), {
          autoUpdate: !b.autoUpdate
        });
      }
    } catch (err) {
      console.error("Error toggling auto update", err);
    }
  }, [user, bookmarks]);

  const handleToggleHideBookmark = useCallback(async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!user) return;
    try {
      const b = bookmarks.find(x => x.id === id);
      if (b) {
        await updateDoc(doc(db, 'users', user.uid, 'bookmarks', id), {
          isHidden: !b.isHidden
        });
      }
    } catch (err) {
      console.error("Error toggling hide", err);
    }
  }, [user, bookmarks]);

  const formatNumber = (val: string) => {
    const num = val.replace(/,/g, '');
    if (!isNaN(Number(num)) && num.length > 0) {
       const parts = num.split('.');
       parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
       return parts.join('.');
    }
    return val;
  };

  const handleLoadBookmark = useCallback((b: BookmarkData) => {
    setSharesInput(formatNumber(b.shares.toString()));
    setBuyPrice(formatNumber((b.buyPrice / 1000).toString()));
    setCurrentPrice(formatNumber((b.currentPrice / 1000).toString()));
    setEditingBookmarkId(b.id);
    setEditingSymbol(b.symbol);
    setCompanyName(b.companyName || b.symbol);
    setStockSymbolAI(b.symbol);
    setProfileTab('bookmarks');
    setView('calc');
  }, []);

  const handleDeleteBookmark = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!user) return;
    setConfirmDialog({
      message: 'Bạn có chắc chắn muốn xóa thẻ này?',
      onConfirm: async () => {
        try {
          await deleteDoc(doc(db, 'users', user.uid, 'bookmarks', id));
        } catch (err) {
          console.error("Error deleting bookmark", err);
        }
        setConfirmDialog(null);
      }
    });
  }, [user]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedIds.size === 0 || !user) return;
    setConfirmDialog({
      message: `Bạn có chắc chắn muốn xóa ${selectedIds.size} danh mục đã chọn?`,
      onConfirm: async () => {
        try {
          const batch = writeBatch(db);
          selectedIds.forEach(id => {
            batch.delete(doc(db, 'users', user.uid, 'bookmarks', id));
          });
          await batch.commit();
          setIsSelectionMode(false);
          setSelectedIds(new Set());
        } catch (err) {
          console.error("Error deleting multiple bookmarks", err);
        }
        setConfirmDialog(null);
      }
    });
  }, [selectedIds, user]);

  const handleDeleteAll = useCallback(() => {
    if (!user) return;
    setConfirmDialog({
      message: 'Bạn có chắc chắn muốn xóa tất cả danh mục? Hành động này không thể hoàn tác.',
      onConfirm: async () => {
        try {
          const batch = writeBatch(db);
          bookmarks.forEach(b => {
             batch.delete(doc(db, 'users', user.uid, 'bookmarks', b.id));
          });
          await batch.commit();
        } catch (err) {
          console.error("Error deleting all bookmarks", err);
        }
        setConfirmDialog(null);
      }
    });
  }, [user, bookmarks]);

  const resetCalcAndGoToNew = useCallback(() => {
    setSharesInput(''); 
    setBuyPrice(''); 
    setCurrentPrice('');
    setEditingBookmarkId(null);
    setEditingSymbol('');
    setStockSymbolAI('');
    setCompanyName('');
    setSymbolInput('');
    setView('calc');
  }, []);

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

  const handleUpdatePrice = useCallback(async (id: string, price: number, name: string, forceSync: boolean = false) => {
    // 1. Update state/local UI immediately
    setBookmarks(prev => prev.map(b => 
      b.id === id ? { ...b, currentPrice: price, companyName: name || b.companyName } : b
    ));

    // 2. Sync to Local Storage immediately for quick resume
    if (user) {
      const localSaved = localStorage.getItem(`vfinance_prices_${user.uid}`);
      let prices = localSaved ? JSON.parse(localSaved) : {};
      prices[id] = price;
      localStorage.setItem(`vfinance_prices_${user.uid}`, JSON.stringify(prices));
    }

    // 3. Cost optimization sync logic for Firestore
    // Only update Firestore on the first fetch of the session for this bookmark, OR if it's a manual forceSync
    if (user && (!firstUpdateRef.current[id] || forceSync)) {
      try {
        await updateDoc(doc(db, 'users', user.uid, 'bookmarks', id), {
          currentPrice: price,
          companyName: name // Update name if found
        });
        // Mark as first fetch done in this session
        firstUpdateRef.current[id] = true;
      } catch (err) {
        console.error("Error syncing price to Firestore", err);
      }
    }
  }, [user]);

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
            <NotificationsBell />
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
                setProfileTab('profile');
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
            initialTab={profileTab}
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
              onBack={() => setView('profile')}
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
            setView('profile');
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

