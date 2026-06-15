'use client';
import React from 'react';
import Logo from './Logo';
import UserMenu from './UserMenu';
import { useAuth } from './AuthProvider';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { user } = useAuth();
  const router = useRouter();

  if (!user) return null;

  return (
    <header className="flex justify-between items-center py-4 px-6 bg-[#f5f5f7]">
      <Logo className="w-24 h-12" />
      <div className="flex items-center gap-4">
        <button className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 text-gray-600">
          <Plus className="w-6 h-6" />
        </button>
        <UserMenu
          uid={user.uid}
          phoneNumber={user.phoneNumber}
          onSignOut={() => signOut(auth)}
          onShowHome={() => router.push('/')}
        />
      </div>
    </header>
  );
}
