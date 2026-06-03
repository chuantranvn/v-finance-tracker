import React, { useState, useEffect } from 'react';
import { UserData } from '@/types';
import { fetchAllUsers, updateUserRole } from '@/services/userService';
import { ChevronDown, ChevronUp, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/AuthProvider';

export default function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const { user: currentUser } = useAuth(); // Need to check if auth hook is available

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await fetchAllUsers();
      setUsers(allUsers);
    } catch (e) {
      console.error(e);
      alert('Lỗi tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await updateUserRole(userId, newRole);
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole as any } : u));
    } catch (e) {
      console.error(e);
      alert('Lỗi cập nhật vai trò.');
    }
  };

  if (loading) return <div>Đang tải...</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Quản lý người dùng</h2>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y">
        {users.map(user => (
          <div key={user.id} className="p-4">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}>
              <div className="flex items-center gap-3">
                <img src={user.avatarUrl || '/default-avatar.png'} alt={user.displayName} className="w-10 h-10 rounded-full" />
                <div>
                  <p className="font-medium">{user.displayName}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={cn("px-2 py-1 rounded-full text-xs font-medium", user.role === 'superadmin' ? 'bg-purple-100' : user.role === 'admin' ? 'bg-blue-100' : 'bg-gray-100')}>{user.role}</span>
                {expandedUser === user.id ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
              </div>
            </div>
            {expandedUser === user.id && (
              <div className="mt-4 pt-4 border-t px-2 space-y-2">
                <p className="text-sm font-medium">Thay đổi vai trò:</p>
                <select 
                  value={user.role}
                  onChange={(e) => handleRoleChange(user.id, e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm"
                  disabled={(currentUser as any)?.role !== 'superadmin'}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Superadmin</option>
                </select>
                {(currentUser as any)?.role !== 'superadmin' && <p className="text-xs text-red-500">Chỉ Superadmin mới có quyền thay đổi vai trò.</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
