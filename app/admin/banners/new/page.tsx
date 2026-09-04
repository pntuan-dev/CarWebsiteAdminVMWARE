'use client';

import React from 'react';
import Header from '@/components/admin/ui/Header';
import BannerForm from '@/components/admin/banners/BannerForm';
import { api } from '@/hooks/useApi';
import { IBannerItem } from '@/types/vinfast';

export default function NewBannerPage() {
  const handleCreateBanner = async (data: Partial<IBannerItem>) => {
    await api.post('/api/banners', data);
  };

  return (
    <div>
      <Header
        title="Thêm Banner Hero Mới"
        subtitle="Cài đặt thông tin xe và hình ảnh hiển thị trên slider trang chủ"
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto">
        <BannerForm onSubmit={handleCreateBanner} />
      </div>
    </div>
  );
}
