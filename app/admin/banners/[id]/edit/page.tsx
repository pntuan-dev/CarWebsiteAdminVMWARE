'use client';

import React, { useEffect, useState, use } from 'react';
import Header from '@/components/admin/ui/Header';
import BannerForm from '@/components/admin/banners/BannerForm';
import { api } from '@/hooks/useApi';
import { IBannerItem } from '@/types/vinfast';
import { Loader2 } from 'lucide-react';

interface EditBannerPageProps {
  params: Promise<{ id: string }>;
}

export default function EditBannerPage({ params }: EditBannerPageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;

  const [banner, setBanner] = useState<IBannerItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadBanner() {
      try {
        const res = await api.get<{ data: IBannerItem }>(`/api/banners/${id}`);
        setBanner(res.data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Không thể tải banner';
        setErrorMsg(message);
      } finally {
        setIsLoading(false);
      }
    }

    loadBanner();
  }, [id]);

  const handleUpdateBanner = async (data: Partial<IBannerItem>) => {
    await api.put(`/api/banners/${id}`, data);
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-sm">Đang tải banner...</p>
      </div>
    );
  }

  if (errorMsg || !banner) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center">
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
          <p className="font-semibold">{errorMsg || 'Không tìm thấy banner'}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header
        title={`Chỉnh Sửa Banner: ${banner.title}`}
        subtitle="Cập nhật nội dung, giá, thông số kỹ thuật và hình ảnh"
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto">
        <BannerForm initialData={banner} isEditing onSubmit={handleUpdateBanner} />
      </div>
    </div>
  );
}
