'use client';

import React from 'react';
import Header from '@/components/admin/ui/Header';
import PromotionForm from '@/components/admin/promotions/PromotionForm';
import { api } from '@/hooks/useApi';
import { IPromotionItem } from '@/types/vinfast';

export default function NewPromotionPage() {
  const handleCreate = async (data: Partial<IPromotionItem>) => {
    await api.post('/api/promotions', data);
  };

  return (
    <div>
      <Header
        title="Thêm Chương Trình Ưu Đãi Mới"
        subtitle="Cài đặt thông tin khuyến mãi, điều kiện áp dụng và thời hạn"
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto">
        <PromotionForm onSubmit={handleCreate} />
      </div>
    </div>
  );
}
