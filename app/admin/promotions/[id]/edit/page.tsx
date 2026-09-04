'use client';

import React, { useEffect, useState, use } from 'react';
import Header from '@/components/admin/ui/Header';
import PromotionForm from '@/components/admin/promotions/PromotionForm';
import { api } from '@/hooks/useApi';
import { IPromotionItem } from '@/types/vinfast';
import { Loader2 } from 'lucide-react';

interface EditPromotionPageProps {
  params: Promise<{ id: string }>;
}

export default function EditPromotionPage({ params }: EditPromotionPageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [promo, setPromo] = useState<IPromotionItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadPromo() {
      try {
        const res = await api.get<{ data: IPromotionItem }>(`/api/promotions/${id}`);
        setPromo(res.data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Không thể tải ưu đãi';
        setErrorMsg(message);
      } finally {
        setIsLoading(false);
      }
    }

    loadPromo();
  }, [id]);

  const handleUpdate = async (data: Partial<IPromotionItem>) => {
    await api.put(`/api/promotions/${id}`, data);
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
        <p className="text-sm">Đang tải thông tin ưu đãi...</p>
      </div>
    );
  }

  if (errorMsg || !promo) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center">
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
          <p className="font-semibold">{errorMsg || 'Không tìm thấy ưu đãi'}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header
        title={`Chỉnh Sửa Ưu Đãi: ${promo.title}`}
        subtitle="Cập nhật điểm nhấn, thể lệ và thời hạn chương trình"
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto">
        <PromotionForm initialData={promo} isEditing onSubmit={handleUpdate} />
      </div>
    </div>
  );
}
