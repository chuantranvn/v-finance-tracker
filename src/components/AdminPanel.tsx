'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';

export default function AdminPanel() {
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'reports'), where('status', '==', 'pending'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reportsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReports(reportsData);
    });
    return () => unsubscribe();
  }, []);

  const resolveReport = async (report: any) => {
    try {
      // 1. Update report status
      await updateDoc(doc(db, 'reports', report.id), { status: 'resolved' });
      
      // 2. Create notification
      await addDoc(collection(db, 'notifications'), {
        type: 'report_resolved',
        actorId: 'admin_uid', // Should be auth.uid, but need admin check
        targetId: report.reporterId,
        articleId: report.postId,
        read: false,
        createdAt: serverTimestamp()
      });
      alert('Đã giải quyết báo cáo.');
    } catch (e) {
      console.error(e);
      alert('Lỗi giải quyết báo cáo.');
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Admin Panel - Reports</h2>
      {reports.map(report => (
        <div key={report.id} className="border p-4 mb-2 rounded shadow">
          <p>Post ID: {report.postId}</p>
          <p>Reporter: {report.reporterId}</p>
          <p>Reason: {report.reason}</p>
          <button 
            onClick={() => resolveReport(report)}
            className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
          >
            Resolve
          </button>
        </div>
      ))}
    </div>
  );
}
