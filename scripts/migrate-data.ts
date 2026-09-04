/**
 * Script migrate dữ liệu từ vinfast.json → PostgreSQL + MinIO
 * Tự động ghi nhật ký vào file txt: logs/migration.txt
 *
 * Cách chạy:
 *   npx ts-node -r tsconfig-paths/register scripts/migrate-data.ts
 *   npx ts-node -r tsconfig-paths/register scripts/migrate-data.ts --dry-run
 *   npx ts-node -r tsconfig-paths/register scripts/migrate-data.ts --skip-minio
 */

import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import {
  S3Client,
  PutObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
} from '@aws-sdk/client-s3';

// ─── Config ──────────────────────────────────────────────────────────────────

const IS_DRY_RUN = process.argv.includes('--dry-run');
const SKIP_MINIO = process.argv.includes('--skip-minio');

// Ưu tiên đọc từ thư mục nội bộ của BE vừa copy
const IMAGES_DIR = fs.existsSync(path.resolve(process.cwd(), 'public/images/vinfast'))
  ? path.resolve(process.cwd(), 'public/images/vinfast')
  : path.resolve(process.cwd(), '../CarWebsiteVMWARE/public/images/vinfast');

const DATA_FILE = fs.existsSync(path.resolve(process.cwd(), 'data/vinfast.json'))
  ? path.resolve(process.cwd(), 'data/vinfast.json')
  : path.resolve(process.cwd(), '../CarWebsiteVMWARE/src/data/vinfast.json');

const LOGS_DIR = path.resolve(process.cwd(), 'logs');
const TXT_LOG_FILE = path.join(LOGS_DIR, 'migration.txt');

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT ?? '192.168.247.130';
const MINIO_PORT = parseInt(process.env.MINIO_PORT ?? '9000');
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY ?? 'minioadmin';
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY ?? 'minioadmin';
const MINIO_BUCKET = process.env.MINIO_BUCKET ?? 'websitecar';
const MINIO_PUBLIC_URL = process.env.MINIO_PUBLIC_URL ?? `http://${MINIO_ENDPOINT}:${MINIO_PORT}/${MINIO_BUCKET}`;

const prisma = new PrismaClient();

const s3 = new S3Client({
  endpoint: `http://${MINIO_ENDPOINT}:${MINIO_PORT}`,
  region: 'ap-southeast-1',
  credentials: { accessKeyId: MINIO_ACCESS_KEY, secretAccessKey: MINIO_SECRET_KEY },
  forcePathStyle: true,
});

// ─── Loggers ─────────────────────────────────────────────────────────────────

function ensureLogDir() {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
}

function writeTxtLog(message: string, level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR' = 'INFO') {
  ensureLogDir();
  const d = new Date();
  const dateStr = d.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const timeStr = d.toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const logLine = `[${dateStr} ${timeStr}] [${level}] ${message}`;

  fs.appendFileSync(TXT_LOG_FILE, logLine + '\n', 'utf8');
  console.log(`  ${logLine}`);

  // Lưu song song vào DB nếu không phải dry-run
  if (!IS_DRY_RUN) {
    prisma.systemLog.create({
      data: {
        level,
        category: 'MIGRATION',
        message,
      },
    }).catch(() => {});
  }
}

function logSection(title: string) {
  const line = '═'.repeat(70);
  ensureLogDir();
  fs.appendFileSync(TXT_LOG_FILE, `\n${line}\n  ${title}\n${line}\n`, 'utf8');
  console.log(`\n${line}\n  ${title}\n${line}`);
}

function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const map: Record<string, string> = {
    webp: 'image/webp',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    svg: 'image/svg+xml',
  };
  return map[ext] ?? 'application/octet-stream';
}

// ─── Step 1: Bucket MinIO ───────────────────────────────────────────────────

