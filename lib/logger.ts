// Hệ thống Logger VinFast Admin: Ghi đồng thời ra file log và Database (SystemLog)
import fs from 'fs';
import path from 'path';
import { prisma } from './prisma';

export type LogLevel = 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR';
export type LogCategory =
  | 'MIGRATION'
  | 'UPLOAD'
  | 'AUTH'
  | 'CAR'
  | 'MOTORBIKE'
  | 'BANNER'
  | 'ECOSYSTEM'
  | 'PROMOTION'
  | 'SYSTEM';

const LOG_DIR = path.resolve(process.cwd(), 'logs');
const LOG_FILE = path.join(LOG_DIR, 'system.txt');
const MIGRATION_LOG_FILE = path.join(LOG_DIR, 'migration.txt');

export function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

export function appendToTxtLog(filename: string, content: string) {
  try {
    ensureLogDir();
    const target = path.join(LOG_DIR, filename);
    fs.appendFileSync(target, content + '\n', 'utf8');
  } catch (err) {
    console.error(`[Logger] Lỗi ghi file ${filename}:`, err);
  }
}

export async function writeLog(
  level: LogLevel,
  category: LogCategory,
  message: string,
  metadata?: Record<string, unknown>
) {
  const d = new Date();
  const dateStr = d.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const timeStr = d.toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const formattedDate = `${dateStr} ${timeStr}`;

  const metaStr = metadata ? ` | Chi tiết: ${JSON.stringify(metadata)}` : '';
  const logLine = `[${formattedDate}] [${level}] [${category}] ${message}${metaStr}`;

  // 1. Ghi ra file logs/system.txt
  appendToTxtLog('system.txt', logLine);

  // Nếu là MIGRATION thì ghi thêm vào logs/migration.txt
  if (category === 'MIGRATION') {
    appendToTxtLog('migration.txt', logLine);
  }

  // 2. Ghi ra Console
  console.log(`[${level}] [${category}] ${message}`);

  // 3. Ghi vào Database SystemLog
  try {
    await prisma.systemLog.create({
      data: {
        level,
        category,
        message,
        metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
      },
    });
  } catch (err) {
    console.error('[Logger] Lỗi ghi DB log:', err);
  }
}

export const logger = {
  info: (category: LogCategory, message: string, metadata?: Record<string, unknown>) =>
    writeLog('INFO', category, message, metadata),
  success: (category: LogCategory, message: string, metadata?: Record<string, unknown>) =>
    writeLog('SUCCESS', category, message, metadata),
  warn: (category: LogCategory, message: string, metadata?: Record<string, unknown>) =>
    writeLog('WARN', category, message, metadata),
  error: (category: LogCategory, message: string, metadata?: Record<string, unknown>) =>
    writeLog('ERROR', category, message, metadata),
};
