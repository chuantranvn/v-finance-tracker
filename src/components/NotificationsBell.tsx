"use client";

import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useAuth } from './AuthProvider';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale/vi';

export default function NotificationsBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'notifications'),
      where('targetId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(data);
    });

    return () => unsubscribe();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 bg-white text-gray-700 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all active:scale-95 relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
          <div className="px-4 py-2 font-bold text-gray-900 border-b border-gray-100">Thông báo</div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-4 text-sm text-gray-500">Chưa có thông báo.</div>
            ) : (
              notifications.map(n => (
                <div key={n.id} className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer text-sm">
                  <p>
                    <span className="font-bold">{n.type === 'like' ? 'Ai đó đã thích' : n.type === 'comment' ? 'Ai đó đã bình luận' : 'Ai đó đã chia sẻ'}</span>
                    {' bài viết của bạn'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {n.createdAt?.toDate ? formatDistanceToNow(n.createdAt.toDate(), { addSuffix: true, locale: vi }) : ''}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
