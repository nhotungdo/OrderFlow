# OrderFlow — Distributed Order Processing System

Hệ thống quản lý đơn hàng phân tán (Distributed Order Processing) được xây dựng trên nền tảng **.NET 9**, **PostgreSQL**, **Redis**, **RabbitMQ**, và **React (Vite + Tailwind CSS)**.

Hệ thống giải quyết 3 bài toán phân tán cốt lõi:
1. **Chống trừ kho sai / Không âm kho (Zero Overselling)**: Kiểm soát tranh chấp 2 tầng (Redis Lua Script giữ chỗ tức thì + PostgreSQL Row-level Atomic Conditional Update).
2. **Chống tạo đơn trùng (Strict Idempotency)**: Bộ lọc `[Idempotent]` đọc header `X-Idempotency-Key`, sử dụng Redis `SETNX` 60s chặn double-click tức thì và Persistent Database Cache trả lại response cũ cho client retry.
3. **Xử lý lỗi thanh toán (Saga Compensation & Transactional Outbox)**: Tránh lỗi Dual-Write bằng Transactional Outbox Pattern; tự động hoàn trả kho và hủy đơn khi cổng thanh toán gặp sự cố hoặc timeout qua RabbitMQ Event Choreography.

---

## 1. Tech Stack

- **Backend**: ASP.NET Core (.NET 9), Entity Framework Core 9, MassTransit 8.3 (RabbitMQ), MediatR, FluentValidation.
- **Data & Cache**: PostgreSQL 16 (Dedicated databases cho từng Service), Redis 7.2 (Lua Scripts, Distributed Locks).
- **Message Broker**: RabbitMQ 3.13 (Management Dashboard, Dead-Letter Queues, Exponential Retries).
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Axios.
- **Testing & Tools**: xUnit, K6 Load Testing, Docker Compose, Scalar API Reference.

---

## 2. Cấu trúc Solution & Ports

```
OrderFlow/
├── docker/
│   ├── docker-compose.yml        # PostgreSQL, Redis, RabbitMQ, Mailpit
│   ├── init-db.sql               # Tạo databases orderflow_orders, orderflow_inventory, orderflow_payments
│   ├── Dockerfile.backend
│   └── Dockerfile.frontend
├── scripts/
│   ├── load-test-k6.js           # K6 Script kiểm thử tải tranh chấp kho & Idempotency
│   └── seed-data.ps1             # PowerShell seed dữ liệu mẫu
├── src/
│   ├── BuildingBlocks/           # Thư viện dùng chung
│   │   ├── BuildingBlocks.Common       # BaseEntity, AggregateRoot, Result, Pipeline Behaviors
│   │   ├── BuildingBlocks.Idempotency  # Two-Tier Idempotency Filter (Redis + Postgres)
│   │   ├── BuildingBlocks.Messaging    # MassTransit RabbitMQ Contracts & Configuration
│   │   ├── BuildingBlocks.Outbox       # Transactional Outbox Interceptor & Background Publisher
│   │   └── BuildingBlocks.Redis        # Atomic Lua Scripts (Reserve/Release stock, Lock)
│   ├── Services/
│   │   ├── OrderService/               # Port 5000 (HTTP) / 5001 (HTTPS)
│   │   ├── InventoryService/           # Port 5002 (HTTP) / 5003 (HTTPS)
│   │   ├── PaymentService/             # Port 5004 (HTTP) / 5005 (HTTPS)
│   │   └── NotificationService/        # Worker Service
│   └── WebApps/
│       └── orderflow-ui/               # Port 3000 (React Vite SPA)
└── tests/
    ├── OrderFlow.ConcurrencyTests/     # Test trừ kho đồng thời 50 buyers / 10 items
    └── OrderFlow.UnitTests/            # Test Saga compensation & Outbox domain events
```

---

## 3. Hướng dẫn Khởi chạy (Quick Start)

### Bước 1: Khởi động Hạ tầng Docker (Postgres, Redis, RabbitMQ)
```bash
cd docker
docker compose up -d
```
Kiểm tra các dịch vụ đang chạy:
- PostgreSQL: `localhost:5432` (user: `orderflow_admin`, pass: `orderflow_secret`)
- Redis: `localhost:6379`
- RabbitMQ Management: `http://localhost:15672` (user: `guest`, pass: `guest`)
- Mailpit UI: `http://localhost:8025`

### Bước 2: Chạy Backend Microservices
Mở 3 terminal riêng hoặc chạy từng service:
```bash
# Terminal 1 - Inventory Service
dotnet run --project src/Services/InventoryService/InventoryService.Api

# Terminal 2 - Order Service
dotnet run --project src/Services/OrderService/OrderService.Api

# Terminal 3 - Payment Service
dotnet run --project src/Services/PaymentService/PaymentService.Api
```

