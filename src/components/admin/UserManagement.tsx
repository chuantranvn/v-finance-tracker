import React, { useState, useEffect } from 'react';
import { UserData } from '@/types';
import { MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function UserManagement() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    // Mock user fetching
    setUsers([
        { id: '1', displayName: 'User 1', email: 'user1@test.com', role: 'user' },
        { id: '2', displayName: 'User 2', email: 'user2@test.com', role: 'admin' },
    ] as any);
  }, []);

  const handleAction = (userId: string, action: string) => {
    console.log(action, userId);
    setMenuOpen(null);
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Quản lý người dùng</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {users.map(user => (
          <div key={user.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
                <div className="font-medium">{user.displayName}</div>
                <div className="relative">
                    <button onClick={() => setMenuOpen(menuOpen === user.id ? null : user.id)}>
                        <MoreVertical className="w-5 h-5 cursor-pointer" />
                    </button>
                    {menuOpen === user.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border rounded-lg shadow-lg z-10 p-2">
                            <button className="block w-full text-left p-2 text-sm hover:bg-gray-100 rounded" onClick={() => handleAction(user.id, 'block')}>Block User</button>
                            <button className="block w-full text-left p-2 text-sm hover:bg-gray-100 rounded" onClick={() => handleAction(user.id, 'admin')}>Assign Admin</button>
                            <button className="block w-full text-left p-2 text-sm hover:bg-gray-100 rounded" onClick={() => handleAction(user.id, 'superadmin')}>Assign Super Admin</button>
                            <button className="block w-full text-left p-2 text-sm hover:bg-gray-100 rounded" onClick={() => handleAction(user.id, 'revoke')}>Thu hồi quyền</button>
                        </div>
                    )}
                </div>
            </div>
            
            <button className="text-sm text-blue-500 mt-2 font-medium" onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}>
                {expandedUser === user.id ? 'Thu gọn' : 'Xem thông tin'}
            </button>
            
            {expandedUser === user.id && (
                <div className="mt-4 pt-4 border-t text-sm text-gray-600 space-y-1">
                    <p><span className="font-medium text-gray-800">Email:</span> {user.email}</p>
                    <p><span className="font-medium text-gray-800">Role:</span> {user.role}</p>
                </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
