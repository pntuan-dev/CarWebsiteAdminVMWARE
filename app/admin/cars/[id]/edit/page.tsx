'use client';

import React, { useEffect, useState, use } from 'react';
import Header from '@/components/admin/ui/Header';
import CarForm from '@/components/admin/cars/CarForm';
import { api } from '@/hooks/useApi';
import { IVinFastCar } from '@/types/vinfast';
import { Loader2 } from 'lucide-react';

interface EditCarPageProps {
  params: Promise<{ id: string }>;
}

export default function EditCarPage({ params }: EditCarPageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [car, setCar] = useState<IVinFastCar | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadCar() {
      try {
        const res = await api.get<{ data: IVinFastCar }>(`/api/cars/${id}`);
        setCar(res.data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Không thể tải thông tin xe';
        setErrorMsg(message);
      } finally {
        setIsLoading(false);
      }
    }

    loadCar();
  }, [id]);

  const handleUpdateCar = async (data: Partial<IVinFastCar>) => {
    await api.put(`/api/cars/${id}`, data);
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <p className="text-sm">Đang tải thông tin xe...</p>
      </div>
    );
  }

  if (errorMsg || !car) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center">
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
          <p className="font-semibold">{errorMsg || 'Không tìm thấy xe này'}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header
        title={`Chỉnh Sửa: ${car.name}`}
        subtitle="Cập nhật lại giá bán, hình ảnh hoặc thông số kỹ thuật"
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto">
        <CarForm initialData={car} isEditing onSubmit={handleUpdateCar} />
      </div>
    </div>
  );
}
