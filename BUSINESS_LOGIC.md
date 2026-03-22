# Tài liệu Logic Nghiệp Vụ — Hệ thống 4thitek

> Phiên bản: 2026-03-21
> Phạm vi: Backend (Spring Boot) · Dealer App (Flutter) · Admin Dashboard (React) · Main Website (Next.js)

---

## Mục lục

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Danh sách chức năng](#2-danh-sách-chức-năng)
3. [Logic nghiệp vụ chi tiết](#3-logic-nghiệp-vụ-chi-tiết)
   - [3.1 Xác thực & phân quyền](#31-xác-thực--phân-quyền)
   - [3.2 Sản phẩm & danh mục](#32-sản-phẩm--danh-mục)
   - [3.3 Giỏ hàng & Chiết khấu](#33-giỏ-hàng--chiết-khấu)
   - [3.4 Đặt hàng & Thanh toán](#34-đặt-hàng--thanh-toán)
   - [3.5 Theo dõi công nợ](#35-theo-dõi-công-nợ)
   - [3.6 Kho hàng & Serial](#36-kho-hàng--serial)
   - [3.7 Bảo hành](#37-bảo-hành)
   - [3.8 Xuất báo cáo bảo hành](#38-xuất-báo-cáo-bảo-hành)
   - [3.9 Dashboard báo cáo](#39-dashboard-báo-cáo)
   - [3.10 Thông báo](#310-thông-báo)
   - [3.11 Hỗ trợ (Support Ticket)](#311-hỗ-trợ-support-ticket)
   - [3.12 Cài đặt ứng dụng](#312-cài-đặt-ứng-dụng)
   - [3.13 Dealer Profile & Tài khoản](#313-dealer-profile--tài-khoản)
   - [3.14 Quản lý Admin & Staff](#314-quản-lý-admin--staff)
   - [3.15 Quản lý Đại lý (Admin)](#315-quản-lý-đại-lý-admin)
   - [3.16 Blog & Nội dung tĩnh](#316-blog--nội-dung-tĩnh)
   - [3.17 Public Website API](#317-public-website-api)
   - [3.18 Dashboard & Cài đặt hệ thống (Admin)](#318-dashboard--cài-đặt-hệ-thống-admin)
   - [3.19 Xuất báo cáo (Admin)](#319-xuất-báo-cáo-admin)
   - [3.20 Upload & Lưu trữ File](#320-upload--lưu-trữ-file)
   - [3.21 Rate Limiting](#321-rate-limiting)
4. [User Flow](#4-user-flow)
5. [Edge Cases](#5-edge-cases)
6. [So sánh nền tảng](#6-so-sánh-nền-tảng)
7. [Giả định & Điểm mở](#7-giả-định--điểm-mở)

---

## 1. Tổng quan hệ thống

Hệ thống quản lý phân phối sản phẩm B2B: đại lý đặt hàng, theo dõi công nợ, quản lý kho serial, kích hoạt bảo hành.

### Kiến trúc

| Thành phần | Công nghệ | Vai trò |
|---|---|---|
| **Backend** | Spring Boot 3.4.3, Java 17, PostgreSQL, Redis, AWS S3 | REST API + WebSocket |
| **Dealer App** | Flutter (Material 3), Dart, ChangeNotifier | Ứng dụng mobile cho đại lý |
| **Admin Dashboard** | React 18, TypeScript, Vite | Giao diện quản trị nội bộ |
| **Main Website** | Next.js (App Router) | Trang web public (ISR, SEO) |

```
Dealer App (Flutter) ──── REST + WebSocket ────┐
                                                ▼
Admin Dashboard (React) ──── REST ────► Backend API ──── PostgreSQL
                                                │    ──── Redis (cache, rate limit)
Main Website (Next.js) ──── REST ─────┘         └──── AWS S3 / MinIO (file)
```

### Phân quyền

| Role | Mô tả | JWT Authority |
|---|---|---|
| `DEALER` | Đại lý bán hàng | `"DEALER"` |
| `ADMIN` | Quản trị viên | `"ADMIN"` |
| `SUPER_ADMIN` | Quản trị viên cao cấp | `"SUPER_ADMIN"` |
| `public` | Không cần đăng nhập | — |

**Quy tắc truy cập:**

| Endpoint | Quyền truy cập |
|---|---|
| `POST /api/v1/admin/users`, `/api/v1/admin/users/**` | `SUPER_ADMIN` only |
| `/api/v1/admin/**` | `ADMIN`, `SUPER_ADMIN` |
| `/api/v1/dealer/**`, `POST /api/v1/warranty-activation` | `DEALER`, `ADMIN`, `SUPER_ADMIN` |
| `POST /api/v1/upload/products`, `/upload/blogs`, `/upload/avatars` | `ADMIN`, `SUPER_ADMIN` |
| `POST /api/v1/upload/dealer-avatars`, `/upload/payment-proofs` | `DEALER`, `ADMIN`, `SUPER_ADMIN` |
| `DELETE /api/v1/upload` | `DEALER`, `ADMIN`, `SUPER_ADMIN` |
| `/api/v1/upload/**` (còn lại) | Đã xác thực |
| `/api/v1/auth/**`, `/api/v1/content/**`, `/api/v1/blog/**`, `/api/v1/product/**` | Public |
| `/api/v1/warranty/check/**`, `/api/v1/webhooks/sepay` | Public |
| `GET /api/v1/user/dealer`, `POST /api/v1/user/dealer` | Public |
| `/uploads/**`, `/ws/**`, `/api/v1/health`, `/v3/api-docs/**`, `/swagger-ui/**` | Public |

> `ADMIN` và `SUPER_ADMIN` đều truy cập `/api/v1/dealer/**` để hỗ trợ dealer. `SUPER_ADMIN` có quyền riêng duy nhất là quản lý staff (`/api/v1/admin/users/**`). Toàn bộ phân quyền enforce tại server — Dealer App không thực hiện role-check phía client.

---

## 2. Danh sách chức năng

### Dealer App

| # | Chức năng | Mô tả |
|---|---|---|
| F01 | Đăng nhập / Đăng xuất | JWT auth, token refresh tự động |
| F02 | Danh mục sản phẩm | Lọc, phân trang, tìm kiếm client-side |
| F03 | Giỏ hàng | Thêm, sửa số lượng, xóa, xem chiết khấu |
| F04 | Đặt hàng | Chuyển khoản hoặc ghi nợ |
| F05 | Theo dõi đơn hàng | Lịch sử, trạng thái, chi tiết, reorder |
| F06 | Ghi nhận thanh toán | Ghi theo đơn từ màn OrderDetail hoặc DebtTracking |
| F07 | Theo dõi công nợ | Danh sách đơn còn nợ, tổng nợ, ghi thanh toán |
| F08 | Kho serial | Xem serial, trạng thái kích hoạt |
| F09 | Kích hoạt bảo hành | Serial-first — không cần chọn đơn trước |
| F10 | Xuất báo cáo bảo hành | PDF/Excel theo serial |
| F11 | Thông báo real-time | WebSocket, fallback polling |
| F12 | Hỗ trợ | Tạo ticket, xem phản hồi, lịch sử |
| F13 | Dashboard | Tổng quan theo kỳ tháng/quý |
| F14 | Cài đặt | Ngôn ngữ (VI/EN), giao diện (dark/light/system) |

### Admin Dashboard

| # | Chức năng |
|---|---|
| A01 | Quản lý đại lý (CRUD, duyệt tài khoản, credit limit) |
| A02 | Quản lý sản phẩm & SKU |
| A03 | Quản lý đơn hàng, duyệt & chuyển trạng thái |
| A04 | Quản lý bảo hành |
| A05 | Quản lý kho serial (import, cập nhật, xóa) |
| A06 | Gửi thông báo cho đại lý |
| A07 | Báo cáo & xuất dữ liệu |
| A08 | Audit log hành động admin |

---

## 3. Logic nghiệp vụ chi tiết

---

### 3.1 Xác thực & phân quyền

#### Đăng nhập — `POST /api/v1/auth/login`

Nhận `username` (email hoặc username) + `password`. Quy trình:
1. Normalize input (trim, lowercase)
2. Xác thực một bước qua `AuthenticationManager` (bcrypt) — không tách riêng email/password để tránh timing attack
3. Nếu thất bại (sai credentials hoặc tài khoản disabled) → trả `invalidCredentials` (thông báo chung)
4. Phát hành `accessToken` (JWT, TTL **30 phút**) + `refreshToken` (TTL **7 ngày**, không rotate)

> Dealer `UNDER_REVIEW` / `SUSPENDED` vẫn đăng nhập được và nhận token — nhưng **không gọi được** bất kỳ dealer API nào (bị chặn tại `DealerController` và `WarrantyActivationController`).

#### Token Refresh — `POST /api/v1/auth/refresh`

Trả `accessToken` mới nếu `refreshToken` còn hợp lệ và tài khoản còn `enabled`. Hết hạn → `401` → client buộc logout, xóa token.

> **Giới hạn thiết kế:** Không có server-side token blacklist — token vẫn hợp lệ đến khi hết TTL dù đã đăng xuất.

#### Đăng xuất

Client-side only: xóa token, clear toàn bộ state (cart, orders, warranty, notifications).

#### Quên mật khẩu

| Bước | Endpoint | Mô tả |
|---|---|---|
| 1 | `POST /api/v1/auth/forgot-password` | Gửi link reset nếu email tồn tại (luôn trả thành công) |
| 2 | `GET /api/v1/auth/reset-password/validate?token=...` | Kiểm tra token còn hợp lệ |
| 3 | `POST /api/v1/auth/reset-password` | Đặt mật khẩu mới bằng token |

Token reset có hiệu lực **30 phút** (cấu hình qua `app.password-reset.expiration-minutes`). Yêu cầu reset mới → token cũ bị xóa ngay.

#### Đăng ký dealer — `POST /api/v1/auth/register-dealer` (public)

Tài khoản tạo với `customerStatus = UNDER_REVIEW`. Hệ thống gửi email xác nhận và publish WebSocket event cho admin.

**Payload:** `username`* · `password`* · `email` · `businessName` · `contactName` · `taxCode` · `phone` · `addressLine` · `ward` · `district` · `city` · `country` · `avatarUrl`

**Validation:**
- `username`: bắt buộc, unique
- `email`: unique, đúng format (nếu có)
- `taxCode`: unique (nếu có)
- `phone`: unique, định dạng Vietnam `0[0-9]{9}` (nếu có)
- `password`: tối thiểu 8 ký tự, có chữ hoa + chữ thường + chữ số
- Trùng → `409 Conflict` với field cụ thể

#### Quy tắc mật khẩu (`assertStrongPassword`)

Áp dụng tại đăng ký dealer, tạo admin staff, đặt lại mật khẩu: **tối thiểu 8 ký tự**, bắt buộc có chữ hoa, chữ thường, chữ số.

---

### 3.2 Sản phẩm & danh mục

**Endpoints (public):**
- `GET /api/v1/product/products` — danh sách
- `GET /api/v1/product/products/page` — phân trang (`totalPages`, `totalElements`, `items[]`)
- `GET /api/v1/product/{productId}` — chi tiết
- `GET /api/v1/product/products/search?query&minPrice&maxPrice` — tìm kiếm theo từ khóa và/hoặc khoảng giá
- `GET /api/v1/product/products/featured` — sản phẩm nổi bật (`featured = true`)
- `GET /api/v1/product/products/new` — sản phẩm mới nhất

> Dealer App luôn gọi kèm token dù endpoint là public. Filter và sort được thực hiện **client-side**.

**Quy tắc hiển thị:**
- `stock ≤ 10` (`kLowStockThreshold`) → cảnh báo "sắp hết hàng"
- `stock = 0` → không cho thêm vào giỏ

**Lọc client-side:** stock (`all` | `inStock` | `lowStock` | `outOfStock`), text (so sánh `name`, `sku`, `shortDescription`)

**Sắp xếp client-side:** `none` | `priceAsc` | `priceDesc` | `nameAsc` | `nameDesc`

**Cấu trúc dữ liệu:**
```
Product { id, sku, name, shortDescription, price (VNĐ, integer),
          stock, warrantyMonths, imageUrl?, descriptions[], videos[], specifications[] }

ProductDescriptionItem { type: title|description|image|gallery|video,
                         text?, url?, caption?, gallery[] }

ProductVideoItem { title, url, description?, type (default: 'tutorial') }
```

---

### 3.3 Giỏ hàng & Chiết khấu

**Endpoints:**
- `GET /api/v1/dealer/cart` — lấy giỏ
- `PUT /api/v1/dealer/cart/items` — thêm/cập nhật item
- `DELETE /api/v1/dealer/cart/items/{productId}` — xóa item
- `DELETE /api/v1/dealer/cart` — xóa toàn bộ
- `GET /api/v1/dealer/discount-rules` — lấy quy tắc chiết khấu

**Kiến trúc:** Local-first, optimistic update + rollback khi lỗi mạng.

**Công thức tính giá:**
```
subtotal           = Σ (price × quantity)
discountAmount     = bulkDiscountAmount(cartItems, activeRules)
totalAfterDiscount = subtotal - discountAmount
vatAmount          = totalAfterDiscount × 10%      // VAT cố định 10%
total              = totalAfterDiscount + vatAmount // Không có phí giao hàng
```

> `shippingFee` luôn = 0 — server từ chối bất kỳ giá trị nào khác 0.

**Chiết khấu theo số lượng (Bulk Discount):**

Quy tắc ưu tiên khi chọn rule áp dụng:
1. Rule product-specific ưu tiên hơn rule global
2. Trong cùng loại: chọn `minQty` cao nhất phù hợp
3. Cùng `minQty`: chọn `discountPercent` cao nhất

```
BulkDiscountRule { productId? (null = global), minQty, maxQty?, discountPercent }
```

Chỉ rule có `status = ACTIVE` được áp dụng. `BulkDiscountTarget` hiển thị tiến trình đến tier tiếp theo.

**Validation:** số lượng ≥ 1, ≤ stock, không cho phép thêm sản phẩm hết hàng.

---

### 3.4 Đặt hàng & Thanh toán

#### Tạo đơn — `POST /api/v1/dealer/orders`

**Payload:**
```json
{
  "paymentMethod": "BANK_TRANSFER | DEBT",
  "receiverName": "...", "receiverPhone": "...", "receiverAddress": "...",
  "note": "...",
  "items": [{ "productId": "...", "quantity": 3 }]
}
```

**Quy trình:**
1. Validate sản phẩm (tồn tại, đủ serial `AVAILABLE`)
2. Snapshot giá → lưu `unitPrice` vào `DealerOrderItem` (giá thay đổi sau không ảnh hưởng)
3. Tính subtotal, discount, VAT, total; enforce `shippingFee = 0`
4. Nếu `DEBT`: kiểm tra `currentOutstandingDebt + total ≤ creditLimit` — dùng `SELECT FOR UPDATE` trên row Dealer
5. Reserve serial: `AVAILABLE → RESERVED` (atomic, `SELECT FOR UPDATE` trên Product row)
6. Lưu đơn `status = PENDING`; gửi email xác nhận cho dealer (async); publish `adminNewOrder` WebSocket

Client tự gọi `DELETE /api/v1/dealer/cart` sau khi nhận phản hồi thành công.

**Mã đơn:** `SCS-{dealerId}-{timestamp}` — dùng để khớp nội dung chuyển khoản SePay.

#### Trạng thái đơn hàng

```
PENDING ──► CONFIRMED ──► SHIPPING ──► COMPLETED
   │              │
   └──────────────┴──────────────────► CANCELLED
```

| Transition | Ai thực hiện | Hệ quả |
|---|---|---|
| `PENDING → CONFIRMED` | Admin | — |
| `CONFIRMED → SHIPPING` | Admin | WebSocket `ORDER_STATUS_CHANGE` → dealer |
| `SHIPPING → COMPLETED` | Admin | Serial `RESERVED → ASSIGNED`; vào kho dealer |
| `PENDING/CONFIRMED → CANCELLED` | Admin hoặc Dealer | Serial `RESERVED → AVAILABLE`; thông báo đến tất cả admin `ACTIVE` |

> Đơn đang `SHIPPING` không thể hủy. `COMPLETED` và `CANCELLED` là trạng thái cuối. Admin dùng `SELECT FOR UPDATE` trên row Order khi cập nhật trạng thái.

#### Thanh toán — Bank Transfer

1. Dealer xem thông tin tài khoản ngân hàng (`GET /api/v1/dealer/payment-instructions`), sao chép và chuyển tiền
2. SePay webhook tự động xác nhận khi nhận giao dịch khớp → `paymentStatus = PAID`

**Quy tắc SePay webhook (`POST /api/v1/webhooks/sepay`):**
- Token qua query param `?token=...` hoặc header `X-Webhook-Token` (query param ưu tiên)
- Chỉ chấp nhận số tiền **đúng bằng** `outstandingAmount` — không chấp nhận thanh toán một phần
- Idempotent: trùng `transactionCode` bị bỏ qua
- Đơn đã hủy hoặc đã thanh toán đủ → bỏ qua
- Dùng `SELECT FOR UPDATE` trên row Order (theo `orderCode`) khi xử lý

Nếu `sepay.enabled=true`, dealer **không thể** tự ghi payment cho đơn bank transfer. Admin có thể override qua `POST /api/v1/admin/orders/{id}/payments`.

#### Thanh toán — Ghi nợ (Debt)

`paymentStatus = DEBT_RECORDED` ngay khi tạo đơn. `outstandingAmount = total − paidAmount` (tính động, không lưu field riêng).

#### Ghi nhận thanh toán công nợ — `POST /api/v1/dealer/orders/{id}/payments`

```json
{ "amount": 1000000, "method": "BANK_TRANSFER|DEBT|...", "channel": "cash|bankTransfer|...",
  "note": "...", "proofFileName": "...", "paidAt": "2026-03-21T10:00:00Z" }
```

**Validation:**
- `amount > 0` (`@DecimalMin(0.01)`)
- `amount ≤ outstandingAmount` (hard block)
- `outstandingAmount > 0` — đơn đã đủ → từ chối
- Trùng lặp: cùng `orderId` + `amount` trong **5 giây** → từ chối (check DB trực tiếp)
- `transactionCode` unique toàn hệ thống (nếu có)
- Dùng `SELECT FOR UPDATE` trên row Order

`outstandingAmount = max(0, total − paidAmount)`. Ẩn dòng "Còn nợ" khi = 0.

#### Admin ghi payment — `POST /api/v1/admin/orders/{id}/payments`

Payload như dealer + không bị chặn bởi SePay restriction. Admin có thể xóa đơn ở trạng thái `CANCELLED`.

---

### 3.5 Theo dõi công nợ

**Màn hình:** `DebtTrackingScreen` — mở từ shortcut Dashboard (không phải tab độc lập).

Hiển thị các đơn thỏa: `paymentMethod = DEBT AND outstandingAmount > 0 AND status ≠ CANCELLED`.

Tổng hợp: tổng nợ tồn (`Σ outstandingAmount`), số đơn còn nợ, danh sách có thể bấm để ghi thanh toán.

> Ghi thanh toán công nợ **độc lập với trạng thái đơn** — dealer có thể ghi khi đơn ở bất kỳ trạng thái nào trừ `CANCELLED`.

---

### 3.6 Kho hàng & Serial

**Mô hình:**
```
ProductSerial { serialNumber (unique per product+warehouse), product, warehouse,
                status: AVAILABLE|RESERVED|ASSIGNED|WARRANTY|DEFECTIVE|RETURNED, importedAt }
```

**Vòng đời trạng thái:**
```
AVAILABLE ──► RESERVED ──► ASSIGNED ──► WARRANTY
(admin import)  (đặt đơn)   (COMPLETED)  (kích hoạt)
     ▲               │            │
     └───────────────┘            ├──► DEFECTIVE
  (đơn hủy)                      └──► RETURNED
```

> `WARRANTY` hiển thị là `activated` trong Dealer App.

**Import serial (Admin) — `POST /api/v1/admin/serials/import`:**
- Bulk import; normalize: trim + uppercase
- Trùng serial trong cùng warehouse → bỏ qua item đó, các item còn lại **vẫn được import** (partial success)
- Admin có thể xóa serial (thường dùng cho serial nhập sai)

**Auto-reserve khi tạo đơn:** Hệ thống tự pick serial `AVAILABLE` đúng số lượng. Không đủ → từ chối đơn.

**Serial vào kho dealer:** Khi đơn chuyển `COMPLETED` → backend gán serial cho dealer (`serial.dealer = order.dealer`), chuyển `RESERVED → ASSIGNED`.

**Dealer cập nhật trạng thái:** `PATCH /api/v1/dealer/serials/{id}/status` — đánh dấu `DEFECTIVE` hoặc `RETURNED` (chỉ áp dụng cho serial `ASSIGNED` hoặc `WARRANTY`).

---

### 3.7 Bảo hành

#### Triết lý: Serial-First

Dealer chỉ cần serial — hệ thống tự resolve thông tin đơn. Không cần chọn đơn trước. `orderId` vẫn được lưu trong bản ghi để phục vụ traceability và báo cáo.

#### Kích hoạt bảo hành — `POST /api/v1/warranty-activation`

```json
{ "productSerialId": 42, "customerName": "...", "customerEmail": "...",
  "customerPhone": "...", "customerAddress": "...", "purchaseDate": "2026-03-19" }
```

**Quy trình:**
1. Normalize serial (trim + uppercase), resolve `productSerialId` qua `GET /api/v1/dealer/serials`
2. Validate: serial thuộc kho dealer, chưa kích hoạt, đơn liên kết `status = COMPLETED`
3. Tự điền `name/phone/address` từ receiver info của đơn; **email phải dealer nhập thủ công** (không có trong receiver info)
4. Dealer chọn `purchaseDate` (mặc định = ngày tạo đơn, có thể chỉnh)
5. Gọi API → tạo `WarrantyRegistration`, cập nhật serial `→ WARRANTY`
6. Ngày hết bảo hành = `purchaseDate + warrantyMonths`

**Validation:** một serial chỉ kích hoạt một lần; `purchaseDate` không trước ngày tạo đơn, không sau hôm nay; tất cả thông tin khách hàng bắt buộc.

**Trạng thái bảo hành:**

| Status | Mô tả |
|---|---|
| `ACTIVE` | Còn hiệu lực |
| `EXPIRED` | Hết hạn theo `purchaseDate + warrantyMonths` |
| `VOID` | Bị vô hiệu hoá bởi admin (ví dụ: vi phạm điều khoản) |

**Admin quản lý — `PATCH /api/v1/admin/warranties/{id}/status`:**
- Không thể set `ACTIVE` nếu warranty đã expired
- Mọi thay đổi clear cache `PUBLIC_WARRANTY_LOOKUP`

**Dealer Warranty CRUD (`/api/v1/dealer/warranties`):** Ngoài luồng serial-first, dealer có thể tạo/sửa/xóa warranty record thủ công. Khi xóa:
- Đơn `COMPLETED` hoặc serial đang `WARRANTY` → serial về `ASSIGNED`
- Đơn chưa hoàn thành → serial về `AVAILABLE`

**Local sync (Dealer App):** Cache bảo hành trong `SharedPreferences`. Khi boot: tải từ `/api/v1/dealer/serials` và `/api/v1/dealer/warranties`. `_ensureImportedSerialsForActivations()` tạo dummy record nếu thiếu, bảo toàn `warehouseId` gốc khi đã có.

---

### 3.8 Xuất báo cáo bảo hành

**Màn hình:** `WarrantyExportScreen` — luồng serial-first.

1. Scan QR hoặc nhập serial; hệ thống tự resolve → đơn hàng (không cần chọn orderId)
2. Preview danh sách serial đã chọn
3. Chọn định dạng: **PDF** hoặc **Excel**
4. Xuất kèm thông tin serial, sản phẩm, ngày kích hoạt, ngày hết hạn, QR code (tùy chọn)

---

### 3.9 Dashboard báo cáo

**Màn hình:** Tab "Tổng quan" (`DashboardScreen`). Bộ lọc: `tháng` hoặc `quý`, điều hướng kỳ trước/sau.

| Card | Mô tả |
|---|---|
| Quick Actions | Shortcut: Tạo đơn, Công nợ, Kho hàng, Bảo hành |
| Overview | Doanh thu, công nợ tồn, số đơn, tỷ lệ hoàn thành — theo kỳ |
| Low Stock Alert | Sản phẩm `stock ≤ 10` |
| Order Status Distribution | Phân bổ trạng thái đơn trong kỳ |
| Revenue Chart | Doanh thu theo tháng trong kỳ |
| Aging Debt | Công nợ phân theo tuổi nợ |
| Activation Trend | Xu hướng kích hoạt bảo hành — theo **kỳ được chọn** |
| Warranty Status Donut | Tỷ lệ serial đã/chưa kích hoạt — cửa sổ cố định **90 ngày** |
| Recent Orders | Đơn hàng gần đây trong kỳ |

> Trên mobile: Activation Trend và Warranty Donut thu gọn mặc định.

---

### 3.10 Thông báo

**Kết nối:** WebSocket tại `/ws`. Token xác thực qua query param hoặc header khi handshake. Fallback: polling nếu mất kết nối.

**Admin gửi thông báo — `POST /api/v1/admin/notifications`:**
- Targeting: `DEALERS` | `ALL_ACCOUNTS` | `ACCOUNTS` (danh sách ID)
- Payload: `title`, `body`, `type` (SYSTEM | PROMOTION | ORDER | WARRANTY), `link?`, `deepLink?`

**Danh sách WebSocket events:**

| Event | Destination | Trigger | Nhận bởi |
|---|---|---|---|
| `ORDER_STATUS_CHANGE` | `/queue/{username}` | Admin cập nhật trạng thái đơn | Dealer |
| `INCOMING_NOTICE` | `/queue/notifications` | Admin tạo thông báo | Dealer |
| `loginConfirmed` | `/queue/login-confirmed` | Đăng nhập thành công | User |
| `dealerRegistrationFromAuth` | `/topic/dealer-registrations` | Dealer đăng ký mới | Admin (broadcast) |
| `adminNewOrder` | `/topic/admin/new-orders` | Dealer tạo đơn | Admin (broadcast) |
| `adminNewSupportTicket` | `/topic/admin/support-tickets` | Dealer mở ticket | Admin (broadcast) |
| `notificationCreated` | `/queue/notifications` | Notification được tạo | User được chỉ định |

> Event user-specific dùng `convertAndSendToUser(username, ...)`. Broadcast dùng `/topic/...`.

**API đọc/quản lý thông báo:**
- `GET /api/v1/dealer/notifications` — danh sách
- `PATCH /api/v1/dealer/notifications/{id}/read` — đánh dấu đã đọc
- `PATCH /api/v1/dealer/notifications/{id}/unread` — đánh dấu chưa đọc
- `PATCH /api/v1/dealer/notifications/read-all` — đọc tất cả (trả về `{ "status": "updated", "updatedCount": N }`)

**Loại thông báo (`DistributorNotice`):** `order` | `system` | `promotion`

---

### 3.11 Hỗ trợ (Support Ticket)

**Màn hình:** `SupportScreen` — truy cập từ tab Account.

**Tạo ticket:** category (`order|warranty|product|payment|returnOrder|other`), priority (`normal|high|urgent`), subject (≤ 80 ký tự), message (≤ 500 ký tự).

**Mô hình:** Một chiều — dealer gửi 1 message, admin trả lời qua `adminReply`. Không có chat thread.

**Trạng thái:** `open → in_progress → resolved → closed`

**Mã ticket:** `SPT-{8 ký tự cuối epoch ms}` — tự động, unique.

**Thông báo khi admin cập nhật:** Dealer nhận in-app notification + email khi admin thay đổi status hoặc thêm reply. `resolvedAt` và `closedAt` được set lần đầu (không ghi đè).

**Liên hệ trực tiếp:** Hotline `1900 1234` · Email `support@4thitek.vn`

**Endpoints:**
- `POST /api/v1/dealer/support-tickets` — tạo ticket
- `GET /api/v1/dealer/support-tickets/latest` — ticket mới nhất
- `GET /api/v1/dealer/support-tickets/page` — lịch sử phân trang

---

### 3.12 Cài đặt ứng dụng

- **Theme:** `light` | `dark` | `system` — lưu trong `SharedPreferences` đúng giá trị chuỗi. `system` theo setting thiết bị.
- **Ngôn ngữ:** `vi` | `en` — toàn bộ UI, validation message, snackbar đều được dịch.

---

### 3.13 Dealer Profile & Tài khoản

**Cập nhật profile — `PUT /api/v1/dealer/profile`:** tên doanh nghiệp, liên hệ, địa chỉ, avatar URL. Credit limit là readonly — chỉ admin thay đổi.

---

### 3.14 Quản lý Admin & Staff

#### Bắt buộc đổi password lần đầu

`AdminPasswordChangeRequiredFilter` chạy trên mọi request tới `/api/v1/admin/**`. Nếu `requirePasswordChange = true` → `403 Forbidden` mọi endpoint trừ `/api/v1/auth/**` và `PATCH /api/v1/admin/password`. Admin mới luôn được tạo với flag này bật. Sau khi đổi thành công → flag reset.

#### Quản lý Staff Users (SUPER_ADMIN only)

| Endpoint | Mô tả |
|---|---|
| `GET /api/v1/admin/users` | Liệt kê staff users |
| `POST /api/v1/admin/users` | Tạo admin staff mới |
| `PATCH /api/v1/admin/users/{id}/status` | Bật / tắt tài khoản |

Khi tạo staff: sinh password tạm thời **12 ký tự** (chữ hoa, chữ thường, số, `@#$%`; loại bỏ ký tự dễ nhầm `I O 1 0`), set `requirePasswordChange = true`, gửi credentials qua email.

#### Bootstrap SUPER_ADMIN

Chạy một lần lúc startup khi `app.bootstrap-super-admin.enabled=true` và chưa có SUPER_ADMIN trong DB. Tạo tài khoản từ env vars (`email`, `password`, `name`; default name: *"System Owner"*) với cả hai role `ADMIN` + `SUPER_ADMIN`, `requirePasswordChange = true`. Idempotent.

#### Audit Logging

`AdminAuditLoggingAspect` tự động ghi log mọi mutation (`POST/PUT/PATCH/DELETE`) trong `/api/v1/admin/**`.

Thông tin ghi: `actor`, `actorRole`, `action` (create|update|delete|changePassword|import|createNotification), `method`, `path`, `ip`, `payload` (sanitized), `entityType`.

---

### 3.15 Quản lý Đại lý (Admin)

| Endpoint | Mô tả |
|---|---|
| `GET /api/v1/admin/dealers/accounts` | Danh sách dealer |
| `GET /api/v1/admin/dealers/accounts/page` | Phân trang |
| `PUT /api/v1/admin/dealers/accounts/{id}` | Cập nhật profile dealer |
| `PATCH /api/v1/admin/dealers/accounts/{id}/status` | Bật/tắt account, cập nhật credit limit |

**Vòng đời tài khoản dealer:**
```
UNDER_REVIEW ──► ACTIVE
             └──► SUSPENDED
```

Admin duyệt → `ACTIVE`; tạm khóa → `SUSPENDED`. Admin cập nhật `creditLimit` độc lập hoặc cùng lúc đổi status.

**Email lifecycle:** Đăng ký mới → gửi email nhận hồ sơ. Thay đổi status → gửi email + in-app notification. Tất cả email gửi async (`@Async("mailTaskExecutor")`) — lỗi email không block transaction.

**Quy tắc truy cập portal (`assertDealerPortalAccess`):**
- Dealer `UNDER_REVIEW` / `SUSPENDED` **đăng nhập được** và nhận token bình thường
- Chỉ `status = ACTIVE` được gọi dealer API và kích hoạt bảo hành
- `UNDER_REVIEW` → `401` với message *"Tài khoản đang chờ duyệt..."* (khi gọi dealer API)
- `SUSPENDED` → `401` với message tương ứng (khi gọi dealer API)
- `null status` coi là `ACTIVE` (backward compatibility)
- Kiểm tra tại: `DealerController`, `WarrantyActivationController`

---

### 3.16 Blog & Nội dung tĩnh

#### Admin — Quản lý Blog

| Endpoint | Mô tả |
|---|---|
| `GET/POST /api/v1/admin/blogs` | Danh sách / Tạo bài viết |
| `PUT /api/v1/admin/blogs/{id}` | Cập nhật |
| `DELETE /api/v1/admin/blogs/{id}` | Xóa |
| `GET /api/v1/admin/categories` | Danh mục |

**Trạng thái bài viết:** `DRAFT` (bản nháp) → `SCHEDULED` (lên lịch) → `PUBLISHED` (public)

#### Public Blog API (không cần auth)

| Endpoint | Mô tả |
|---|---|
| `GET /api/v1/blog/blogs/latest` | Bài viết mới nhất (homepage) |
| `GET /api/v1/blog/blogs` | Tất cả bài viết |
| `GET /api/v1/blog/blogs/search` | Tìm kiếm |
| `GET /api/v1/blog/blogs/related/{id}` | Bài viết liên quan |
| `GET /api/v1/blog/categories` | Danh mục |
| `GET /api/v1/blog/categories/{id}/blogs` | Bài viết theo danh mục |
| `GET /api/v1/blog/{id}` | Chi tiết |

#### Public Content API (Nội dung tĩnh)

`GET /api/v1/content/{section}?lang=vi|en` — trả về nội dung tĩnh (FAQ, Về chúng tôi, Chính sách...). Mặc định `lang=vi`. Không cần auth.

---

### 3.17 Public Website API

**Public Warranty Check — `GET /api/v1/warranty/check/{serial}`**

Public, rate limit 30 req/60s. Serial normalize (trim + uppercase) trước khi lookup. Kết quả cache `PUBLIC_WARRANTY_LOOKUP`.

```
WarrantyLookupResponse {
  status: ACTIVE | EXPIRED | VOID | invalid  // invalid = chưa kích hoạt hoặc không tồn tại
  productName, serialNumber, purchaseDate, warrantyEndDate,
  remainingDays,   // 0 nếu hết hạn
  warrantyCode
}
```

**Dealer listing (public):**
- `GET /api/v1/user/dealer` — danh sách dealer
- `GET /api/v1/user/dealer/page` — phân trang

---

### 3.18 Dashboard & Cài đặt hệ thống (Admin)

**Admin Dashboard — `GET /api/v1/admin/dashboard`**

Tổng hợp số liệu vận hành: số dealer `UNDER_REVIEW`, thống kê đơn hàng, doanh thu. Kết quả cache `ADMIN_DASHBOARD`.

**System Settings:**
- `GET /api/v1/admin/settings` — đọc cài đặt
- `PUT /api/v1/admin/settings` — cập nhật (SePay config, `emailConfirmation`, `sessionTimeoutMinutes`, `orderAlerts`, `inventoryAlerts`, email settings, rate limit overrides...)

**Cache invalidation:**

| Cache | Bị clear khi |
|---|---|
| `ADMIN_DASHBOARD` | Dealer đăng ký mới, admin cập nhật dealer status, dealer tạo đơn, discount rule tạo mới |
| `PUBLIC_PRODUCTS`, `PUBLIC_PRODUCT_BY_ID`, `PUBLIC_FEATURED_PRODUCTS`, `PUBLIC_HOMEPAGE_PRODUCTS` | Admin tạo/cập nhật sản phẩm |
| `PUBLIC_WARRANTY_LOOKUP` | Warranty tạo/cập nhật/xóa (activation, CRUD, admin status change) |

---

### 3.19 Xuất báo cáo (Admin)

**`GET /api/v1/admin/reports/export`**

| Param | Giá trị |
|---|---|
| `type` | `ORDERS` \| `REVENUE` \| `WARRANTIES` \| `SERIALS` |
| `format` | `XLSX` \| `PDF` |

---

### 3.20 Upload & Lưu trữ File

**Upload endpoints:**

| Endpoint | Role | Mục đích |
|---|---|---|
| `POST /api/v1/upload/products` | ADMIN, SUPER_ADMIN | Ảnh sản phẩm |
| `POST /api/v1/upload/blogs` | ADMIN, SUPER_ADMIN | Ảnh bài viết |
| `POST /api/v1/upload/avatars` | ADMIN, SUPER_ADMIN | Avatar admin |
| `POST /api/v1/upload/dealer-avatars` | DEALER, ADMIN, SUPER_ADMIN | Avatar dealer |
| `POST /api/v1/upload/payment-proofs` | DEALER, ADMIN, SUPER_ADMIN | Chứng từ thanh toán |
| `DELETE /api/v1/upload?url=...` | DEALER, ADMIN, SUPER_ADMIN | Xóa file |
| `GET /api/v1/upload/**` | Đã xác thực | Truy cập nội bộ |

**Path scoping theo actor:**

| Category | Admin | Dealer |
|---|---|---|
| `avatars` | `avatars/{adminId}/` | — |
| `dealer-avatars` | `avatars/dealers/{adminId}/` | `avatars/dealers/{dealerId}/` |
| `payment-proofs` | `payments/proofs/{adminId}/` | `payments/proofs/dealers/{dealerId}/` |
| `products`, `blogs` | `products/`, `blogs/` | — |

**Quyền xóa:**
- `products/`, `blogs/` → chỉ ADMIN/SUPER_ADMIN
- `avatars/dealers/`, `payments/proofs/` → admin xóa mọi file; dealer chỉ xóa file trong folder của mình
- Response: `{ "status": "deleted", "path": "..." }`

**Serve file tĩnh — `GET /uploads/{*path}`:**
- Public, Cache-Control `max-age=31536000` (365 ngày)
- Chỉ active khi `app.storage.provider=s3`

---

### 3.21 Rate Limiting

Cơ chế sliding window per client IP. Cleanup job chạy mỗi **5 phút** (cấu hình qua `app.rate-limit.cleanup-interval-ms`), grace period **300 giây**.

| Endpoint | Giới hạn |
|---|---|
| `POST /api/v1/auth/login` | 10 req / 60s |
| `POST /api/v1/auth/forgot-password` | 5 req / 300s |
| `GET /api/v1/warranty/check/{serial}` | 30 req / 60s |
| `POST /api/v1/upload/**` | 20 req / 60s |
| `POST /api/v1/webhooks/sepay` | 120 req / 60s |

Vượt ngưỡng → `429 Too Many Requests`.

---

## 4. User Flow

### 4.1 Đặt hàng

```
Đăng nhập → Duyệt sản phẩm → Thêm vào giỏ → Kiểm tra giỏ & chiết khấu → Nhập thông tin người nhận
→ Chọn thanh toán:
    [Chuyển khoản] Sao chép thông tin NH → Chuyển tiền → SePay tự xác nhận
    [Ghi nợ] Xác nhận → Đơn ghi nợ ngay
→ Đơn tạo thành công (PENDING)
```

### 4.2 Thanh toán công nợ

```
Dashboard → Shortcut "Công nợ" → Chọn đơn còn nợ → Ghi nhận thanh toán (số tiền, kênh, chứng từ)
→ outstandingAmount giảm ngay (không cần admin xác nhận)
→ outstandingAmount = 0 → đơn biến mất khỏi danh sách nợ
```

### 4.3 Kích hoạt bảo hành

```
[Admin] Đơn → COMPLETED → Serial vào kho dealer
[Dealer] Scan/nhập serial → Hệ thống validate & tự điền thông tin khách
→ Chỉnh sửa nếu cần → Chọn ngày mua → Xác nhận → Bảo hành kích hoạt
→ Có thể xuất PDF/Excel
```

### 4.4 Admin duyệt đơn

```
Xem đơn PENDING → Duyệt (CONFIRMED) → Chuẩn bị hàng (SHIPPING) → Giao xong (COMPLETED)
→ Hệ thống push WebSocket về Dealer App
```

---

## 5. Edge Cases

### 5.1 Thanh toán

| Trường hợp | Xử lý |
|---|---|
| `amount = 0` | `@DecimalMin(0.01)` từ chối tại request level |
| `amount > outstandingAmount` | Hard block — `BadRequestException` |
| `outstandingAmount = 0` | Client ẩn nút; server chặn cứng `BadRequestException` |
| Trùng lặp (cùng orderId + amount trong 5s) | Từ chối — `ConflictException` |

### 5.2 Serial & Bảo hành

| Trường hợp | Xử lý |
|---|---|
| Serial đã kích hoạt | Từ chối, lỗi "serial đã kích hoạt" |
| Serial không thuộc kho dealer | Từ chối — validation error |
| Serial trùng khi import | Bỏ qua item trùng, import tiếp các item còn lại |
| Đơn liên kết chưa `COMPLETED` | Từ chối (`PENDING`, `CONFIRMED`, `SHIPPING` đều bị từ chối) |
| Thông tin khách hàng trống | Tự điền từ receiver info của đơn (chi tiết tại [3.7](#37-bảo-hành)) |
| `ImportedSerialRecord` đã tồn tại | Bỏ qua, giữ nguyên `warehouseId` gốc |

### 5.3 Đơn hàng

| Trường hợp | Xử lý |
|---|---|
| Không đủ serial `AVAILABLE` | Từ chối tạo đơn |
| Sản phẩm bị xóa sau khi vào giỏ | Lỗi khi checkout, yêu cầu xóa item |
| Hủy đơn | Serial `RESERVED → AVAILABLE` (xem quy tắc tại [3.4](#34-đặt-hàng--thanh-toán)) |
| Reorder đơn cũ | Thêm vào giỏ, snackbar "Đã thêm X sản phẩm, bỏ qua Y (hết hàng)" |

### 5.4 Giỏ hàng

| Trường hợp | Xử lý |
|---|---|
| Offline / lỗi mạng | Rollback optimistic update, hiện lỗi |
| Mutation version conflict | Giữ version cao nhất |
| Token hết hạn khi thao tác | Trigger refresh, retry sau khi có token mới |

### 5.5 Giao diện & Cài đặt

| Trường hợp | Xử lý |
|---|---|
| `DateTime` tháng 13+ | `DateTime(year, month + n, ...)` tự overflow sang năm sau |
| Snackbar khi widget đã unmount | Check `!mounted` trước `ScaffoldMessenger` |
| Snackbar từ `didChangeDependencies` | Dùng `addPostFrameCallback` (`_showSnackBarDeferred`) |
| Theme `system` | Lưu chuỗi `'system'` — không lưu sai thành `'light'` |

---

## 6. So sánh nền tảng

### Dealer App vs Admin Dashboard

| Tính năng | Dealer App | Admin Dashboard |
|---|---|---|
| Xem đơn hàng | Chỉ đơn của mình | Toàn bộ |
| Thay đổi trạng thái đơn | Hủy (`PENDING`/`CONFIRMED` only) | PENDING→CONFIRMED→SHIPPING→COMPLETED, hoặc hủy |
| Ghi nhận thanh toán | Tự ghi, hiệu lực ngay | Ghi thay dealer; bank transfer tự động qua SePay |
| Quản lý sản phẩm | Chỉ đọc | CRUD đầy đủ |
| Quản lý serial | Xem kho + kích hoạt bảo hành + cập nhật status | Import, xem tất cả, cập nhật status, xóa |
| Thông báo | WebSocket + push | Dashboard admin |
| Ngôn ngữ | VI / EN (user chọn) | Cố định |
| Audit log | Không | Có (mọi mutation admin) |

### Main Website vs Dealer App

| Tính năng | Main Website (Next.js) | Dealer App (Flutter) |
|---|---|---|
| Đối tượng | Khách hàng public, SEO | Đại lý đã xác thực |
| Xem sản phẩm | Có (ISR, cached) | Có (live API) |
| Đặt hàng | Không | Có |
| Auth | Không bắt buộc | Bắt buộc (JWT) |

---

## 7. Giả định & Điểm mở

### 7.1 Giả định hiện tại

1. **Một đơn = một warehouse** — không hỗ trợ lấy hàng từ nhiều kho.
2. **Giá snapshot tại thời điểm đặt** — không có cơ chế cập nhật giá đơn cũ.
3. **VAT = 10% cố định** — áp dụng đồng nhất mọi sản phẩm.
4. **Một serial = một lần kích hoạt** — không hỗ trợ chuyển bảo hành.
5. **Thanh toán tự động qua SePay** — bank transfer tự xác nhận khi webhook khớp; ghi nợ dealer tự ghi, hiệu lực ngay; admin có thể ghi override.
6. **Công nợ không tính lãi** — `outstandingAmount` không thay đổi theo thời gian.

### 7.2 Điểm mở / Cần làm rõ

| Điểm | Hiện trạng | Cần làm rõ |
|---|---|---|
| Admin override giá | Order có `subtotalOverride`, `vatOverride`, `totalOverride` | Ai được override, khi nào, flow ra sao? |
| `paymentStatus` vs `status` | Hai field độc lập (ví dụ: `paymentStatus=PAID` nhưng `status=PENDING`) | Cần document quan hệ và các tổ hợp hợp lệ |
| Warranty transfer | Không có tính năng | Có cần hỗ trợ chuyển bảo hành sang chủ mới không? |
| Serial `DEFECTIVE` / `RETURNED` không có lối ra | Không có endpoint reset về `AVAILABLE` — serial bị treo vĩnh viễn | Cần bổ sung flow admin reset + quy trình RMA |
| Serial `RESERVED` không có timeout | Serial `RESERVED` vô thời hạn nếu admin không duyệt/hủy đơn → dealer khác không đặt được | Cân nhắc: auto-hủy đơn PENDING quá X giờ; hoặc cảnh báo admin |
| Support ticket SLA | Không có timeout/SLA | Cần bổ sung nếu cam kết thời gian phản hồi |
| `RESERVED` có thể bỏ | `RESERVED` và `ASSIGNED` chỉ khác nhau ở `order.status`; admin gán thủ công đã bỏ | Kỹ thuật nợ: cân nhắc bỏ `RESERVED` khỏi enum, dùng `ASSIGNED` trực tiếp |
| Bulk discount + product-specific rule cùng match | Code ưu tiên product-specific | Cần confirm đây là business decision hay chỉ là implementation default |

---

*Cập nhật: 2026-03-21 — Phân tích từ source code toàn dự án.*
