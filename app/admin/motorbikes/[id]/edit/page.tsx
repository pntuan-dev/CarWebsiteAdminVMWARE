'use client';

import React, { useEffect, useState, use } from 'react';
import Header from '@/components/admin/ui/Header';
import MotorbikeForm from '@/components/admin/motorbikes/MotorbikeForm';
import { api } from '@/hooks/useApi';
import { IVinFastMotorbike } from '@/types/vinfast';
import { Loader2 } from 'lucide-react';

interface EditMotorbikePageProps {
  params: Promise<{ id: string }>;
}

export default function EditMotorbikePage({ params }: EditMotorbikePageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [bike, setBike] = useState<IVinFastMotorbike | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadBike() {
      try {
        const res = await api.get<{ data: IVinFastMotorbike }>(`/api/motorbikes/${id}`);
        setBike(res.data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Không thể tải xe máy';
        setErrorMsg(message);
      } finally {
        setIsLoading(false);
      }
    }

    loadBike();
  }, [id]);

  const handleUpdateBike = async (data: Partial<IVinFastMotorbike>) => {
    await api.put(`/api/motorbikes/${id}`, data);
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-sm">Đang tải thông tin xe máy...</p>
      </div>
    );
  }

  if (errorMsg || !bike) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center">
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
          <p className="font-semibold">{errorMsg || 'Không tìm thấy xe máy này'}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header
        title={`Chỉnh Sửa: ${bike.name}`}
        subtitle="Cập nhật giá bán, thông số và hình ảnh xe máy"
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto">
        <MotorbikeForm initialData={bike} isEditing onSubmit={handleUpdateBike} />
      </div>
    </div>
  );
}
