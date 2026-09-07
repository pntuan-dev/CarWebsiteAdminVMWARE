import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';
import { logApi } from '@/lib/logger';
import { z } from 'zod';

const createSchema = z.object({
  title: z.string().min(1),
  highlight: z.string().min(1),
  description: z.string().min(1),
  tag: z.string().min(1),
  validUntil: z.string().min(1),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const activeOnly = searchParams.get('activeOnly') !== 'false';
  const input = { activeOnly };

  try {
    const promos = await prisma.promotion.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    const resData = { data: promos, total: promos.length };
    await logApi('GET /api/promotions', input, { total: promos.length });
    return NextResponse.json(resData);
  } catch (error) {
    console.error('[GET /api/promotions]', error);
    await logApi('GET /api/promotions', input, { error: String(error) });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const POST = withAuth(async (req) => {
  let body: unknown;
  try {
    body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      const resData = { error: 'Validation Error', message: parsed.error.errors[0].message };
      await logApi('POST /api/promotions', body, resData);
      return NextResponse.json(resData, { status: 400 });
    }
    const promo = await prisma.promotion.create({ data: parsed.data });
    const resData = { data: promo, message: 'Tạo ưu đãi thành công' };
    await logApi('POST /api/promotions', body, resData);
    return NextResponse.json(resData, { status: 201 });
  } catch (error) {
    console.error('[POST /api/promotions]', error);
    await logApi('POST /api/promotions', body, { error: String(error) });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
