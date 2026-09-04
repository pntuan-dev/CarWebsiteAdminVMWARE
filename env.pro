# =================================================================
# Biến môi trường Production chạy trực tiếp trên VPS (192.168.247.130)
# Dùng chung VPS cho cả App, PostgreSQL DB và MinIO Storage
# =================================================================

# PostgreSQL (Chạy trên cùng VPS)
DATABASE_URL="postgresql://myuser:StrongPassword123@192.168.247.130:5432/appdb"

# MinIO S3 Object Storage (Chạy trên cùng VPS)
MINIO_ENDPOINT="192.168.247.130"
MINIO_PORT="9000"
MINIO_USE_SSL="false"
MINIO_ACCESS_KEY="admin_user"
MINIO_SECRET_KEY="MyStrongPassword123"
MINIO_BUCKET="websitecar"
MINIO_PUBLIC_URL="http://192.168.247.130:9000/websitecar"

# JWT Authentication
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-min-32-chars"
JWT_EXPIRES_IN="7d"

# Admin Account khởi tạo
ADMIN_EMAIL="admin@vinfast.vn"
ADMIN_PASSWORD="Admin@123456"

# App & API Config
NEXT_PUBLIC_API_URL="http://192.168.247.130:4000"
PORT="4000"
HOSTNAME="0.0.0.0"
