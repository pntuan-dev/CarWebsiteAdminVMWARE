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
  segment: z.enum(['urban', 'suv', 'luxury', 'commercial'], {
    errorMap: () => ({ message: 'Phân khúc xe không hợp lệ' }),
  }),
  segmentLabel: z.string().min(1, 'Nhãn phân khúc không được để trống'),
  tagline: z.string().min(1, 'Khẩu hiệu xe không được để trống'),
  description: z.string().min(1, 'Mô tả không được để trống'),
  priceWithBattery: z.number().int().positive('Giá kèm pin phải lớn hơn 0'),
  priceWithoutBattery: z.number().int().positive('Giá không kèm pin phải lớn hơn 0'),
  batteryRentMonthly: z.number().int().min(0, 'Giá thuê pin không được âm').nullable().optional(),
  rangePerCharge: z.string().min(1, 'Quãng đường di chuyển không được để trống'),
  maxPower: z.string().min(1, 'Công suất tối đa không được để trống'),
  maxTorque: z.string().min(1, 'Mô-men xoắn không được để trống'),
  topSpeed: z.string().min(1, 'Tốc độ tối đa không được để trống'),
  seats: z.number().int().positive('Số chỗ ngồi phải lớn hơn 0'),
  airbags: z.number().int().min(0, 'Số túi khí không được âm'),
  fastChargingTime: z.string().min(1, 'Thời gian sạc nhanh không được để trống'),
  dimensions: z.string().min(1, 'Kích thước không được để trống'),
  wheelbase: z.string().min(1, 'Chiều dài cơ sở không được để trống'),
  imageUrl: z.string().url('URL ảnh xe không hợp lệ'),
  badge: z.string().nullable().optional(),
  features: z.array(z.string()).min(1, 'Cần ít nhất 1 tính năng nổi bật'),
  depositUrl: z.string().url('Link đặt cọc không hợp lệ'),
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
