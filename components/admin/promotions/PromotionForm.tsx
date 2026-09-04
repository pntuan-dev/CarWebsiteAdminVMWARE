'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { IPromotionItem } from '@/types/vinfast';

const promoSchema = z.object({
  title: z.string().min(1, 'Vui lòng nhập tiêu đề ưu đãi'),
  highlight: z.string().min(1, 'Vui lòng nhập điểm nổi bật (vd: Ưu đãi 50% phí trước bạ)'),
  description: z.string().min(1, 'Vui lòng nhập mô tả chi tiết'),
  tag: z.string().min(1, 'Vui lòng nhập thẻ tag (vd: HOT, MÃNH LIỆT TINH THẦN VIỆT)'),
  validUntil: z.string().min(1, 'Vui lòng nhập thời hạn áp dụng (vd: Đến hết 31/12/2026)'),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

type PromoFormValues = z.infer<typeof promoSchema>;

interface PromotionFormProps {
  initialData?: Partial<IPromotionItem>;
  onSubmit: (data: Partial<IPromotionItem>) => Promise<void>;
  isEditing?: boolean;
}

export default function PromotionForm({
  initialData,
  onSubmit,
  isEditing = false,
}: PromotionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PromoFormValues>({
    resolver: zodResolver(promoSchema),
    defaultValues: {
      title: initialData?.title || '',
      highlight: initialData?.highlight || '',
      description: initialData?.description || '',
      tag: initialData?.tag || 'ƯU ĐÃI ĐẶC BIỆT',
      validUntil: initialData?.validUntil || 'Đến hết 31/12/2026',
      isActive: initialData?.isActive !== undefined ? initialData.isActive : true,
      sortOrder: initialData?.sortOrder || 0,
    },
  });

  const handleFormSubmit = async (values: PromoFormValues) => {
    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await onSubmit(values);
      router.push('/admin/promotions');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Lỗi khi lưu ưu đãi';
      setErrorMsg(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/promotions"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Quay lại danh sách ưu đãi</span>
        </Link>

        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm shadow-lg shadow-amber-600/30 transition-all flex items-center gap-2 disabled:opacity-60"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span>{isEditing ? 'Cập nhật ưu đãi' : 'Lưu ưu đãi mới'}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
          {errorMsg}
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
        <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
          Nội dung chương trình ưu đãi
        </h3>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase text-slate-400">Tiêu đề chương trình</label>
          <input
            type="text"
            placeholder="Mãnh liệt Tinh thần Việt Nam - Vì Tương lai Xanh"
            {...register('title')}
            className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
          />
          {errors.title && <p className="text-xs text-red-400">{errors.title.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-slate-400">Điểm nhấn nổi bật</label>
            <input
              type="text"
              placeholder="Hỗ trợ lãi suất 0% hoặc chiết khấu đến 10%"
              {...register('highlight')}
              className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
            />
            {errors.highlight && <p className="text-xs text-red-400">{errors.highlight.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-slate-400">Thẻ tag phân loại</label>
            <input
              type="text"
              placeholder="HOT / ĐẶC BIỆT / TRI ÂN"
              {...register('tag')}
              className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 font-mono text-xs"
            />
            {errors.tag && <p className="text-xs text-red-400">{errors.tag.message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase text-slate-400">Thời hạn áp dụng</label>
          <input
            type="text"
            placeholder="Áp dụng đến hết 31/12/2026 hoặc đến khi hết số lượng"
            {...register('validUntil')}
            className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
          />
          {errors.validUntil && <p className="text-xs text-red-400">{errors.validUntil.message}</p>}
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-semibold uppercase text-slate-400">Mô tả chi tiết thể lệ</label>
          <textarea
            rows={4}
            placeholder="Khách hàng mua ô tô điện VinFast sẽ được hưởng gói hỗ trợ tài chính đặc quyền..."
            {...register('description')}
            className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 resize-none"
          />
          {errors.description && <p className="text-xs text-red-400">{errors.description.message}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase text-slate-400">Thứ tự sắp xếp</label>
            <input
              type="number"
              placeholder="0"
              {...register('sortOrder')}
              className="w-full bg-slate-950/60 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4 sm:pt-6">
            <span className="text-sm font-semibold text-slate-300">Trạng thái kích hoạt</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" {...register('isActive')} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
            </label>
          </div>
        </div>
      </div>
    </form>
  );
}
