// API Route: POST /api/auth/login
// Đăng nhập admin, trả về JWT token

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';
import { logApi } from '@/lib/logger';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      const resData = { error: 'Validation Error', message: parsed.error.errors[0].message };
      await logApi('POST /api/auth/login', body, resData);
      return NextResponse.json(resData, { status: 400 });
    }

    const { email, password } = parsed.data;

    // Tìm admin user trong DB
    const user = await prisma.adminUser.findUnique({ where: { email } });
    if (!user) {
      const resData = { error: 'Unauthorized', message: 'Email hoặc mật khẩu không đúng' };
      await logApi('POST /api/auth/login', body, resData);
      return NextResponse.json(resData, { status: 401 });
    }

    // Kiểm tra mật khẩu
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      const resData = { error: 'Unauthorized', message: 'Email hoặc mật khẩu không đúng' };
      await logApi('POST /api/auth/login', body, resData);
      return NextResponse.json(resData, { status: 401 });
    }

    // Tạo JWT token
    const token = signToken({ userId: user.id, email: user.email, role: user.role });

    const resData = {
      data: {
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
      },
      message: 'Đăng nhập thành công',
    };

    await logApi('POST /api/auth/login', body, resData);
    return NextResponse.json(resData);
  } catch (error) {
    console.error('[POST /api/auth/login]', error);
    const resData = { error: 'Internal Server Error' };
    await logApi('POST /api/auth/login', body, { error: String(error) });
    return NextResponse.json(resData, { status: 500 });
  }
}
