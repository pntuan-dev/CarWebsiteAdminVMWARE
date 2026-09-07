// API Route: GET/PUT/DELETE /api/motorbikes/[id]

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';
import { logApi } from '@/lib/logger';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  let resolvedId = '';
  try {
    const { id } = await params;
    resolvedId = id;
    const bike = await prisma.motorbike.findFirst({ where: { OR: [{ id }, { slug: id }] } });
    if (!bike) {
      const resData = { error: 'Not Found' };
      await logApi(`GET /api/motorbikes/${resolvedId}`, { id: resolvedId }, resData);
      return NextResponse.json(resData, { status: 404 });
    }
    const resData = { data: bike };
    await logApi(`GET /api/motorbikes/${resolvedId}`, { id: resolvedId }, { id: bike.id, name: bike.name });
    return NextResponse.json(resData);
  } catch (error) {
    console.error('[GET /api/motorbikes/[id]]', error);
    await logApi(`GET /api/motorbikes/${resolvedId}`, { id: resolvedId }, { error: String(error) });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  return withAuth(async (authReq) => {
    let resolvedId = '';
    let body: unknown;
    try {
      const { id } = await params;
      resolvedId = id;
      body = await authReq.json();
      const bike = await prisma.motorbike.findUnique({ where: { id } });
      if (!bike) {
        const resData = { error: 'Not Found' };
        await logApi(`PUT /api/motorbikes/${resolvedId}`, body, resData);
        return NextResponse.json(resData, { status: 404 });
      }
      const updated = await prisma.motorbike.update({ where: { id }, data: body as Record<string, unknown> });
      const resData = { data: updated, message: 'Cập nhật thành công' };
      await logApi(`PUT /api/motorbikes/${resolvedId}`, body, resData);
      return NextResponse.json(resData);
    } catch (error) {
      console.error('[PUT /api/motorbikes/[id]]', error);
      await logApi(`PUT /api/motorbikes/${resolvedId}`, body, { error: String(error) });
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  })(req);
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  return withAuth(async () => {
    let resolvedId = '';
    try {
      const { id } = await params;
      resolvedId = id;
      const bike = await prisma.motorbike.findUnique({ where: { id } });
      if (!bike) {
        const resData = { error: 'Not Found' };
        await logApi(`DELETE /api/motorbikes/${resolvedId}`, { id: resolvedId }, resData);
        return NextResponse.json(resData, { status: 404 });
      }
      // Lưu ý: việc xoá ảnh MinIO thực hiện riêng qua DELETE /api/upload
      await prisma.motorbike.delete({ where: { id } });
      const resData = { data: { imageUrl: bike.imageUrl }, message: 'Xoá xe máy thành công' };
      await logApi(`DELETE /api/motorbikes/${resolvedId}`, { id: resolvedId }, resData);
      return NextResponse.json(resData);
    } catch (error) {
      console.error('[DELETE /api/motorbikes/[id]]', error);
      await logApi(`DELETE /api/motorbikes/${resolvedId}`, { id: resolvedId }, { error: String(error) });
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  })(req);
}
