'use client';

import React, { useState } from 'react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (status: 'resolved' | 'dismissed', note: string) => void;
  reportId: string;
}

export default function ActionReportModal({ isOpen, onClose, onConfirm, reportId }: Props) {
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'resolved' | 'dismissed'>('resolved');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h3 className="text-xl font-bold mb-4">Xử lý báo cáo {reportId.slice(0, 8)}...</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
            <select 
              value={status} 
              onChange={(e) => setStatus(e.target.value as 'resolved' | 'dismissed')}
              className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500"
            >
              <option value="resolved">Giải quyết</option>
              <option value="dismissed">Từ chối</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú của kiểm duyệt viên</label>
            <textarea 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 h-24 focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập nội dung xử lý..."
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">Hủy</button>
          <button 
            onClick={() => { onConfirm(status, note); onClose(); }} 
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            Xác nhận
          </button>
        </div>
      </div>
    </div>
  );
}
