'use client';

import React from 'react';
import Header from '@/components/admin/ui/Header';
import MotorbikeForm from '@/components/admin/motorbikes/MotorbikeForm';
import { api } from '@/hooks/useApi';
import { IVinFastMotorbike } from '@/types/vinfast';

export default function NewMotorbikePage() {
  const handleCreateBike = async (data: Partial<IVinFastMotorbike>) => {
    await api.post('/api/motorbikes', data);
  };

  return (
    <div>
      <Header
        title="Thêm Mẫu Xe Máy Mới"
        subtitle="Nhập thông số, loại pin, quãng đường và hình ảnh"
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto">
        <MotorbikeForm onSubmit={handleCreateBike} />
      </div>
    </div>
  );
}
