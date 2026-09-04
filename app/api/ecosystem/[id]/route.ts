// API Route: GET/PUT/DELETE /api/ecosystem/[id]
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const item = await prisma.ecosystemItem.findUnique({ where: { id } });
    if (!item) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    return NextResponse.json({ data: item });
  } catch (error) {
    console.error('[GET /api/ecosystem/[id]]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  return withAuth(async (authReq) => {
    try {
      const { id } = await params;
      const body = await authReq.json();
      const item = await prisma.ecosystemItem.findUnique({ where: { id } });
      if (!item) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
      const updated = await prisma.ecosystemItem.update({ where: { id }, data: body });
      return NextResponse.json({ data: updated, message: 'Cập nhật thành công' });
    } catch (error) {
      console.error('[PUT /api/ecosystem/[id]]', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  })(req);
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  return withAuth(async () => {
    try {
      const { id } = await params;
      const item = await prisma.ecosystemItem.findUnique({ where: { id } });
      if (!item) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
      // Lưu ý: việc xoá ảnh MinIO thực hiện riêng qua DELETE /api/upload
      await prisma.ecosystemItem.delete({ where: { id } });
      return NextResponse.json({ data: { imageUrl: item.imageUrl }, message: 'Xoá thành công' });
    } catch (error) {
      console.error('[DELETE /api/ecosystem/[id]]', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  })(req);
}
