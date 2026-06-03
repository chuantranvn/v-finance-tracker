'use client';

import React, { useState } from 'react';
import { LayoutDashboard, AlertTriangle, Users } from 'lucide-react';
import AdminReports from './admin/AdminReports';
import AdminDashboard from './admin/AdminDashboard';
import UserManagement from './admin/UserManagement';

type Section = 'dashboard' | 'reports' | 'users';

export default function AdminPanel() {
  const [activeSection, setActiveSection] = useState<Section>('dashboard');

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'reports', label: 'Báo cáo', icon: AlertTriangle },
    { id: 'users', label: 'Người dùng', icon: Users },
  ] as const;

  return (
    <div className="flex h-screen bg-[#f5f5f7]">
      <aside className="w-64 bg-white border-r p-6">
        <h1 className="text-xl font-bold mb-8">Admin Portal</h1>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                  activeSection === item.id 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        {activeSection === 'reports' && <AdminReports />}
        {activeSection === 'dashboard' && <AdminDashboard />}
        {activeSection === 'users' && <UserManagement />}
      </main>
    </div>
  );
}
