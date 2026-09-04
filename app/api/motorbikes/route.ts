// API Route: GET /api/motorbikes — Danh sách xe máy (public)
//           POST /api/motorbikes — Tạo mới (JWT)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';
import { z } from 'zod';

const createSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  price: z.number().int().positive(),
  rangePerCharge: z.string().min(1),
  topSpeed: z.string().min(1),
  batteryType: z.string().min(1),
  chargingTime: z.string().min(1),
  trunkCapacity: z.string().min(1),
  imageUrl: z.string().url(),
  tagline: z.string().min(1),
  badge: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get('activeOnly') !== 'false';
    const bikes = await prisma.motorbike.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return NextResponse.json({ data: bikes, total: bikes.length });
  } catch (error) {
    console.error('[GET /api/motorbikes]', error);
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
    const existing = await prisma.motorbike.findUnique({ where: { slug: parsed.data.slug } });
    if (existing) return NextResponse.json({ error: 'Conflict', message: 'Slug đã tồn tại' }, { status: 409 });
    const bike = await prisma.motorbike.create({ data: parsed.data });
    return NextResponse.json({ data: bike, message: 'Tạo xe máy thành công' }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/motorbikes]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
