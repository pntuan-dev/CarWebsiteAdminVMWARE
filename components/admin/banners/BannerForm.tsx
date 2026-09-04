'use client';

import React, { useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import ImageUpload from '@/components/admin/ui/ImageUpload';
import { IBannerItem } from '@/types/vinfast';

const bannerSchema = z.object({
  title: z.string().min(1, 'Vui lòng nhập tiêu đề banner'),
  subtitle: z.string().min(1, 'Vui lòng nhập phụ đề'),
  description: z.string().min(1, 'Vui lòng nhập mô tả'),
  ctaText: z.string().min(1, 'Vui lòng nhập nút bấm chính'),
  ctaLink: z.string().min(1, 'Vui lòng nhập liên kết chính'),
  secondaryCtaText: z.string().optional(),
  secondaryCtaLink: z.string().optional(),
  carImageUrl: z.string().url('Vui lòng tải lên ảnh xe cho banner'),
  badge: z.string().optional(),
  price: z.string().optional(),
  specs: z
    .array(
      z.object({
        label: z.string().min(1, 'Nhãn'),
        value: z.string().min(1, 'Giá trị'),
      })
    )
    .optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

type BannerFormValues = z.infer<typeof bannerSchema>;

interface BannerFormProps {
  initialData?: Partial<IBannerItem>;
  onSubmit: (data: Partial<IBannerItem>) => Promise<void>;
  isEditing?: boolean;
}

export default function BannerForm({
  initialData,
  onSubmit,
  isEditing = false,
}: BannerFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<BannerFormValues>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      title: initialData?.title || '',
      subtitle: initialData?.subtitle || '',
      description: initialData?.description || '',
      ctaText: initialData?.ctaText || 'Khám phá ngay',
      ctaLink: initialData?.ctaLink || '#cars',
      secondaryCtaText: initialData?.secondaryCtaText || 'Đặt cọc',
      secondaryCtaLink: initialData?.secondaryCtaLink || 'https://shop.vinfastauto.com',
      carImageUrl: initialData?.carImageUrl || '',
      badge: initialData?.badge || 'Flagship SUV',
      price: initialData?.price || '',
      specs: initialData?.specs || [
        { label: 'Quãng đường', value: '471 km' },
        { label: 'Công suất', value: '300 kW' },
        { label: 'Tăng tốc', value: '5.5 giây' },
      ],
      isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
      sortOrder: initialData?.sortOrder || 0,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'specs',
  });

  const handleFormSubmit = async (values: BannerFormValues) => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await onSubmit(values);
      router.push('/admin/banners');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi khi lưu banner';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/banners"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách banner</span>
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2 disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{isEditing ? 'Cập nhật Banner' : 'Lưu Banner mới'}</span>
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
              Nội dung Banner Hero
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-400">Tiêu đề lớn</label>
                <input
                  type="text"
                  placeholder="VinFast VF 9"
                  {...register('title')}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
                {errors.title && <p className="text-xs text-red-400">{errors.title.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-400">Huy hiệu (Badge)</label>
                <input
                  type="text"
                  placeholder="Flagship E-SUV"
                  {...register('badge')}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase text-slate-400">Phụ đề nổi bật</label>
              <input
                type="text"
                placeholder="Khẳng định đẳng cấp tinh hoa"
                {...register('subtitle')}
                className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
              {errors.subtitle && <p className="text-xs text-red-400">{errors.subtitle.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase text-slate-400">Giá hiển thị nổi bật</label>
              <input
                type="text"
                placeholder="Từ 1.499.000.000 VNĐ"
                {...register('price')}
                className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase text-slate-400">Mô tả ngắn</label>
              <textarea
                rows={3}
                placeholder="Trải nghiệm không gian sang trọng và tiện nghi bậc nhất..."
                {...register('description')}
                className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
              />
              {errors.description && <p className="text-xs text-red-400">{errors.description.message}</p>}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
              Nút bấm điều hướng (CTA)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-400">Tên nút chính</label>
                <input
                  type="text"
                  placeholder="Khám phá ngay"
                  {...register('ctaText')}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-400">Liên kết nút chính</label>
                <input
                  type="text"
                  placeholder="#cars hoặc URL"
                  {...register('ctaLink')}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-400">Tên nút phụ</label>
                <input
                  type="text"
                  placeholder="Đặt cọc"
                  {...register('secondaryCtaText')}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-400">Liên kết nút phụ</label>
                <input
                  type="text"
                  placeholder="https://shop.vinfastauto.com/..."
                  {...register('secondaryCtaLink')}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Thông số vàng hiển thị trên Banner</h3>
              <button
                type="button"
                onClick={() => append({ label: '', value: '' })}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white text-xs font-semibold transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm thông số</span>
              </button>
            </div>

            <div className="space-y-3">
              {fields.map((field, idx) => (
                <div key={field.id} className="flex items-center gap-3">
                  <input
                    type="text"
                    placeholder="Tên thông số (vd: Quãng đường)"
                    {...register(`specs.${idx}.label`)}
                    className="flex-1 bg-slate-950/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    placeholder="Giá trị (vd: 471 km)"
                    {...register(`specs.${idx}.value`)}
                    className="flex-1 bg-slate-950/60 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
              Ảnh xe Hero Banner (MinIO)
            </h3>

            <Controller
              control={control}
              name="carImageUrl"
              render={({ field }) => (
                <ImageUpload
                  value={field.value}
                  onChange={field.onChange}
                  folder="banners"
                  label="Ảnh xe nổi bật trên nền slider"
                  error={errors.carImageUrl?.message}
                />
              )}
            />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
              Cài đặt hiển thị
            </h3>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase text-slate-400">Thứ tự hiển thị slider</label>
              <input
                type="number"
                placeholder="0"
                {...register('sortOrder')}
                className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-300">Kích hoạt banner</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" {...register('isActive')} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
