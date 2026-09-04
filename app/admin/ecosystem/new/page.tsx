'use client';

import React from 'react';
import Header from '@/components/admin/ui/Header';
import EcosystemForm from '@/components/admin/ecosystem/EcosystemForm';
import { api } from '@/hooks/useApi';
import { IEcosystemItem } from '@/types/vinfast';

export default function NewEcosystemPage() {
  const handleCreate = async (data: Partial<IEcosystemItem>) => {
    await api.post('/api/ecosystem', data);
  };

  return (
    <div>
      <Header
        title="Thêm Dịch Vụ Hệ Sinh Thái Mới"
        subtitle="Cài đặt thông tin giới thiệu, icon và hình ảnh"
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto">
        <EcosystemForm onSubmit={handleCreate} />
      </div>
    </div>
  );
}
