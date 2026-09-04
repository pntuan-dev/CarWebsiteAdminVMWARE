'use client';

import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import ImageUpload from '@/components/admin/ui/ImageUpload';
import { IVinFastCar } from '@/types/vinfast';

const carFormSchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên xe'),
  slug: z.string().min(1, 'Vui lòng nhập slug (ví dụ: vf-3)'),
  segment: z.enum(['urban', 'suv', 'luxury', 'commercial'], {
    errorMap: () => ({ message: 'Vui lòng chọn phân khúc hợp lệ' }),
  }),
  segmentLabel: z.string().min(1, 'Vui lòng nhập nhãn phân khúc'),
  tagline: z.string().min(1, 'Vui lòng nhập tagline'),
  description: z.string().min(1, 'Vui lòng nhập mô tả chi tiết'),
  priceWithBattery: z.coerce.number().positive('Giá kèm pin phải lớn hơn 0'),
  priceWithoutBattery: z.coerce.number().positive('Giá thuê pin phải lớn hơn 0'),
  batteryRentMonthly: z.coerce.number().optional(),
  rangePerCharge: z.string().min(1, 'Vui lòng nhập quãng đường di chuyển'),
  maxPower: z.string().min(1, 'Vui lòng nhập công suất tối đa'),
  maxTorque: z.string().min(1, 'Vui lòng nhập mô-men xoắn'),
  topSpeed: z.string().min(1, 'Vui lòng nhập tốc độ tối đa'),
  seats: z.coerce.number().int().positive('Số chỗ ngồi phải lớn hơn 0'),
  airbags: z.coerce.number().int().min(0, 'Số túi khí không được âm'),
  fastChargingTime: z.string().min(1, 'Vui lòng nhập thời gian sạc nhanh'),
  dimensions: z.string().min(1, 'Vui lòng nhập kích thước'),
  wheelbase: z.string().min(1, 'Vui lòng nhập chiều dài cơ sở'),
  imageUrl: z.string().url('Vui lòng tải lên ảnh xe'),
  badge: z.string().optional(),
  featuresText: z.string().min(1, 'Vui lòng nhập ít nhất 1 tính năng (mỗi dòng 1 tính năng)'),
  depositUrl: z.string().url('Vui lòng nhập URL đặt cọc hợp lệ'),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

type CarFormValues = z.infer<typeof carFormSchema>;

interface CarFormProps {
  initialData?: Partial<IVinFastCar>;
  onSubmit: (data: Partial<IVinFastCar>) => Promise<void>;
  isEditing?: boolean;
}

