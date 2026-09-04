'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import Header from '@/components/admin/ui/Header';
import DataTable, { Column } from '@/components/admin/ui/DataTable';
import ConfirmDialog from '@/components/admin/ui/ConfirmDialog';
import { IEcosystemItem } from '@/types/vinfast';
import { api } from '@/hooks/useApi';

export default function AdminEcosystemPage() {
  const [items, setItems] = useState<IEcosystemItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<IEcosystemItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<{ data: IEcosystemItem[] }>('/api/ecosystem?activeOnly=false');
      setItems(res.data || []);
    } catch (err) {
      console.error('Lỗi tải hệ sinh thái:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async () => {
    if (!selectedItem) return;
    setIsDeleting(true);

    try {
      const res = await api.delete<{ data: { imageUrl: string } }>(`/api/ecosystem/${selectedItem.id}`);
      const imageUrl = res.data?.imageUrl;
      if (imageUrl) {
        const bucket = process.env.NEXT_PUBLIC_MINIO_BUCKET || 'websitecar';
        const parts = imageUrl.split(`/${bucket}/`);
        if (parts.length > 1) {
          await api.delete('/api/upload', { key: parts[1] }).catch(() => {});
        }
      }

      setSelectedItem(null);
      await fetchItems();
    } catch (err) {
      console.error('Lỗi xóa mục hệ sinh thái:', err);
      alert('Không thể xóa mục này.');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns: Column<IEcosystemItem>[] = [
    {
      header: 'Hình ảnh',
      className: 'w-24',
      render: (item) => (
        <div className="w-20 h-14 bg-slate-950/60 rounded-lg p-1.5 border border-slate-800 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={item.imageUrl} alt={item.title} className="max-h-full max-w-full object-contain" />
        </div>
      ),
    },
    {
      header: 'Tiêu đề dịch vụ',
      render: (item) => (
        <div>
          <span className="font-bold text-white text-base">{item.title}</span>
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 max-w-md">{item.description}</p>
        </div>
      ),
    },
    {
      header: 'Icon',
      render: (item) => (
        <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-purple-300">
          {item.iconName}
        </span>
      ),
    },
    {
      header: 'Hành động',
      render: (item) => (
        <div className="text-xs text-slate-300">
          <p className="font-medium text-white">{item.actionText}</p>
          <p className="text-slate-500 truncate max-w-[150px]">{item.actionLink}</p>
        </div>
      ),
    },
    {
      header: 'Trạng thái',
      render: (item) => (
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${
            item.isActive
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-slate-800 text-slate-500 border border-slate-700'
          }`}
        >
          {item.isActive ? 'Hiển thị' : 'Ẩn'}
        </span>
      ),
    },
    {
      header: 'Thao tác',
      className: 'w-32 text-right',
      render: (item) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/admin/ecosystem/${item.id}/edit`}
            className="p-2 rounded-lg bg-slate-800 hover:bg-purple-600 text-slate-400 hover:text-white transition-colors"
            title="Chỉnh sửa"
          >
            <Edit2 className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={() => setSelectedItem(item)}
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
        title="Quản lý Hệ sinh thái & Dịch vụ"
        subtitle="Danh sách trạm sạc, pin, xưởng dịch vụ và công nghệ kết nối"
        actions={
          <Link
            href="/admin/ecosystem/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold shadow-lg shadow-purple-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm dịch vụ mới</span>
          </Link>
        }
      />

      <div className="p-6 sm:p-8 max-w-7xl mx-auto space-y-6">
        <DataTable
          columns={columns}
          data={items}
          isLoading={isLoading}
          emptyMessage="Chưa có mục hệ sinh thái nào"
        />
      </div>

      <ConfirmDialog
        isOpen={!!selectedItem}
        title="Xác nhận xóa"
        message={`Bạn có chắc muốn xóa dịch vụ "${selectedItem?.title}"?`}
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setSelectedItem(null)}
      />
    </div>
  );
}
