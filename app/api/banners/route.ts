// API Route: GET /api/banners — Danh sách banner (public)
//           POST /api/banners — Tạo banner mới (JWT)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';
import { logApi } from '@/lib/logger';
import { z } from 'zod';

const createBannerSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().min(1),
  description: z.string().min(1),
  ctaText: z.string().min(1),
  ctaLink: z.string().min(1),
  secondaryCtaText: z.string().optional(),
  secondaryCtaLink: z.string().optional(),
  carImageUrl: z.string().url(),
  badge: z.string().optional(),
  price: z.string().optional(),
  specs: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const activeOnly = searchParams.get('activeOnly') !== 'false';
  const input = { activeOnly };

  try {
    const banners = await prisma.banner.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    const resData = { data: banners, total: banners.length };
    await logApi('GET /api/banners', input, { total: banners.length });
    return NextResponse.json(resData);
  } catch (error) {
    console.error('[GET /api/banners]', error);
    await logApi('GET /api/banners', input, { error: String(error) });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const POST = withAuth(async (req) => {
  let body: unknown;
  try {
    body = await req.json();
    const parsed = createBannerSchema.safeParse(body);

    if (!parsed.success) {
      const resData = { error: 'Validation Error', message: parsed.error.errors[0].message };
      await logApi('POST /api/banners', body, resData);
      return NextResponse.json(resData, { status: 400 });
    }

    const banner = await prisma.banner.create({ data: parsed.data });
    const resData = { data: banner, message: 'Tạo banner thành công' };
    await logApi('POST /api/banners', body, resData);
    return NextResponse.json(resData, { status: 201 });
  } catch (error) {
    console.error('[POST /api/banners]', error);
    await logApi('POST /api/banners', body, { error: String(error) });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
