'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import Header from '@/components/admin/ui/Header';
import DataTable, { Column } from '@/components/admin/ui/DataTable';
import ConfirmDialog from '@/components/admin/ui/ConfirmDialog';
import { IVinFastMotorbike } from '@/types/vinfast';
import { api } from '@/hooks/useApi';

export default function AdminMotorbikesPage() {
  const [motorbikes, setMotorbikes] = useState<IVinFastMotorbike[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedBike, setSelectedBike] = useState<IVinFastMotorbike | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchMotorbikes = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<{ data: IVinFastMotorbike[] }>('/api/motorbikes?activeOnly=false');
      setMotorbikes(res.data || []);
    } catch (err) {
      console.error('Lỗi tải danh sách xe máy:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMotorbikes();
  }, []);

  const handleDelete = async () => {
    if (!selectedBike) return;
    setIsDeleting(true);

    try {
      const res = await api.delete<{ data: { imageUrl: string } }>(`/api/motorbikes/${selectedBike.id}`);
      const imageUrl = res.data?.imageUrl;
      if (imageUrl) {
        const bucket = process.env.NEXT_PUBLIC_MINIO_BUCKET || 'websitecar';
        const parts = imageUrl.split(`/${bucket}/`);
        if (parts.length > 1) {
          await api.delete('/api/upload', { key: parts[1] }).catch(() => {});
        }
      }

      setSelectedBike(null);
      await fetchMotorbikes();
    } catch (err) {
      console.error('Lỗi xóa xe máy:', err);
      alert('Không thể xóa xe máy.');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const columns: Column<IVinFastMotorbike>[] = [
    {
      header: 'Hình ảnh',
      className: 'w-24',
      render: (bike) => (
        <div className="w-20 h-14 bg-slate-950/60 rounded-lg p-1.5 border border-slate-800 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={bike.imageUrl} alt={bike.name} className="max-h-full max-w-full object-contain" />
        </div>
      ),
    },
    {
      header: 'Tên xe & Slug',
      render: (bike) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-base">{bike.name}</span>
            {bike.badge && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {bike.badge}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-mono mt-0.5">/{bike.slug}</p>
        </div>
      ),
    },
    {
      header: 'Giá bán',
      render: (bike) => (
        <div>
          <p className="font-bold text-emerald-400">{formatPrice(bike.price)}</p>
          <p className="text-xs text-slate-400 mt-0.5">{bike.batteryType}</p>
        </div>
      ),
    },
    {
      header: 'Quãng đường & Tốc độ',
      render: (bike) => (
        <div className="text-xs text-slate-300 space-y-0.5">
          <p>Đi được: <span className="font-semibold text-white">{bike.rangePerCharge}</span></p>
          <p>Tối đa: <span className="font-semibold text-white">{bike.topSpeed}</span></p>
        </div>
      ),
    },
    {
      header: 'Trạng thái',
      render: (bike) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
            bike.isActive
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-slate-800 text-slate-500 border border-slate-700'
          }`}
        >
          {bike.isActive ? 'Đang hiển thị' : 'Đã ẩn'}
        </span>
      ),
    },
    {
      header: 'Thao tác',
      className: 'w-32 text-right',
      render: (bike) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/admin/motorbikes/${bike.id}/edit`}
            className="p-2 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-400 hover:text-white transition-colors"
            title="Chỉnh sửa xe máy"
          >
            <Edit2 className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={() => setSelectedBike(bike)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white transition-colors"
            title="Xóa xe máy"
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
        title="Quản lý Xe máy điện"
        subtitle="Danh sách các mẫu xe máy điện thông minh VinFast"
        actions={
          <Link
            href="/admin/motorbikes/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-lg shadow-emerald-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm xe máy mới</span>
          </Link>
        }
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
        <DataTable
          columns={columns}
          data={motorbikes}
          isLoading={isLoading}
          emptyMessage="Chưa có mẫu xe máy điện nào"
        />
      </div>

      <ConfirmDialog
        isOpen={!!selectedBike}
        title="Xác nhận xóa xe máy"
        message={`Bạn có chắc muốn xóa xe máy "${selectedBike?.name}"? Dữ liệu và hình ảnh trên MinIO sẽ bị xóa vĩnh viễn.`}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setSelectedBike(null)}
      />
    </div>
  );
}
