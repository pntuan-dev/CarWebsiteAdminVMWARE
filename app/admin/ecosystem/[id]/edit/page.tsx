'use client';

import React, { useEffect, useState, use } from 'react';
import Header from '@/components/admin/ui/Header';
import EcosystemForm from '@/components/admin/ecosystem/EcosystemForm';
import { api } from '@/hooks/useApi';
import { IEcosystemItem } from '@/types/vinfast';
import { Loader2 } from 'lucide-react';

interface EditEcosystemPageProps {
  params: Promise<{ id: string }>;
}

export default function EditEcosystemPage({ params }: EditEcosystemPageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [item, setItem] = useState<IEcosystemItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadItem() {
      try {
        const res = await api.get<{ data: IEcosystemItem }>(`/api/ecosystem/${id}`);
        setItem(res.data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Không thể tải dịch vụ';
        setErrorMsg(message);
      } finally {
        setIsLoading(false);
      }
    }

    loadItem();
  }, [id]);

  const handleUpdate = async (data: Partial<IEcosystemItem>) => {
    await api.put(`/api/ecosystem/${id}`, data);
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <p className="text-sm">Đang tải...</p>
      </div>
    );
  }

  if (errorMsg || !item) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center">
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
          <p className="font-semibold">{errorMsg || 'Không tìm thấy mục này'}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header
        title={`Chỉnh Sửa: ${item.title}`}
        subtitle="Cập nhật nội dung dịch vụ hệ sinh thái"
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto">
        <EcosystemForm initialData={item} isEditing onSubmit={handleUpdate} />
      </div>
    </div>
  );
}
