## 0.0 Runtime Contract Override (2026-04-08)

This override supersedes older debt-related references elsewhere in this document.

- Only `BANK_TRANSFER` is supported for new runtime order and payment flows.
- Dealers still create the order first. Order creation must generate a real order, assign `orderCode`, reserve stock and serials, and keep idempotency behavior.
- New checkout orders must start with `order.status = PENDING` and `paymentStatus = PENDING` until bank-transfer money is reconciled.
- Admin must not confirm or process an unpaid order. Backend enforcement is authoritative: `PENDING -> CONFIRMED` requires `paymentStatus = PAID`.
- Unpaid `PENDING` orders may expire after the configured timeout and auto-cancel only when no money has been recorded. Timeout cancellation must release reserved inventory and serials.
- If money has already been recorded for a stale `PENDING` order, the order must not be blindly auto-cancelled; it must stay in manual finance review handling.
- Historical `DEBT` and `DEBT_RECORDED` data are not auto-converted inside business logic. Clean them up through explicit rollout or migration work before full production rollout.

---
# Tài liệu Logic Nghiệp Vụ — Hệ thống 4thitek

> Phiên bản: 2026-03-23
> Phạm vi: Backend (Spring Boot) · Dealer App (Flutter) · Admin Dashboard (React) · Main Website (Next.js)

---

## Mục lục

