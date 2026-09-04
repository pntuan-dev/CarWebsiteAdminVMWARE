'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import ImageUpload from '@/components/admin/ui/ImageUpload';
import { IVinFastMotorbike } from '@/types/vinfast';

const bikeSchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên xe máy'),
  slug: z.string().min(1, 'Vui lòng nhập slug (ví dụ: evo-200)'),
  price: z.coerce.number().positive('Giá xe phải lớn hơn 0'),
  rangePerCharge: z.string().min(1, 'Vui lòng nhập quãng đường sạc'),
  topSpeed: z.string().min(1, 'Vui lòng nhập tốc độ tối đa'),
  batteryType: z.string().min(1, 'Vui lòng nhập loại pin (LFP, Lithium...)'),
  chargingTime: z.string().min(1, 'Vui lòng nhập thời gian sạc'),
  trunkCapacity: z.string().min(1, 'Vui lòng nhập dung tích cốp'),
  imageUrl: z.string().url('Vui lòng tải lên hình ảnh xe máy'),
  tagline: z.string().min(1, 'Vui lòng nhập câu khẩu hiệu'),
  badge: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

type BikeFormValues = z.infer<typeof bikeSchema>;

interface MotorbikeFormProps {
  initialData?: Partial<IVinFastMotorbike>;
  onSubmit: (data: Partial<IVinFastMotorbike>) => Promise<void>;
  isEditing?: boolean;
}

export default function MotorbikeForm({
  initialData,
  onSubmit,
  isEditing = false,
}: MotorbikeFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<BikeFormValues>({
    resolver: zodResolver(bikeSchema),
    defaultValues: {
      name: initialData?.name || '',
      slug: initialData?.slug || '',
      price: initialData?.price || 0,
      rangePerCharge: initialData?.rangePerCharge || '205 km / lần sạc',
      topSpeed: initialData?.topSpeed || '70 km/h',
      batteryType: initialData?.batteryType || 'Pin LFP cao cấp',
      chargingTime: initialData?.chargingTime || 'Khoảng 10 tiếng',
      trunkCapacity: initialData?.trunkCapacity || '22 lít',
      imageUrl: initialData?.imageUrl || '',
      tagline: initialData?.tagline || '',
      badge: initialData?.badge || '',
      isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
      sortOrder: initialData?.sortOrder || 0,
    },
  });

  const handleFormSubmit = async (values: BikeFormValues) => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await onSubmit(values);
      router.push('/admin/motorbikes');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi khi lưu xe máy';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/motorbikes"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách xe máy</span>
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2 disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{isEditing ? 'Cập nhật xe máy' : 'Lưu xe máy mới'}</span>
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
              Thông tin chung
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-400">Tên xe máy</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Feliz S, Evo200, Klara S"
                  {...register('name')}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
                {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-400">Slug</label>
                <input
                  type="text"
                  placeholder="evo-200"
                  {...register('slug')}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
                {errors.slug && <p className="text-xs text-red-400">{errors.slug.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-400">Giá bán (VNĐ)</label>
                <input
                  type="number"
                  placeholder="18000000"
                  {...register('price')}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
                {errors.price && <p className="text-xs text-red-400">{errors.price.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-400">Huy hiệu (Badge)</label>
                <input
                  type="text"
                  placeholder="Bán chạy / Mới ra mắt"
                  {...register('badge')}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase text-slate-400">Tagline (Khẩu hiệu)</label>
              <input
                type="text"
                placeholder="Vận hành bền bỉ - Tiết kiệm tối đa"
                {...register('tagline')}
                className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
              {errors.tagline && <p className="text-xs text-red-400">{errors.tagline.message}</p>}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
              Thông số vận hành
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-400">Quãng đường sạc</label>
                <input
                  type="text"
                  placeholder="205 km / lần sạc"
                  {...register('rangePerCharge')}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-400">Tốc độ tối đa</label>
                <input
                  type="text"
                  placeholder="70 km/h"
                  {...register('topSpeed')}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-400">Loại pin</label>
                <input
                  type="text"
                  placeholder="Pin LFP"
                  {...register('batteryType')}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-400">Thời gian sạc</label>
                <input
                  type="text"
                  placeholder="10 tiếng"
                  {...register('chargingTime')}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-400">Dung tích cốp</label>
                <input
                  type="text"
                  placeholder="22 Lít"
                  {...register('trunkCapacity')}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
              Ảnh xe máy (MinIO)
            </h3>

            <Controller
              control={control}
              name="imageUrl"
              render={({ field }) => (
                <ImageUpload
                  value={field.value}
                  onChange={field.onChange}
                  folder="motorbikes"
                  label="Ảnh xe máy PNG/WebP"
                  error={errors.imageUrl?.message}
                />
              )}
            />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
              Cài đặt hiển thị
            </h3>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase text-slate-400">Thứ tự sắp xếp</label>
              <input
                type="number"
                placeholder="0"
                {...register('sortOrder')}
                className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-300">Trạng thái kích hoạt</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" {...register('isActive')} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
