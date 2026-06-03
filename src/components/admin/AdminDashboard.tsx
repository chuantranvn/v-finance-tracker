'use client';

import React from 'react';

export default function AdminDashboard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <h2 className="text-2xl font-bold mb-6">Tổng quan Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-6 rounded-2xl">
          <p className="text-blue-600 font-medium">Tổng người dùng</p>
          <p className="text-4xl font-bold mt-2">1,234</p>
        </div>
        <div className="bg-purple-50 p-6 rounded-2xl">
          <p className="text-purple-600 font-medium">Bài viết mới</p>
          <p className="text-4xl font-bold mt-2">45</p>
        </div>
        <div className="bg-orange-50 p-6 rounded-2xl">
          <p className="text-orange-600 font-medium">Báo cáo chờ xử lý</p>
          <p className="text-4xl font-bold mt-2">12</p>
        </div>
      </div>
    </div>
  );
}
