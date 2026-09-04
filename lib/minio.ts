// MinIO S3 Client
// Sử dụng AWS SDK v3 để tương thích với MinIO S3 API

import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const MINIO_ENDPOINT = process.env.MINIO_ENDPOINT ?? '192.168.247.130';
const MINIO_PORT = parseInt(process.env.MINIO_PORT ?? '9000');
const MINIO_USE_SSL = process.env.MINIO_USE_SSL === 'true';
const MINIO_ACCESS_KEY = process.env.MINIO_ACCESS_KEY ?? 'minioadmin';
const MINIO_SECRET_KEY = process.env.MINIO_SECRET_KEY ?? 'minioadmin';
export const MINIO_BUCKET = process.env.MINIO_BUCKET ?? 'websitecar';
export const MINIO_PUBLIC_URL = process.env.MINIO_PUBLIC_URL ?? `http://${MINIO_ENDPOINT}:${MINIO_PORT}/${MINIO_BUCKET}`;

// Khởi tạo S3 Client trỏ đến MinIO
export const s3Client = new S3Client({
  endpoint: `${MINIO_USE_SSL ? 'https' : 'http'}://${MINIO_ENDPOINT}:${MINIO_PORT}`,
  region: 'ap-southeast-1', // MinIO không dùng region nhưng SDK yêu cầu
  credentials: {
    accessKeyId: MINIO_ACCESS_KEY,
    secretAccessKey: MINIO_SECRET_KEY,
  },
  forcePathStyle: true, // Bắt buộc với MinIO (dùng path-style: endpoint/bucket/key)
});

/**
 * Upload file lên MinIO
 * @param key - Đường dẫn trong bucket (ví dụ: "cars/vf-3.webp")
 * @param body - Buffer dữ liệu file
 * @param contentType - MIME type (ví dụ: "image/webp")
 * @returns Public URL của file đã upload
 */
export async function uploadToMinio(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: MINIO_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
    ACL: 'public-read', // Cho phép đọc công khai
  });

  await s3Client.send(command);

  // Trả về public URL
  return `${MINIO_PUBLIC_URL}/${key}`;
}

/**
 * Xoá file khỏi MinIO
 * @param key - Đường dẫn trong bucket
 */
export async function deleteFromMinio(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: MINIO_BUCKET,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Tạo presigned URL để upload từ client (nếu cần)
 * @param key - Đường dẫn trong bucket
 * @param expiresIn - Số giây hết hạn (mặc định 1 giờ)
 */
export async function getPresignedUploadUrl(
  key: string,
  expiresIn = 3600
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: MINIO_BUCKET,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Lấy key từ MinIO public URL
 * ví dụ: "http://192.168.247.130:9000/websitecar/cars/vf-3.webp" → "cars/vf-3.webp"
 */
export function getKeyFromUrl(url: string): string {
  return url.replace(`${MINIO_PUBLIC_URL}/`, '');
}

/**
 * Xác định MIME type từ extension file
 */
export function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    webp: 'image/webp',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    svg: 'image/svg+xml',
  };
  return mimeTypes[ext ?? ''] ?? 'application/octet-stream';
}
