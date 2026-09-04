'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

const TOKEN_KEY = 'vinfast_admin_token';
const USER_KEY = 'vinfast_admin_user';

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Khởi tạo state từ localStorage khi component mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        // Đảm bảo cookie cũng được đồng bộ
        document.cookie = `${TOKEN_KEY}=${storedToken}; path=/; max-age=604800; SameSite=Lax`;
      }
    } catch (e) {
      console.error('Lỗi đọc thông tin đăng nhập:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback((jwtToken: string, userData: AdminUser) => {
    setToken(jwtToken);
    setUser(userData);
    localStorage.setItem(TOKEN_KEY, jwtToken);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    // Lưu cookie để Server Component / middleware có thể đọc
    document.cookie = `${TOKEN_KEY}=${jwtToken}; path=/; max-age=604800; SameSite=Lax`;
    router.push('/admin');
  }, [router]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    document.cookie = `${TOKEN_KEY}=; path=/; max-age=0; SameSite=Lax`;
    router.push('/admin/login');
  }, [router]);

  return {
    user,
    token,
    isLoading,
    isAuthenticated: !!token,
    login,
    logout,
  };
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}
