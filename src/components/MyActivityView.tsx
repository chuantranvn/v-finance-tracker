"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { 
  User, 
  Camera, 
  Save, 
  Loader2, 
  ArrowLeft, 
  FileText, 
  Settings,
  ChevronRight,
  RefreshCw,
  Bookmark
} from 'lucide-react';
import { db } from '@/lib/firebase';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  serverTimestamp, 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs,
  limit,
  startAfter,
  DocumentData,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { useAuth } from '@/components/AuthProvider';
import { cn } from '@/lib/utils';
import ArticleCard from './ArticleCard';
import BookmarksList from './BookmarksList';
import { BookmarkData, ArticleData } from '@/types';
import { handleFirestoreError, OperationType } from '@/lib/firebase';

interface UserProfile {
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
}

type Tab = 'profile' | 'posts' | 'bookmarks';

interface MyActivityViewProps {
  onBack: () => void;
  // Bookmarks props
  bookmarks: BookmarkData[];
  isSelectionMode: boolean;
  selectedIds: Set<string>;
  setIsSelectionMode: (val: boolean) => void;
  setSelectedIds: (val: Set<string> | ((prev: Set<string>) => Set<string>)) => void;
  onDeleteSelected: () => void;
  onDeleteAll: () => void;
  onDeleteSingle: (id: string, e: React.MouseEvent) => void;
  onAddNew: () => void;
  onLoadBookmark: (b: BookmarkData) => void;
  onToggleAutoUpdate: (id: string, e?: React.MouseEvent) => void;
  onToggleHide: (id: string, e?: React.MouseEvent) => void;
  onUpdatePrice: (id: string, price: number, name: string) => void;
  onShareArticle?: (article: ArticleData) => void;
}

