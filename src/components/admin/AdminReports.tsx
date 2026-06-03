'use client';

import React, { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useAuth } from '../AuthProvider';
import ActionReportModal from './ActionReportModal';
import PostPreviewModal from './PostPreviewModal';
import { Search, Filter } from 'lucide-react';

export default function AdminReports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [previewPostId, setPreviewPostId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'resolved' | 'dismissed'>('all');

  useEffect(() => {
    if (!user) return;

    let unsubscribeReports: () => void;

    const checkAdmin = async () => {
      try {
        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        if (!adminDoc.exists() || adminDoc.data().role !== 'superadmin') return;

        const q = query(collection(db, 'reports'));
        unsubscribeReports = onSnapshot(q, (snapshot) => {
          const reportsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setReports(reportsData);
        });
      } catch (e) {
        console.error("Error checking admin:", e);
      }
    };

    checkAdmin();

    return () => {
      if (unsubscribeReports) unsubscribeReports();
    };
  }, [user]);

  const handleAction = async (status: 'resolved' | 'dismissed', note: string, actions: { deletePost: boolean; blockPost: boolean; blockUser: boolean }) => {
    if (!user || !selectedReport) return;
    try {
      // 1. Get article details to find author
      const articleDoc = await getDoc(doc(db, 'articles', selectedReport.postId));
      const articleData = articleDoc.exists() ? articleDoc.data() : null;
      const authorId = articleData?.authorId;
      
      let authorName = 'người dùng';
      if (authorId) {
        const userDoc = await getDoc(doc(db, 'users', authorId));
        if (userDoc.exists()) {
          authorName = userDoc.data().displayName || 'người dùng';
        }
      }

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

      if (actions.blockUser && authorId) {
        await updateDoc(doc(db, 'users', authorId), { status: 'blocked' });
      }
      
      // 3. Notify owner
      if (authorId && (actions.deletePost || actions.blockPost || actions.blockUser)) {
        await addDoc(collection(db, 'notifications'), {
          type: 'admin_action',
          actorId: user.uid,
          targetId: authorId,
          articleId: selectedReport.postId,
          message: `Bài viết của bạn đã bị ${actions.deletePost ? 'xóa' : 'ẩn'} bởi quản trị viên. Ghi chú: ${note}`,
          read: false,
          createdAt: serverTimestamp()
        });
      }
      
      if (status === 'resolved' || status === 'dismissed') {
        const message = status === 'resolved' 
          ? 'Báo cáo của bạn đã được giải quyết.' 
          : `Chúng tôi đã xem xét và thông báo với bạn rằng bài viết của ${authorName} không vi phạm tiêu chuẩn cộng đồng`;

        await addDoc(collection(db, 'notifications'), {
          type: status === 'resolved' ? 'report_resolved' : 'report_dismissed',
          actorId: user.uid,
          targetId: selectedReport.reporterId,
          articleId: selectedReport.postId,
          message,
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

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.postId.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          report.reason.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Báo cáo</h2>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Tìm kiếm..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg text-sm"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-4 py-2 border rounded-lg text-sm"
          >
            <option value="all">Tất cả</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="dismissed">Dismissed</option>
          </select>
        </div>
      </div>
      <div className="space-y-4">
        {filteredReports.map(report => (
          <div key={report.id} className="border border-gray-100 p-4 rounded-xl flex justify-between items-center">
            <div className="cursor-pointer flex-1" onClick={() => setPreviewPostId(report.postId)}>
              <p className="font-bold">Post ID: {report.postId}</p>
              <p className="text-sm text-gray-600">Lý do: {report.reason}</p>
              <p className="text-xs text-gray-500">
                Tạo lúc: {report.createdAt?.toDate ? report.createdAt.toDate().toLocaleString() : 'N/A'}
              </p>
              {report.resolvedAt && (
                <p className="text-xs text-gray-500">
                  Giải quyết lúc: {report.resolvedAt.toDate().toLocaleString()}
                </p>
              )}
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
