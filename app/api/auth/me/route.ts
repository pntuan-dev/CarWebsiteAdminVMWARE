// API Route: POST /api/auth/me
// Lấy thông tin user hiện tại từ JWT token

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { extractTokenFromHeader, verifyToken } from '@/lib/auth';
import { logApi } from '@/lib/logger';

export async function GET(req: NextRequest) {
  try {
    const token = extractTokenFromHeader(req.headers.get('Authorization'));
    if (!token) {
      const resData = { error: 'Unauthorized' };
      await logApi('GET /api/auth/me', null, resData);
      return NextResponse.json(resData, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      const resData = { error: 'Unauthorized', message: 'Token không hợp lệ' };
      await logApi('GET /api/auth/me', null, resData);
      return NextResponse.json(resData, { status: 401 });
    }

    const user = await prisma.adminUser.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    if (!user) {
      const resData = { error: 'Not Found', message: 'User không tồn tại' };
      await logApi('GET /api/auth/me', { userId: payload.userId }, resData);
      return NextResponse.json(resData, { status: 404 });
    }

    const resData = { data: user };
    await logApi('GET /api/auth/me', { userId: payload.userId }, { email: user.email, role: user.role });
    return NextResponse.json(resData);
  } catch (error) {
    console.error('[GET /api/auth/me]', error);
    await logApi('GET /api/auth/me', null, { error: String(error) });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