### Bước 3: Nạp dữ liệu mẫu (Seed Data)
Truy cập endpoint Swagger/Scalar của InventoryService hoặc chạy:
```bash
powershell -File scripts/seed-data.ps1
```
*(Sản phẩm iPhone 16 Pro Max được khởi tạo với tồn kho giới hạn = 10 chiếc để thử nghiệm)*.

### Bước 4: Khởi chạy React Frontend
```bash
cd src/WebApps/orderflow-ui
pnpm install
pnpm dev
```
Truy cập: `http://localhost:3000`

---

## 4. Cấu trúc Giao diện Frontend (18 Màn hình: Customer & Admin)

Giao diện được xây dựng bằng React 19 + TypeScript + Vite + Tailwind CSS v4, chia thành 2 phân hệ độc lập:

### I. Customer Portal (8 Màn hình)
1. **Authentication** (`/login`, `/register`): Đăng nhập, đăng ký, JWT, Quick Mock Role Switcher (Alice, Bob, Admin).
2. **Product Catalog** (`/products`): Danh sách sản phẩm, tìm kiếm, lọc danh mục, Real-time 2-Tier Stock Watch Badge.
3. **Product Details** (`/products/:id`): Xem chi tiết, tồn kho khả dụng vs đã giữ, bộ chọn số lượng chặn oversell.
4. **Shopping Cart** (`/cart`): Giỏ hàng, cập nhật số lượng, tính tổng, Pre-checkout Inventory Validation.
5. **Checkout** (`/checkout`): Địa chỉ, chọn kịch bản thanh toán, sinh UUID `X-Idempotency-Key`, toggle thử nghiệm Double-Click spam (Promise.all).
6. **Payment Result** (`/payment-result/:orderId`): Polling trạng thái Saga phân tán, thông báo tự động hoàn kho khi thanh toán lỗi.
7. **My Orders** (`/orders`): Danh sách lịch sử đơn hàng, bộ lọc đa trạng thái, tìm kiếm theo mã đơn.
8. **Order Details** (`/orders/:id`): Chi tiết đơn, Customer State Machine Timeline, hủy đơn và hoàn kho tự động.

### II. Admin Observability Dashboard (10 Màn hình)
9. **Dashboard Overview** (`/admin`): Tổng quan KPIs (Doanh thu, Đơn hàng, SLA %, Tỷ lệ bồi hoàn), Health check microservices.
10. **Product Management** (`/admin/products`): Danh sách sản phẩm, so sánh tồn kho PostgreSQL vs Redis.
11. **Create / Edit Product** (`/admin/products/new`, `:id/edit`): Thêm/sửa sản phẩm, tự động cấp phát key Redis và row PostgreSQL.
12. ⭐ **Two-Tier Inventory Management** (`/admin/inventory`) — **Showcase 1**: Bảng đối chiếu 2 tầng kho, nút Reconcile, Flash Sale Race Condition Attack Lab (bắn 15 requests đồng thời, chứng minh không âm kho).
13. **Stock Movement History** (`/admin/inventory/history`): Sổ kiểm toán kho (Audit Trail: RESTOCK, HOLD, DEDUCT, RELEASE).
14. **Order Management** (`/admin/orders`): Quản trị toàn bộ đơn hàng, lọc trạng thái, tra cứu Idempotency Key.
15. ⭐ **Order Details & Saga Timeline** (`/admin/orders/:id`) — **Showcase 2**: Sơ đồ tiến trình Distributed Saga Choreography, Outbox Message ID, Correlation ID, xem raw JSON payload.
16. **Payment Transactions Ledger** (`/admin/payments`): Sổ cái thanh toán, số tiền captured vs declined/reverted, kiểm tra tính lũy kế.
17. ⭐ **Event Processing Monitor** (`/admin/system/events`) — **Showcase 3**: Giám sát hàng đợi RabbitMQ & MassTransit, throughput (msgs/s), consumer count, message lag.
18. ⭐ **Failed Events & DLQ Retry** (`/admin/system/dlq`) — **Showcase 4**: Trung tâm quản lý Poison Messages, phân tích C# Exception Stack Trace, nút Replay an toàn với cam kết không tác dụng phụ trùng lặp.

---

## 5. Chạy Automated Tests & K6 Load Test

### Chạy Unit & Concurrency Tests (.NET xUnit)
```bash
dotnet test OrderFlow.sln
```
Kết quả: **7/7 tests passed** (Bao gồm test tranh chấp 50 threads tranh mua 10 sản phẩm mà không bị âm kho).

### Chạy K6 Load Testing
```bash
k6 run scripts/load-test-k6.js
```
Script sẽ tự động chạy:
1. `concurrency_race_condition`: 50 Virtual Users gửi request mua đồng thời.
2. `idempotency_double_click`: 20 Virtual Users gửi dồn dập cùng 1 `X-Idempotency-Key` để kiểm tra khả năng khóa của Redis.
