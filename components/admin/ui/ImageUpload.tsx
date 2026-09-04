'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { getStoredToken } from '@/hooks/useAuth';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: 'cars' | 'motorbikes' | 'banners' | 'ecosystem' | 'uploads';
  label?: string;
  error?: string;
}

export default function ImageUpload({
  value,
  onChange,
  folder = 'uploads',
  label = 'Hình ảnh',
  error,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (file: File) => {
    // Validate định dạng ảnh
    if (!file.type.startsWith('image/')) {
      setUploadError('Vui lòng chỉ chọn file hình ảnh (JPEG, PNG, WebP, SVG)');
      return;
    }

    // Giới hạn dung lượng 10MB
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Dung lượng ảnh không được vượt quá 10MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const token = getStoredToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/upload?folder=${folder}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Upload ảnh thất bại');
      }

      const uploadedUrl = data.data?.url || data.url;
      if (!uploadedUrl) {
        throw new Error('Không nhận được URL ảnh từ máy chủ');
      }

      onChange(uploadedUrl);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Có lỗi xảy ra khi upload';
      setUploadError(message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleRemove = async () => {
    if (!value) return;

    try {
      // Trích xuất key từ URL MinIO
      // Ví dụ: http://.../websitecar/cars/vf-3.webp -> cars/vf-3.webp
      const bucket = process.env.NEXT_PUBLIC_MINIO_BUCKET || 'websitecar';
      const token = getStoredToken();
      const parts = value.split(`/${bucket}/`);
      const key = parts.length > 1 ? parts[1] : undefined;

      if (key) {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        await fetch('/api/upload', {
          method: 'DELETE',
          headers,
          body: JSON.stringify({ key }),
        });
      }
    } catch (err) {
      console.warn('Lỗi khi xóa ảnh trên MinIO:', err);
    } finally {
      onChange('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-semibold text-slate-300">
          {label}
        </label>
      )}

      {value ? (
        <div className="relative group w-full h-56 rounded-2xl border border-slate-700 bg-slate-950/60 overflow-hidden flex items-center justify-center p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Uploaded preview"
            className="max-h-full max-w-full object-contain transition-transform duration-300 group-hover:scale-105"
          />

          {/* Overlay Actions */}
          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 transition-all"
            >
              Đổi ảnh
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-600/30 transition-all flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Xóa</span>
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={`w-full h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-slate-700 hover:border-slate-600 bg-slate-950/40 hover:bg-slate-950/60'
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 text-blue-400">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm font-medium">Đang tải ảnh lên MinIO...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-300">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Nhấn để chọn ảnh hoặc kéo thả vào đây
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Định dạng PNG, JPG, WebP, SVG (tối đa 10MB)
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {(error || uploadError) && (
        <p className="text-xs text-red-400 font-medium">
          {error || uploadError}
        </p>
      )}
    </div>
  );
}
