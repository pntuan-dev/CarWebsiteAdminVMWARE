// Middleware helper: Xác thực JWT cho API routes

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, extractTokenFromHeader, JwtPayload } from './auth';

/**
 * Bọc API handler với JWT auth guard
 * Trả về 401 nếu token không hợp lệ
 */
export function withAuth(
  handler: (req: NextRequest, user: JwtPayload) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const token = extractTokenFromHeader(req.headers.get('Authorization'));
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Token không tồn tại' }, { status: 401 });
    }

    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized', message: 'Token không hợp lệ hoặc đã hết hạn' }, { status: 401 });
    }

    return handler(req, user);
  };
}
