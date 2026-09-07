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
    const item = await prisma.ecosystemItem.findUnique({ where: { id } });
    if (!item) {
      const resData = { error: 'Not Found' };
      await logApi(`GET /api/ecosystem/${resolvedId}`, { id: resolvedId }, resData);
      return NextResponse.json(resData, { status: 404 });
    }
    const resData = { data: item };
    await logApi(`GET /api/ecosystem/${resolvedId}`, { id: resolvedId }, { id: item.id, title: item.title });
    return NextResponse.json(resData);
  } catch (error) {
    console.error('[GET /api/ecosystem/[id]]', error);
    await logApi(`GET /api/ecosystem/${resolvedId}`, { id: resolvedId }, { error: String(error) });
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
      const item = await prisma.ecosystemItem.findUnique({ where: { id } });
      if (!item) {
        const resData = { error: 'Not Found' };
        await logApi(`PUT /api/ecosystem/${resolvedId}`, body, resData);
        return NextResponse.json(resData, { status: 404 });
      }
      const updated = await prisma.ecosystemItem.update({ where: { id }, data: body as Record<string, unknown> });
      const resData = { data: updated, message: 'Cập nhật thành công' };
      await logApi(`PUT /api/ecosystem/${resolvedId}`, body, resData);
      return NextResponse.json(resData);
    } catch (error) {
      console.error('[PUT /api/ecosystem/[id]]', error);
      await logApi(`PUT /api/ecosystem/${resolvedId}`, body, { error: String(error) });
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
      const item = await prisma.ecosystemItem.findUnique({ where: { id } });
      if (!item) {
        const resData = { error: 'Not Found' };
        await logApi(`DELETE /api/ecosystem/${resolvedId}`, { id: resolvedId }, resData);
        return NextResponse.json(resData, { status: 404 });
      }
      // Lưu ý: việc xoá ảnh MinIO thực hiện riêng qua DELETE /api/upload
      await prisma.ecosystemItem.delete({ where: { id } });
      const resData = { data: { imageUrl: item.imageUrl }, message: 'Xoá thành công' };
      await logApi(`DELETE /api/ecosystem/${resolvedId}`, { id: resolvedId }, resData);
      return NextResponse.json(resData);
    } catch (error) {
      console.error('[DELETE /api/ecosystem/[id]]', error);
      await logApi(`DELETE /api/ecosystem/${resolvedId}`, { id: resolvedId }, { error: String(error) });
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  })(req);
}
