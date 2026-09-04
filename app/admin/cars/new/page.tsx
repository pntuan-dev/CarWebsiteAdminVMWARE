'use client';

import React from 'react';
import Header from '@/components/admin/ui/Header';
import CarForm from '@/components/admin/cars/CarForm';
import { api } from '@/hooks/useApi';
import { IVinFastCar } from '@/types/vinfast';

export default function NewCarPage() {
  const handleCreateCar = async (data: Partial<IVinFastCar>) => {
    await api.post('/api/cars', data);
  };

  return (
    <div>
      <Header
        title="Thêm Mẫu Xe Ô Tô Mới"
        subtitle="Điền thông số kỹ thuật, giá bán và tải ảnh lên hệ thống"
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto">
        <CarForm onSubmit={handleCreateCar} />
      </div>
    </div>
  );
}