async function ensureBucket(): Promise<void> {
  logSection('BƯỚC 1: Kiểm tra Bucket MinIO');
  writeTxtLog(`Kết nối MinIO tại ${MINIO_ENDPOINT}:${MINIO_PORT}, kiểm tra bucket "${MINIO_BUCKET}"...`, 'INFO');

  if (IS_DRY_RUN) {
    writeTxtLog(`[DRY-RUN] Giả lập kiểm tra bucket "${MINIO_BUCKET}"`, 'INFO');
    return;
  }

  try {
    await s3.send(new HeadBucketCommand({ Bucket: MINIO_BUCKET }));
    writeTxtLog(`Bucket "${MINIO_BUCKET}" đã tồn tại và sẵn sàng`, 'SUCCESS');
  } catch {
    writeTxtLog(`Bucket "${MINIO_BUCKET}" chưa có, tiến hành tạo mới...`, 'INFO');
    try {
      await s3.send(new CreateBucketCommand({ Bucket: MINIO_BUCKET }));
      writeTxtLog(`Tạo bucket "${MINIO_BUCKET}" thành công`, 'SUCCESS');

      const policy = JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: '*',
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${MINIO_BUCKET}/*`],
          },
        ],
      });
      await s3.send(new PutBucketPolicyCommand({ Bucket: MINIO_BUCKET, Policy: policy }));
      writeTxtLog(`Đã cấp quyền truy cập công khai (Read-Only) cho bucket "${MINIO_BUCKET}"`, 'SUCCESS');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      writeTxtLog(`Lỗi tạo bucket: ${msg}`, 'ERROR');
      throw err;
    }
  }
}

// ─── Step 2: Upload Ảnh lên MinIO ──────────────────────────────────────────

async function uploadImages(): Promise<Map<string, string>> {
  logSection('BƯỚC 2: Quét và Upload Hình Ảnh lên MinIO');
  writeTxtLog(`Đọc thư mục ảnh: ${IMAGES_DIR}`, 'INFO');

  const urlMap = new Map<string, string>();

  const scanDir = (dir: string, prefix: string = '') => {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        scanDir(fullPath, relativePath);
      } else if (/\.(webp|png|jpg|jpeg|svg)$/i.test(entry.name)) {
        const localWebPath = `/images/vinfast/${relativePath}`;
        const minioKey = relativePath.replace(/\\/g, '/');
        const minioUrl = `${MINIO_PUBLIC_URL}/${minioKey}`;
        urlMap.set(localWebPath, minioUrl);
      }
    }
  };

  scanDir(IMAGES_DIR);
  writeTxtLog(`Tìm thấy ${urlMap.size} file hình ảnh hợp lệ`, 'INFO');

  if (IS_DRY_RUN) {
    for (const [local, minio] of urlMap) {
      writeTxtLog(`[DRY-RUN] Sẽ upload: ${local} → ${minio}`, 'INFO');
    }
    return urlMap;
  }

  let successCount = 0;
  let errorCount = 0;

  const uploadDir = (dir: string, prefix: string = ''): Promise<void>[] => {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const tasks: Promise<void>[] = [];

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
      const s3Key = relativePath.replace(/\\/g, '/');

      if (entry.isDirectory()) {
        tasks.push(...uploadDir(fullPath, relativePath));
      } else if (/\.(webp|png|jpg|jpeg|svg)$/i.test(entry.name)) {
        const task = (async () => {
          try {
            const fileBuffer = fs.readFileSync(fullPath);
            await s3.send(
              new PutObjectCommand({
                Bucket: MINIO_BUCKET,
                Key: s3Key,
                Body: fileBuffer,
                ContentType: getMimeType(entry.name),
              })
            );
            successCount++;
            writeTxtLog(`Upload thành công: ${s3Key} → ${MINIO_PUBLIC_URL}/${s3Key}`, 'SUCCESS');
          } catch (err: unknown) {
            errorCount++;
            const msg = err instanceof Error ? err.message : String(err);
            writeTxtLog(`Lỗi upload ảnh ${s3Key}: ${msg}`, 'ERROR');
          }
        })();
        tasks.push(task);
      }
    }
    return tasks;
  };

  const tasks = uploadDir(IMAGES_DIR);
  await Promise.all(tasks);

  writeTxtLog(`Hoàn tất upload: ${successCount} ảnh thành công, ${errorCount} ảnh thất bại`, successCount > 0 ? 'SUCCESS' : 'WARN');
  return urlMap;
}

// ─── Step 3: Seed & Update Database ─────────────────────────────────────────

async function seedDatabase(urlMap: Map<string, string>): Promise<void> {
  logSection('BƯỚC 3: Cập Nhật & Seed Dữ Liệu vào PostgreSQL');
  writeTxtLog(`Đọc file dữ liệu: ${DATA_FILE}`, 'INFO');

  if (!fs.existsSync(DATA_FILE)) {
    writeTxtLog(`Không tìm thấy file ${DATA_FILE}`, 'ERROR');
    return;
  }

  const raw = fs.readFileSync(DATA_FILE, 'utf8');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = JSON.parse(raw);

  const mapUrl = (localPath: string): string => {
    if (!localPath) return '';
    if (localPath.startsWith('http')) return localPath;
    const found = urlMap.get(localPath);
    if (found) return found;
    const clean = localPath.replace('/images/vinfast/', '');
    return `${MINIO_PUBLIC_URL}/${clean}`;
  };

  // 1. Ô tô
  writeTxtLog(`Bắt đầu đồng bộ ${data.cars.length} mẫu Ô tô điện...`, 'INFO');
  let carIdx = 0;
  for (const car of data.cars) {
    const imageUrl = mapUrl(car.image);
    if (!IS_DRY_RUN) {
      await prisma.car.upsert({
        where: { slug: car.slug },
        update: {
          name: car.name,
          segment: car.segment,
          segmentLabel: car.segmentLabel,
          tagline: car.tagline,
          description: car.description,
          priceWithBattery: car.priceWithBattery,
          priceWithoutBattery: car.priceWithoutBattery,
          batteryRentMonthly: car.batteryRentMonthly ?? null,
          rangePerCharge: car.rangePerCharge,
          maxPower: car.maxPower,
          maxTorque: car.maxTorque,
          topSpeed: car.topSpeed,
          seats: car.seats,
          airbags: car.airbags,
          fastChargingTime: car.fastChargingTime,
          dimensions: car.dimensions,
          wheelbase: car.wheelbase,
          imageUrl,
          badge: car.badge ?? null,
          features: car.features ?? [],
          depositUrl: car.depositUrl,
          sortOrder: carIdx,
        },
        create: {
          name: car.name,
          slug: car.slug,
          segment: car.segment,
          segmentLabel: car.segmentLabel,
          tagline: car.tagline,
          description: car.description,
          priceWithBattery: car.priceWithBattery,
          priceWithoutBattery: car.priceWithoutBattery,
          batteryRentMonthly: car.batteryRentMonthly ?? null,
          rangePerCharge: car.rangePerCharge,
          maxPower: car.maxPower,
          maxTorque: car.maxTorque,
          topSpeed: car.topSpeed,
          seats: car.seats,
          airbags: car.airbags,
          fastChargingTime: car.fastChargingTime,
          dimensions: car.dimensions,
          wheelbase: car.wheelbase,
          imageUrl,
          badge: car.badge ?? null,
          features: car.features ?? [],
          depositUrl: car.depositUrl,
          sortOrder: carIdx,
        },
      });
    }
    writeTxtLog(`[Car ${carIdx + 1}/${data.cars.length}] ${car.name} (${car.slug}) → ${imageUrl}`, 'SUCCESS');
    carIdx++;
  }

  // 2. Xe máy
  writeTxtLog(`Bắt đầu đồng bộ ${data.motorbikes.length} mẫu Xe máy điện...`, 'INFO');
  let bikeIdx = 0;
  for (const bike of data.motorbikes) {
    const imageUrl = mapUrl(bike.image);
    if (!IS_DRY_RUN) {
      await prisma.motorbike.upsert({
        where: { slug: bike.slug },
        update: {
          name: bike.name,
          price: bike.price,
          rangePerCharge: bike.rangePerCharge,
          topSpeed: bike.topSpeed,
          batteryType: bike.batteryType,
          chargingTime: bike.chargingTime,
          trunkCapacity: bike.trunkCapacity,
          imageUrl,
          tagline: bike.tagline,
          badge: bike.badge ?? null,
          sortOrder: bikeIdx,
        },
        create: {
          name: bike.name,
          slug: bike.slug,
          price: bike.price,
          rangePerCharge: bike.rangePerCharge,
          topSpeed: bike.topSpeed,
          batteryType: bike.batteryType,
          chargingTime: bike.chargingTime,
          trunkCapacity: bike.trunkCapacity,
          imageUrl,
          tagline: bike.tagline,
          badge: bike.badge ?? null,
          sortOrder: bikeIdx,
        },
      });
    }
    writeTxtLog(`[Bike ${bikeIdx + 1}/${data.motorbikes.length}] ${bike.name} (${bike.slug}) → ${imageUrl}`, 'SUCCESS');
    bikeIdx++;
  }

  // 3. Banner
  writeTxtLog(`Bắt đầu đồng bộ ${data.banners.length} Banner slider...`, 'INFO');
  let bannerIdx = 0;
  for (const banner of data.banners) {
    const carImageUrl = mapUrl(banner.carImage);
    if (!IS_DRY_RUN) {
      const existing = await prisma.banner.findFirst({ where: { title: banner.title } });
      if (existing) {
        await prisma.banner.update({
          where: { id: existing.id },
          data: {
            title: banner.title,
            subtitle: banner.subtitle,
            description: banner.description,
            ctaText: banner.ctaText,
            ctaLink: banner.ctaLink,
            secondaryCtaText: banner.secondaryCtaText ?? null,
            secondaryCtaLink: banner.secondaryCtaLink ?? null,
            carImageUrl,
            badge: banner.badge ?? null,
            price: banner.price ?? null,
            specs: banner.specs ?? [],
            sortOrder: bannerIdx,
          },
        });
      } else {
        await prisma.banner.create({
          data: {
            title: banner.title,
            subtitle: banner.subtitle,
            description: banner.description,
            ctaText: banner.ctaText,
            ctaLink: banner.ctaLink,
            secondaryCtaText: banner.secondaryCtaText ?? null,
            secondaryCtaLink: banner.secondaryCtaLink ?? null,
            carImageUrl,
            badge: banner.badge ?? null,
            price: banner.price ?? null,
            specs: banner.specs ?? [],
            sortOrder: bannerIdx,
          },
        });
      }
    }
    writeTxtLog(`[Banner ${bannerIdx + 1}/${data.banners.length}] ${banner.title} → ${carImageUrl}`, 'SUCCESS');
    bannerIdx++;
  }

  // 4. Hệ sinh thái
  writeTxtLog(`Bắt đầu đồng bộ ${data.ecosystem.length} mục Hệ sinh thái...`, 'INFO');
  let ecoIdx = 0;
  for (const item of data.ecosystem) {
    const imageUrl = mapUrl(item.image);
    if (!IS_DRY_RUN) {
      const existing = await prisma.ecosystemItem.findFirst({ where: { title: item.title } });
      if (existing) {
        await prisma.ecosystemItem.update({
          where: { id: existing.id },
          data: {
            title: item.title,
            description: item.description,
            iconName: item.iconName,
            imageUrl,
            actionText: item.actionText,
            actionLink: item.actionLink,
            sortOrder: ecoIdx,
          },
        });
      } else {
        await prisma.ecosystemItem.create({
          data: {
            title: item.title,
            description: item.description,
            iconName: item.iconName,
            imageUrl,
            actionText: item.actionText,
            actionLink: item.actionLink,
            sortOrder: ecoIdx,
          },
        });
      }
    }
    writeTxtLog(`[Ecosystem ${ecoIdx + 1}/${data.ecosystem.length}] ${item.title} → ${imageUrl}`, 'SUCCESS');
    ecoIdx++;
  }

  // 5. Ưu đãi
  writeTxtLog(`Bắt đầu đồng bộ ${data.promotions.length} Chương trình ưu đãi...`, 'INFO');
  let promoIdx = 0;
  for (const promo of data.promotions) {
    if (!IS_DRY_RUN) {
      const existing = await prisma.promotion.findFirst({ where: { title: promo.title } });
      if (existing) {
        await prisma.promotion.update({
          where: { id: existing.id },
          data: {
            title: promo.title,
            highlight: promo.highlight,
            description: promo.description,
            tag: promo.tag,
            validUntil: promo.validUntil,
            sortOrder: promoIdx,
          },
        });
      } else {
        await prisma.promotion.create({
          data: {
            title: promo.title,
            highlight: promo.highlight,
            description: promo.description,
            tag: promo.tag,
            validUntil: promo.validUntil,
            sortOrder: promoIdx,
          },
        });
      }
    }
    writeTxtLog(`[Promo ${promoIdx + 1}/${data.promotions.length}] ${promo.title}`, 'SUCCESS');
    promoIdx++;
  }
}

// ─── Step 4: Tạo Admin User ──────────────────────────────────────────────────

async function createAdminUser(): Promise<void> {
  logSection('BƯỚC 4: Khởi Tạo Tài Khoản Admin');
  const email = process.env.ADMIN_EMAIL ?? 'admin@vinfast.vn';
  const password = process.env.ADMIN_PASSWORD ?? 'Admin@123456';

  if (IS_DRY_RUN) {
    writeTxtLog(`[DRY-RUN] Tài khoản admin: ${email} / ${password}`, 'INFO');
    return;
  }

  const existing = await prisma.adminUser.findUnique({ where: { email } });
  if (existing) {
    writeTxtLog(`Admin user "${email}" đã tồn tại trên PostgreSQL`, 'SUCCESS');
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.adminUser.create({
    data: { email, passwordHash, name: 'Super Admin', role: 'superadmin' },
  });
  writeTxtLog(`Đã tạo tài khoản admin: ${email} / ${password}`, 'SUCCESS');
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  ensureLogDir();

  // Khởi tạo file log txt mới hoặc nối tiếp
  const header = [
    '',
    '════════════════════════════════════════════════════════════════════════',
    '                 VINFAST DATA & MINIO MIGRATION LOG                     ',
    '════════════════════════════════════════════════════════════════════════',
    `Thời gian: ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`,
    `Chế độ: ${IS_DRY_RUN ? 'DRY-RUN (Kiểm tra trước)' : 'THỰC THI THẬT'}`,
    `MinIO: http://${MINIO_ENDPOINT}:${MINIO_PORT} | Bucket: ${MINIO_BUCKET}`,
    `PostgreSQL: ${process.env.DATABASE_URL?.replace(/:[^:@]*@/, ':****@')}`,
    `File log TXT: ${TXT_LOG_FILE}`,
    '════════════════════════════════════════════════════════════════════════',
    '',
  ].join('\n');

  fs.writeFileSync(TXT_LOG_FILE, header + '\n', 'utf8');
  console.log(header);

  try {
    let urlMap: Map<string, string>;
    if (!SKIP_MINIO) {
      await ensureBucket();
      urlMap = await uploadImages();
    } else {
      urlMap = new Map<string, string>();
      const scanDir = (dir: string, prefix: string = '') => {
        if (!fs.existsSync(dir)) return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
          if (entry.isDirectory()) {
            scanDir(path.join(dir, entry.name), relativePath);
          } else if (/\.(webp|png|jpg|jpeg|svg)$/i.test(entry.name)) {
            const localWebPath = `/images/vinfast/${relativePath}`;
            urlMap.set(localWebPath, `${MINIO_PUBLIC_URL}/${relativePath.replace(/\\/g, '/')}`);
          }
        }
      };
      scanDir(IMAGES_DIR);
      writeTxtLog(`[SKIP-MINIO] Đã tạo map cho ${urlMap.size} ảnh trỏ đến MinIO URL`, 'INFO');
    }

    await seedDatabase(urlMap);
    await createAdminUser();

    logSection('TỔNG KẾT QUÁ TRÌNH MIGRATION');
    writeTxtLog('Tất cả các bước migration đã hoàn tất thành công!', 'SUCCESS');
    writeTxtLog(`File log văn bản (.txt) đã được lưu tại: ${TXT_LOG_FILE}`, 'SUCCESS');
  } catch (error: unknown) {
    const errStr = error instanceof Error ? error.stack || error.message : String(error);
    writeTxtLog(`LỖI TRONG QUÁ TRÌNH MIGRATION: ${errStr}`, 'ERROR');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
