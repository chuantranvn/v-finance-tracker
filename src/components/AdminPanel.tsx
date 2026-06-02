'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from './AuthProvider';

export default function AdminPanel() {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'reports'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReports(reportsData);
    });
    return () => unsubscribe();
  }, []);

  const updateReportStatus = async (reportId: string, status: 'resolved' | 'dismissed', reporterId: string, postId: string) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'reports', reportId), { status });
      
      if (status === 'resolved') {
        await addDoc(collection(db, 'notifications'), {
          type: 'report_resolved',
          actorId: user.uid,
          targetId: reporterId,
          articleId: postId,
          read: false,
          createdAt: serverTimestamp()
        });
      }
      alert(`Đã ${status === 'resolved' ? 'giải quyết' : 'từ chối'} báo cáo.`);
    } catch (e) {
      console.error(e);
      alert('Lỗi cập nhật báo cáo.');
    }
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-sm">
      <h2 className="text-2xl font-bold mb-6">Admin Panel - Báo cáo</h2>
      <div className="space-y-4">
        {reports.map(report => (
          <div key={report.id} className="border border-gray-100 p-4 rounded-xl flex justify-between items-center">
            <div>
              <p className="font-bold">Post ID: {report.postId}</p>
              <p className="text-sm text-gray-600">Lý do: {report.reason}</p>
              <p className={`text-xs mt-1 ${report.status === 'pending' ? 'text-yellow-600' : report.status === 'resolved' ? 'text-green-600' : 'text-red-500'}`}>
                Trạng thái: {report.status}
              </p>
            </div>
            {report.status === 'pending' && (
              <div className="flex gap-2">
                <button 
                  onClick={() => updateReportStatus(report.id, 'dismissed', report.reporterId, report.postId)}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm"
                >
                  Từ chối
                </button>
                <button 
                  onClick={() => updateReportStatus(report.id, 'resolved', report.reporterId, report.postId)}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
                >
                  Giải quyết
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