export default function CarForm({ initialData, onSubmit, isEditing = false }: CarFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CarFormValues>({
    resolver: zodResolver(carFormSchema),
    defaultValues: {
      name: initialData?.name || '',
      slug: initialData?.slug || '',
      segment: (initialData?.segment as 'urban' | 'suv' | 'luxury' | 'commercial') || 'suv',
      segmentLabel: initialData?.segmentLabel || 'SUV điện thông minh',
      tagline: initialData?.tagline || '',
      description: initialData?.description || '',
      priceWithBattery: initialData?.priceWithBattery || 0,
      priceWithoutBattery: initialData?.priceWithoutBattery || 0,
      batteryRentMonthly: initialData?.batteryRentMonthly || undefined,
      rangePerCharge: initialData?.rangePerCharge || '',
      maxPower: initialData?.maxPower || '',
      maxTorque: initialData?.maxTorque || '',
      topSpeed: initialData?.topSpeed || '',
      seats: initialData?.seats || 5,
      airbags: initialData?.airbags || 6,
      fastChargingTime: initialData?.fastChargingTime || '30 phút (10% - 70%)',
      dimensions: initialData?.dimensions || '',
      wheelbase: initialData?.wheelbase || '',
      imageUrl: initialData?.imageUrl || '',
      badge: initialData?.badge || '',
      featuresText: (initialData?.features || []).join('\n'),
      depositUrl: initialData?.depositUrl || 'https://shop.vinfastauto.com',
      isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
      sortOrder: initialData?.sortOrder || 0,
    },
  });

  const handleFormSubmit = async (values: CarFormValues) => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const features = values.featuresText
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { featuresText, batteryRentMonthly, ...rest } = values;

      await onSubmit({
        ...rest,
        batteryRentMonthly:
          batteryRentMonthly && Number(batteryRentMonthly) > 0
            ? Number(batteryRentMonthly)
            : undefined,
        features,
      });

      router.push('/admin/cars');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi khi lưu thông tin xe';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8 max-w-5xl mx-auto">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/cars"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách xe</span>
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2 disabled:opacity-60"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{isEditing ? 'Cập nhật xe' : 'Lưu xe mới'}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
          {errorMsg}
        </div>
      )}

      {/* Grid sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Core info & Specs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Thông tin cơ bản */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
              Thông tin chung
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-400">Tên xe</label>
                <input
                  type="text"
                  placeholder="Ví dụ: VinFast VF 7"
                  {...register('name')}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-400">Slug (URL)</label>
                <input
                  type="text"
                  placeholder="vf-7"
                  {...register('slug')}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                />
                {errors.slug && <p className="text-xs text-red-400">{errors.slug.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-400">Phân khúc</label>
                <select
                  {...register('segment')}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="urban">Đô thị (urban)</option>
                  <option value="suv">SUV thông minh (suv)</option>
                  <option value="luxury">Cao cấp (luxury)</option>
                  <option value="commercial">Thương mại (commercial)</option>
                </select>
                {errors.segment && <p className="text-xs text-red-400">{errors.segment.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-400">Nhãn phân khúc hiển thị</label>
                <input
                  type="text"
                  placeholder="SUV Cỡ C | Dẫn đầu phong cách"
                  {...register('segmentLabel')}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                {errors.segmentLabel && <p className="text-xs text-red-400">{errors.segmentLabel.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase text-slate-400">Tagline (Câu khẩu hiệu)</label>
              <input
                type="text"
                placeholder="Khắc họa phong cách đam mê bất tận"
                {...register('tagline')}
                className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              {errors.tagline && <p className="text-xs text-red-400">{errors.tagline.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase text-slate-400">Mô tả chi tiết</label>
              <textarea
                rows={3}
                placeholder="Giới thiệu về mẫu xe..."
                {...register('description')}
                className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
              />
              {errors.description && <p className="text-xs text-red-400">{errors.description.message}</p>}
            </div>
          </div>

          {/* Giá & Pin */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
              Giá bán & Chính sách Pin
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-400">Giá kèm pin (VNĐ)</label>
                <input
                  type="number"
                  placeholder="999000000"
                  {...register('priceWithBattery')}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                {errors.priceWithBattery && <p className="text-xs text-red-400">{errors.priceWithBattery.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-400">Giá thuê pin (VNĐ)</label>
                <input
                  type="number"
                  placeholder="850000000"
                  {...register('priceWithoutBattery')}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
                {errors.priceWithoutBattery && <p className="text-xs text-red-400">{errors.priceWithoutBattery.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-400">Thuê pin / tháng (VNĐ)</label>
                <input
                  type="number"
                  placeholder="2900000"
                  {...register('batteryRentMonthly')}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Thông số kỹ thuật */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
              Thông số kỹ thuật
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-400">Quãng đường / lần sạc</label>
                <input
                  type="text"
                  placeholder="431 km (WLTP)"
                  {...register('rangePerCharge')}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-400">Công suất tối đa</label>
                <input
                  type="text"
                  placeholder="349 mã lực"
                  {...register('maxPower')}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-400">Mô-men xoắn</label>
                <input
                  type="text"
                  placeholder="500 Nm"
                  {...register('maxTorque')}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-400">Tốc độ tối đa</label>
                <input
                  type="text"
                  placeholder="175 km/h"
                  {...register('topSpeed')}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-400">Số chỗ ngồi</label>
                <input
                  type="number"
                  {...register('seats')}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-400">Số túi khí</label>
                <input
                  type="number"
                  {...register('airbags')}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-400">Sạc nhanh</label>
                <input
                  type="text"
                  placeholder="24 phút (10% - 70%)"
                  {...register('fastChargingTime')}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-400">Kích thước D x R x C (mm)</label>
                <input
                  type="text"
                  placeholder="4.545 x 1.890 x 1.635 mm"
                  {...register('dimensions')}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold uppercase text-slate-400">Chiều dài cơ sở</label>
                <input
                  type="text"
                  placeholder="2.840 mm"
                  {...register('wheelbase')}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase text-slate-400">
                Tính năng nổi bật (Mỗi dòng 1 tính năng)
              </label>
              <textarea
                rows={4}
                placeholder="Hệ thống hỗ trợ lái nâng cao ADAS level 2&#10;Trợ lý ảo thông minh VinFast điều khiển giọng nói&#10;Màn hình giải trí 12.9 inch sắc nét"
                {...register('featuresText')}
                className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 font-mono text-xs"
              />
              {errors.featuresText && <p className="text-xs text-red-400">{errors.featuresText.message}</p>}
            </div>
          </div>
        </div>

        {/* Right Column: Image & Status */}
        <div className="space-y-6">
          {/* Upload ảnh */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
              Hình ảnh xe (MinIO)
            </h3>

            <Controller
              control={control}
              name="imageUrl"
              render={({ field }) => (
                <ImageUpload
                  value={field.value}
                  onChange={field.onChange}
                  folder="cars"
                  label="Ảnh xe (nền trong suốt hoặc PNG/WebP)"
                  error={errors.imageUrl?.message}
                />
              )}
            />
          </div>

          {/* Cài đặt hiển thị */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
              Cấu hình hiển thị
            </h3>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase text-slate-400">Huy hiệu (Badge)</label>
              <input
                type="text"
                placeholder="Mới / Bán chạy / Hot / Ưu đãi"
                {...register('badge')}
                className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase text-slate-400">Link đặt cọc</label>
              <input
                type="text"
                placeholder="https://shop.vinfastauto.com/..."
                {...register('depositUrl')}
                className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase text-slate-400">Thứ tự sắp xếp</label>
              <input
                type="number"
                placeholder="0"
                {...register('sortOrder')}
                className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-300">Trạng thái kích hoạt</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  {...register('isActive')}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