export default function MyActivityView({ 
  onBack,
  bookmarks,
  isSelectionMode,
  selectedIds,
  setIsSelectionMode,
  setSelectedIds,
  onDeleteSelected,
  onDeleteAll,
  onDeleteSingle,
  onAddNew,
  onLoadBookmark,
  onToggleAutoUpdate,
  onToggleHide,
  onUpdatePrice,
  onShareArticle
}: MyActivityViewProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('posts');
  
  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // My Posts state
  const [articles, setArticles] = useState<ArticleData[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setProfile(data);
          setDisplayName(data.displayName || '');
          setPhotoURL(data.photoURL || '');
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const fetchMyArticles = async (isLoadMore = false) => {
    if (!user) return;
    
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setPostsLoading(true);
    }

    try {
      const articlesRef = collection(db, 'articles');
      let q = query(
        articlesRef, 
        where('authorId', '==', user.uid),
        where('isDeleted', '==', false),
        orderBy('createdAt', 'desc'), 
        limit(10)
      );

      if (isLoadMore && lastDoc) {
        q = query(
          articlesRef, 
          where('authorId', '==', user.uid),
          where('isDeleted', '==', false),
          orderBy('createdAt', 'desc'), 
          startAfter(lastDoc), 
          limit(10)
        );
      }

      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ArticleData[];

      if (isLoadMore) {
        setArticles(prev => [...prev, ...fetched]);
      } else {
        setArticles(fetched);
      }

      setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
      setHasMore(snapshot.docs.length === 10);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'articles');
      // Fallback if index is not ready or other error
      if (!isLoadMore) setArticles([]);
    } finally {
      setPostsLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'posts') {
      fetchMyArticles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 800000) {
      alert("Ảnh quá lớn. Vui lòng chọn ảnh dưới 800KB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoURL(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || profileSaving) return;

    setProfileSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: displayName.trim(),
        photoURL: photoURL,
        updatedAt: serverTimestamp()
      });
      alert("Cập nhật thành công!");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      alert("Lỗi cập nhật.");
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Hoạt động của tôi</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Sidebar Menu */}
        <div className="w-full lg:w-64 flex-shrink-0 bg-white rounded-[2rem] shadow-sm border border-gray-100 p-4 sticky top-24">
          <div className="space-y-2">
            <button
              onClick={() => setActiveTab('profile')}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all font-bold text-sm",
                activeTab === 'profile' 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-100" 
                  : "text-gray-500 hover:bg-gray-50"
              )}
            >
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4" />
                <span>Thông tin của tôi</span>
              </div>
              <ChevronRight className={cn("w-4 h-4 transition-transform", activeTab === 'profile' && "rotate-90")} />
            </button>

            <button
              onClick={() => setActiveTab('posts')}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all font-bold text-sm",
                activeTab === 'posts' 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-100" 
                  : "text-gray-500 hover:bg-gray-50"
              )}
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4" />
                <span>Các bài viết</span>
              </div>
              <ChevronRight className={cn("w-4 h-4 transition-transform", activeTab === 'posts' && "rotate-90")} />
            </button>

            <button
              onClick={() => setActiveTab('bookmarks')}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all font-bold text-sm",
                activeTab === 'bookmarks' 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-100" 
                  : "text-gray-500 hover:bg-gray-50"
              )}
            >
              <div className="flex items-center gap-3">
                <Bookmark className="w-4 h-4" />
                <span>Danh mục</span>
              </div>
              <ChevronRight className={cn("w-4 h-4 transition-transform", activeTab === 'bookmarks' && "rotate-90")} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 w-full min-w-0">
          <AnimatePresence mode="wait">
            {activeTab === 'posts' ? (
              <motion.div
                key="posts"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {postsLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2rem] border border-gray-100">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
                    <p className="text-gray-400 font-medium">Đang tải bài viết của bạn...</p>
                  </div>
                ) : articles.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-200">
                    <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                    <p className="text-gray-400">Bạn chưa có bài viết nào.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-6">
                      {articles.map(article => (
                        <ArticleCard 
                          key={article.id} 
                          article={article} 
                          onShare={onShareArticle}
                        />
                      ))}
                    </div>
                    {hasMore && (
                      <button
                        onClick={() => fetchMyArticles(true)}
                        disabled={loadingMore}
                        className="w-full py-4 bg-white rounded-3xl border border-gray-100 text-sm font-semibold text-gray-500 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
                      >
                        {loadingMore ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        Tải thêm bài viết
                      </button>
                    )}
                  </>
                )}
              </motion.div>
            ) : activeTab === 'bookmarks' ? (
                <motion.div
                    key="bookmarks"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="w-full"
                >
                    <BookmarksList
                        bookmarks={bookmarks}
                        isSelectionMode={isSelectionMode}
                        selectedIds={selectedIds}
                        setIsSelectionMode={setIsSelectionMode}
                        setSelectedIds={setSelectedIds}
                        onDeleteSelected={onDeleteSelected}
                        onDeleteAll={onDeleteAll}
                        onDeleteSingle={onDeleteSingle}
                        onAddNew={onAddNew}
                        onLoadBookmark={onLoadBookmark}
                        onToggleAutoUpdate={onToggleAutoUpdate}
                        onToggleHide={onToggleHide}
                        onUpdatePrice={onUpdatePrice}
                    />
                </motion.div>
            ) : (
              <motion.div
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8"
              >
                {profileLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  </div>
                ) : (
                  <form onSubmit={handleSaveProfile} className="space-y-8 max-w-xl mx-auto">
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center">
                      <div className="relative group">
                        <div className="w-32 h-32 rounded-[2rem] bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-400">
                          {photoURL ? (
                            <Image src={photoURL} alt="Avatar" width={128} height={128} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <User className="w-12 h-12 text-gray-300" />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg hover:bg-blue-700 transition-transform active:scale-90"
                        >
                          <Camera className="w-5 h-5" />
                        </button>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleImageUpload} 
                          accept="image/*" 
                          className="hidden" 
                        />
                      </div>
                      <p className="mt-4 text-xs text-gray-400">Tải ảnh đại diện lên (PNG, JPG)</p>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 ml-4">Họ và tên</label>
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Nhập tên của bạn..."
                          className="w-full bg-gray-50 border-transparent border-2 focus:border-blue-500 focus:bg-white rounded-2xl px-6 py-4 outline-none transition-all"
                        />
                      </div>

                      <div className="space-y-2 opacity-60">
                        <label className="text-sm font-bold text-gray-700 ml-4">Số điện thoại</label>
                        <input
                          type="text"
                          value={profile?.phoneNumber || ''}
                          disabled
                          className="w-full bg-gray-100 border-transparent border-2 rounded-2xl px-6 py-4 outline-none cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="w-full bg-blue-600 text-white rounded-[1.5rem] py-4 font-bold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 transition-all shadow-xl shadow-blue-200"
                    >
                      {profileSaving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          Lưu thay đổi
                        </>
                      )}
                    </button>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
