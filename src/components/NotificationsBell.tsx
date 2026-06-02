"use client";

import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, doc, getDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { useAuth } from './AuthProvider';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale/vi';
import { getDisplayName } from '@/lib/userUtils';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import ReportResolvedModal from './ReportResolvedModal';

const NotificationItem = ({ notification, onClick }: { notification: any, onClick: () => void }) => {
  const [senderName, setSenderName] = useState('Ai đó');
  
  useEffect(() => {
    const userRef = doc(db, 'users', notification.actorId);
    getDoc(userRef).then(docSnap => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        setSenderName(getDisplayName({ displayName: userData.displayName, phoneNumber: userData.phoneNumber }));
      }
    });
  }, [notification.actorId]);

  return (
    <div onClick={onClick} className="px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer text-sm flex items-center gap-3">
      {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />}
      <div className={cn(!notification.read && "font-medium")}>
        <p>
          <span className="font-bold">{notification.type === 'report_resolved' ? 'Quản trị viên' : senderName}</span>
          {' '}
          <span className="text-gray-700">
            {notification.type === 'like' ? 'đã thích' : notification.type === 'comment' ? 'đã bình luận' : notification.type === 'report_resolved' ? 'đã giải quyết báo cáo về' : 'đã chia sẻ'}
          </span>
          {' '}
          <span className="text-gray-500">{notification.type === 'report_resolved' ? 'bài viết của bạn' : 'bài viết của bạn'}</span>
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {notification.createdAt?.toDate ? formatDistanceToNow(notification.createdAt.toDate(), { addSuffix: true, locale: vi }) : ''}
        </p>
      </div>
    </div>
  );
};

export default function NotificationsBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasOpenedBell, setHasOpenedBell] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [userName, setUserName] = useState('');

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

  const router = useRouter();

  const handleNotificationClick = async (notification: any) => {
    setIsOpen(false);
    try {
      await updateDoc(doc(db, 'notifications', notification.id), { read: true });
      
      if (notification.type === 'report_resolved') {
        // Fetch current user display name
        const userRef = doc(db, 'users', notification.targetId);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setUserName(getDisplayName({ displayName: userData.displayName, phoneNumber: userData.phoneNumber }));
        } else {
          setUserName('Bạn');
        }
        setIsReportModalOpen(true);
      } else {
        router.push(`/article/${notification.articleId}`);
      }
    } catch (e) {
      console.error("Error marking notification as read:", e);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.read);
    if (unreadNotifications.length === 0) return;

    const batch = writeBatch(db);
    unreadNotifications.forEach(n => {
      batch.update(doc(db, 'notifications', n.id), { read: true });
    });

    try {
      await batch.commit();
    } catch (e) {
      console.error("Error marking all notifications as read:", e);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) setHasOpenedBell(true);
        }}
        className="p-3 bg-white text-gray-700 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all active:scale-95 relative"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && !hasOpenedBell && (
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50">
          <div className="px-4 py-2 font-bold text-gray-900 border-b border-gray-100 flex items-center justify-between">
            <span>Thông báo</span>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllAsRead} className="text-xs text-blue-600 font-medium hover:text-blue-700">
                Xem tất cả
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-4 text-sm text-gray-500">Chưa có thông báo.</div>
            ) : (
              notifications.map(n => (
                <NotificationItem 
                  key={n.id} 
                  notification={n} 
                  onClick={() => handleNotificationClick(n)}
                />
              ))
            )}
          </div>
        </div>
      )}
      <ReportResolvedModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        username={userName} 
      />
    </div>
  );
}
