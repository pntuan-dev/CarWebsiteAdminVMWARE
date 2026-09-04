'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import Header from '@/components/admin/ui/Header';
import DataTable, { Column } from '@/components/admin/ui/DataTable';
import ConfirmDialog from '@/components/admin/ui/ConfirmDialog';
import { IPromotionItem } from '@/types/vinfast';
import { api } from '@/hooks/useApi';

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<IPromotionItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPromo, setSelectedPromo] = useState<IPromotionItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPromotions = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<{ data: IPromotionItem[] }>('/api/promotions?activeOnly=false');
      setPromotions(res.data || []);
    } catch (err) {
      console.error('Lỗi tải ưu đãi:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  const handleDelete = async () => {
    if (!selectedPromo) return;
    setIsDeleting(true);

    try {
      await api.delete(`/api/promotions/${selectedPromo.id}`);
      setSelectedPromo(null);
      await fetchPromotions();
    } catch (err) {
      console.error('Lỗi xóa ưu đãi:', err);
      alert('Không thể xóa ưu đãi.');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<IPromotionItem>[] = [
    {
      header: 'Thẻ phân loại',
      className: 'w-36',
      render: (p) => (
        <span className="inline-block font-mono text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
          {p.tag}
        </span>
      ),
    },
    {
      header: 'Tiêu đề & Điểm nhấn',
      render: (p) => (
        <div>
          <span className="font-bold text-white text-base">{p.title}</span>
          <p className="text-xs text-amber-400 font-medium mt-0.5">{p.highlight}</p>
          <p className="text-xs text-slate-400 mt-1 line-clamp-1 max-w-md">{p.description}</p>
        </div>
      ),
    },
    {
      header: 'Thời hạn áp dụng',
      render: (p) => (
        <span className="text-xs text-slate-300 font-medium">{p.validUntil}</span>
      ),
    },
    {
      header: 'Trạng thái',
      render: (p) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
            p.isActive
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-slate-800 text-slate-500 border border-slate-700'
          }`}
        >
          {p.isActive ? 'Áp dụng' : 'Hết hạn/Ẩn'}
        </span>
      ),
    },
    {
      header: 'Thao tác',
      className: 'w-32 text-right',
      render: (p) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/admin/promotions/${p.id}/edit`}
            className="p-2 rounded-lg bg-slate-800 hover:bg-amber-600 text-slate-400 hover:text-white transition-colors"
            title="Chỉnh sửa"
          >
            <Edit2 className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={() => setSelectedPromo(p)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-red-600 text-slate-400 hover:text-white transition-colors"
            title="Xóa"
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
        title="Quản lý Chương trình Ưu đãi"
        subtitle="Các chính sách khuyến mãi và hỗ trợ khách hàng mua xe VinFast"
        actions={
          <Link
            href="/admin/promotions/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold shadow-lg shadow-amber-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm ưu đãi mới</span>
          </Link>
        }
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
        <DataTable
          columns={columns}
          data={promotions}
          isLoading={isLoading}
          emptyMessage="Chưa có chương trình ưu đãi nào"
        />
      </div>

      <ConfirmDialog
        isOpen={!!selectedPromo}
        title="Xác nhận xóa ưu đãi"
        message={`Bạn có chắc muốn xóa chương trình "${selectedPromo?.title}"?`}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setSelectedPromo(null)}
      />
    </div>
  );
}
