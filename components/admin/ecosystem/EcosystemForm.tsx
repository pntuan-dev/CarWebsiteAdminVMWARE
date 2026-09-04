'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import ImageUpload from '@/components/admin/ui/ImageUpload';
import { IEcosystemItem } from '@/types/vinfast';

const ecoSchema = z.object({
  title: z.string().min(1, 'Vui lòng nhập tiêu đề'),
  description: z.string().min(1, 'Vui lòng nhập mô tả'),
  iconName: z.string().min(1, 'Vui lòng nhập iconName (vd: Zap, Shield, Smartphone)'),
  imageUrl: z.string().url('Vui lòng tải ảnh minh họa'),
  actionText: z.string().min(1, 'Vui lòng nhập nhãn nút'),
  actionLink: z.string().min(1, 'Vui lòng nhập liên kết'),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

type EcoFormValues = z.infer<typeof ecoSchema>;

interface EcosystemFormProps {
  initialData?: Partial<IEcosystemItem>;
  onSubmit: (data: Partial<IEcosystemItem>) => Promise<void>;
  isEditing?: boolean;
}

export default function EcosystemForm({
  initialData,
  onSubmit,
  isEditing = false,
}: EcosystemFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<EcoFormValues>({
    resolver: zodResolver(ecoSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      iconName: initialData?.iconName || 'Zap',
      imageUrl: initialData?.imageUrl || '',
      actionText: initialData?.actionText || 'Tìm hiểu thêm',
      actionLink: initialData?.actionLink || '#',
      isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
      sortOrder: initialData?.sortOrder || 0,
    },
  });

  const handleFormSubmit = async (values: EcoFormValues) => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await onSubmit(values);
      router.push('/admin/ecosystem');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi khi lưu mục hệ sinh thái';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/ecosystem"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách</span>
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{isEditing ? 'Cập nhật' : 'Lưu mới'}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
              Thông tin dịch vụ / Hệ sinh thái
            </h3>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase text-slate-400">Tiêu đề</label>
              <input
                type="text"
                placeholder="Trạm sạc phủ sóng toàn quốc"
                {...register('title')}
                className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
              />
              {errors.title && <p className="text-xs text-red-400">{errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-400">Icon Name</label>
                <input
                  type="text"
                  placeholder="Zap, Shield, Smartphone..."
                  {...register('iconName')}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                />
                {errors.iconName && <p className="text-xs text-red-400">{errors.iconName.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-400">Thứ tự sắp xếp</label>
                <input
                  type="number"
                  placeholder="0"
                  {...register('sortOrder')}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase text-slate-400">Mô tả dịch vụ</label>
              <textarea
                rows={3}
                placeholder="150.000 cổng sạc trên 63 tỉnh thành..."
                {...register('description')}
                className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 resize-none"
              />
              {errors.description && <p className="text-xs text-red-400">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-400">Tên nút hành động</label>
                <input
                  type="text"
                  placeholder="Tìm trạm sạc gần nhất"
                  {...register('actionText')}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-400">Đường dẫn liên kết</label>
                <input
                  type="text"
                  placeholder="https://vinfastauto.com/..."
                  {...register('actionLink')}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
              Ảnh minh họa (MinIO)
            </h3>

            <Controller
              control={control}
              name="imageUrl"
              render={({ field }) => (
                <ImageUpload
                  value={field.value}
                  onChange={field.onChange}
                  folder="ecosystem"
                  label="Ảnh minh họa"
                  error={errors.imageUrl?.message}
                />
              )}
            />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-300">Trạng thái kích hoạt</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" {...register('isActive')} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>
      </div>
    </form>
  );
}
