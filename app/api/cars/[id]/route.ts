// API Route: GET /api/cars/[id]   — Chi tiết xe (public)
//           PUT /api/cars/[id]   — Cập nhật xe (JWT)
//           DELETE /api/cars/[id] — Xoá xe (JWT)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';
import { z } from 'zod';

type RouteParams = { params: Promise<{ id: string }> };

const updateCarSchema = z.object({
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  segment: z.enum(['urban', 'suv', 'luxury', 'commercial']).optional(),
  segmentLabel: z.string().optional(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  priceWithBattery: z.number().int().positive().optional(),
  priceWithoutBattery: z.number().int().positive().optional(),
  batteryRentMonthly: z.number().int().min(0).nullable().optional(),
  rangePerCharge: z.string().optional(),
  maxPower: z.string().optional(),
  maxTorque: z.string().optional(),
  topSpeed: z.string().optional(),
  seats: z.number().int().positive().optional(),
  airbags: z.number().int().min(0).optional(),
  fastChargingTime: z.string().optional(),
  dimensions: z.string().optional(),
  wheelbase: z.string().optional(),
  imageUrl: z.string().url().optional(),
  badge: z.string().nullable().optional(),
  features: z.array(z.string()).optional(),
  depositUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

// GET /api/cars/[id] - Công khai (có thể dùng slug hoặc id)
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Tìm theo id hoặc slug
    const car = await prisma.car.findFirst({
      where: { OR: [{ id }, { slug: id }] },
    });

    if (!car) {
      return NextResponse.json({ error: 'Not Found', message: 'Xe không tồn tại' }, { status: 404 });
    }

    return NextResponse.json({ data: car });
  } catch (error) {
    console.error('[GET /api/cars/[id]]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/cars/[id] - Cần JWT
export async function PUT(req: NextRequest, { params }: RouteParams) {
  return withAuth(async (authReq) => {
    try {
      const { id } = await params;
      const body = await authReq.json();
      const parsed = updateCarSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Validation Error', message: parsed.error.errors[0].message },
          { status: 400 }
        );
      }

      const car = await prisma.car.findUnique({ where: { id } });
      if (!car) {
        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
      }

      const updated = await prisma.car.update({ where: { id }, data: parsed.data });
      return NextResponse.json({ data: updated, message: 'Cập nhật thành công' });
    } catch (error) {
      console.error('[PUT /api/cars/[id]]', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  })(req);
}

// DELETE /api/cars/[id] - Cần JWT
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  return withAuth(async () => {
    try {
      const { id } = await params;

      const car = await prisma.car.findUnique({ where: { id } });
      if (!car) {
        return NextResponse.json({ error: 'Not Found' }, { status: 404 });
      }

      // Lưu ý: việc xoá ảnh MinIO thực hiện riêng qua DELETE /api/upload
      await prisma.car.delete({ where: { id } });
      return NextResponse.json({ data: { imageUrl: car.imageUrl }, message: 'Xoá xe thành công' });
    } catch (error) {
      console.error('[DELETE /api/cars/[id]]', error);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  })(req);
}
