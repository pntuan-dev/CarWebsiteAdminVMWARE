import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';
import { logApi } from '@/lib/logger';
import { z } from 'zod';

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  iconName: z.string().min(1),
  imageUrl: z.string().url(),
  actionText: z.string().min(1),
  actionLink: z.string().min(1),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const activeOnly = searchParams.get('activeOnly') !== 'false';
  const input = { activeOnly };

  try {
    const items = await prisma.ecosystemItem.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    const resData = { data: items, total: items.length };
    await logApi('GET /api/ecosystem', input, { total: items.length });
    return NextResponse.json(resData);
  } catch (error) {
    console.error('[GET /api/ecosystem]', error);
    await logApi('GET /api/ecosystem', input, { error: String(error) });
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
      await logApi('POST /api/ecosystem', body, resData);
      return NextResponse.json(resData, { status: 400 });
    }
    const item = await prisma.ecosystemItem.create({ data: parsed.data });
    const resData = { data: item, message: 'Tạo thành công' };
    await logApi('POST /api/ecosystem', body, resData);
    return NextResponse.json(resData, { status: 201 });
  } catch (error) {
    console.error('[POST /api/ecosystem]', error);
    await logApi('POST /api/ecosystem', body, { error: String(error) });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
