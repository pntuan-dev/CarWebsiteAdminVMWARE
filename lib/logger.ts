// Hệ thống Logger VinFast Admin: Ghi đồng thời ra file log và Database (SystemLog)
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';

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

/**
 * Định dạng thời gian theo chuẩn: [hh/mm/ss dd/mm/yyyy]
 */
export function getFormattedTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');

  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());
  const day = pad(now.getDate());
  const month = pad(now.getMonth() + 1);
  const year = now.getFullYear();

  return `[${hours}/${minutes}/${seconds} ${day}/${month}/${year}]`;
}

/**
 * Che giấu thông tin nhạy cảm (password, token,...) trước khi ghi log
 */
function maskSensitiveData(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(maskSensitiveData);

  const clone: Record<string, unknown> = { ...(data as Record<string, unknown>) };
  const sensitiveKeys = ['password', 'passwordHash', 'token', 'secret', 'MINIO_SECRET_KEY'];

  for (const key of Object.keys(clone)) {
    if (sensitiveKeys.includes(key) && typeof clone[key] === 'string') {
      clone[key] = '******';
    } else if (typeof clone[key] === 'object' && clone[key] !== null) {
      clone[key] = maskSensitiveData(clone[key]);
    }
  }

  return clone;
}

/**
 * Function chung ghi log cho mọi API theo mẫu:
 * [hh/mm/ss dd/mm/yyyy] API - input - output
 */
export async function logApi(api: string, input: unknown, output: unknown): Promise<void> {
  const timestamp = getFormattedTimestamp();
  const safeInput = maskSensitiveData(input);
  const safeOutput = maskSensitiveData(output);

  const inputStr = typeof safeInput === 'string' ? safeInput : JSON.stringify(safeInput ?? null);
  const outputStr = typeof safeOutput === 'string' ? safeOutput : JSON.stringify(safeOutput ?? null);

  const logLine = `${timestamp} ${api} - ${inputStr} - ${outputStr}`;

  // 1. Ghi vào logs/system.txt
  appendToTxtLog('system.txt', logLine);

  // 2. Ghi ra Console
  console.log(logLine);

  // 3. Ghi vào Database SystemLog
  try {
    const jsonMetadata = JSON.parse(
      JSON.stringify({
        api,
        input: safeInput,
        output: safeOutput,
      })
    );

    await prisma.systemLog.create({
      data: {
        level: 'INFO',
        category: 'SYSTEM',
        message: `${api} - ${inputStr} - ${outputStr}`,
        metadata: jsonMetadata,
      },
    });
  } catch (err) {
    console.error('[logApi] Lỗi ghi DB log:', err);
  }
}
