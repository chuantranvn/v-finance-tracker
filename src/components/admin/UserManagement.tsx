'use client';
import React, { useState, useEffect, useRef } from 'react';
import { UserData } from '@/types';
import { MoreVertical, User, Shield, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fetchAllUsers, updateUserRole, checkIsAdmin } from '@/services/userService';
import { getFirebaseAuth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const auth = getFirebaseAuth();
    if (!auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAuthorized(false);
        setLoading(false);
        return;
      }
      
      const adminStatus = await checkIsAdmin(user.uid);
      setIsAuthorized(adminStatus);

      if (adminStatus) {
        await loadUsers();
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await fetchAllUsers();
      setUsers(data);
    } catch (e) {
      console.error("Error loading users:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Close menu when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAction = async (userId: string, role: string) => {
    try {
      await updateUserRole(userId, role);
      // Refresh users
      const data = await fetchAllUsers();
      setUsers(data);
    } catch (e) {
      console.error("Error updating user role:", e);
    }
    setMenuOpen(null);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'superadmin': return <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold">Super Admin</span>;
      case 'admin': return <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold">Admin</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">User</span>;
    }
  }

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Đang tải...</div>;
  }

  if (!isAuthorized) {
    return <div className="p-6 text-center text-red-500 font-medium">Bạn không có quyền truy cập vào trang này.</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quản lý người dùng</h2>
        
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-700">Người dùng</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Email</th>
                <th className="px-6 py-4 font-semibold text-gray-700">Quyền</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                      <User size={20} />
                    </div>
                    <span className="font-medium text-gray-900">{user.displayName}</span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{user.email}</td>
                  <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                      onClick={() => setMenuOpen(menuOpen === user.id ? null : user.id)}
                    >
                      <MoreVertical className="w-5 h-5 text-gray-500" />
                    </button>
                    {menuOpen === user.id && (
                      <div ref={menuRef} className="absolute right-10 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-20 p-2">
                        <button className="flex items-center gap-2 w-full p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => handleAction(user.id, 'block')}><Ban size={16} /> Khóa tài khoản</button>
                        <button className="flex items-center gap-2 w-full p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => handleAction(user.id, 'admin')}><Shield size={16} /> Gán Admin</button>
                        <button className="flex items-center gap-2 w-full p-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg" onClick={() => handleAction(user.id, 'superadmin')}><Shield size={16} /> Gán Super Admin</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
