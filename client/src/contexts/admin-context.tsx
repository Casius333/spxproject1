import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: string;
  lastLogin?: string;
}

interface AdminContextType {
  admin: AdminUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: AdminUser) => void;
  logout: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [location] = useLocation();
  
  // Check if admin is already logged in on mount
  useEffect(() => {
    try {
      // Get admin data from localStorage
      const storedToken = localStorage.getItem('adminToken');
      const storedUser = localStorage.getItem('adminUser');
      
      if (storedToken && storedUser) {
        const adminUser = JSON.parse(storedUser) as AdminUser;
        setToken(storedToken);
        setAdmin(adminUser);
      }
    } catch (error) {
      console.error('Error loading admin session:', error);
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Get wouter's navigation function
  const [, setLocation] = useLocation();

  // Check if current location is an admin page and redirect if needed
  useEffect(() => {
    if (!isLoading) {
      const isAdminPage = location.startsWith('/admin');
      const isAdminLoginPage = location === '/admin/login';
      
      if (isAdminPage && !isAdminLoginPage && !token) {
        // Not authenticated, redirect to login
        setLocation('/admin/login');
      } else if (isAdminLoginPage && token) {
        // Already authenticated, redirect to admin dashboard
        setLocation('/admin');
      }
    }
  }, [isLoading, location, token, setLocation]);
  
  // Login function
  const login = (newToken: string, user: AdminUser) => {
    setToken(newToken);
    setAdmin(user);
    localStorage.setItem('adminToken', newToken);
    localStorage.setItem('adminUser', JSON.stringify(user));
  };
  
  // Logout function
  const logout = () => {
    setToken(null);
    setAdmin(null);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    toast({
      title: 'Logged out',
      description: 'You have been logged out of the admin dashboard',
    });
    setLocation('/admin/login');
  };
  
  return (
    <AdminContext.Provider
      value={{
        admin,
        token,
        isLoading,
        isAuthenticated: !!token,
        login,
        logout,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  
  return context;
}