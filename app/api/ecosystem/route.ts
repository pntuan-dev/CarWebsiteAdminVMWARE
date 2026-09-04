// API Route: GET /api/ecosystem + POST
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';
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
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('activeOnly') !== 'false';
    const items = await prisma.ecosystemItem.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return NextResponse.json({ data: items, total: items.length });
  } catch (error) {
    console.error('[GET /api/ecosystem]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const POST = withAuth(async (req) => {
  try {
    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validation Error', message: parsed.error.errors[0].message }, { status: 400 });
    }
    const item = await prisma.ecosystemItem.create({ data: parsed.data });
    return NextResponse.json({ data: item, message: 'Tạo thành công' }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/ecosystem]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
