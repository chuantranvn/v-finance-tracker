'use client';
import { useEffect, useState } from 'react';
import { getFirebaseAuth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import Login from '@/components/Login';
import UserManagement from '@/components/admin/UserManagement';

export default function Page() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
        setLoading(false);
        return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) return <div className="p-6 text-center">Đang tải...</div>;
  if (!user) return <div className="p-6 max-w-md mx-auto"><Login /></div>;

  return (
    <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Chào mừng {user.displayName || user.email}</h1>
        <UserManagement />
    </div>
  );
}