0. [Quy ước Nguồn Sự Thật](#0-quy-ước-nguồn-sự-thật)
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
   - [3.8 Xuất hàng theo serial](#38-xuất-hàng-theo-serial)
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
   - [3.22 Data Contract Consistency](#322-data-contract-consistency)
   - [3.23 Error Contract](#323-error-contract)
   - [3.24 Audit & Traceability](#324-audit--traceability)
   - [3.25 Refund & Reversal](#325-refund--reversal)
4. [User Flow](#4-user-flow)
5. [Edge Cases](#5-edge-cases)
6. [So sánh nền tảng](#6-so-sánh-nền-tảng)
7. [Giả định Chuẩn & Pending Decisions](#7-giả-định-chuẩn--pending-decisions)

---

## 0. Quy ước Nguồn Sự Thật

Tài liệu này là **canonical business contract** cho hệ thống 4thitek kể từ phiên bản `2026-03-22`.
Mọi mục **không** gắn `[Pending Decision]` phải được xem là rule production. Nếu code, QA, hoặc frontend lệch với các rule này thì phải coi đây là defect hoặc có quyết định thay đổi contract.

### 0.1 Nhãn trạng thái

| Nhãn | Ý nghĩa | Cách sử dụng |
|---|---|---|
| `[Implemented]` | Đã phản ánh đúng behavior hiện đang chạy trong code | Backend, frontend, QA và tài liệu phụ phải bám theo |
| `[Policy]` | Quy định nghiệp vụ/công ty bắt buộc áp dụng trên toàn hệ thống | Nếu code lệch policy, phải sửa code hoặc có quyết định thay đổi policy |
| `[Pending Decision]` | Vấn đề chưa chốt hoặc target state chưa implement | Không được xem là contract production hiện hành |

### 0.2 Thứ tự ưu tiên khi đọc tài liệu

1. Rule có nhãn `[Implemented]` là contract runtime hiện hành.
2. Rule có nhãn `[Policy]` là ràng buộc bắt buộc cho toàn hệ thống.
3. Rule có nhãn `[Pending Decision]` chỉ là backlog/định hướng, **chưa** phải logic production.

### 0.3 Phạm vi hiện đã đủ chặt để làm source of truth

- Auth, phân quyền, dealer lifecycle (bao gồm ACTIVE ↔ SUSPENDED)
- Order lifecycle, serial lifecycle, warranty lifecycle
- Order creation idempotency (`X-Idempotency-Key`)
- Reserved timeout auto-cancel (48h) cho đơn PENDING
- Guard condition hủy đơn có nghĩa vụ tài chính (`FinancialSettlement`)
- RMA / serial reset qua bước trung gian `INSPECTING`
- Admin financial adjustment (correction, write-off, credit note, refund record)
- Unmatched SePay transaction handling
- SePay exact-match policy + unmatched payment queue
- Debt payment accepted risk + compensating controls
- Support ticket workflow
- Upload private/public access
- Report export contract
- Rate limiting hiện tại
- VAT runtime do backend settings quản lý (default 10) và `shippingFee = 0` theo policy công ty

### 0.4 Phạm vi còn mở / chưa chốt production contract

- Support SLA và support thread nhiều lượt
- Admin override giá (`subtotalOverride`, `vatOverride`, `totalOverride`) — chưa có rule
- Warranty transfer (chuyển bảo hành sang chủ mới)
- Full refund gateway integration (auto-refund ra tài khoản ngoài hệ thống)
- Audit log retention policy + read API / UI cho admin

> Nguyên tắc thay đổi: mọi thay đổi behavior ở các vùng `[Implemented]` hoặc `[Policy]` phải cập nhật file này cùng lúc với code trong cùng một batch thay đổi.

### 0.5 Nguyên tắc bổ sung

> Các chi tiết thuần implementation như local persistence, optimistic update, widget lifecycle, hay tên màn hình legacy không nên được dùng để thay đổi business contract. File này là nguồn duy nhất cho contract nghiệp vụ.

---

## 1. Tổng quan hệ thống

Hệ thống quản lý phân phối sản phẩm B2B: đại lý đặt hàng, theo dõi công nợ, quản lý kho serial, kích hoạt bảo hành.

### Kiến trúc

| Thành phần | Công nghệ | Vai trò |
|---|---|---|
| **Backend** | Spring Boot 3.4.3, Java 17, PostgreSQL, Redis-ready config (optional), AWS S3 | REST API + WebSocket |
| **Dealer App** | Flutter (Material 3), Dart, ChangeNotifier | Ứng dụng mobile cho đại lý |
| **Admin Dashboard** | React 18, TypeScript, Vite | Giao diện quản trị nội bộ |
| **Main Website** | Next.js (App Router) | Trang web public (ISR, SEO) |

```
Dealer App (Flutter) ──── REST + WebSocket ────┐
                                                ▼
Admin Dashboard (React) ──── REST ────â–º Backend API ──── PostgreSQL
                                                │    ──── Redis (optional / theo môi trường)
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
| `GET /api/v1/admin/settings`, `PUT /api/v1/admin/settings` | `SUPER_ADMIN` only |
| `/api/v1/admin/**` | `ADMIN`, `SUPER_ADMIN` |
| `/api/v1/dealer/**` | `DEALER` |
| `POST /api/v1/warranty-activation` | `DEALER` |
| `POST /api/v1/upload/products`, `/upload/blogs`, `/upload/avatars` | `ADMIN`, `SUPER_ADMIN` |
| `POST /api/v1/upload/dealer-avatars`, `/upload/payment-proofs` | `DEALER`, `ADMIN`, `SUPER_ADMIN` |
| `DELETE /api/v1/upload` | `DEALER`, `ADMIN`, `SUPER_ADMIN` |
| `GET /api/v1/upload/**` | Public ở tầng security; path public (`products/`, `blogs/`) mở công khai, path private bị `UploadController` chặn theo auth/ownership |
| `/api/v1/auth/**`, `/api/v1/content/**`, `/api/v1/blog/**`, `/api/v1/product/**` | Public |
| `/api/v1/warranty/check/**`, `/api/v1/webhooks/sepay` | Public |
| `GET /api/v1/user/dealer`, `GET /api/v1/user/dealer/page` | Public |
| `/uploads/**`, `/ws/**`, `/api/v1/health`, `/v3/api-docs/**`, `/swagger-ui/**` | Public |

> `ADMIN` và `SUPER_ADMIN` hỗ trợ dealer qua `/api/v1/admin/**`, upload route phù hợp, và các topic admin WebSocket; runtime hiện tại **không** cho admin dùng chung namespace `/api/v1/dealer/**`. `SUPER_ADMIN` có quyền riêng cho quản lý staff (`/api/v1/admin/users/**`) và system settings (`/api/v1/admin/settings`). Toàn bộ phân quyền enforce tại server — Dealer App không thực hiện role-check phía client.

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
| F10 | Xuất hàng theo serial | Gom serial đủ điều kiện, nhập thông tin khách, kích hoạt nhiều serial trong một lượt |
| F11 | Thông báo real-time | WebSocket, reconnect + refetch khi kết nối lại |
| F12 | Hỗ trợ | Tạo ticket, xem phản hồi, lịch sử |
| F13 | Dashboard | Tổng quan theo kỳ tháng/quý |
| F14 | Cài đặt | Ngôn ngữ (VI/EN), giao diện (dark/light/system) |

### Admin Dashboard

| # | Chức năng |
|---|---|
| A01 | Quản lý đại lý (danh sách, duyệt tài khoản, cập nhật hồ sơ, credit limit) |
| A02 | Quản lý sản phẩm & SKU |
| A03 | Quản lý đơn hàng, duyệt & chuyển trạng thái |
| A04 | Quản lý bảo hành |
| A05 | Quản lý kho serial (import, cập nhật, xóa) |
| A06 | Gửi thông báo cho đại lý |
| A07 | Báo cáo & xuất dữ liệu |
| A08 | Audit log backend cho mutation admin |

---

## 3. Logic nghiệp vụ chi tiết

---

### 3.1 Xác thực & phân quyền

#### Đăng nhập — `POST /api/v1/auth/login`

Nhận `username` (email hoặc username) + `password`. Quy trình:
1. Normalize input (trim, lowercase)
2. Xác thực một bước qua `AuthenticationManager` (bcrypt) — không tách riêng email/password để tránh timing attack
3. Nếu thất bại (sai credentials hoặc tài khoản disabled) → trả `invalidCredentials` (thông báo chung)
4. Phát hành `accessToken` (JWT, TTL **30 phút**) + `refreshToken` (TTL **7 ngày**, có session id server-side)

> Chỉ dealer `ACTIVE` mới đăng nhập thành công. Dealer `UNDER_REVIEW` / `SUSPENDED` bị trả `401` ngay tại bước login và không nhận token.

#### Token Refresh — `POST /api/v1/auth/refresh`

Trả cặp token mới nếu `refreshToken` còn hợp lệ, tài khoản còn `enabled`, và dealer vẫn có `customerStatus = ACTIVE`. `UNDER_REVIEW` / `SUSPENDED` bị trả `401` tại bước refresh. Hết hạn → `401` → client buộc logout, xóa token. Refresh thành công sẽ rotate `refreshToken`; token cũ bị revoke ngay.

> Refresh token được validate thêm bằng trạng thái session phía server. Logout sẽ revoke refresh token/session hiện tại.

#### Đăng xuất

Client xóa token/local state (cart, orders, warranty, notifications); backend đồng thời revoke refresh token/session hiện tại nếu client gửi body token hoặc refresh cookie.

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
- `stock â‰¤ 10` (`kLowStockThreshold`) → cảnh báo "sắp hết hàng"
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
vatAmount          = totalAfterDiscount × vatPercent // VAT lấy từ backend settings (default 10)
total              = totalAfterDiscount + vatAmount // Không có phí giao hàng theo policy công ty
```

> `shippingFee` luôn = 0 theo policy công ty — server từ chối bất kỳ giá trị nào khác 0.

**Chiết khấu theo số lượng (Bulk Discount):**

Quy tắc ưu tiên khi chọn rule áp dụng:
1. Rule product-specific ưu tiên hơn rule global
2. Trong cùng loại: chọn `minQty` cao nhất phù hợp
3. Cùng `minQty`: chọn `discountPercent` cao nhất

```
BulkDiscountRule { productId? (null = global), minQty, maxQty?, discountPercent }
```

Chỉ rule có `status = ACTIVE` được áp dụng. `BulkDiscountTarget` hiển thị tiến trình đến tier tiếp theo.

**Validation:** số lượng â‰¥ 1, â‰¤ stock, không cho phép thêm sản phẩm hết hàng.

---

### 3.4 Đặt hàng & Thanh toán

**Trạng thái section:** `[Implemented]` cho tạo đơn, order status, SePay webhook, dealer/admin payment hiện tại. `[Policy]` cho VAT backend-configurable (default 10) và `shippingFee = 0`. `[Pending Decision]` cho debt payment verification nhiều bước trong tương lai.

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
1. Validate sản phẩm tồn tại; backend khóa inventory liên quan và pick đủ serial `AVAILABLE` thực tế cho từng SKU trước khi tạo đơn
2. Snapshot giá → lưu `unitPrice` vào `DealerOrderItem` (giá thay đổi sau không ảnh hưởng)
3. Tính subtotal, discount, VAT, total từ backend pricing engine; enforce `shippingFee = 0` theo policy công ty
4. Nếu `DEBT`: kiểm tra `currentOutstandingDebt + total â‰¤ creditLimit` — dùng `SELECT FOR UPDATE` trên row Dealer
5. Reserve serial: khóa row `Product` và serial liên quan, pick đúng số serial từ pool khả dụng `dealer IS NULL AND order IS NULL AND status = AVAILABLE`, chuyển `AVAILABLE → RESERVED` trong cùng transaction; sau đó đồng bộ `product.stock` như giá trị phái sinh
6. Lưu đơn `status = PENDING`; gửi email xác nhận cho dealer (async); publish `adminNewOrder` WebSocket

**Idempotency `[Policy]`:**
- Client **phải** gửi header `X-Idempotency-Key` (UUID v4) với mỗi request tạo đơn
- Backend lưu mapping `idempotencyKey → orderId + response` trong **10 phút** (configurable via `app.order.idempotency-ttl-minutes`)
- Request trùng `idempotencyKey` trong TTL → trả response cũ, **không** tạo đơn mới, không reserve serial lần nữa
- Request không có `X-Idempotency-Key` → `400 Bad Request`
- Ngăn double-order do network retry, double-click, hoặc client retry sau timeout

Client tự gọi `DELETE /api/v1/dealer/cart` sau khi nhận phản hồi thành công.

> Runtime hiện tại dùng pool serial khả dụng `dealer IS NULL AND order IS NULL AND status = AVAILABLE` làm nguồn sự thật để chặn oversell giữa các dealer. `Product.stock` chỉ còn là số liệu đồng bộ/phái sinh từ pool serial khả dụng của SKU. Serial còn `dealer IS NULL` nhưng đã gắn `order` không còn được tính là tồn kho bán được.

**Mã đơn:** `SCS-{dealerId}-{timestamp}-{random6}` — dùng để khớp nội dung chuyển khoản SePay.

#### Trạng thái đơn hàng

```
PENDING ──â–º CONFIRMED ──â–º SHIPPING ──â–º COMPLETED
   │              │
   └──────────────â”´──────────────────â–º CANCELLED
```

| Transition | Ai thực hiện | Hệ quả |
|---|---|---|
| `PENDING → CONFIRMED` | Admin | — |
| `CONFIRMED → SHIPPING` | Admin | WebSocket `/user/queue/order-status` → dealer |
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

**Unmatched transaction handling `[Policy]`:**

Khi webhook nhận giao dịch nhưng không thể khớp tự động (orderCode không tồn tại, amount không bằng `outstandingAmount`, hoặc đơn đã CANCELLED/PAID):

1. **Không im lặng bỏ qua** — ghi vào bảng `UnmatchedPayment`:
   - `transactionCode`, `amount`, `senderInfo`, `content` (nội dung chuyển khoản), `receivedAt`
   - `reason`: `ORDER_NOT_FOUND` | `AMOUNT_MISMATCH` | `ORDER_ALREADY_SETTLED` | `ORDER_CANCELLED`
   - `status`: `PENDING`
2. Backend gửi notification cho admin: *"Giao dịch SePay không khớp đơn hàng — cần xử lý thủ công"*
3. Admin review qua `GET /api/v1/admin/unmatched-payments` (có phân trang, filter theo status/reason)
4. Admin xử lý qua `PATCH /api/v1/admin/unmatched-payments/{id}`:
   - `MATCHED` — gán thủ công vào order phù hợp (tạo payment record cho order đó)
   - `REFUNDED` — đã hoàn tiền ngoài hệ thống
   - `WRITTEN_OFF` — xử lý ngoại lệ, ghi chú lý do
5. Unmatched payment `status = PENDING` phải hiển thị trong admin dashboard widget **"Giao dịch chờ đối soát"**

> Mục tiêu: không bao giờ để tiền vào tài khoản NPP mà hệ thống không có record theo dõi.

Nếu `sepay.enabled=true`, dealer **không thể** tự ghi payment cho đơn bank transfer. Admin có thể override qua `POST /api/v1/admin/orders/{id}/payments`.

**Đồng bộ FE sau SePay thành công** `[Implemented]`
- Khi webhook SePay xác nhận thanh toán thành công, backend cập nhật trạng thái payment/order và publish event `/user/queue/order-status`.
- Dealer App đồng bộ lại trạng thái thanh toán qua WebSocket; khi reconnect sẽ refetch lại dữ liệu liên quan.
- Nếu người dùng đang mở bank-transfer sheet, sheet tự đóng khi thấy `paymentStatus = PAID`.
- Nếu người dùng đang ở `OrderSuccessScreen` hoặc màn đang đọc cùng order state, UI đổi sang trạng thái đã thanh toán sau khi sync.
- Hiện chưa có cơ chế redirect toàn cục từ mọi context bất kỳ sang một màn success riêng.

#### Thanh toán — Ghi nợ (Debt) `[Implemented]`

`paymentStatus = DEBT_RECORDED` ngay khi tạo đơn. `outstandingAmount = total âˆ’ paidAmount` (tính động, không lưu field riêng).

#### Ghi nhận thanh toán công nợ — `POST /api/v1/dealer/orders/{id}/payments` `[Implemented]`

```json
{ "amount": 1000000, "method": "BANK_TRANSFER|DEBT|...", "channel": "cash|bankTransfer|...",
  "note": "...", "proofFileName": "...", "paidAt": "2026-03-21T10:00:00Z" }
```

**Behavior hiện hành:**
- Dealer tự tạo payment record cho đơn còn nợ của mình
- Payment có hiệu lực ngay khi request hợp lệ và transaction commit thành công
- `outstandingAmount` giảm ngay sau khi payment được ghi nhận

**Validation hiện hành:**
- `amount > 0` (`@DecimalMin(0.01)`)
- `amount â‰¤ outstandingAmount`
- `outstandingAmount > 0` — đơn đã đủ → từ chối
- Trùng lặp: cùng `orderId` + `amount` trong **30 giây** → từ chối (check DB trực tiếp)
- `transactionCode` unique toàn hệ thống (nếu có)
- Dùng `SELECT FOR UPDATE` trên row Order

**Quy tắc hạch toán hiện hành:**
- `paidAmount`: tổng payment đã được ghi nhận
- `outstandingAmount = max(0, total âˆ’ paidAmount)`

> Đây là contract runtime hiện tại. Chưa có bước `PENDING_VERIFICATION / CONFIRMED / REJECTED` ở production flow.

#### Admin ghi payment — `POST /api/v1/admin/orders/{id}/payments` `[Implemented]`

Payload như dealer + không bị chặn bởi SePay restriction. Admin có thể ghi payment trực tiếp trong các trường hợp hỗ trợ/override.

> Về quản trị dữ liệu, vẫn ưu tiên soft-delete hoặc archive thay vì xóa cứng đơn `CANCELLED`, nhưng đây hiện là định hướng quản trị hơn là contract API bắt buộc.

#### Ma trận `order.status` và `paymentStatus` `[Implemented]`

`paymentStatus` hiện tại là aggregate field ở level Order, được suy ra từ `paymentMethod`, `paidAmount`, `totalAmount`, và `order.status`.

| `order.status` | `paymentStatus` hợp lệ trong runtime hiện tại | Diễn giải |
|---|---|---|
| `PENDING` | `PENDING`, `DEBT_RECORDED`, `PAID` | Chưa duyệt đơn; có thể chưa thanh toán, ghi nợ, hoặc đã thanh toán |
| `CONFIRMED` | `PENDING`, `DEBT_RECORDED`, `PAID` | Đơn đã duyệt nhưng chưa giao xong |
| `SHIPPING` | `PENDING`, `DEBT_RECORDED`, `PAID` | Đang giao hàng; không có partial-payment status riêng trong runtime hiện tại |
| `COMPLETED` | `PENDING`, `DEBT_RECORDED`, `PAID` | Hoàn tất giao hàng; serial vào kho dealer |
| `CANCELLED` | `CANCELLED`, `PENDING`, `DEBT_RECORDED`, `PAID` | `CANCELLED` chỉ xảy ra khi hủy đơn và `paidAmount = 0`; các combo còn lại có nghĩa là đã/đang có nghĩa vụ tài chính cần xử lý manual |

**Quy tắc khống chế:**
- `FAILED` không phải aggregate `order.paymentStatus` trong runtime hiện tại; đây là thất bại của giao dịch/attempt riêng, không phải trạng thái chuẩn của Order
- `CANCELLED` không hợp lệ cho order chưa `CANCELLED`
- Các tổ hợp `CANCELLED + (PENDING|DEBT_RECORDED|PAID)` không bị runtime chặn, nhưng phải được xem là **manual finance follow-up required**

#### Dealer hủy đơn `[Implemented]`

- Dealer chỉ được hủy `PENDING` hoặc `CONFIRMED`
- Dealer **không** được hủy `SHIPPING`, `COMPLETED`, `CANCELLED`
- Khi hủy: serial `RESERVED → AVAILABLE`, đơn chuyển `CANCELLED`, và backend gửi notification cho admin
- Nếu hủy khi `paidAmount = 0` → `paymentStatus = CANCELLED`
- Nếu hủy khi đơn đã có `paidAmount > 0` → runtime **không** tự refund, không tự reverse debt, không tự sinh compensating transaction; `paymentStatus` sẽ được giữ theo aggregate hiện hành và cần xử lý manual

> Nghĩa là dealer có thể hủy `CONFIRMED` kể cả khi đơn đã có thanh toán hợp lệ. Việc hoàn tiền / xóa công nợ / bút toán đối ứng **chưa** được tự động hóa trong runtime hiện tại.

#### Guard condition hủy đơn có nghĩa vụ tài chính `[Policy]`

Khi dealer hoặc admin hủy đơn mà `paidAmount > 0` tại thời điểm hủy:

1. Hệ thống **phải** tạo record `FinancialSettlement`:
   - `type`: `CANCELLATION_REFUND`
   - `orderId`: ID đơn bị hủy
   - `amount`: `paidAmount` tại thời điểm hủy
   - `status`: `PENDING`
   - `createdBy`: actor thực hiện hủy
   - `createdAt`: timestamp
2. Order chuyển `CANCELLED` nhưng gắn flag `financialSettlementRequired = true`
3. Backend gửi notification cho **tất cả admin ACTIVE** yêu cầu xử lý settlement
4. Settlement record phải được xử lý (→ `REFUNDED` | `WRITTEN_OFF` | `CREDITED`) trước khi đơn được coi là fully settled
5. Admin xử lý settlement qua `PATCH /api/v1/admin/financial-settlements/{id}`:
   - `status`: `REFUNDED` | `WRITTEN_OFF` | `CREDITED`
   - `resolution`: mô tả cách xử lý
   - `resolvedBy`: actor ID
   - `resolvedAt`: timestamp

**Dashboard visibility:** Đơn có `financialSettlementRequired = true` AND settlement `status = PENDING` phải hiển thị trong admin dashboard widget **"Chờ xử lý tài chính"**.

> Nếu `paidAmount = 0`: hủy bình thường, không tạo settlement record.

---

### 3.5 Theo dõi công nợ

**Trạng thái section:** `[Implemented]`

**Màn hình:** `DebtTrackingScreen` — mở từ shortcut Dashboard (không phải tab độc lập).

Hiển thị các đơn thỏa: `paymentMethod = DEBT AND outstandingAmount > 0 AND status â‰  CANCELLED`.

Tổng hợp: tổng nợ tồn (`Σ outstandingAmount`), số đơn còn nợ, danh sách có thể bấm để ghi nhận thanh toán.

> Dealer có thể ghi nhận thanh toán cho đơn còn nợ của mình; khi request thành công thì payment có hiệu lực ngay, `paidAmount` và `outstandingAmount` được cập nhật ngay theo payment đã ghi. Không có bước kiểm duyệt trung gian trong runtime hiện tại.

---

### 3.6 Kho hàng & Serial

**Trạng thái section:** `[Implemented]` cho lifecycle hiện tại. `[Pending Decision]` cho RMA/reset serial từ `DEFECTIVE` hoặc `RETURNED`.

**Mô hình:**
```
ProductSerial { serial (unique toàn hệ thống), product, warehouse,
                status: AVAILABLE|RESERVED|ASSIGNED|WARRANTY|DEFECTIVE|RETURNED|INSPECTING|SCRAPPED, importedAt }
```

**Vòng đời trạng thái:**
```
AVAILABLE ──► RESERVED ──► ASSIGNED ──► WARRANTY
(admin import)  (đặt đơn)   (COMPLETED)  (kích hoạt)
     ▲               │            │
     └───────────────┘            ├──► DEFECTIVE ──► INSPECTING ──► AVAILABLE (qua QC)
  (đơn hủy)                      │                             └──► SCRAPPED (loại bỏ)
                                  └──► RETURNED  ──► INSPECTING ──► AVAILABLE (qua QC)
                                                                └──► SCRAPPED (loại bỏ)
```

> `SCRAPPED` là trạng thái cuối — serial ra khỏi inventory vĩnh viễn. Xem [RMA / serial reset](#rma--serial-reset-cho-defective-và-returned-policy) trong Section 7.3 cho quy trình chi tiết.

> `WARRANTY` hiển thị là `activated` trong Dealer App.

**Ownership semantics (canonical):**
- `AVAILABLE`: tài sản của NPP, chưa giữ cho đơn nào
- `RESERVED`: tài sản của NPP, đã giữ cho một order, chưa thuộc dealer
- `ASSIGNED`: đã vào kho dealer, thuộc dealer
- `WARRANTY`: đã bán ra và kích hoạt cho khách cuối

**Import serial (Admin) — `POST /api/v1/admin/serials/import`:**
- Bulk import; normalize: trim + uppercase
- Serial đã tồn tại trong DB không làm fail cả batch; item đó bị skip với reason rõ ràng trong response summary
- Duplicate lặp lại trong cùng request được dedupe một lần; các serial hợp lệ còn lại vẫn tiếp tục import
- Response trả partial-success summary gồm `importedItems`, `skippedItems`, `importedCount`, `skippedCount`
- Nếu import và đồng thời link serial vào một order:
  - order `COMPLETED` → serial buộc về `ASSIGNED`
  - order chưa `COMPLETED` → serial buộc về `RESERVED`
  - không được dùng `AVAILABLE` cho serial đã gắn order
  - nếu client gửi `RESERVED` hoặc `ASSIGNED`, backend vẫn chuẩn hóa về trạng thái bắt buộc theo order; các status khác bị từ chối

**Auto-reserve khi tạo đơn:** Hệ thống tự pick serial `AVAILABLE` đúng số lượng từ pool serial thực tế. Không đủ → từ chối đơn.

**Serial vào kho dealer:** Khi đơn chuyển `COMPLETED` → backend gán serial cho dealer (`serial.dealer = order.dealer`), chuyển `RESERVED → ASSIGNED`, đồng thời đồng bộ lại `product.stock` từ pool serial còn `AVAILABLE` của NPP.

> Serial chỉ **chính thức thuộc dealer** kể từ thời điểm đơn chứa serial đó chuyển `COMPLETED`. Ở trạng thái `RESERVED`, serial mới chỉ được giữ cho đơn, chưa được coi là tài sản/kho chính thức của dealer.

> Dealer inventory runtime chỉ hiển thị serial đã thuộc dealer và hoặc không gắn order, hoặc gắn order đã `COMPLETED`. Serial gắn order chưa hoàn tất chưa được coi là tồn kho khả dụng của dealer.

**Dealer cập nhật trạng thái:** `PATCH /api/v1/dealer/serials/{id}/status` — đánh dấu `DEFECTIVE` hoặc `RETURNED` (chỉ áp dụng cho serial `ASSIGNED` hoặc `WARRANTY`).

---

### 3.7 Bảo hành

**Trạng thái section:** `[Implemented]`

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
3. Dealer App hiện yêu cầu dealer nhập thủ công cả `name/email/phone/address`; ở backend, nếu request để trống `name/phone/address` thì server mới fallback từ receiver info của đơn. `email` luôn phải dealer nhập thủ công
4. Dealer chọn `purchaseDate` (mặc định = ngày tạo đơn, có thể chỉnh)
5. Gọi API → tạo `WarrantyRegistration`, cập nhật serial `→ WARRANTY`
6. Ngày hết bảo hành = `purchaseDate + warrantyMonths`

**Validation:** một serial chỉ kích hoạt một lần; chỉ serial đã **chính thức thuộc dealer** (tức đã vào kho dealer qua đơn `COMPLETED`) mới được kích hoạt; `purchaseDate` không trước ngày tạo đơn, không sau hôm nay; tất cả thông tin khách hàng bắt buộc.

> Runtime hiện tại coi `POST /api/v1/warranty-activation` là endpoint kích hoạt bảo hành chuẩn. `POST /api/v1/dealer/warranties` hiện là alias cùng semantics cho hành vi activate/create warranty đầu tiên, không phải một business action khác.

**Trạng thái bảo hành:**

| Status | Mô tả |
|---|---|
| `ACTIVE` | Còn hiệu lực |
| `EXPIRED` | Hết hạn theo `purchaseDate + warrantyMonths` |
| `VOID` | Bị vô hiệu hoá bởi admin (ví dụ: vi phạm điều khoản) |

**Admin quản lý — `PATCH /api/v1/admin/warranties/{id}/status`:**
- Không thể set `ACTIVE` nếu warranty đã expired
- Đồng bộ serial theo trạng thái warranty:
  - `ACTIVE` → serial `WARRANTY`
  - `EXPIRED` hoặc `VOID` → serial về `ASSIGNED` nếu gắn với đơn `COMPLETED`, ngược lại về `AVAILABLE`
  - nếu serial đang `DEFECTIVE` hoặc `RETURNED` thì giữ nguyên, không bị warranty update ghi đè
- Mọi thay đổi clear cache `PUBLIC_WARRANTY_LOOKUP`

**Dealer Warranty CRUD (`/api/v1/dealer/warranties`):** `POST /api/v1/dealer/warranties` hiện dùng cùng logic activate với `POST /api/v1/warranty-activation`; `PUT` và `DELETE` dùng để sửa/xóa bản ghi warranty đã tồn tại. Khi xóa:
- Đơn `COMPLETED` hoặc serial đang `WARRANTY` → serial về `ASSIGNED`
- Đơn chưa hoàn thành → serial về `AVAILABLE`

**Local sync (Dealer App):** Cache bảo hành trong `SharedPreferences`. Khi boot: tải từ `/api/v1/dealer/serials` và `/api/v1/dealer/warranties`. `_ensureImportedSerialsForActivations()` tạo dummy record nếu thiếu, bảo toàn `warehouseId` gốc khi đã có.

---

### 3.8 Xuất hàng theo serial

**Màn hình:** `WarrantyExportScreen` — tên UI hiện tại là "Xuất hàng".

1. Scan QR hoặc nhập serial; app validate serial đủ điều kiện kích hoạt
2. Thêm serial vào "giỏ xuất hàng"
3. Dealer nhập thông tin khách hàng + ngày mua
4. App gọi luồng kích hoạt bảo hành serial-first cho từng serial trong giỏ

> Màn hình này hiện **không** tạo file PDF/Excel. Tên `WarrantyExportScreen` là tên màn hình legacy trong code, nhưng behavior thực tế là gom serial để kích hoạt bảo hành theo lô.

---

### 3.9 Dashboard báo cáo

**Màn hình:** Tab "Tổng quan" (`DashboardScreen`). Bộ lọc: `tháng` hoặc `quý`, điều hướng kỳ trước/sau.

| Card | Mô tả |
|---|---|
| Quick Actions | Shortcut: Tạo đơn, Công nợ, Kho hàng, Bảo hành |
| Overview | Doanh thu, công nợ tồn, số đơn, tỷ lệ hoàn thành — theo kỳ |
| Low Stock Alert | Sản phẩm `stock â‰¤ 10` |
| Order Status Distribution | Phân bổ trạng thái đơn trong kỳ |
| Revenue Chart | Doanh thu theo tháng trong kỳ |
| Aging Debt | Công nợ phân theo tuổi nợ |
| Activation Trend | Xu hướng kích hoạt bảo hành — theo **kỳ được chọn** |
| Warranty Status Donut | Tỷ lệ serial đã/chưa kích hoạt — cửa sổ cố định **90 ngày** |
| Recent Orders | Đơn hàng gần đây trong kỳ |

> Trên mobile: Activation Trend và Warranty Donut thu gọn mặc định.

---

### 3.10 Thông báo

**Kết nối:** WebSocket tại `/ws`. Token xác thực qua STOMP header `Authorization: Bearer ...` hoặc header native `token` khi CONNECT. Dealer App hiện dùng reconnect + refetch sau reconnect; không có polling loop định kỳ.

**Admin gửi thông báo — `POST /api/v1/admin/notifications`:**
- Targeting: `DEALERS` (toàn bộ dealer accounts, không filter `customerStatus`) | `ALL_ACCOUNTS` | `ACCOUNTS` (danh sách ID)
- Payload: `title`, `body`, `type` (SYSTEM | PROMOTION | ORDER | WARRANTY), `link?`, `deepLink?`

**Danh sách WebSocket events:**

| Event | Destination | Trigger | Nhận bởi |
|---|---|---|---|
| `orderStatusChanged` | `/user/queue/order-status` | Backend cập nhật trạng thái đơn hoặc payment status liên quan order | Dealer |
| `notificationCreated` | `/user/queue/notifications` | Backend tạo notification cho user cụ thể | User được chỉ định |
| `loginConfirmed` | `/user/queue/login-confirmed` | Đăng nhập thành công | User |
| `dealerRegistrationFromAuth` | `/topic/dealer-registrations` | Dealer đăng ký mới | Admin (broadcast) |
| `adminNewOrder` | `/topic/admin/new-orders` | Dealer tạo đơn | Admin (broadcast) |
| `adminNewSupportTicket` | `/topic/admin/support-tickets` | Dealer mở ticket | Admin (broadcast) |

> Event user-specific dùng `convertAndSendToUser(username, ...)`. Broadcast dùng `/topic/...`.

**API đọc/quản lý thông báo:**
- `GET /api/v1/dealer/notifications` — danh sách
- `PATCH /api/v1/dealer/notifications/{id}/read` — đánh dấu đã đọc
- `PATCH /api/v1/dealer/notifications/{id}/unread` — đánh dấu chưa đọc
- `PATCH /api/v1/dealer/notifications/read-all` — đọc tất cả (trả về `{ "status": "updated", "updatedCount": N }`)

**Loại thông báo:**
- Backend `NotifyType`: `SYSTEM` | `PROMOTION` | `ORDER` | `WARRANTY`
- Dealer App `DistributorNotice`: `order` | `system` | `promotion` | `warranty`
- Mapping hiện tại: `WARRANTY` được render như `warranty` trong Dealer App

**Push notification (FCM):**
- Khi app ở background hoặc terminated, WebSocket không hoạt động; backend gửi FCM push notification để đánh thức app.
- FCM chỉ kích hoạt khi `APP_FCM_ENABLED=true` và credentials được cấu hình (`APP_FCM_PROJECT_ID`, `APP_FCM_CREDENTIALS_JSON_BASE64`).
- Payload FCM chứa `notificationId` để Dealer App fetch chi tiết qua REST sau khi nhận push.

---

### 3.11 Hỗ trợ (Support Ticket)

**Trạng thái section:** `[Implemented]`

**Màn hình:** `SupportScreen` — truy cập từ tab Account.

**Tạo ticket:** category (`order|warranty|product|payment|returnOrder|other`), priority (`normal|high|urgent`), subject (â‰¤ 80 ký tự), message (â‰¤ 500 ký tự).

**Mô hình:** Một chiều — dealer gửi 1 message, admin trả lời qua `adminReply`. Không có chat thread.

**Trạng thái & transition hợp lệ:**
- `OPEN → IN_PROGRESS | CLOSED`
- `IN_PROGRESS → OPEN | RESOLVED | CLOSED`
- `RESOLVED → IN_PROGRESS | CLOSED`
- `CLOSED` là trạng thái cuối

**Mã ticket:** `SPT-{8 ký tự cuối epoch ms}` — tự động, unique.

**Thông báo khi admin cập nhật:** Dealer nhận in-app notification + email khi admin thay đổi status hoặc thêm/xóa reply.

**Quy tắc timestamp:**
- chuyển về `OPEN` hoặc `IN_PROGRESS` → clear `resolvedAt`, `closedAt`
- chuyển sang `RESOLVED` → set `resolvedAt` nếu chưa có, clear `closedAt`
- chuyển sang `CLOSED` → set `closedAt`; nếu chưa có `resolvedAt` thì set luôn

**Quy tắc `adminReply`:**
- `null` → giữ nguyên reply hiện tại
- chuỗi rỗng / chỉ có khoảng trắng → xóa reply hiện tại
- chuỗi có nội dung → thay thế reply hiện tại

**Liên hệ trực tiếp:** Hotline `1900 1234` · Email `support@4thitek.vn`

**Endpoints:**
- `POST /api/v1/dealer/support-tickets` — tạo ticket
- `GET /api/v1/dealer/support-tickets/latest` — ticket mới nhất
- `GET /api/v1/dealer/support-tickets/page` — lịch sử phân trang
- `PATCH /api/v1/admin/support-tickets/{id}` — admin cập nhật status / reply theo transition matrix ở trên

---

### 3.12 Cài đặt ứng dụng

- **Theme:** `light` | `dark` | `system` — `system` theo setting thiết bị.
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

> Audit log hiện là behavior ở backend; chưa có màn hình riêng hoặc read API riêng trong `admin-fe` để xem danh sách audit log.

---

### 3.15 Quản lý Đại lý (Admin)

**Trạng thái section:** `[Implemented]` cho lifecycle account hiện tại. `[Policy]` cho việc chỉ dealer `ACTIVE` mới dùng được portal và asset private.

| Endpoint | Mô tả |
|---|---|
| `GET /api/v1/admin/dealers/accounts` | Danh sách dealer |
| `GET /api/v1/admin/dealers/accounts/page` | Phân trang |
| `PUT /api/v1/admin/dealers/accounts/{id}` | Cập nhật profile dealer |
| `PATCH /api/v1/admin/dealers/accounts/{id}/status` | Bật/tắt account, cập nhật credit limit |

**Vòng đời tài khoản dealer:**
```
UNDER_REVIEW ──► ACTIVE ◄──► SUSPENDED
             └──► SUSPENDED
```

| Transition | Actor | Side effect |
|---|---|---|
| `UNDER_REVIEW → ACTIVE` | Admin | Email + in-app notification |
| `UNDER_REVIEW → SUSPENDED` | Admin | Email + in-app notification |
| `ACTIVE → SUSPENDED` | Admin | Email + notification; token hết hạn không refresh được; đơn `PENDING` của dealer chỉ auto-cancel sau grace period 24h khi **chưa ghi nhận tiền**; nếu đã có `paidAmount > 0` thì phải chuyển sang manual finance review; đơn CONFIRMED/SHIPPING giữ nguyên để admin xử lý |
| `SUSPENDED → ACTIVE` | Admin | Email + notification; dealer có thể login lại; đơn CONFIRMED/SHIPPING tiếp tục flow bình thường |

Admin cập nhật `creditLimit` độc lập hoặc cùng lúc đổi status.

**Email lifecycle:** Đăng ký mới → gửi email nhận hồ sơ. Thay đổi status → gửi email + in-app notification. Tất cả email gửi async (`@Async("mailTaskExecutor")`) — lỗi email không block transaction.

**Quy tắc truy cập portal (`assertDealerPortalAccess`):**
- Chỉ `status = ACTIVE` được đăng nhập, refresh token, gọi dealer API, kích hoạt bảo hành, và thao tác asset riêng của dealer (`dealer-avatars`, `payment-proofs`)
- `UNDER_REVIEW` → `401` với message *"Tài khoản đang chờ duyệt..."* ở login, refresh, và dealer API
- `SUSPENDED` → `401` với message tương ứng ở login, refresh, và dealer API
- Sau migration dữ liệu, mọi dealer phải có `customerStatus` rõ ràng; `null` là dữ liệu invalid, không còn được normalize thành `ACTIVE`
- Kiểm tra tại: `DealerController`, `WarrantyActivationController`, `UploadController` (đối với asset private của dealer)

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

**Visibility rule `[Implemented]`:**
- Public dealer listing chỉ trả dealer `ACTIVE`
- Cả endpoint paged và non-paged đều dùng cùng một rule filter `customerStatus = ACTIVE`
- Field public hiện tại gồm: `id`, `businessName`, `contactName`, `address`, `city`, `district`, `phone`, `email`
- Không public các field nhạy cảm hoặc nội bộ như `creditLimit`, công nợ, tax info, status history, auth/role, payment data

---

### 3.18 Dashboard & Cài đặt hệ thống (Admin)

**Admin Dashboard — `GET /api/v1/admin/dashboard`**

Tổng hợp số liệu vận hành: số dealer `UNDER_REVIEW`, thống kê đơn hàng, doanh thu. Kết quả cache `ADMIN_DASHBOARD`.

**System Settings (SUPER_ADMIN only):**
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

**Trạng thái section:** `[Implemented]`

**`GET /api/v1/admin/reports/export`**

| Param | Giá trị |
|---|---|
| `type` | `ORDERS` \| `REVENUE` \| `WARRANTIES` \| `SERIALS` |
| `format` | `XLSX` \| `PDF` |

**Response:** stream file binary trực tiếp (`Content-Disposition: attachment`) với `Content-Type` phù hợp định dạng; frontend tải bằng blob, không bọc `ApiResponse`.

---

### 3.20 Upload & Lưu trữ File

**Trạng thái section:** `[Implemented]`

**Upload endpoints:**

| Endpoint | Role | Mục đích |
|---|---|---|
| `POST /api/v1/upload/products` | ADMIN, SUPER_ADMIN | Ảnh sản phẩm |
| `POST /api/v1/upload/blogs` | ADMIN, SUPER_ADMIN | Ảnh bài viết |
| `POST /api/v1/upload/avatars` | ADMIN, SUPER_ADMIN | Avatar admin |
| `POST /api/v1/upload/dealer-avatars` | DEALER, ADMIN, SUPER_ADMIN | Avatar dealer |
| `POST /api/v1/upload/payment-proofs` | DEALER, ADMIN, SUPER_ADMIN | Chứng từ thanh toán |
| `DELETE /api/v1/upload?url=...` | DEALER, ADMIN, SUPER_ADMIN | Xóa file |
| `GET /api/v1/upload/**` | Public ở tầng security; controller sẽ chỉ cho đọc công khai với `products/`, `blogs/`, còn path private bị chặn theo auth/ownership | Đọc asset |

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

**Ràng buộc lifecycle dealer:**
- Dealer chỉ upload / đọc / xóa asset riêng của mình khi `status = ACTIVE`
- `UNDER_REVIEW` / `SUSPENDED` bị chặn giống dealer portal
- Admin/SUPER_ADMIN không bị ràng buộc bởi lifecycle dealer khi hỗ trợ xử lý hồ sơ / chứng từ

**Serve file tĩnh — `GET /uploads/{*path}`:**
- Public, Cache-Control `max-age=31536000` (365 ngày)
- Chỉ serve được asset public `products/` và `blogs/`
- Chỉ active khi `app.storage.provider=s3`

---

### 3.21 Rate Limiting

**Trạng thái section:** `[Implemented]`

Cơ chế sliding window in-memory theo client key. Cleanup job chạy mỗi **5 phút** (cấu hình qua `app.rate-limit.cleanup-interval-ms`), grace period **300 giây**.

**Xác định client key:**
- mặc định dùng `remoteAddr`
- chỉ trust `X-Forwarded-For` khi `app.rate-limit.trust-forwarded-for=true`
- audit log admin có cờ riêng `app.audit.trust-forwarded-for`
- rate limit và audit log dùng cùng app-side client IP resolver; mỗi feature vẫn giữ cờ trust riêng
- phù hợp nhất cho single-instance; nếu scale multi-instance cần shared store hoặc gateway rate-limit phía trước

| Endpoint | Giới hạn |
|---|---|
| `POST /api/v1/auth/login` | 10 req / 60s |
| `POST /api/v1/auth/forgot-password` | 5 req / 300s |
| `GET /api/v1/warranty/check/{serial}` | 30 req / 60s |
| `POST /api/v1/upload/**` | 20 req / 60s |
| `POST /api/v1/webhooks/sepay` | 120 req / 60s |

Vượt ngưỡng → `429 Too Many Requests`.

---

### 3.22 Data Contract Consistency

**Trạng thái section:** `[Implemented]` cho các field runtime hiện hành; `[Pending Decision]` cho migration legacy chưa xóa hết.

**Canonical fields:**
- `orderCode` là business identifier chuẩn cho đơn hàng; `id` DB không được dùng thay cho `orderCode` ở search/display flow user-facing
- `product.stock` là field **derived/read model**, không phải inventory input canonical
- Pool serial khả dụng `dealer IS NULL AND order IS NULL AND status = AVAILABLE` là source of truth để chặn oversell
- Response import serial summary `importedItems`, `skippedItems`, `importedCount`, `skippedCount` là contract chuẩn cho các FE
- `paymentStatus` là aggregate field ở level Order; `Payment` record là source-of-truth cho từng lần ghi nhận/giao dịch

**Legacy / compatibility rules:**
- `id` vẫn có thể xuất hiện trong API để nôi liên nội bộ, nhưng không được xem là business code thay cho `orderCode`
- Các field legacy/chuyển tiếp chỉ được dùng cho read compatibility; mọi write flow mới phải bám canonical schema hiện hành

---

### 3.23 Error Contract

**Trạng thái section:** `[Implemented]`

**Envelope chuẩn:**

```json
{
  "success": false,
  "data": null,
  "error": "..."
}
```

**Validation-level error:**

```json
{
  "success": false,
  "data": {
    "fieldName": "message"
  },
  "error": "Validation failed"
}
```

**Status code contract:**
- `400`: request sai, validation fail, business rule fail, payload không hợp lệ
- `401`: chưa xác thực, token hết hạn, refresh fail, dealer không `ACTIVE`
- `403`: đã xác thực nhưng không đủ quyền
- `404`: resource không tồn tại
- `409`: conflict như duplicate payment, transactionCode đã tồn tại, duplicate mutation window
- `413`: file quá dung lượng
- `429`: vượt rate limit
- `500`: lỗi hệ thống không lường trước

**Current conventions:**
- Không dùng `422` trong runtime hiện tại
- FE phải bám `status code + envelope` thay vì suy luận từ raw text

---

### 3.24 Audit & Traceability

**Trạng thái section:** `[Implemented]` cho admin mutation audit. `[Pending Decision]` cho retention/access policy đầy đủ.

**Admin mutation audit `[Implemented]`:**
- Mọi `POST`, `PUT`, `PATCH`, `DELETE` đi qua `AdminController` được ghi audit log backend
- Audit payload hiện tại gồm: actor, actorRole, action, requestMethod, requestPath, entityType, entityId, ipAddress, payload
- Các field nhạy cảm chứa `password`, `token`, `secret`, `apiKey`, `accessKey`, `checksum` phải bị redact trước khi lưu

**Pending decisions:**
- ai được xem audit log
- retention bao lâu
- có cần export/search UI riêng hay không

---

### 3.25 Refund & Reversal

**Trạng thái section:** `[Implemented]` cho current limitation. `[Pending Decision]` cho refund/reversal workflow đầy đủ.

**Current runtime `[Implemented]`:**
- Không có endpoint refund/payment reversal chuẩn trong hệ thống
- Không có negative payment / compensating transaction flow production
- Hủy order không tự refund, không tự reverse debt, không xóa payment đã ghi
- Payment record không nên bị xóa cứng để biểu diễn hoàn tiền; đây chưa phải workflow hỗ trợ trong runtime

#### Admin Financial Adjustment `[Policy]`

Để xử lý lỗi tài chính, overpayment, hoặc settlement cho đơn hủy mà không cần truy cập DB trực tiếp:

**`POST /api/v1/admin/orders/{id}/adjustments`:**

```json
{
  "type": "CORRECTION | WRITE_OFF | CREDIT_NOTE | REFUND_RECORD",
  "amount": -500000,
  "reason": "Hoàn tiền đơn SCS-42-... đã hủy — đã chuyển khoản hoàn ngày 2026-03-23",
  "referenceCode": "REF-..."
}
```

**Quy tắc:**
1. Adjustment entry là **append-only** — không xóa, không sửa sau khi tạo
2. `amount` có thể **âm** (giảm paidAmount — dùng cho refund/correction) hoặc **dương** (bổ sung ghi nhận — dùng cho late payment match)
3. `paidAmount` và `outstandingAmount` được **tính lại** từ: `Σ payments.amount + Σ adjustments.amount`
4. `reason` **bắt buộc**, tối thiểu 10 ký tự
5. `referenceCode` tùy chọn — dùng cho cross-reference với giao dịch ngân hàng ngoài hệ thống
6. Chỉ `ADMIN` / `SUPER_ADMIN` được tạo adjustment
7. Audit log tự động ghi: actor, actorRole, orderId, type, amount, reason, timestamp
8. Adjustment **không** tự thực hiện chuyển tiền ra ngoài hệ thống — refund thực tế qua bank transfer manual, nhưng hệ thống **phải** ghi nhận

**`GET /api/v1/admin/orders/{id}/adjustments`:** — lịch sử adjustment của đơn, sắp xếp theo thời gian

**Constraint tài chính:**
- `paidAmount` (tính lại) không được âm → adjustment bị reject nếu tổng kết quả < 0
- Adjustment trên đơn `COMPLETED` cần xác nhận lại (`confirmOverride = true` trong payload) vì ảnh hưởng accounting đã chốt

> Đây là minimum viable correction flow. Không thay thế full refund gateway integration nhưng đảm bảo mọi biến động tài chính đều có record trong hệ thống.

---

## 4. User Flow

### 4.1 Đặt hàng

```
Đăng nhập → Duyệt sản phẩm → Thêm vào giỏ → Kiểm tra giỏ & chiết khấu → Nhập thông tin người nhận
→ Chọn thanh toán:
    [Chuyển khoản] Sao chép thông tin NH → Chuyển tiền → SePay tự xác nhận → Dealer App cập nhật order state; nếu đang mở bank-transfer sheet thì sheet tự đóng, nếu đang ở màn thành công thì trạng thái hiển thị đổi sang đã thanh toán
    [Ghi nợ] Xác nhận → Đơn ghi nợ ngay
→ Đơn tạo thành công (PENDING)
```

### 4.2 Thanh toán công nợ

```
Dashboard → Shortcut "Công nợ" → Chọn đơn còn nợ → Ghi nhận thanh toán (số tiền, kênh, chứng từ)
→ Backend validate request
→ Payment được ghi nhận thành công
→ paidAmount tăng
→ outstandingAmount giảm ngay
→ outstandingAmount = 0 → đơn biến mất khỏi danh sách nợ
```

### 4.3 Kích hoạt bảo hành

```
[Admin] Đơn → COMPLETED → Serial vào kho dealer
[Dealer] Scan/nhập serial → Hệ thống validate serial đủ điều kiện
→ Dealer nhập thông tin khách + chọn ngày mua → Xác nhận → Bảo hành kích hoạt
→ Không có bước xuất PDF/Excel trong Dealer App hiện tại
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
| Dealer ghi payment thành công | Có hiệu lực ngay, `outstandingAmount` giảm tức thì |
| Đơn `BANK_TRANSFER` khi `sepay.enabled = true` | Dealer không tự ghi payment; chờ SePay hoặc admin override |

### 5.2 Serial & Bảo hành

| Trường hợp | Xử lý |
|---|---|
| Serial đã kích hoạt | Từ chối, lỗi "serial đã kích hoạt" |
| Serial không thuộc kho dealer | Từ chối — validation error |
| Serial đã tồn tại khi admin import | Không fail cả request; item đó bị skip và trả reason trong summary response |
| Đơn liên kết chưa `COMPLETED` | Từ chối (`PENDING`, `CONFIRMED`, `SHIPPING` đều bị từ chối) |
| Thông tin khách hàng trống | Backend chỉ fallback `name/phone/address` từ receiver info nếu request thiếu; Dealer App hiện vẫn yêu cầu dealer nhập đủ 4 trường trên form |
| `ImportedSerialRecord` đã tồn tại | Bỏ qua, giữ nguyên `warehouseId` gốc |

### 5.3 Đơn hàng

| Trường hợp | Xử lý |
|---|---|
| Pool serial `AVAILABLE` không đủ | Từ chối tạo đơn, kể cả khi `Product.stock` cũ đang lệch lớn hơn thực tế |
| Sản phẩm bị xóa sau khi vào giỏ | Lỗi khi checkout, yêu cầu xóa item |
| Hủy đơn | Serial `RESERVED → AVAILABLE` (xem quy tắc tại [3.4](#34-đặt-hàng--thanh-toán)) |
| Reorder đơn cũ | Thêm vào giỏ, snackbar "Đã thêm X sản phẩm, bỏ qua Y (hết hàng)" |

### 5.4 Giỏ hàng

- **Optimistic update:** UI cập nhật ngay (add/remove/qty), rollback nếu backend trả error.
- **Mutation conflict:** khi response về sau khi local state đã thay đổi (ví dụ: user thêm item khác trong lúc request đang pending), local state thắng — response cũ không ghi đè state hiện tại.
- **Sync retry:** Dealer App dùng reconnect + refetch sau khi WebSocket reconnect; không có polling loop định kỳ.
- Business contract cốt lõi vẫn là: cart mutation không được phá vỡ inventory rule và auth rule của backend.

### 5.5 Giao diện & Cài đặt

- **Widget lifecycle:** `_showSnackBar` luôn kiểm tra `!mounted` trước khi gọi `ScaffoldMessenger`. Khi gọi từ `didChangeDependencies`, dùng `addPostFrameCallback` để tránh gọi trong build phase.
- **Local preference persistence:** ThemeMode persist dưới dạng string `'system'`/`'light'`/`'dark'`. Tên màn hình `WarrantyExportScreen` là legacy name — chức năng là import serial từ file (không phải export).
- **ApiResponse envelope:** Client chỉ render `message` từ error response khi `status != "success"`; không đọc `data` khi có lỗi.
- Business contract cốt lõi ở section này chỉ gồm: user có thể chọn theme `light|dark|system` và ngôn ngữ `vi|en`.

### 5.6 Tình huống tài chính và inventory nâng cao

| Trường hợp | Xử lý |
|---|---|
| Tạo đơn với `X-Idempotency-Key` trùng (retry trong 10 phút) | Trả response cũ, không tạo đơn mới, không reserve serial lần nữa |
| SePay webhook đến khi dealer đang hủy đơn đồng thời | `SELECT FOR UPDATE` trên row Order — một trong hai thắng; nếu order đã CANCELLED khi webhook xử lý → ghi `UnmatchedPayment` reason `ORDER_CANCELLED` |
| Dealer bị SUSPENDED khi có đơn PENDING | Sau grace period 24h: nếu `paidAmount = 0` thì auto-cancel và giải phóng serial; nếu `paidAmount > 0` thì **không auto-cancel**, phải vào `STALE_ORDER_REVIEW`; đơn CONFIRMED/SHIPPING giữ nguyên để admin xử lý |
| Dealer bị SUSPENDED khi có đơn CONFIRMED/SHIPPING | Đơn giữ nguyên trạng thái; admin tiếp tục xử lý; dealer không thể thao tác thêm |
| Admin hạ `creditLimit` xuống thấp hơn `currentOutstandingDebt` hiện tại | Không block — chỉ block đơn mới; đơn cũ và debt hiện tại giữ nguyên; admin nhận notification về credit limit violation |
| Batch warranty activation partial failure (Section 3.8) | Mỗi serial được kích hoạt độc lập; serial thành công không rollback khi serial khác fail; response trả partial-success summary với list success/fail per serial |
| Dealer xóa payment-proof file sau khi payment đã ghi nhận | File có thể bị xóa (hành động trên storage), nhưng payment record giữ nguyên `proofFileName` làm reference; file đã xóa không thể phục hồi từ hệ thống — đây là rủi ro vận hành; admin nên download proof ngay khi nhận payment |
| Admin chuyển SHIPPING → COMPLETED khi serial không còn RESERVED | `RESERVED → ASSIGNED` sẽ fail nếu serial đã bị đổi status (ví dụ: dealer đánh DEFECTIVE cho serial RESERVED — không hợp lệ vì DEFECTIVE chỉ áp dụng cho ASSIGNED/WARRANTY); backend kiểm tra và reject transition với message rõ ràng |
| 2 admin cùng approve/cancel đơn đồng thời | `SELECT FOR UPDATE` trên row Order — một trong hai thắng; bên thua nhận `409 Conflict` với message "Order đã được xử lý bởi tác nhân khác" |
| SePay webhook nhận `transactionCode` đã tồn tại (retry từ SePay) | Idempotent — bỏ qua, không xử lý lại, trả `200 OK` (tránh SePay retry loop) |

---

## 6. So sánh nền tảng

### Dealer App vs Admin Dashboard

| Tính năng | Dealer App | Admin Dashboard |
|---|---|---|
| Xem đơn hàng | Chỉ đơn của mình | Toàn bộ |
| Thay đổi trạng thái đơn | Hủy (`PENDING`/`CONFIRMED` only) | PENDING→CONFIRMED→SHIPPING→COMPLETED, hoặc hủy |
| Ghi nhận thanh toán | Dealer tự ghi payment cho đơn còn nợ; bank transfer tự động qua SePay | Admin ghi trực tiếp/override; bank transfer tự động qua SePay |
| Quản lý sản phẩm | Chỉ đọc | CRUD đầy đủ |
| Quản lý serial | Xem kho + kích hoạt bảo hành + cập nhật status | Import, xem tất cả, cập nhật status, xóa |
| Thông báo | WebSocket + in-app sync | Topic admin WebSocket + dashboard |
| Ngôn ngữ | VI / EN (user chọn) | VI / EN (`LanguageSwitcher`) |
| Audit log | Không | Có ở backend cho mọi mutation admin; chưa có màn hình riêng |

### Main Website vs Dealer App

| Tính năng | Main Website (Next.js) | Dealer App (Flutter) |
|---|---|---|
| Đối tượng | Khách hàng public, SEO | Đại lý đã xác thực |
| Xem sản phẩm | Có (ISR, cached) | Có (live API) |
| Đặt hàng | Không | Có |
| Auth | Không bắt buộc | Bắt buộc (JWT) |

---

## 7. Giả định Chuẩn & Pending Decisions

### 7.1 Giả định chuẩn hiện tại

1. **Một đơn = một warehouse** — không hỗ trợ lấy hàng từ nhiều kho.
2. **Giá snapshot tại thời điểm đặt** — không có cơ chế cập nhật giá đơn cũ.
3. **VAT lấy từ `AdminSettings.vatPercent`** — default 10, backend là source of truth cho mọi phép tính pricing.
4. **`shippingFee = 0` cố định** — policy công ty, không thu phí giao hàng qua hệ thống.
5. **Một serial = một lần kích hoạt** — không hỗ trợ chuyển bảo hành.
6. **Thanh toán tự động qua SePay** — bank transfer tự xác nhận khi webhook khớp; dealer payment cho đơn còn nợ có hiệu lực ngay khi ghi nhận thành công; admin có thể ghi override.
7. **Công nợ không tính lãi** — `outstandingAmount` không thay đổi theo thời gian.

### 7.2 Pending Decisions / Chưa là source of truth

> Các mục dưới đây **không phải contract production hiện hành**. Đây là backlog nghiệp vụ hoặc câu hỏi mở cần chốt riêng trước khi triển khai.

| Điểm | Hiện trạng | Cần làm rõ |
|---|---|---|
| Admin override giá | Order có `subtotalOverride`, `vatOverride`, `totalOverride` | Ai được override, khi nào, flow ra sao? |
| Warranty transfer | Không có tính năng | Có cần hỗ trợ chuyển bảo hành sang chủ mới không? |
| Support ticket SLA | Không có timeout/SLA | Cần bổ sung nếu cam kết thời gian phản hồi |
| Support thread nhiều lượt | Runtime hiện tại là mô hình một chiều + `adminReply` đơn | Cần chốt có nâng cấp sang thread/attachment hay không |
| Bulk discount + product-specific rule cùng match | Code ưu tiên product-specific | Cần confirm đây là business decision hay chỉ là implementation default |
| Audit log retention + read API | Audit log ghi backend nhưng chưa có UI/API đọc | Cần chốt retention policy, ai được xem, có cần export không |

> Các mục đã được chốt thành `[Policy]` và di chuyển vào section tương ứng: Reserved timeout → 7.3, RMA/serial reset → 7.3, Debt payment verification → 7.3, SePay partial/over payment → 7.3, Finance rule cho order CANCELLED → 3.4 (Guard condition), Refund/reversal → 3.25 (Admin Financial Adjustment).

### 7.3 Closed Decisions — Production Policies

#### Reserved timeout `[Policy]`

Đơn `PENDING` quá thời hạn sẽ được hệ thống tự động xử lý:

**Quy tắc:**
1. **Timeout**: đơn `PENDING` quá **48 giờ** kể từ `createdAt` (configurable via `app.order.pending-timeout-hours`, default `48`)
2. **System job** chạy mỗi **1 giờ** (configurable via `app.order.stale-check-interval-ms`)
3. **Xử lý khi hết timeout:**
   - Nếu `paidAmount = 0` → auto-cancel: serial `RESERVED → AVAILABLE`, order → `CANCELLED`, `paymentStatus = CANCELLED`, đồng bộ `product.stock`
   - Nếu `paidAmount > 0` → **không auto-cancel**; chuyển vào queue `STALE_ORDER_REVIEW` với flag `staleReviewRequired = true`
4. **Notification:**
   - Dealer nhận cảnh báo **6 giờ trước** khi hết timeout: *"Đơn hàng {orderCode} sẽ tự động hủy sau 6 giờ nếu không được xử lý"*
   - Admin nhận notification khi đơn bị auto-cancel
   - Admin nhận notification khi đơn vào stale review queue
5. **Admin dashboard** hiển thị widget **"Đơn treo chờ xử lý"** cho các đơn có `staleReviewRequired = true`
6. Đơn `CONFIRMED` hoặc `SHIPPING` **không** bị timeout — chỉ áp dụng cho `PENDING`

#### RMA / serial reset cho `DEFECTIVE` và `RETURNED` `[Policy]`

Serial ở trạng thái `DEFECTIVE` hoặc `RETURNED` phải đi qua bước trung gian trước khi quay lại inventory.

**State machine mở rộng:**
```
DEFECTIVE ──► INSPECTING ──► AVAILABLE   (qua QC, đạt yêu cầu)
                          └──► SCRAPPED   (không thể sửa, loại bỏ vĩnh viễn)
RETURNED  ──► INSPECTING ──► AVAILABLE
                          └──► SCRAPPED
```

**Endpoint: `PATCH /api/v1/admin/serials/{id}/rma`**

```json
{
  "action": "START_INSPECTION | PASS_QC | SCRAP",
  "reason": "Đã kiểm tra, sản phẩm hoạt động bình thường",
  "proofUrls": ["..."]
}
```

**Quy tắc:**
1. Chỉ `ADMIN` / `SUPER_ADMIN` thực hiện — dealer **không** được reset serial
2. `DEFECTIVE/RETURNED → INSPECTING`: yêu cầu `reason` bắt buộc
3. `INSPECTING → AVAILABLE`: yêu cầu `reason` + ít nhất 1 `proofUrl` (ảnh/tài liệu QC)
   - Serial về `AVAILABLE`, clear `dealer` và `order` reference
   - Warranty liên quan (nếu có) chuyển `VOID` với reason *"Serial đã qua RMA, bảo hành cũ vô hiệu"*
   - `product.stock` đồng bộ lại
4. `INSPECTING → SCRAPPED`: yêu cầu `reason`
   - Serial ra khỏi inventory vĩnh viễn, không đếm vào stock
   - `SCRAPPED` là trạng thái cuối
5. Không cho reset thẳng `DEFECTIVE/RETURNED → AVAILABLE` — **bắt buộc** qua `INSPECTING`
6. Audit log ghi đầy đủ: actor, serial, action, reason, proofUrls, timestamp

#### Debt payment verification `[Historical / rollout-only]`

**Lưu ý runtime:** mục này chỉ còn giá trị cho dữ liệu lịch sử hoặc kế hoạch rollout dọn nợ cũ. Runtime hiện tại cho đơn mới chỉ còn `BANK_TRANSFER`; không tạo mới `DEBT` / `DEBT_RECORDED` trong flow vận hành hiện hành.

**Compensating controls bắt buộc:**
1. **Daily reconciliation report:** System job tạo báo cáo hàng ngày lúc 00:00 liệt kê tất cả dealer payments ghi nhận trong 24h qua, gửi email cho admin/finance
2. **Proof requirement:** Dealer payment cho đơn có `outstandingAmount ≥ 10,000,000 VNĐ` **bắt buộc** upload `proofFileName`; payment không có proof bị reject
3. **Admin review dashboard:** `GET /api/v1/admin/payments/recent` — danh sách payment gần đây (filter theo dealer, date range, amount range, có/không có proof)
4. **Anomaly flag:** Payment ghi nhận bất thường (ví dụ: nhiều payment cùng dealer trong 1 giờ, hoặc payment = exact outstandingAmount cho nhiều đơn liên tiếp) được gắn flag `reviewSuggested = true`
5. **Nếu phát hiện gian lận:** Admin dùng [Admin Financial Adjustment](#325-refund--reversal) để tạo correction entry, và có thể suspend dealer

> Nếu tương lai cần chuyển sang `PENDING_VERIFICATION → CONFIRMED/REJECTED`, phải thiết kế lại API/DB/UI và cập nhật toàn bộ flow. Hiện tại chưa cần.

#### SePay partial / over payment `[Policy]`

**Quyết định:** Hệ thống chỉ auto-match giao dịch SePay khi amount **đúng bằng** `outstandingAmount`. Các trường hợp khác **không** được tự động xử lý.

| Tình huống | Xử lý |
|---|---|
| Amount < outstandingAmount (thiếu tiền) | Ghi vào `UnmatchedPayment` với reason `AMOUNT_MISMATCH`; admin xử lý thủ công |
| Amount > outstandingAmount (dư tiền) | Ghi vào `UnmatchedPayment` với reason `AMOUNT_MISMATCH`; admin xử lý thủ công |
| Nhiều lần chuyển khoản cho cùng đơn | Lần đầu khớp → auto-match; các lần sau đơn đã PAID → ghi `UnmatchedPayment` với reason `ORDER_ALREADY_SETTLED` |
| Nội dung chuyển khoản sai orderCode | Ghi vào `UnmatchedPayment` với reason `ORDER_NOT_FOUND` |

> Tất cả unmatched transactions đều đi qua [Unmatched transaction handling](#thanh-toán--bank-transfer) — admin được notify và phải xử lý. Không có giao dịch nào bị im lặng bỏ qua.

---

*Cập nhật: 2026-03-23 — Siết lại `BUSINESS_LOGIC.md` thành canonical contract, bổ sung matrix order/payment, error contract, audit/traceability, refund/reversal notes, public dealer visibility.*

*Cập nhật: 2026-03-24 — Hợp nhất nội dung từ `RUNTIME_BEHAVIOR.md` và `CLIENT_NOTES.md` vào file này; xóa 2 file companion. `BUSINESS_LOGIC.md` là nguồn duy nhất cho contract và implementation notes.*

*Cập nhật: 2026-03-23 (audit pass) — Chốt 6 pending decisions thành `[Policy]`: reserved timeout (48h auto-cancel), RMA/serial reset qua INSPECTING→AVAILABLE/SCRAPPED, dealer lifecycle ACTIVE↔SUSPENDED, debt payment accepted risk + compensating controls, SePay exact-match + unmatched payment queue, guard condition hủy đơn có paidAmount>0 (FinancialSettlement). Thêm: idempotency tạo đơn (X-Idempotency-Key), admin financial adjustment endpoint (Section 3.25), edge cases Section 5.6. Cập nhật serial status model (+INSPECTING, +SCRAPPED). Cập nhật Section 0.3/0.4 phản ánh phạm vi đã chặt mới.*

---

## 8. Audit Alignment (2026-03-29)

> Section này là canonical override cho các điểm audit đã verify lại với code hiện tại. Nếu có câu nào ở section cũ mâu thuẫn với Section 8, ưu tiên Section 8. Trường hợp quan trọng nhất là VAT: runtime hiện tại không còn coi "VAT = 10% cố định" là business constant trong code nữa; VAT được đọc từ `AdminSettings.vatPercent` với default 10.

### 8.1 Source Of Truth Corrections

- Backend là nguồn sự thật cho: VAT, pricing tổng đơn, `allowedTransitions`, `warrantyEnd`, `UnmatchedPayment`, `FinancialSettlement`.
- Frontend không được coi logic local là authoritative cho pricing, transition, warranty expiration, hay payment resolution.
- Dealer App vẫn có fallback local để giữ UX khi chưa fetch xong, nhưng fallback đó chỉ là estimate và phải bị override bởi dữ liệu backend ngay khi có response.
- `shippingFee` hiện vẫn cố định bằng `0`, nhưng shipping subsystem chưa có aggregate/domain riêng.

### 8.2 Pricing, VAT, And Frontend Duplication

- VAT runtime được cấu hình ở `AdminSettings.vatPercent`, range `0..100`, default `10`.
- Backend dùng cùng một VAT source cho order creation, order/payment recalculation, SePay reconciliation, dashboard, reporting, và dealer cart preview.
- Endpoint authoritative cho preview pricing của Dealer là `GET /api/v1/dealer/cart/summary`.
- Dealer FE hiện ưu tiên `/dealer/cart/summary`; local calculation chỉ là fallback khi summary chưa có hoặc đang stale.
- Khi order đã được tạo, tổng tiền trong `DealerOrderResponse`/`AdminOrderResponse` từ backend là authoritative; FE không được tự recompute để "sửa" backend total.

### 8.3 Transition Authority

- Backend mới là nơi enforce state machine của `OrderStatus` và `CustomerStatus`.
- Admin FE hiện consume `allowedTransitions` từ backend để render action list; hardcoded list cũ chỉ còn là fallback compatibility path.
- `allowedTransitions` là UX hint do backend cung cấp, không thay thế server-side validation.

### 8.4 Shipping Current State

- System hiện chưa có shipping aggregate riêng.
- Dữ liệu shipping đang có trên `Order` chỉ gồm `receiverName`, `receiverAddress`, `receiverPhone`, `shippingFee`, `note`.
- Chưa có field/domain riêng cho `carrier`, `trackingNumber`, `pod`, `shippingStatus`, `deliveryAttempt`, hay shipping dispute workflow.
- Vì chưa có shipping aggregate, các khiếu nại giao hàng hiện được xử lý thủ công qua support ticket hoặc order note, không có state machine riêng.
- Decision hiện tại: chưa thêm `carrier`/`trackingNumber` vội trong đợt này để tránh migration/UI ripple không cần thiết; backlog này phải đi kèm contract/API/UI rõ ràng.

### 8.5 OrderAdjustmentType Semantics

`OrderAdjustment` là append-only ledger entry cho admin. Type hiện có:

| Type | Semantics | Amount convention |
|---|---|---|
| `CORRECTION` | Điều chỉnh tổng quát để sửa sai lệch kế toán hoặc dữ liệu payment/paidAmount | Thường âm nếu giảm số đã ghi nhận, dương nếu bổ sung thiếu |
| `WRITE_OFF` | Ghi nhận khoản phải thu không còn thu hồi tiếp và chấp nhận xóa/giảm nghĩa vụ | Thường âm |
| `CREDIT_NOTE` | Ghi nhận credit thủ công cấp cho dealer để bù trừ nghĩa vụ tài chính | Thường âm |
| `REFUND_RECORD` | Ghi nhận việc hoàn tiền đã thực hiện ngoài hệ thống thanh toán chuẩn | Thường âm |

- Code hiện không hard-enforce sign theo type; sign cuối cùng nằm ở `amount`.
- `paidAmount` của order được tính lại từ `sum(payments.amount) + sum(adjustments.amount)`.
- Adjustment không tự chuyển tiền ra ngoài hệ thống; nó chỉ ghi ledger/audit trail.

### 8.6 UnmatchedPayment Resolution Workflow

`UnmatchedPaymentReason` hiện có:

- `ORDER_NOT_FOUND`
- `AMOUNT_MISMATCH`
- `ORDER_ALREADY_SETTLED`
- `ORDER_CANCELLED`

`UnmatchedPaymentStatus` hiện có:

- `PENDING`
- `MATCHED`
- `REFUNDED`
- `WRITTEN_OFF`

Workflow:

1. SePay chỉ auto-match khi tìm đúng order và `amount == outstandingAmount`.
2. Nếu không auto-match được, backend luôn tạo `UnmatchedPayment` với `status = PENDING`.
3. Admin resolve qua `PATCH /api/v1/admin/unmatched-payments/{id}`.
4. Nếu resolve sang `MATCHED`, request bắt buộc có:
   - `matchedOrderId`
   - `resolution`
5. Nếu resolve sang `REFUNDED` hoặc `WRITTEN_OFF`, request bắt buộc có:
   - `resolution`
6. Khi resolve `MATCHED`, backend tạo một `Payment` thật trên order đích với transaction code ổn định `UNMATCHED_MATCH:{unmatchedPaymentId}`, rồi recompute `paidAmount` và `paymentStatus`.
7. Không được match vào order đã `CANCELLED` hoặc soft-deleted.

Required resolution fields sau khi resolve:

- `matchedOrderId`: bắt buộc khi `status = MATCHED`, để `null` cho nhánh khác
- `resolution`: mô tả xử lý cuối cùng
- `resolvedBy`: username admin/staff resolve
- `resolvedAt`: timestamp resolve

Terminal states:

- `MATCHED`
- `REFUNDED`
- `WRITTEN_OFF`

`PENDING` là non-terminal; không được transition ngược từ terminal state về `PENDING`.

### 8.7 FinancialSettlement Resolution Workflow

`FinancialSettlementType` hiện có:

- `CANCELLATION_REFUND`
- `STALE_ORDER_REVIEW`

`FinancialSettlementStatus` hiện có:

- `PENDING`
- `REFUNDED`
- `WRITTEN_OFF`
- `CREDITED`

Creation rules:

- `CANCELLATION_REFUND`: tạo khi order bị cancel và `paidAmount > 0`, bất kể cancel bởi admin hay dealer.
- `STALE_ORDER_REVIEW`: tạo khi stale-order job phát hiện order `PENDING` đã quá timeout nhưng vẫn có `paidAmount > 0`.

Amount semantics:

- `FinancialSettlement.amount` là snapshot của `paidAmount` tại thời điểm settlement được tạo.
- Amount này không tự động "trôi" theo payment/adjustment phát sinh sau đó; nếu cần xử lý chênh lệch tiếp, admin dùng settlement resolution hoặc order adjustment riêng.

Resolution rules:

- Chỉ admin/staff resolve qua `PATCH /api/v1/admin/financial-settlements/{id}`.
- Không được resolve ngược về `PENDING`.
- `resolution` luôn bắt buộc.
- Audit fields bắt buộc khi resolve:
  - `resolvedBy`
  - `resolvedAt`
  - `resolution`

Suggested semantics cho status cuối:

- `REFUNDED`: đã hoàn tiền ra ngoài hệ thống
- `WRITTEN_OFF`: không hoàn tiền, ghi nhận write-off/manual close
- `CREDITED`: không hoàn cash, chuyển thành credit bù trừ cho dealer

Terminal states:

- `REFUNDED`
- `WRITTEN_OFF`
- `CREDITED`

### 8.8 Notification Event Matrix

Rule nền:

- Mọi `Notify` được tạo qua `NotificationService.create(...)` đều có ba lớp fan-out theo thứ tự:
  1. persist in-app notification
  2. publish WebSocket event `notificationCreated`
  3. sau commit, thử gửi push FCM nếu có active token và FCM enable

Matrix hiện có:

| Business event | Recipients | In-app / WebSocket / Push | Email |
|---|---|---|---|
| Dealer đăng ký mới | Admin broadcast qua `dealerRegistrationFromAuth` | Broadcast WS `/topic/dealer-registrations`; không tạo `Notify` hàng loạt | Dealer nhận email "application received" |
| Dealer account status đổi (`UNDER_REVIEW`/`ACTIVE`/`SUSPENDED`) | Dealer | Có `NotifyType.SYSTEM` + `notificationCreated` + push nếu có token | Có email; riêng flow này còn phụ thuộc `emailConfirmation` |
| Dealer tạo order | Dealer | Có `NotifyType.ORDER` + `notificationCreated` + push | Có email xác nhận order |
| Admin đổi order status | Dealer | Có `NotifyType.ORDER` + `notificationCreated` + `orderStatusChanged` realtime payload | Có email cập nhật trạng thái |
| Dealer record payment / SePay ghi nhận payment | Dealer | Có `NotifyType.ORDER` + `notificationCreated`; order realtime refresh qua `orderStatusChanged` | Không có email riêng trong mọi nhánh |
| Dealer cancel order có paidAmount > 0 | ACTIVE admins | Có `NotifyType.ORDER` + `notificationCreated` + push | Không có email riêng |
| Stale order cần review | ACTIVE admins | Có `NotifyType.ORDER` + `notificationCreated` + push | Không có email riêng |
| Dealer mở support ticket | Dealer nhận confirmation; admin nhận broadcast new ticket | Dealer có `NotifyType.SYSTEM`; admin có WS `/topic/admin/support-tickets` | Không có email ở bước tạo ticket |
| Admin cập nhật support ticket | Dealer | Có `NotifyType.SYSTEM` + `notificationCreated` + push | Có email nếu mail đang enable |
| Admin gửi notification thủ công | Targeted accounts / dealers / all accounts | Có `notificationCreated` + push | Không auto-email |
| Warranty activation thành công | Customer/end-user | Hiện không tạo `Notify`; không có WebSocket event riêng | Có email xác nhận bảo hành nếu có email hợp lệ |

`NotifyType` hiện dùng:

- `SYSTEM`
- `PROMOTION`
- `ORDER`
- `WARRANTY`

### 8.9 Push Notification And FCM Flow

- Dealer app register token qua `POST /api/v1/dealer/push-tokens`.
- Payload hiện lưu: `token`, `platform`, `deviceName`, `appVersion`, `languageCode`.
- Backend upsert theo token:
  - bind token với account hiện tại
  - set `active = true`
  - update `lastSeenAt`
- Dealer app unregister qua `DELETE /api/v1/dealer/push-tokens?token=...`, backend set `active = false`.
- Khi FCM trả về lỗi `UNREGISTERED`, `INVALID_ARGUMENT`, hoặc `SENDER_ID_MISMATCH`, backend tự deactivate token.
- Payload push hiện chứa:
  - `noticeId`
  - `type`
  - `title`
  - `body`
  - `link`
  - `deepLink`
- Dealer app dùng push như signal để refetch notification/order state; route navigation ưu tiên `deepLink`, fallback `link`.

### 8.10 Blog Lifecycle

`BlogStatus` hiện có:

- `DRAFT`
- `SCHEDULED`
- `PUBLISHED`

Rules:

- Khi create blog mà không truyền status, default là `DRAFT`.
- Nếu `status = SCHEDULED`, `scheduledAt` là bắt buộc và phải nằm trong tương lai.
- Nếu status khác `SCHEDULED`, backend clear `scheduledAt`.
- Public blog APIs chỉ expose blog `PUBLISHED` và chưa soft-delete.
- `showOnHomepage = true` chỉ có hiệu lực public khi blog đã `PUBLISHED`.

Scheduled publish job:

- `BlogPublishJob` chạy mỗi `60_000 ms` (1 phút).
- Job tìm blog `SCHEDULED` có `scheduledAt <= now`, chuyển sang `PUBLISHED`, rồi clear `scheduledAt`.
- Sau publish job, backend evict toàn bộ public blog caches:
  - homepage blogs
  - blog list/search
  - blog detail
  - related blogs
  - blog categories/by-category

### 8.11 Product Content Field Spec

Base product fields:

- `sku`, `name`, `retailPrice` là required khi tạo.
- `warrantyPeriod` default `12` tháng nếu không truyền.
- `publishStatus` default `DRAFT`.
- `stock` default `0`.

Content and merchandising fields:

| Field | Current contract | Consumer impact |
|---|---|---|
| `showOnHomepage` | Boolean merchandising flag | `main-fe` homepage "new products" dùng query `showOnHomepage = true` + `publishStatus = PUBLISHED` |
| `isFeatured` | Boolean merchandising flag | `main-fe` featured products dùng query `isFeatured = true` + `publishStatus = PUBLISHED` |
| `shortDescription` | Optional text summary; nếu có thì không được blank; max 2000 chars | Dùng ở product list, search, SEO summary, và fallback description |
| `image` | JSON object; key ổn định nhất hiện tại là `imageUrl` | Dealer FE và `main-fe` đều ưu tiên đọc `image.imageUrl` |
| `descriptions` | JSON array các block nội dung theo thứ tự | `main-fe` và dealer FE render chi tiết sản phẩm từ đây nếu có |
| `videos` | JSON array video items | `main-fe`/dealer FE render video section |
| `specifications` | JSON object hoặc array; shape ổn định nhất nên là array `{ label, value }` | `main-fe` có parser tolerant, nhưng array `{label,value}` là contract an toàn nhất |

Recommended stable shape:

- `image`: `{ "imageUrl": "/uploads/..." }`
- `videos[]`: `{ "title"?: string, "description"?: string, "url"?: string, "videoUrl"?: string }`
- `specifications[]`: `{ "label": string, "value": string }`
- `descriptions[]`: ordered content blocks; FE hiện tolerate các key như `type`, `text`, `description`, `content`, `url`, `imageUrl`, `gallery`, `images`

Important note:

- Backend hiện chưa deep-validate toàn bộ schema của `image/descriptions/videos/specifications`; admin-side must keep payload shape stable.
- Với `main-fe`, các field `image`, `descriptions`, `videos`, `specifications` là input trực tiếp cho product detail pages, nên thay đổi schema phải được coi là breaking contract.

### 8.12 Dealer Self-Registration And Order Note

Dealer self-registration hiện dùng `POST /api/v1/auth/register/dealer` với các field:

- Required:
  - `username`
  - `password`
- Optional nhưng có validation/uniqueness nếu truyền:
  - `businessName`
  - `contactName`
  - `taxCode`
  - `phone`
  - `email`
  - `addressLine`
  - `ward`
  - `district`
  - `city`
  - `country`
  - `avatarUrl`

Validation and defaults:

- `username`: 3..50 chars, unique case-insensitive
- `password`: 8..255 chars + strong-password validation ở service
- `email`: nếu có thì phải hợp lệ và unique case-insensitive
- `taxCode`: nếu có thì unique
- `phone`: nếu có thì validate số điện thoại VN và unique
- Initial `customerStatus`: `UNDER_REVIEW`
- Default role: `DEALER`
- Không auto-default `country = Vietnam`
- `businessName` hiện có thể để trống

Registration outputs:

- Dealer nhận email "application received"
- Admin nhận realtime event `dealerRegistrationFromAuth`

`Order.note` semantics:

- `Order.note` là free-form note do dealer nhập lúc tạo order.
- Backend chỉ normalize/trim và lưu text; không parse thành structured business rule.
- Use cases hiện tại:
  - ghi chú giao hàng
  - yêu cầu gọi trước khi giao
  - ghi chú hóa đơn/chứng từ
  - context bổ sung cho admin/support
- `Order.note` được expose lại cho dealer/admin views nhưng không làm thay đổi pricing, transition, hay shipping state machine.

### 8.13 Warranty Source Of Truth

- Warranty end date authoritative nằm ở backend field `WarrantyRegistration.warrantyEnd`.
- Runtime tính `warrantyEnd = purchaseDate + warrantyMonths`, dùng `warrantyPeriod` của product; nếu product không có giá trị hợp lệ thì fallback `12` tháng.
- Dealer FE hiện đã ưu tiên `warrantyEnd` từ backend; local month-based calculation chỉ còn là fallback display.
- Trạng thái expired cũng phải bám backend date semantics, không bám FE local heuristic.

Warranty code format hiện tại:

1. Lấy `productSerial.serial`
2. Loại bỏ ký tự không phải chữ/số
3. Lấy suffix 4 ký tự cuối của serial đã normalize; nếu serial ngắn hơn thì lấy toàn bộ
4. Nếu đã có `productSerialId`:
   - `WAR-{SUFFIX}-{productSerialId}`
5. Nếu chưa có `productSerialId`:
   - `WAR-{SANITIZED_SERIAL}`

Examples:

- Serial `SN-ABC-1234`, id `57` -> `WAR-1234-57`
- Serial `ZX9`, chưa có id -> `WAR-ZX9`

### 8.14 Dashboard Cache, Reports, Credit Limit, And Refund Scope

Admin dashboard cache semantics:

- `GET /api/v1/admin/dashboard` hiện là cacheable.
- Nếu app dùng Redis cache, dashboard hiện dùng cùng cache manager/config chung với TTL mặc định `app.cache.public.ttl-minutes` (default 30 phút), không có TTL riêng cho dashboard.
- Nếu app fallback sang in-memory `ConcurrentMapCacheManager`, cache không có TTL và chủ yếu được invalidated bởi write operations hoặc app restart.
- Dashboard cache bị evict trên các mutation chính như order, product, blog, dealer/account status, registration, inventory changes.

Report/export policy:

- Policy đã chốt là **exclude soft-deleted orders** khỏi export/report mặc định.
- Runtime hiện dùng `findVisibleByCreatedAtDesc(...)`, nên order có `isDeleted = true` không còn đi vào Orders/Revenue export.

Credit-limit projected debt scope:

- Check credit limit chỉ áp dụng cho order có `paymentMethod = DEBT`.
- Scope tính projected debt hiện tại =
  - tổng `outstandingAmount` của các order visible, chưa `CANCELLED`, và cũng là `DEBT`
  - cộng thêm `outstandingAmount` của draft order đang tạo
- Bank-transfer orders không đi vào projected debt scope này.

Return/refund scope hiện tại:

- Chưa có return aggregate hoặc refund gateway integration đầy đủ.
- Hủy order không auto-refund.
- Khi order cancel mà đã có tiền:
  - hệ thống tạo `FinancialSettlement`
  - admin resolve theo một trong các trạng thái cuối (`REFUNDED`, `WRITTEN_OFF`, `CREDITED`)
- Nếu cần điều chỉnh ledger chi tiết hơn sau đó, admin dùng `OrderAdjustment`.

### 8.15 Decision Log From This Audit Pass

- VAT configurability: đã chốt sang backend setting `AdminSettings.vatPercent`; default 10 nhưng không còn hardcoded business constant ở mọi chỗ.
- Pricing preview: đã chọn backend-authoritative cart summary API thay vì tiếp tục để dealer FE tự làm source of truth.
- Shipping metadata: chưa thêm `carrier`/`trackingNumber` trong đợt này vì risk lan rộng qua DB/API/admin/dealer/main-fe lớn hơn lợi ích tức thời.
- Soft-deleted report policy: chốt exclude mặc định.
- `FinancialSettlement.type`: đã chuyển sang enum trong code; DB vẫn lưu string-compatible enum names nên không cần migration kiểu dữ liệu riêng.
- Return/refund scope: giữ phạm vi manual settlement + order adjustment; chưa mở rộng thành workflow hoàn tiền tự động.
