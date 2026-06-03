'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import AdminPanel from '@/components/AdminPanel';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function ManageAdminPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [authorized, setAuthorized] = useState<'loading' | 'authorized' | 'unauthorized'>('loading');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setAuthorized('unauthorized');
      return;
    }

    const checkAdminRole = async () => {
      try {
        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        if (adminDoc.exists() && adminDoc.data().role === 'superadmin') {
          setAuthorized('authorized');
        } else {
          setAuthorized('unauthorized');
        }
      } catch (e) {
        setAuthorized('unauthorized');
      }
    };

    checkAdminRole();
  }, [user, authLoading]);

  if (authorized === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Đang kiểm tra quyền truy cập...</p>
      </div>
    );
  }

  if (authorized === 'unauthorized') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500 font-bold">Invalid permission: Bạn không có quyền truy cập trang này.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] p-6">
      <AdminPanel />
    </div>
  );
}
