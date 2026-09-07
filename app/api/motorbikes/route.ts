// API Route: GET /api/motorbikes — Danh sách xe máy (public)
//           POST /api/motorbikes — Tạo mới (JWT)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';
import { logApi } from '@/lib/logger';
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
  const { searchParams } = new URL(req.url);
  const activeOnly = searchParams.get('activeOnly') !== 'false';
  const input = { activeOnly };

  try {
    const bikes = await prisma.motorbike.findMany({
      where: activeOnly ? { isActive: true } : {},
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    const resData = { data: bikes, total: bikes.length };
    await logApi('GET /api/motorbikes', input, { total: bikes.length });
    return NextResponse.json(resData);
  } catch (error) {
    console.error('[GET /api/motorbikes]', error);
    await logApi('GET /api/motorbikes', input, { error: String(error) });
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
      await logApi('POST /api/motorbikes', body, resData);
      return NextResponse.json(resData, { status: 400 });
    }
    const existing = await prisma.motorbike.findUnique({ where: { slug: parsed.data.slug } });
    if (existing) {
      const resData = { error: 'Conflict', message: 'Slug đã tồn tại' };
      await logApi('POST /api/motorbikes', body, resData);
      return NextResponse.json(resData, { status: 409 });
    }
    const bike = await prisma.motorbike.create({ data: parsed.data });
    const resData = { data: bike, message: 'Tạo xe máy thành công' };
    await logApi('POST /api/motorbikes', body, resData);
    return NextResponse.json(resData, { status: 201 });
  } catch (error) {
    console.error('[POST /api/motorbikes]', error);
    await logApi('POST /api/motorbikes', body, { error: String(error) });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
