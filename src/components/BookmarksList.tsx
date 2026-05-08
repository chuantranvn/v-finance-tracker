"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Bookmark, Trash2, ListChecks, Plus, EyeOff, Eye } from 'lucide-react';
import { BookmarkData } from '@/types';
import BookmarkCard from './BookmarkCard';
import { motion, AnimatePresence } from 'motion/react';

interface BookmarksListProps {
  bookmarks: BookmarkData[];
  isSelectionMode: boolean;
  selectedIds: Set<string>;
  setIsSelectionMode: (val: boolean) => void;
  setSelectedIds: (val: Set<string>) => void;
  onDeleteSelected: () => void;
  onDeleteAll: () => void;
  onDeleteSingle: (id: string, e: React.MouseEvent) => void;
  onAddNew: () => void;
  onLoadBookmark: (b: BookmarkData) => void;
  onToggleAutoUpdate: (id: string, e?: React.MouseEvent) => void;
  onToggleHide: (id: string, e?: React.MouseEvent) => void;
  onUpdatePrice: (id: string, price: number, name: string) => void;
}

export default function BookmarksList({
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
  onUpdatePrice
}: BookmarksListProps) {
  const [activeTab, setActiveTab] = useState<'public' | 'hidden'>('public');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter(b => activeTab === 'hidden' ? b.isHidden : !b.isHidden);
  }, [bookmarks, activeTab]);

  const handleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  if (!mounted) return null;

  return (
    <div className="w-full max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 px-1 md:px-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-black mb-1 md:mb-2 text-center md:text-left">Danh Mục Theo Dõi</h1>
          <p className="text-xs md:text-sm font-medium text-gray-500 text-center md:text-left">Quản lý các mô phỏng của bạn</p>
        </div>
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-2 md:gap-3">
          {isSelectionMode ? (
            <>
              <button 
                onClick={() => {
                  setIsSelectionMode(false);
                  setSelectedIds(new Set());
                }}
                className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 md:px-5 py-2.5 md:py-3 rounded-full text-sm md:text-base font-medium hover:bg-gray-200 transition-colors shadow-sm"
              >
                Hủy
              </button>
              <button 
                onClick={onDeleteSelected}
                disabled={selectedIds.size === 0}
                className="flex items-center gap-2 bg-red-500 text-white px-4 md:px-5 py-2.5 md:py-3 rounded-full text-sm md:text-base font-medium hover:bg-red-600 transition-colors shadow-md disabled:opacity-50 disabled:hover:bg-red-500"
              >
                <Trash2 size={16} />
                Xóa ({selectedIds.size})
              </button>
            </>
          ) : (
            <>
              {bookmarks.length > 0 && (
                <>
                  <button 
                    onClick={() => setIsSelectionMode(true)}
                    className="flex items-center gap-2 bg-gray-100 text-black px-4 md:px-5 py-2.5 md:py-3 rounded-full text-sm md:text-base font-medium hover:bg-gray-200 transition-colors shadow-sm"
                  >
                    <ListChecks size={16} />
                    <span className="hidden xs:inline">Chọn hàng loạt</span>
                    <span className="xs:hidden">Chọn</span>
                  </button>
                  <button 
                    onClick={onDeleteAll}
                    className="flex items-center gap-2 bg-red-50 text-red-600 px-4 md:px-5 py-2.5 md:py-3 rounded-full text-sm md:text-base font-medium hover:bg-red-100 transition-colors shadow-sm"
                  >
                    <Trash2 size={16} />
                    <span className="hidden xs:inline">Xóa tất cả</span>
                    <span className="xs:hidden">Xóa hết</span>
                  </button>
                </>
              )}
              <button 
                onClick={onAddNew}
                className="flex items-center gap-2 bg-black text-white px-4 md:px-5 py-2.5 md:py-3 rounded-full text-sm md:text-base font-medium hover:bg-gray-800 transition-colors shadow-md"
              >
                <Plus size={16} />
                Thêm mới
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('public')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'public' 
              ? 'bg-white text-black shadow-sm' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Eye size={16} />
          Công khai
        </button>
        <button
          onClick={() => setActiveTab('hidden')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === 'hidden' 
              ? 'bg-white text-black shadow-sm' 
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <EyeOff size={16} />
          Bị ẩn
        </button>
      </div>

      {filteredBookmarks.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[32px] p-12 text-center border border-gray-100 shadow-sm flex flex-col items-center justify-center min-h-[400px]"
        >
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <Bookmark className="text-gray-400" size={24} />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Chưa có dữ liệu</h3>
          <p className="text-gray-500 font-medium mb-6">
            {activeTab === 'public' ? 'Bạn chưa có danh mục công khai nào.' : 'Thư mục ẩn đang trống.'}
          </p>
          {activeTab === 'public' && (
            <button 
              onClick={onAddNew}
              className="bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors"
            >
              Tạo mô phỏng đầu tiên
            </button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout" initial={false}>
            {filteredBookmarks.map((b) => (
              <BookmarkCard
                key={b.id}
                bookmark={b}
                isSelectionMode={isSelectionMode}
                isSelected={selectedIds.has(b.id)}
                onSelect={handleSelect}
                onDeleteSingle={onDeleteSingle}
                onLoadBookmark={onLoadBookmark}
                onToggleAutoUpdate={onToggleAutoUpdate}
                onToggleHide={onToggleHide}
                onUpdatePrice={onUpdatePrice}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
