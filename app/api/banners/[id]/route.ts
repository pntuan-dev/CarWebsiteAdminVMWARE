// API Route: GET/PUT/DELETE /api/banners/[id]

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const banner = await prisma.banner.findUnique({ where: { id } });
    if (!banner) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    return NextResponse.json({ data: banner });
  } catch (error) {
    console.error('[GET /api/banners/[id]]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  return withAuth(async (authReq) => {
    try {
      const { id } = await params;
      const body = await authReq.json();
      const banner = await prisma.banner.findUnique({ where: { id } });
      if (!banner) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
      const updated = await prisma.banner.update({ where: { id }, data: body });
      return NextResponse.json({ data: updated, message: 'Cập nhật thành công' });
    } catch (error) {
      console.error('[PUT /api/banners/[id]]', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  })(req);
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  return withAuth(async () => {
    try {
      const { id } = await params;
      const banner = await prisma.banner.findUnique({ where: { id } });
      if (!banner) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
      // Lưu ý: việc xoá ảnh MinIO thực hiện riêng qua DELETE /api/upload
      await prisma.banner.delete({ where: { id } });
      return NextResponse.json({ data: { carImageUrl: banner.carImageUrl }, message: 'Xoá banner thành công' });
    } catch (error) {
      console.error('[DELETE /api/banners/[id]]', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  })(req);
}
