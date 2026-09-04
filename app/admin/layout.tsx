'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from '@/components/admin/ui/Sidebar';
import { Loader2 } from 'lucide-react';

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      router.replace('/admin/login');
    }
  }, [isLoading, isAuthenticated, isLoginPage, router]);

  // Nếu là trang Login -> render full layout không có Sidebar
  if (isLoginPage) {
    return <div className="min-h-screen bg-[#0f172a]">{children}</div>;
  }

  // Đang kiểm tra token
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm font-medium">Đang tải bảng điều khiển...</p>
      </div>
    );
  }

  // Chưa đăng nhập -> đang redirect
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100">
      <Sidebar />
      <div className="lg:pl-64 flex flex-col min-h-screen">
        <main className="flex-1 pb-16">{children}</main>
      </div>
    </div>
  );
}
