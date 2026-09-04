// API Route: GET /api/cars — Lấy danh sách ô tô
//           POST /api/cars — Tạo xe mới (yêu cầu JWT)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';
import { z } from 'zod';

// Schema tạo xe mới
const createCarSchema = z.object({
  name: z.string().min(1, 'Tên xe không được để trống'),
  slug: z.string().min(1, 'Slug không được để trống'),
  segment: z.enum(['urban', 'suv', 'luxury', 'commercial']),
  segmentLabel: z.string().min(1),
  tagline: z.string().min(1),
  description: z.string().min(1),
  priceWithBattery: z.number().int().positive(),
  priceWithoutBattery: z.number().int().positive(),
  batteryRentMonthly: z.number().int().positive().optional(),
  rangePerCharge: z.string().min(1),
  maxPower: z.string().min(1),
  maxTorque: z.string().min(1),
  topSpeed: z.string().min(1),
  seats: z.number().int().positive(),
  airbags: z.number().int().min(0),
  fastChargingTime: z.string().min(1),
  dimensions: z.string().min(1),
  wheelbase: z.string().min(1),
  imageUrl: z.string().url('URL ảnh không hợp lệ'),
  badge: z.string().optional(),
  features: z.array(z.string()).min(1, 'Cần ít nhất 1 tính năng'),
  depositUrl: z.string().url(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

// GET /api/cars - Công khai, Landing Page dùng
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const segment = searchParams.get('segment');
    const activeOnly = searchParams.get('activeOnly') !== 'false';

    const where = {
      ...(activeOnly ? { isActive: true } : {}),
      ...(segment && segment !== 'all' ? { segment } : {}),
    };

    const cars = await prisma.car.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json({ data: cars, total: cars.length });
  } catch (error) {
    console.error('[GET /api/cars]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/cars - Cần JWT
export const POST = withAuth(async (req) => {
  try {
    const body = await req.json();
    const parsed = createCarSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation Error', message: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    // Kiểm tra slug trùng
    const existing = await prisma.car.findUnique({ where: { slug: parsed.data.slug } });
    if (existing) {
      return NextResponse.json(
        { error: 'Conflict', message: 'Slug đã tồn tại' },
        { status: 409 }
      );
    }

    const car = await prisma.car.create({ data: parsed.data });

    return NextResponse.json({ data: car, message: 'Tạo xe thành công' }, { status: 201 });
  } catch (error) {
    console.error('[POST /api/cars]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
