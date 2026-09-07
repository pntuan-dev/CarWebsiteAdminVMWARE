/**
 * API Route tập trung xử lý ảnh (Image Management)
 *
 * POST   /api/upload   — Upload ảnh lên MinIO (multipart/form-data)
 *                        Body: file (File), folder? (string: "cars"|"bikes"|"ecosystem"|"banners"|"misc")
 *                        Response: { data: { url, key } }
 *
 * DELETE /api/upload   — Xoá ảnh khỏi MinIO theo key
 *                        Body: { key: string }
 *                        Response: { message }
 *
 * Cả 2 đều yêu cầu JWT Bearer token.
 */

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/middleware';
import { uploadToMinio, deleteFromMinio, getMimeType } from '@/lib/minio';
import { logApi } from '@/lib/logger';

// ─── POST /api/upload ─────────────────────────────────────────────────────────
export const POST = withAuth(async (req) => {
  let fileInfo: Record<string, unknown> = {};
  try {
    const { searchParams } = new URL(req.url);
    const queryFolder = searchParams.get('folder');

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const formFolder = formData.get('folder') as string | null;
    const folder = formFolder || queryFolder || 'uploads';

    if (!file) {
      const resData = { error: 'Bad Request', message: 'Không có file được gửi lên' };
      await logApi('POST /api/upload', { folder }, resData);
      return NextResponse.json(resData, { status: 400 });
    }

    fileInfo = { name: file.name, size: file.size, type: file.type, folder };

    // Giới hạn kích thước: 10MB
    if (file.size > 10 * 1024 * 1024) {
      const resData = { error: 'Bad Request', message: 'File quá lớn, tối đa 10MB' };
      await logApi('POST /api/upload', fileInfo, resData);
      return NextResponse.json(resData, { status: 400 });
    }

    // Chỉ cho phép file ảnh
    const allowedTypes = ['image/webp', 'image/png', 'image/jpeg', 'image/gif', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      const resData = { error: 'Bad Request', message: 'Chỉ cho phép file ảnh (webp, png, jpeg, gif, svg)' };
      await logApi('POST /api/upload', fileInfo, resData);
      return NextResponse.json(resData, { status: 400 });
    }

    // Tạo object key: {folder}/{tên-an-toàn}-{timestamp}.{ext}
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'webp';
    const safeName = file.name
      .replace(/\.[^/.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const key = `${folder}/${safeName}-${Date.now()}.${ext}`;

    // Đọc buffer và upload
    const buffer = Buffer.from(await file.arrayBuffer());
    const publicUrl = await uploadToMinio(key, buffer, getMimeType(file.name));

    const resData = {
      data: { url: publicUrl, key },
      url: publicUrl,
      key,
      message: 'Upload ảnh thành công',
    };
    await logApi('POST /api/upload', fileInfo, resData);

    return NextResponse.json(resData, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Upload thất bại';
    console.error('[POST /api/upload]', error);
    const resData = { error: 'Internal Server Error', message: `Lỗi upload: ${msg}` };
    await logApi('POST /api/upload', fileInfo, { error: msg });
    return NextResponse.json(resData, { status: 500 });
  }
});

// ─── DELETE /api/upload ───────────────────────────────────────────────────────
export const DELETE = withAuth(async (req) => {
  let body: { key?: string } = {};
  try {
    body = (await req.json()) as { key?: string };

    if (!body.key || typeof body.key !== 'string' || body.key.trim() === '') {
      const resData = { error: 'Bad Request', message: 'Thiếu key ảnh cần xoá' };
      await logApi('DELETE /api/upload', body, resData);
      return NextResponse.json(resData, { status: 400 });
    }

    await deleteFromMinio(body.key.trim());
    const resData = { message: 'Xoá ảnh thành công' };
    await logApi('DELETE /api/upload', body, resData);

    return NextResponse.json(resData);
  } catch (error) {
    console.error('[DELETE /api/upload]', error);
    const resData = { error: 'Internal Server Error', message: 'Xoá ảnh thất bại' };
    await logApi('DELETE /api/upload', body, { error: String(error) });
    return NextResponse.json(resData, { status: 500 });
  }
});
