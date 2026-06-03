'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useAuth } from '../AuthProvider';
import ActionReportModal from './ActionReportModal';
import PostPreviewModal from './PostPreviewModal';

export default function AdminReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [previewPostId, setPreviewPostId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const checkAdmin = async () => {
      try {
        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        if (!adminDoc.exists() || adminDoc.data().role !== 'superadmin') return;

        const q = query(collection(db, 'reports'));
        return onSnapshot(q, (snapshot) => {
          const reportsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setReports(reportsData);
        });
      } catch (e) {
        console.error("Error checking admin:", e);
      }
    };

    let unsubscribe: any;
    checkAdmin().then(unsub => unsubscribe = unsub);
    return () => { if (unsubscribe) unsubscribe(); };
  }, [user]);

  const handleAction = async (status: 'resolved' | 'dismissed', note: string, actions: { deletePost: boolean; blockPost: boolean; blockUser: boolean }) => {
    if (!user || !selectedReport) return;
    try {
      // 1. Get article details to find owner
      const articleDoc = await getDoc(doc(db, 'articles', selectedReport.postId));
      const articleData = articleDoc.exists() ? articleDoc.data() : null;
      const ownerId = articleData?.ownerId;

      // 2. Perform actions
      await updateDoc(doc(db, 'reports', selectedReport.id), { 
        status,
        moderatorNote: note,
        moderatorId: user.uid,
        resolvedAt: serverTimestamp()
      });
      
      if (actions.deletePost) {
        await updateDoc(doc(db, 'articles', selectedReport.postId), { isDeleted: true });
      }
      
      if (actions.blockPost) {
        await updateDoc(doc(db, 'articles', selectedReport.postId), { isBlockedByAdmin: true });
      }

      if (actions.blockUser && ownerId) {
        await updateDoc(doc(db, 'users', ownerId), { status: 'blocked' });
      }
      
      // 3. Notify owner
      if (ownerId && (actions.deletePost || actions.blockPost || actions.blockUser)) {
        await addDoc(collection(db, 'notifications'), {
          type: 'admin_action',
          actorId: user.uid,
          targetId: ownerId,
          articleId: selectedReport.postId,
          message: `Bài viết của bạn đã bị ${actions.deletePost ? 'xóa' : 'ẩn'} bởi quản trị viên. Ghi chú: ${note}`,
          read: false,
          createdAt: serverTimestamp()
        });
      }
      
      if (status === 'resolved') {
        await addDoc(collection(db, 'notifications'), {
          type: 'report_resolved',
          actorId: user.uid,
          targetId: selectedReport.reporterId,
          articleId: selectedReport.postId,
          read: false,
          createdAt: serverTimestamp()
        });
      }
      alert(`Đã ${status === 'resolved' ? 'giải quyết' : 'từ chối'} báo cáo: ${note}`);
      setSelectedReport(null);
    } catch (e) {
      console.error(e);
      alert('Lỗi cập nhật báo cáo.');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h2 className="text-2xl font-bold mb-6">Báo cáo</h2>
      <div className="space-y-4">
        {reports.map(report => (
          <div key={report.id} className="border border-gray-100 p-4 rounded-xl flex justify-between items-center">
            <div className="cursor-pointer flex-1" onClick={() => setPreviewPostId(report.postId)}>
              <p className="font-bold">Post ID: {report.postId}</p>
              <p className="text-sm text-gray-600">Lý do: {report.reason}</p>
              <p className={`text-xs mt-1 ${report.status === 'pending' ? 'text-yellow-600' : report.status === 'resolved' ? 'text-green-600' : 'text-red-500'}`}>
                Trạng thái: {report.status}
              </p>
              {report.moderatorNote && <p className="text-sm mt-2 italic text-gray-500">Ghi chú: {report.moderatorNote}</p>}
            </div>
            {report.status === 'pending' && (
              <button 
                onClick={() => setSelectedReport(report)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
              >
                Xử lý
              </button>
            )}
          </div>
        ))}
      </div>
      
      {selectedReport && (
        <ActionReportModal 
          isOpen={!!selectedReport}
          onClose={() => setSelectedReport(null)}
          onConfirm={handleAction}
          reportId={selectedReport.id}
        />
      )}

      {previewPostId && (
        <PostPreviewModal 
          isOpen={!!previewPostId}
          onClose={() => setPreviewPostId(null)}
          postId={previewPostId}
        />
      )}
    </div>
  );
}
