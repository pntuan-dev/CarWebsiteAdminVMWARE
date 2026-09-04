'use client';

import { getStoredToken } from './useAuth';

export interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

export async function apiCall<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const token = getStoredToken();
  const { params, headers, ...rest } = options;

  let url = endpoint;
  if (params) {
    const searchParams = new URLSearchParams(params);
    url += (url.includes('?') ? '&' : '?') + searchParams.toString();
  }

  const defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...rest,
    headers: {
      ...defaultHeaders,
      ...headers,
    },
  });

  // Nếu lỗi 401 Unauthorized -> xóa token và chuyển về login
  if (response.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('vinfast_admin_token');
    localStorage.removeItem('vinfast_admin_user');
    document.cookie = 'vinfast_admin_token=; path=/; max-age=0; SameSite=Lax';
    window.location.href = '/admin/login';
    throw new Error('Phiên đăng nhập đã hết hạn');
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || 'Đã có lỗi xảy ra');
  }

  return data;
}

export const api = {
  get: <T>(url: string, params?: Record<string, string>) =>
    apiCall<T>(url, { method: 'GET', params }),
  post: <T>(url: string, body?: unknown) =>
    apiCall<T>(url, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(url: string, body?: unknown) =>
    apiCall<T>(url, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(url: string, body?: unknown) =>
    apiCall<T>(url, { method: 'DELETE', body: body ? JSON.stringify(body) : undefined }),
};
