# VinFast Admin & Backend API (CarWebsiteAdminVMWARE)

Dự án Backend API & Bảng điều khiển Quản trị (Admin Dashboard) cho hệ thống Website VinFast, xây dựng trên nền tảng **Next.js (App Router)**, **PostgreSQL (Prisma ORM)** và **MinIO Object Storage**.

---

## 📑 Mục lục
1. [Hệ Thống Nhật Ký (Logs & Xem File TXT Trực Tiếp)](#-hệ-thống-nhật-ký-logs)
2. [Cấu Hình Môi Trường (.env)](#-cấu-hình-môi-trường)
3. [Khởi Động Nhanh (Local Dev)](#-khởi-động-nhanh-local-dev)
4. [Triển Khai Production (Docker Swarm & Jenkins)](#-triển-khai-production)
5. [Tài Khoản Quản Trị Mặc Định](#-tài-khoản-quản-trị)

---

## 📜 Hệ Thống Nhật Ký (Logs)

Hệ thống hỗ trợ ghi log song song vào **Database (PostgreSQL)** và **File văn bản (.txt)** tại thư mục `logs/`. Bạn có thể truy cập xem nội dung log thô (raw text) trực tiếp từ trình duyệt mà không cần SSH vào máy chủ.

### 1. Đường dẫn xem file `.txt` trực tiếp trên trình duyệt

| Loại nhật ký | Mô tả | URL trên VPS | URL Local (Dev) |
|---|---|---|---|
| **System Logs** | Ghi nhận toàn bộ hoạt động (Auth, CRUD xe, banner, lỗi runtime) | `http://192.168.247.130:4000/api/logs/raw?file=system.txt` | `http://localhost:4000/api/logs/raw?file=system.txt` |
| **Migration Logs** | Lịch sử đồng bộ dữ liệu xe & upload ảnh sang MinIO | `http://192.168.247.130:4000/api/logs/raw?file=migration.txt` | `http://localhost:4000/api/logs/raw?file=migration.txt` |

> **Lưu ý:** Endpoint `/api/logs/raw` trả về định dạng `text/plain; charset=utf-8` và tắt cache (`no-store`), giúp bạn xem dữ liệu thời gian thực như đang mở file bằng Notepad.

### 2. Xem qua Giao diện Quản trị (Admin UI)
* **Đường dẫn:** `http://<HOST>:4000/admin/logs`
* **Tính năng:**
  * Thống kê số lượng log theo từng cấp độ: `INFO`, `SUCCESS`, `WARN`, `ERROR`.
  * Bộ lọc log theo danh mục (`CAR`, `AUTH`, `BANNER`, `MIGRATION`,...).
  * Xem cấu trúc chi tiết dữ liệu JSON đi kèm của từng log.
  * Nút xóa toàn bộ nhật ký hệ thống khi file quá đầy.

### 3. Cấu trúc lưu trữ trên ổ đĩa
```text
logs/
├── system.txt        # Toàn bộ nhật ký hệ thống dạng text
└── migration.txt     # Lịch sử chi tiết quá trình migration dữ liệu & MinIO
```

---

## ⚙️ Cấu Hình Môi Trường

Dự án sử dụng 2 file cấu hình chính:
* **`.env` / `.env.local`**: Dùng cho phát triển dưới máy cá nhân (Local Dev).
* **`env.production`**: Cấu hình chuẩn khi deploy trên VPS (IP `192.168.247.130`), được Jenkinsfile tự động copy thành `.env` khi đóng gói Docker.

```env
# Database
DATABASE_URL="postgresql://myuser:StrongPassword123@192.168.247.130:5432/appdb"

# MinIO S3 Storage
MINIO_ENDPOINT="192.168.247.130"
MINIO_PORT="9000"
MINIO_BUCKET="websitecar"
MINIO_PUBLIC_URL="http://192.168.247.130:9000/websitecar"

# App & Port
PORT="4000"
NEXT_PUBLIC_API_URL="http://192.168.247.130:4000"
```

---

## 🚀 Khởi Động Nhanh (Local Dev)

```bash
# 1. Cài đặt thư viện
npm install

# 2. Sinh mã Prisma Client
npx prisma generate

# 3. Chạy server phát triển (Port 4000)
npm run dev
```

* Trang chủ Admin: `http://localhost:4000/admin`
* API Base URL: `http://localhost:4000/api`

---

## 🐳 Triển Khai Production

Dự án được triển khai tự động qua **Jenkins Pipeline** và chạy trên **Docker Swarm**:
* **Stack:** `admin_stack`
* **Service:** `admin_stack_car-admin`
* **Port:** `4000:4000`
* **Mạng overlay:** `vinfast_net` (dùng chung với Frontend `app_stack`)

---

## 🔑 Tài Khoản Quản Trị

* **Email:** `admin@vinfast.vn`
* **Mật khẩu:** `Admin@123456`
