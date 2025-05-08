import { useState } from 'react';
import { useLocation } from 'wouter';
import { AdminLayout } from './index';
import { Users, Plus, Pencil, Trash2, MoreHorizontal, Search, UserPlus, Eye, EyeOff, Lock, Shield, ShieldAlert } from 'lucide-react';

// Mock user data for display purposes
// In a real implementation, this would come from the database
interface User {
  id: number;
  username: string;
  email: string;
  balance: number;
  status: 'active' | 'suspended' | 'banned';
  role: 'user' | 'admin' | 'moderator';
  createdAt: string;
}

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useLocation();
  
  // This would be replaced with a real API call
  const mockUsers: User[] = [
    {
      id: 1,
      username: 'player123',
      email: 'player123@example.com',
      balance: 1250,
      status: 'active',
      role: 'user',
      createdAt: '2023-01-15T00:00:00.000Z',
    },
    {
      id: 2,
      username: 'casinoadmin',
      email: 'admin@casino.com',
      balance: 9999,
      status: 'active',
      role: 'admin',
      createdAt: '2023-01-01T00:00:00.000Z',
    },
    {
      id: 3,
      username: 'highroller',
      email: 'highroller@example.com',
      balance: 5000,
      status: 'active',
      role: 'user',
      createdAt: '2023-02-20T00:00:00.000Z',
    },
    {
      id: 4,
      username: 'banneduser',
      email: 'banned@example.com',
      balance: 0,
      status: 'banned',
      role: 'user',
      createdAt: '2023-03-10T00:00:00.000Z',
    },
    {
      id: 5,
      username: 'moderator1',
      email: 'mod@casino.com',
      balance: 2500,
      status: 'active',
      role: 'moderator',
      createdAt: '2023-01-05T00:00:00.000Z',
    },
  ];
  
  // Filter users based on search query
  const filteredUsers = mockUsers.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Functions to render status and role badges
  const getStatusBadge = (status: User['status']) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800/20 dark:text-green-300">
            <Eye className="h-3 w-3 mr-1" />
            Active
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-800/20 dark:text-yellow-300">
            <EyeOff className="h-3 w-3 mr-1" />
            Suspended
          </span>
        );
      case 'banned':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800/20 dark:text-red-300">
            <Lock className="h-3 w-3 mr-1" />
            Banned
          </span>
        );
    }
  };

  const getRoleBadge = (role: User['role']) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-800/20 dark:text-purple-300">
            <ShieldAlert className="h-3 w-3 mr-1" />
            Admin
          </span>
        );
      case 'moderator':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800/20 dark:text-blue-300">
            <Shield className="h-3 w-3 mr-1" />
            Moderator
          </span>
        );
      case 'user':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-300">
            User
          </span>
        );
    }
  };

  return (
    <AdminLayout title="User Management">
      <div className="rounded-lg border border-primary/20 bg-dark-card shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Users className="h-6 w-6 mr-2 text-primary" />
            <h2 className="text-xl font-semibold">User Management</h2>
          </div>
          
          <button className="bg-primary hover:bg-primary-light text-white px-4 py-2 rounded-md flex items-center transition-colors">
            <UserPlus className="h-4 w-4 mr-2" />
            Add New User
          </button>
        </div>
        
        {/* Search and Filters */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search users by username or email..."
              className="w-full pl-10 pr-4 py-2 bg-dark rounded-md border border-primary/20 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-primary/20">
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Username</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Balance</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Role</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-400">Created</th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-3 text-center text-gray-400">No users found</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-primary/10 hover:bg-dark/50">
                    <td className="px-4 py-4 text-sm">{user.id}</td>
                    <td className="px-4 py-4 font-medium">{user.username}</td>
                    <td className="px-4 py-4 text-sm text-gray-300">{user.email}</td>
                    <td className="px-4 py-4 text-sm">${user.balance.toFixed(2)}</td>
                    <td className="px-4 py-4">{getStatusBadge(user.status)}</td>
                    <td className="px-4 py-4">{getRoleBadge(user.role)}</td>
                    <td className="px-4 py-4 text-sm text-gray-300">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-right space-x-2">
                      <button className="text-primary hover:text-primary-light transition-colors">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button className="text-red-500 hover:text-red-400 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button className="text-gray-400 hover:text-white transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}