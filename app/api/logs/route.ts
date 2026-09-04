// API Route: GET /api/logs — Lấy danh sách nhật ký hệ thống
//           DELETE /api/logs — Xóa nhật ký hệ thống (yêu cầu Auth)

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth } from '@/lib/middleware';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const level = searchParams.get('level');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');
    const skip = (page - 1) * limit;

    const where: { level?: string; category?: string } = {};
    if (level && level !== 'ALL') where.level = level;
    if (category && category !== 'ALL') where.category = category;

    const [logs, total, stats] = await Promise.all([
      prisma.systemLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.systemLog.count({ where }),
      prisma.systemLog.groupBy({
        by: ['level'],
        _count: { level: true },
      }),
    ]);

    const statCounts = {
      INFO: 0,
      SUCCESS: 0,
      WARN: 0,
      ERROR: 0,
    };

    for (const item of stats) {
      if (item.level in statCounts) {
        statCounts[item.level as keyof typeof statCounts] = item._count.level;
      }
    }

    const logFilePath = path.resolve(process.cwd(), 'logs', 'system.log');

    return NextResponse.json({
      data: logs,
      total,
      page,
      limit,
      stats: statCounts,
      logFilePath,
    });
  } catch (error) {
    console.error('[GET /api/logs]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export const DELETE = withAuth(async () => {
  try {
    await prisma.systemLog.deleteMany({});

    const logFilePath = path.resolve(process.cwd(), 'logs', 'system.log');
    if (fs.existsSync(logFilePath)) {
      fs.writeFileSync(logFilePath, '', 'utf8');
    }

    return NextResponse.json({ message: 'Đã xóa toàn bộ nhật ký hệ thống' });
  } catch (error) {
    console.error('[DELETE /api/logs]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
});
