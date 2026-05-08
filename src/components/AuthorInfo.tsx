"use client";

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import Image from 'next/image';
import { User } from 'lucide-react';
import { getDisplayName } from '@/lib/userUtils';

interface AuthorInfoProps {
  uid: string;
  fallbackPhone?: string;
  size?: 'sm' | 'md' | 'lg';
  onlyAvatar?: boolean;
  onlyName?: boolean;
}

export default function AuthorInfo({ uid, fallbackPhone, size = 'md', onlyAvatar, onlyName }: AuthorInfoProps) {
  const [profile, setProfile] = useState<{ displayName?: string; photoURL?: string } | null>(null);

  useEffect(() => {
    if (!uid) return;
    const unsubscribe = onSnapshot(doc(db, 'users', uid), (docSnap) => {
      if (docSnap.exists()) {
        setProfile(docSnap.data());
      }
    });
    return () => unsubscribe();
  }, [uid]);

  const displayName = profile 
    ? getDisplayName({ displayName: profile.displayName, phoneNumber: fallbackPhone }) 
    : (fallbackPhone ? getDisplayName({ phoneNumber: fallbackPhone }) : 'Đang tải...');
  
  const photoURL = profile?.photoURL;

  const sizeClasses = {
    sm: {
      container: "w-6 h-6",
      icon: "w-4 h-4",
      text: "text-[10px]"
    },
    md: {
      container: "w-8 h-8",
      icon: "w-5 h-5",
      text: "text-sm"
    },
    lg: {
      container: "w-10 h-10",
      icon: "w-6 h-6",
      text: "text-base"
    }
  }[size];

  if (onlyAvatar) {
    return (
      <div className={`${sizeClasses.container} rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-100`}>
        {photoURL ? (
          <Image src={photoURL} alt={displayName} width={size === 'lg' ? 40 : size === 'md' ? 32 : 24} height={size === 'lg' ? 40 : size === 'md' ? 32 : 24} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <User className={`${sizeClasses.icon} text-gray-400`} />
        )}
      </div>
    );
  }

  if (onlyName) {
    return (
      <span className={`${sizeClasses.text} font-bold text-gray-900 truncate`}>
        {displayName}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className={`${sizeClasses.container} rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-100`}>
        {photoURL ? (
          <Image src={photoURL} alt={displayName} width={size === 'lg' ? 40 : size === 'md' ? 32 : 24} height={size === 'lg' ? 40 : size === 'md' ? 32 : 24} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <User className={`${sizeClasses.icon} text-gray-400`} />
        )}
      </div>
      <span className={`${sizeClasses.text} font-bold text-gray-900 truncate max-w-[120px]`}>
        {displayName}
      </span>
    </div>
  );
}
