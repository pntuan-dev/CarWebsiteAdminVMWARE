// API Route: GET/PUT/DELETE /api/promotions/[id]
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const promo = await prisma.promotion.findUnique({ where: { id } });
    if (!promo) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
    return NextResponse.json({ data: promo });
  } catch (error) {
    console.error('[GET /api/promotions/[id]]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  return withAuth(async (authReq) => {
    try {
      const { id } = await params;
      const body = await authReq.json();
      const promo = await prisma.promotion.findUnique({ where: { id } });
      if (!promo) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
      const updated = await prisma.promotion.update({ where: { id }, data: body });
      return NextResponse.json({ data: updated, message: 'Cập nhật thành công' });
    } catch (error) {
      console.error('[PUT /api/promotions/[id]]', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  })(req);
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  return withAuth(async () => {
    try {
      const { id } = await params;
      const promo = await prisma.promotion.findUnique({ where: { id } });
      if (!promo) return NextResponse.json({ error: 'Not Found' }, { status: 404 });
      await prisma.promotion.delete({ where: { id } });
      return NextResponse.json({ message: 'Xoá ưu đãi thành công' });
    } catch (error) {
      console.error('[DELETE /api/promotions/[id]]', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  })(req);
}
