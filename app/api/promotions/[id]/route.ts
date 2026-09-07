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
    const promo = await prisma.promotion.findUnique({ where: { id } });
    if (!promo) {
      const resData = { error: 'Not Found' };
      await logApi(`GET /api/promotions/${resolvedId}`, { id: resolvedId }, resData);
      return NextResponse.json(resData, { status: 404 });
    }
    const resData = { data: promo };
    await logApi(`GET /api/promotions/${resolvedId}`, { id: resolvedId }, { id: promo.id, title: promo.title });
    return NextResponse.json(resData);
  } catch (error) {
    console.error('[GET /api/promotions/[id]]', error);
    await logApi(`GET /api/promotions/${resolvedId}`, { id: resolvedId }, { error: String(error) });
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
      const promo = await prisma.promotion.findUnique({ where: { id } });
      if (!promo) {
        const resData = { error: 'Not Found' };
        await logApi(`PUT /api/promotions/${resolvedId}`, body, resData);
        return NextResponse.json(resData, { status: 404 });
      }
      const updated = await prisma.promotion.update({ where: { id }, data: body as Record<string, unknown> });
      const resData = { data: updated, message: 'Cập nhật thành công' };
      await logApi(`PUT /api/promotions/${resolvedId}`, body, resData);
      return NextResponse.json(resData);
    } catch (error) {
      console.error('[PUT /api/promotions/[id]]', error);
      await logApi(`PUT /api/promotions/${resolvedId}`, body, { error: String(error) });
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
      const promo = await prisma.promotion.findUnique({ where: { id } });
      if (!promo) {
        const resData = { error: 'Not Found' };
        await logApi(`DELETE /api/promotions/${resolvedId}`, { id: resolvedId }, resData);
        return NextResponse.json(resData, { status: 404 });
      }
      await prisma.promotion.delete({ where: { id } });
      const resData = { message: 'Xoá ưu đãi thành công' };
      await logApi(`DELETE /api/promotions/${resolvedId}`, { id: resolvedId }, resData);
      return NextResponse.json(resData);
    } catch (error) {
      console.error('[DELETE /api/promotions/[id]]', error);
      await logApi(`DELETE /api/promotions/${resolvedId}`, { id: resolvedId }, { error: String(error) });
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  })(req);
}
