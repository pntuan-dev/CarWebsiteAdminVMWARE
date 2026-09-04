// API Route: GET /api/banners — Danh sách banner (public)
//           POST /api/banners — Tạo banner mới (JWT)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';
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
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    const banners = await prisma.banner.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json({ data: banners, total: banners.length });
  } catch (error) {
    console.error('[GET /api/banners]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const POST = withAuth(async (req) => {
  try {
    const body = await req.json();
    const parsed = createBannerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation Error', message: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const banner = await prisma.banner.create({ data: parsed.data });
    return NextResponse.json({ data: banner, message: 'Tạo banner thành công' }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/banners]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
