"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { User, LogOut, Info, List, ChevronDown, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { getDisplayName } from '@/lib/userUtils';

interface UserMenuProps {
  uid: string | null;
  phoneNumber: string | null;
  onSignOut: () => void;
  onShowInfo?: () => void;
  onShowHome?: () => void;
}

export default function UserMenu({ uid, phoneNumber, onSignOut, onShowInfo, onShowHome }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<{ displayName?: string; photoURL?: string } | null>(null);

  useEffect(() => {
    if (!uid) return;
    const unsubscribe = onSnapshot(doc(db, 'users', uid), (doc) => {
      if (doc.exists()) {
        setProfile(doc.data());
      }
    });
    return () => unsubscribe();
  }, [uid]);

  const displayName = profile ? getDisplayName({ displayName: profile.displayName, phoneNumber: phoneNumber }) : getDisplayName({ phoneNumber: phoneNumber });
  const photoURL = profile?.photoURL;

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div className={cn(
        "flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-gray-100 cursor-pointer transition-all hover:shadow-md",
        isOpen && "rounded-b-none border-b-transparent"
      )}>
        <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center overflow-hidden border border-gray-100">
          {photoURL ? (
            <Image src={photoURL} alt={displayName} width={32} height={32} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <User className="w-5 h-5" />
          )}
        </div>
        <span className="text-sm font-medium text-gray-700 max-w-[100px] truncate">
          {displayName}
        </span>
        <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", isOpen && "rotate-180")} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full right-0 w-48 bg-white rounded-b-2xl shadow-lg border border-gray-100 border-t-0 p-2 z-50"
          >
            <button
              onClick={onShowHome}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <Home className="w-4 h-4" />
              Trang chủ
            </button>
            <button
              onClick={onShowInfo}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-xl transition-colors"
            >
              <List className="w-4 h-4" />
              Hoạt động của tôi
            </button>
            <div className="my-1 border-t border-gray-100" />
            <button
              onClick={onSignOut}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Đăng xuất
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
