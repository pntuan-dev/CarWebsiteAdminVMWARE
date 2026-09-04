'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import Header from '@/components/admin/ui/Header';
import DataTable, { Column } from '@/components/admin/ui/DataTable';
import ConfirmDialog from '@/components/admin/ui/ConfirmDialog';
import { IBannerItem } from '@/types/vinfast';
import { api } from '@/hooks/useApi';

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<IBannerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBanner, setSelectedBanner] = useState<IBannerItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBanners = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<{ data: IBannerItem[] }>('/api/banners?activeOnly=false');
      setBanners(res.data || []);
    } catch (err) {
      console.error('Lỗi tải danh sách banner:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleDelete = async () => {
    if (!selectedBanner) return;
    setIsDeleting(true);

    try {
      const res = await api.delete<{ data: { carImageUrl: string } }>(`/api/banners/${selectedBanner.id}`);
      const imageUrl = res.data?.carImageUrl;
      if (imageUrl) {
        const bucket = process.env.NEXT_PUBLIC_MINIO_BUCKET || 'websitecar';
        const parts = imageUrl.split(`/${bucket}/`);
        if (parts.length > 1) {
          await api.delete('/api/upload', { key: parts[1] }).catch(() => {});
        }
      }

      setSelectedBanner(null);
      await fetchBanners();
    } catch (err) {
      console.error('Lỗi xóa banner:', err);
      alert('Không thể xóa banner.');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<IBannerItem>[] = [
    {
      header: 'Ảnh Hero',
      className: 'w-24',
      render: (banner) => (
        <div className="w-20 h-14 bg-slate-950/60 rounded-lg p-1.5 border border-slate-800 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={banner.carImageUrl} alt={banner.title} className="max-h-full max-w-full object-contain" />
        </div>
      ),
    },
    {
      header: 'Tiêu đề & Khẩu hiệu',
      render: (banner) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-base">{banner.title}</span>
            {banner.badge && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                {banner.badge}
              </span>
            )}
          </div>
          <p className="text-xs text-indigo-300 mt-0.5">{banner.subtitle}</p>
        </div>
      ),
    },
    {
      header: 'Giá hiển thị',
      render: (banner) => (
        <span className="font-bold text-amber-400 text-sm">
          {banner.price || 'Chưa cập nhật'}
        </span>
      ),
    },
    {
      header: 'Nút bấm CTA',
      render: (banner) => (
        <div className="text-xs text-slate-300">
          <p>Chính: <span className="font-semibold text-white">{banner.ctaText}</span> ({banner.ctaLink})</p>
          {banner.secondaryCtaText && (
            <p className="text-slate-400">Phụ: {banner.secondaryCtaText}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Trạng thái',
      render: (banner) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
            banner.isActive
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-slate-800 text-slate-500 border border-slate-700'
          }`}
        >
          {banner.isActive ? 'Hiển thị' : 'Ẩn'}
        </span>
      ),
    },
    {
      header: 'Thao tác',
      className: 'w-32 text-right',
      render: (banner) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/admin/banners/${banner.id}/edit`}
            className="p-2 rounded-lg bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white transition-colors"
            title="Sửa banner"
          >
            <Edit2 className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={() => setSelectedBanner(banner)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white transition-colors"
            title="Xóa banner"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Header
        title="Quản lý Banner Slider"
        subtitle="Thiết lập các slide xe hiển thị tại đầu trang chủ Landing Page"
        actions={
          <Link
            href="/admin/banners/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Banner mới</span>
          </Link>
        }
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
        <DataTable
          columns={columns}
          data={banners}
          isLoading={isLoading}
          emptyMessage="Chưa có banner nào"
        />
      </div>

      <ConfirmDialog
        isOpen={!!selectedBanner}
        title="Xác nhận xóa Banner"
        message={`Bạn có chắc muốn xóa banner "${selectedBanner?.title}"?`}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setSelectedBanner(null)}
      />
    </div>
  );
}
