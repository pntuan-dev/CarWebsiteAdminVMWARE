'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit2, Trash2, ExternalLink } from 'lucide-react';
import Header from '@/components/admin/ui/Header';
import DataTable, { Column } from '@/components/admin/ui/DataTable';
import ConfirmDialog from '@/components/admin/ui/ConfirmDialog';
import { IVinFastCar } from '@/types/vinfast';
import { api } from '@/hooks/useApi';

export default function AdminCarsPage() {
  const [cars, setCars] = useState<IVinFastCar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState<IVinFastCar | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCars = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<{ data: IVinFastCar[] }>('/api/cars?activeOnly=false');
      setCars(res.data || []);
    } catch (err) {
      console.error('Lỗi tải danh sách xe:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCars();
  }, []);

  const handleDelete = async () => {
    if (!selectedCar) return;
    setIsDeleting(true);

    try {
      // 1. Gọi DELETE /api/cars/[id] -> nhận lại imageUrl
      const res = await api.delete<{ data: { imageUrl: string } }>(`/api/cars/${selectedCar.id}`);

      // 2. Dọn dẹp ảnh trên MinIO nếu có
      const imageUrl = res.data?.imageUrl;
      if (imageUrl) {
        const bucket = process.env.NEXT_PUBLIC_MINIO_BUCKET || 'websitecar';
        const parts = imageUrl.split(`/${bucket}/`);
        if (parts.length > 1) {
          await api.delete('/api/upload', { key: parts[1] }).catch((e) => {
            console.warn('Lỗi dọn dẹp ảnh MinIO:', e);
          });
        }
      }

      // 3. Tải lại danh sách xe
      setSelectedCar(null);
      await fetchCars();
    } catch (err) {
      console.error('Lỗi khi xóa xe:', err);
      alert('Không thể xóa xe. Vui lòng thử lại!');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const columns: Column<IVinFastCar>[] = [
    {
      header: 'Hình ảnh',
      className: 'w-24',
      render: (car) => (
        <div className="w-20 h-14 bg-slate-950/60 rounded-lg p-1.5 border border-slate-800 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={car.imageUrl}
            alt={car.name}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      ),
    },
    {
      header: 'Tên xe & Slug',
      render: (car) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-base">{car.name}</span>
            {car.badge && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                {car.badge}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 font-mono mt-0.5">/{car.slug}</p>
        </div>
      ),
    },
    {
      header: 'Phân khúc',
      render: (car) => (
        <div>
          <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-semibold text-slate-300">
            {car.segment.toUpperCase()}
          </span>
          <p className="text-xs text-slate-400 mt-1 truncate max-w-[180px]">{car.segmentLabel}</p>
        </div>
      ),
    },
    {
      header: 'Giá niêm yết',
      render: (car) => (
        <div>
          <p className="font-bold text-amber-400">{formatPrice(car.priceWithBattery)}</p>
          <p className="text-xs text-slate-400 mt-0.5">Thuê pin: {formatPrice(car.priceWithoutBattery)}</p>
        </div>
      ),
    },
    {
      header: 'Trạng thái',
      render: (car) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
            car.isActive
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-slate-800 text-slate-500 border border-slate-700'
          }`}
        >
          {car.isActive ? 'Đang hiển thị' : 'Đã ẩn'}
        </span>
      ),
    },
    {
      header: 'Thao tác',
      className: 'w-32 text-right',
      render: (car) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/admin/cars/${car.id}/edit`}
            className="p-2 rounded-lg bg-slate-800 hover:bg-blue-600 text-slate-400 hover:text-white transition-colors"
            title="Chỉnh sửa xe"
          >
            <Edit2 className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={() => setSelectedCar(car)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white transition-colors"
            title="Xóa xe"
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
        title="Quản lý Ô tô điện"
        subtitle="Danh sách và thông số các dòng xe ô tô VinFast"
        actions={
          <Link
            href="/admin/cars/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm mẫu xe mới</span>
          </Link>
        }
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
        <DataTable
          columns={columns}
          data={cars}
          isLoading={isLoading}
          emptyMessage="Chưa có mẫu xe ô tô nào trong hệ thống"
        />
      </div>

      <ConfirmDialog
        isOpen={!!selectedCar}
        title="Xác nhận xóa xe"
        message={`Bạn có chắc chắn muốn xóa xe "${selectedCar?.name}"? Dữ liệu và hình ảnh trên MinIO sẽ bị xóa vĩnh viễn.`}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setSelectedCar(null)}
      />
    </div>
  );
}
