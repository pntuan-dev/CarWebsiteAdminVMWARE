// API Route: GET /api/logs/raw — Trả về nội dung file log dạng text/plain để xem trực tiếp trên browser
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fileName = searchParams.get('file') || 'migration.txt';

    // Bảo vệ path traversal
    const safeFileName = path.basename(fileName);
    const filePath = path.resolve(process.cwd(), 'logs', safeFileName);

    if (!fs.existsSync(filePath)) {
      return new NextResponse(`File log "${safeFileName}" chưa được tạo hoặc chưa có dữ liệu ghi nhận.\nĐường dẫn: ${filePath}`, {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    const content = fs.readFileSync(filePath, 'utf8');

    return new NextResponse(content || '--- File log hiện tại đang trống ---', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error('[GET /api/logs/raw]', error);
    return new NextResponse('Lỗi khi đọc file log', { status: 500 });
  }
}
