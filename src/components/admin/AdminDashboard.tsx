'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getCountFromServer } from 'firebase/firestore';

export default function AdminDashboard() {
  const [counts, setCounts] = useState({ users: 0, articles: 0, pendingReports: 0, resolvedReports: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const usersSnap = await getCountFromServer(collection(db, 'users'));
        const articlesSnap = await getCountFromServer(collection(db, 'articles'));
        const pendingReportsSnap = await getCountFromServer(query(collection(db, 'reports'), where('status', '==', 'pending')));
        const resolvedReportsSnap = await getCountFromServer(query(collection(db, 'reports'), where('status', '==', 'resolved')));

        setCounts({
          users: usersSnap.data().count,
          articles: articlesSnap.data().count,
          pendingReports: pendingReportsSnap.data().count,
          resolvedReports: resolvedReportsSnap.data().count,
        });
      } catch (error) {
        console.error('Error fetching dashboard counts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, []);

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h2 className="text-2xl font-bold mb-6">Tổng quan Dashboard</h2>
      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-blue-50 p-6 rounded-2xl">
            <p className="text-blue-600 font-medium">Tổng người dùng</p>
            <p className="text-4xl font-bold mt-2">{counts.users}</p>
          </div>
          <div className="bg-purple-50 p-6 rounded-2xl">
            <p className="text-purple-600 font-medium">Bài viết mới</p>
            <p className="text-4xl font-bold mt-2">{counts.articles}</p>
          </div>
          <div className="bg-orange-50 p-6 rounded-2xl">
            <p className="text-orange-600 font-medium">Báo cáo chờ xử lý</p>
            <p className="text-4xl font-bold mt-2">{counts.pendingReports}</p>
          </div>
          <div className="bg-green-50 p-6 rounded-2xl">
            <p className="text-green-600 font-medium">Báo cáo đã xử lý</p>
            <p className="text-4xl font-bold mt-2">{counts.resolvedReports}</p>
          </div>
        </div>
      )}
    </div>
  );
}
