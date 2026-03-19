# Tài liệu Logic Nghiệp Vụ — Hệ thống 4thitek

> Phiên bản: 2026-03-19
> Phạm vi: Backend (Spring Boot) · Dealer App (Flutter) · Admin Dashboard (React) · Main Website (Next.js)

---

## Mục lục

1. [Tổng quan hệ thống](#1-tổng-quan-hệ-thống)
2. [Danh sách chức năng](#2-danh-sách-chức-năng)
3. [Logic nghiệp vụ chi tiết](#3-logic-nghiệp-vụ-chi-tiết)
   - [3.1 Xác thực & phân quyền](#31-xác-thực--phân-quyền)
   - [3.2 Sản phẩm & danh mục](#32-sản-phẩm--danh-mục)
   - [3.3 Giỏ hàng](#33-giỏ-hàng)
   - [3.4 Đặt hàng & thanh toán](#34-đặt-hàng--thanh-toán)
   - [3.5 Theo dõi công nợ](#35-theo-dõi-công-nợ)
   - [3.6 Kho hàng & Serial](#36-kho-hàng--serial)
   - [3.7 Bảo hành](#37-bảo-hành)
   - [3.8 Xuất báo cáo bảo hành](#38-xuất-báo-cáo-bảo-hành)
   - [3.9 Thông báo](#39-thông-báo)
   - [3.10 Hỗ trợ (Support Ticket)](#310-hỗ-trợ-support-ticket)
   - [3.11 Cài đặt ứng dụng](#311-cài-đặt-ứng-dụng)
4. [User Flow](#4-user-flow)
5. [Edge Cases](#5-edge-cases)
6. [Sự khác nhau giữa các nền tảng](#6-sự-khác-nhau-giữa-các-nền-tảng)
7. [Các giả định & điểm chưa rõ](#7-các-giả-định--điểm-chưa-rõ)

---

## 1. Tổng quan hệ thống

### Mục đích
Hệ thống quản lý phân phối sản phẩm (đại lý B2B). Nhà phân phối (dealer) đặt hàng, theo dõi công nợ, quản lý kho serial, kích hoạt bảo hành cho sản phẩm bán ra.

### Các thành phần chính

| Thành phần | Công nghệ | Vai trò |
|---|---|---|
| **Backend** | Spring Boot 3.4.3, Java 17, PostgreSQL, Redis, AWS S3 | REST API + WebSocket, xử lý toàn bộ nghiệp vụ |
| **Dealer App** | Flutter (Material 3), Dart, ChangeNotifier | Ứng dụng mobile cho đại lý |
| **Admin Dashboard** | React 18, TypeScript, Vite | Giao diện quản trị nội bộ |
| **Main Website** | Next.js (App Router) | Trang web public (ISR, SEO) |

### Kiến trúc tổng thể

```
Dealer App (Flutter)
        │ REST + WebSocket
        ▼
   Backend API  ──── PostgreSQL (data)
        │        ──── Redis (cache, rate limit)
        │        ──── AWS S3 / MinIO (file upload)
        ▼
Admin Dashboard (React)
```

### Phân quyền

| Role | Mô tả | Truy cập |
|---|---|---|
| `dealer` | Đại lý bán hàng | `/api/dealer/*` |
| `admin` | Quản trị viên | `/api/admin/*` |
| `anonymous` | Không xác thực | `/api/public/*`, website |

---

## 2. Danh sách chức năng

### Dealer App
| # | Chức năng | Mô tả ngắn |
|---|---|---|
| F01 | Đăng nhập / Đăng xuất | JWT auth, token refresh tự động |
| F02 | Xem danh mục sản phẩm | Lọc, phân trang, tìm kiếm |
| F03 | Quản lý giỏ hàng | Thêm, sửa số lượng, xóa, xem chiết khấu |
| F04 | Đặt hàng | Chọn phương thức thanh toán, xác nhận |
| F05 | Xem & theo dõi đơn hàng | Lịch sử, trạng thái, chi tiết |
| F06 | Ghi nhận thanh toán công nợ | Ghi thanh toán theo đơn còn nợ |
| F07 | Xem tổng hợp công nợ | Dashboard nợ tồn |
| F08 | Quản lý kho serial | Import serial vào kho, gán đơn hàng |
| F09 | Kích hoạt bảo hành | Nhập serial → kích hoạt bảo hành theo đơn |
| F10 | Xuất danh sách bảo hành | Xuất PDF/Excel theo đơn hàng |
| F11 | Thông báo real-time | WebSocket nhận thay đổi trạng thái đơn |
| F12 | Hỗ trợ (ticket) | Tạo phiếu hỗ trợ, xem lịch sử chat |
| F13 | Dashboard báo cáo | Biểu đồ doanh thu, nợ, tồn kho 90 ngày |
| F14 | Cài đặt ứng dụng | Ngôn ngữ (VI/EN), giao diện (dark/light/system) |

### Admin Dashboard
| # | Chức năng |
|---|---|
| A01 | Quản lý đại lý (CRUD) |
| A02 | Quản lý sản phẩm & SKU |
| A03 | Quản lý đơn hàng, duyệt trạng thái |
| A04 | Quản lý bảo hành |
| A05 | Quản lý kho serial |
| A06 | Gửi thông báo cho đại lý |
| A07 | Báo cáo & thống kê |
| A08 | Audit log hành động admin |

---

## 3. Logic nghiệp vụ chi tiết

---

### 3.1 Xác thực & phân quyền

#### Đăng nhập
**Endpoint:** `POST /api/auth/login`

**Quy trình:**
1. Nhận `email` + `password`
2. Kiểm tra email tồn tại trong DB
3. Nếu email không tồn tại → trả `invalidCredentials` (**không** tiết lộ "email không tồn tại")
4. So sánh password hash (bcrypt)
5. Nếu sai password → cũng trả `invalidCredentials`
6. Nếu đúng → tạo `accessToken` (JWT) + `refreshToken`
7. Trả token về client

> **Bảo mật:** Dùng thông báo lỗi chung cho cả sai email lẫn sai mật khẩu, tránh lộ thông tin tài khoản.

**Validation:**
- Email: required, format hợp lệ
- Password: required, không có min length check ở login

**Token Refresh:**
- `POST /api/auth/refresh` nhận `refreshToken` → trả `accessToken` mới
- Client tự động gọi khi nhận `401` từ bất kỳ API nào (`RemoteAuthService`)

**Đăng xuất:**
- Xóa token khỏi storage local
- Clear toàn bộ state: cart, orders, warranty, notifications

**Quên mật khẩu:**
- `POST /api/auth/forgot-password` nhận email → gửi link reset

---

### 3.2 Sản phẩm & danh mục

**Endpoint:** `GET /api/dealer/products`

**Tham số lọc:** category, stock, warranty, search text, page, size

**Quy tắc:**
- Chỉ dealer đã xác thực mới xem được danh sách
- Giá sản phẩm được snapshot vào đơn hàng tại thời điểm đặt (không thay đổi sau)
- Khi `stock ≤ kLowStockThreshold (10)` → hiển thị cảnh báo "sắp hết hàng"
- Khi `stock = 0` → không cho phép thêm vào giỏ

**Dữ liệu sản phẩm:**
```
Product {
  id, sku, name, price, stock
  warrantyMonths        // Số tháng bảo hành
  descriptions[]        // Rich content (text, image, link)
  videos[]              // Video demo
  specifications[]      // Thông số kỹ thuật
}
```

---

### 3.3 Giỏ hàng

**Endpoints:**
- `GET /api/dealer/cart` — Lấy giỏ hàng
- `PUT /api/dealer/cart/items` — Thêm/cập nhật item
- `DELETE /api/dealer/cart/items/{productId}` — Xóa item
- `DELETE /api/dealer/cart` — Xóa toàn bộ giỏ
- `GET /api/dealer/discount-rules` — Lấy quy tắc chiết khấu

**Kiến trúc:** Local-first với eventual sync (optimistic update + rollback khi lỗi)

#### Tính giá

```
subtotal        = Σ (price × quantity) cho mỗi item
discountAmount  = bulkDiscountAmount(cartItems, rules)
totalAfterDiscount = subtotal - discountAmount
vatAmount       = totalAfterDiscount × 10 / 100       // kVatPercent = 10
total           = totalAfterDiscount + vatAmount
```

#### Chiết khấu theo số lượng (Bulk Discount)

Quy tắc ưu tiên:
1. Rule áp dụng cho sản phẩm cụ thể (product-specific) → ưu tiên hơn rule toàn cục (global)
2. Trong cùng loại: chọn rule có `minQty` cao nhất phù hợp
3. Nếu có nhiều rule cùng minQty: chọn rule có `discountPercent` cao nhất

```
BulkDiscountRule {
  productId?      // null = global
  minQty          // Số lượng tối thiểu để áp dụng
  maxQty?         // Giới hạn trên (nếu có)
  discountPercent // % chiết khấu
}
```

**Hiển thị tiến trình:** `BulkDiscountTarget` cho biết còn cần thêm bao nhiêu sản phẩm để đạt tier tiếp theo.

**Validation giỏ hàng:**
- Số lượng mỗi item ≥ 1
- Số lượng ≤ stock hiện tại của sản phẩm
- Không cho phép thêm sản phẩm hết hàng

**Xóa item:**
- Nút xóa (IconButton) hoặc vuốt trái (Dismissible) trên mobile

---

### 3.4 Đặt hàng & thanh toán

**Endpoint tạo đơn:** `POST /api/dealer/orders`

**Payload:**
```json
{
  "paymentMethod": "bankTransfer | debt",
  "receiverName": "...",
  "receiverPhone": "...",
  "receiverAddress": "...",
  "note": "...",
  "items": [{ "productId": "...", "quantity": 3 }]
}
```

**Quy trình tạo đơn:**
1. Validate tất cả sản phẩm trong cart (stock đủ, sản phẩm tồn tại)
2. Snapshot giá tại thời điểm đặt (lưu `unitPrice` vào `DealerOrderItem`)
3. Tính subtotal, discount, VAT, total (theo công thức ở 3.3)
4. Trừ stock từng sản phẩm (atomic)
5. Lưu đơn với `status = PENDING`
6. Xóa giỏ hàng
7. Trả về `orderId`

#### Trạng thái đơn hàng

```
PENDING ──────► CONFIRMED ──────► SHIPPING ──────► COMPLETED
   │                │                  │
   └────────────────┴──────────────────┴────► CANCELLED
```

| Trạng thái | Ai thay đổi | Điều kiện |
|---|---|---|
| `PENDING → CONFIRMED` | Admin | Xem xét và duyệt đơn |
| `CONFIRMED → SHIPPING` | Admin | Hàng đã được chuẩn bị giao |
| `SHIPPING → COMPLETED` | Admin / System | Giao hàng thành công |
| `* → CANCELLED` | Admin (hoặc dealer nếu còn PENDING) | Hủy đơn, hoàn lại stock |

#### Phương thức thanh toán

**Bank Transfer (Chuyển khoản):**
1. Hiển thị thông tin tài khoản ngân hàng
2. Cho phép sao chép số tài khoản, tên, số tiền (hiện snackbar "Đã sao chép [label]")
3. Dealer phải nhấn nút **"Đã chuyển khoản"** để xác nhận (không có auto-confirm)
4. `paymentStatus = unpaid` cho đến khi admin xác nhận nhận tiền

**Debt (Ghi nợ):**
1. Ghi nhận toàn bộ giá trị đơn hàng là nợ
2. `paymentStatus = debtRecorded`
3. `outstandingAmount = total`

#### Ghi nhận thanh toán công nợ

**Endpoint:** `POST /api/dealer/orders/{orderId}/payments`

```json
{
  "amount": 1000000,
  "channel": "cash | bankTransfer | ...",
  "note": "...",
  "proofFileUrl": "..."  // optional, upload lên S3 trước
}
```

**Validation:**
- `amount > 0` (bắt buộc, hiện snackbar lỗi nếu vi phạm)
- `amount ≤ outstandingAmount` (khuyến nghị, không block cứng)
- **Chống trùng lặp:** Nếu cùng `orderId` + cùng `amount` trong vòng **5 giây** → từ chối

**Tính `outstandingAmount`:**
```
outstandingAmount = max(0, total - paidAmount)
```
- Không bao giờ âm
- Ẩn dòng "Còn nợ" khi `outstandingAmount = 0`

---

### 3.5 Theo dõi công nợ

**Màn hình:** Debt Tracking Screen

**Lọc đơn nợ (debtOrders):**
```
paymentMethod == DEBT
AND outstandingAmount > 0
AND status != CANCELLED
```

**Dashboard tổng hợp:**
- Tổng nợ tồn: `Σ outstandingAmount` của tất cả debtOrders
- Số đơn còn nợ
- Biểu đồ xu hướng (theo period window được chọn)

**Dashboard donut chart:** Dùng cửa sổ cố định **90 ngày**
**Trend card:** Dùng cửa sổ **period** mà người dùng chọn (tuần/tháng/quý)

---

### 3.6 Kho hàng & Serial

**Mô hình dữ liệu:**
```
ProductSerial {
  serialNumber  // Unique per product+warehouse
  product
  warehouse
  status: available | assigned | activated | defective
  importedAt
}
```

**Trạng thái serial:**
```
available ──► assigned ──► activated
                │
                └──► defective  // Admin đánh dấu lỗi
```

**Import serial:**
- **Endpoint:** `POST /api/dealer/serials`
- Bulk import (nhiều serial cùng lúc)
- Serial được normalize: trim + uppercase
- Trùng serial trong cùng warehouse → từ chối

**Quy tắc gán serial vào đơn:**
- Serial phải thuộc warehouse tương ứng với đơn hàng
- Chỉ serial `status = available` mới được gán
- Khi gán vào đơn → `status = assigned`

**Xem serial theo đơn:**
- `GET /api/dealer/serials` trả về danh sách kèm `orderId`, `orderStatus`
- Xử lý serial được phép khi `orderStatus = SHIPPING` **hoặc** `COMPLETED`

---

### 3.7 Bảo hành

**Endpoint kích hoạt:** `POST /api/warranty-activation`

```json
{
  "serialNumber": "SN123456",
  "productId": "...",
  "orderId": "...",
  "customerName": "...",
  "customerPhone": "...",
  "customerAddress": "...",
  "purchaseDate": "2026-03-19"
}
```

**Quy trình kích hoạt:**
1. Normalize serial: trim + uppercase
2. Kiểm tra serial đã được import (tồn tại trong `ImportedSerialRecord`)
3. Kiểm tra serial thuộc đúng `productId`
4. Kiểm tra serial chưa được kích hoạt trước đó
5. Tạo `WarrantyActivationRecord`
6. Cập nhật `ProductSerial.status = activated`
7. Tính ngày hết bảo hành: `purchaseDate + warrantyMonths`

**Fallback dữ liệu khách hàng:**
- Nếu không nhập thông tin khách → tự động điền từ receiver info của đơn hàng

**Validation:**
- Một serial chỉ được kích hoạt **một lần**
- Serial phải thuộc đơn hàng đang xét (không thể kích hoạt nhầm đơn khác)
- Đơn phải có `status = SHIPPING` hoặc `COMPLETED`

**Local sync:**
- `WarrantyController` lưu bản ghi vào `SharedPreferences` (cache local)
- Khi boot: tải từ API, sync vào cache
- `_ensureImportedSerialsForActivations()`: Tạo dummy `ImportedSerialRecord` cho activation đã tồn tại nếu chưa có record — **bảo toàn** `warehouseId`/`warehouseName` nếu record đã tồn tại (không ghi đè)

---

### 3.8 Xuất báo cáo bảo hành

**Màn hình:** `WarrantyExportScreen`

**Luồng Serial-First:**
1. Chọn / scan serial (camera QR hoặc nhập tay)
2. Hệ thống tự động resolve serial → đơn hàng tương ứng (không cần chọn orderId trước)
3. Preview danh sách serial đã scan
4. Chọn định dạng xuất: **PDF** hoặc **Excel**
5. Xuất file kèm:
   - Thông tin serial
   - Thông tin sản phẩm
   - Ngày kích hoạt, ngày hết bảo hành
   - QR code (tùy chọn)

**Không có ràng buộc orderId** trong luồng export (khác với activation).

---

### 3.9 Thông báo

**Kết nối:** WebSocket tại `/ws`
**Auth:** Token truyền qua query param hoặc header khi handshake

**Loại sự kiện:**

| Loại | Payload | Xử lý |
|---|---|---|
| `ORDER_STATUS_CHANGE` | `{ orderId, status, paymentStatus }` | Cập nhật trạng thái đơn trong memory, push notification |
| `INCOMING_NOTICE` | `{ title, body, type }` | Hiển thị banner, lưu vào danh sách thông báo |

**Fallback:** Nếu WebSocket không kết nối được → chuyển sang polling.

**API lấy thông báo:** `GET /api/dealer/notifications`

**Loại thông báo (`DistributorNotice`):**
- `order`: Liên quan đơn hàng
- `system`: Thông báo hệ thống
- `promotion`: Khuyến mãi

---

### 3.10 Hỗ trợ (Support Ticket)

**Tạo ticket:** Chọn category, priority, mô tả vấn đề
**Chat:** Mỗi ticket có thread message (dealer ↔ admin)
**Trạng thái ticket:** open → in_progress → resolved → closed

---

### 3.11 Cài đặt ứng dụng

**Theme:**
- Các tùy chọn: `light` | `dark` | `system`
- Lưu vào `SharedPreferences` dưới dạng chuỗi `'light'`, `'dark'`, `'system'`
- `system` → theo setting của thiết bị (không lưu sai thành `'light'`)

**Ngôn ngữ:**
- `vi` (Tiếng Việt) | `en` (English)
- Toàn bộ UI, validation message, snackbar đều được dịch

---

## 4. User Flow

### 4.1 Luồng đặt hàng (Happy Path)

```
1. Dealer mở app, đăng nhập
2. Vào tab Products → duyệt danh sách
3. Nhấn sản phẩm → Xem chi tiết → "Thêm vào giỏ"
4. Vào tab Cart → kiểm tra giỏ hàng, xem chiết khấu
5. Nhấn "Thanh toán"
6. Nhập thông tin người nhận (tên, SĐT, địa chỉ)
7. Chọn phương thức:
   a. Chuyển khoản → xem thông tin NH, sao chép, chuyển tiền, nhấn "Đã chuyển khoản"
   b. Ghi nợ → nhấn "Xác nhận ghi nợ"
8. Đơn hàng tạo thành công, chuyển sang màn hình xác nhận
9. Vào tab Orders → xem đơn vừa tạo (status: PENDING)
```

### 4.2 Luồng xử lý công nợ

```
1. Admin duyệt đơn hàng (PENDING → CONFIRMED → SHIPPING)
2. Dealer nhận thông báo WebSocket về thay đổi trạng thái
3. Dealer vào tab Debt → xem danh sách đơn còn nợ
4. Chọn đơn → Nhấn "Ghi nhận thanh toán"
5. Nhập số tiền, kênh thanh toán, ghi chú, đính kèm chứng từ (tùy chọn)
6. Xác nhận → outstandingAmount giảm tương ứng
7. Khi outstandingAmount = 0 → đơn biến mất khỏi danh sách nợ
```

### 4.3 Luồng kích hoạt bảo hành

```
1. Admin đánh dấu đơn hàng là SHIPPING hoặc COMPLETED
2. Dealer vào tab Inventory → Import serial vào kho
3. Dealer vào Warranty → Warranty Activation
4. Nhập serial (tay hoặc scan QR)
5. Hệ thống validate: serial tồn tại, chưa kích hoạt, đúng sản phẩm
6. Nhập thông tin khách hàng (hoặc dùng thông tin receiver của đơn)
7. Xác nhận → bảo hành được kích hoạt
8. Dealer có thể xuất danh sách bảo hành (PDF/Excel)
```

### 4.4 Luồng Admin duyệt đơn

```
1. Admin vào Admin Dashboard
2. Xem danh sách đơn hàng mới (PENDING)
3. Xem chi tiết đơn (sản phẩm, dealer, địa chỉ giao hàng)
4. Duyệt → CONFIRMED
5. Chuẩn bị hàng, cập nhật → SHIPPING
6. Giao hàng xong → COMPLETED
7. Hệ thống tự động push WebSocket event về Dealer App
```

---

## 5. Edge Cases

### 5.1 Thanh toán

| Trường hợp | Xử lý |
|---|---|
| `amount = 0` | Từ chối, hiển thị snackbar lỗi |
| `amount > outstandingAmount` | Cho phép (overpayment), admin xử lý thủ công |
| Thanh toán trùng (cùng orderId + amount trong 5s) | Từ chối, snackbar cảnh báo |
| `outstandingAmount = 0` | Ẩn dòng "Còn nợ", không cho ghi thêm thanh toán |

### 5.2 Serial & Bảo hành

| Trường hợp | Xử lý |
|---|---|
| Serial đã kích hoạt | Từ chối, hiển thị lỗi "serial đã được kích hoạt" |
| Serial không tồn tại trong warehouse | Từ chối với lỗi validation |
| Serial trùng khi import | Từ chối item trùng, các item còn lại vẫn import |
| Không có thông tin khách hàng | Fallback sang receiver info của đơn hàng |
| ImportedSerialRecord đã tồn tại | Bỏ qua (không ghi đè), giữ nguyên warehouseId gốc |

### 5.3 Đơn hàng

| Trường hợp | Xử lý |
|---|---|
| Stock không đủ khi đặt | Từ chối tạo đơn, hiện lỗi |
| Sản phẩm bị xóa sau khi vào giỏ | Lỗi khi checkout, yêu cầu xóa item |
| Hủy đơn | Hoàn lại stock cho từng sản phẩm (atomic) |
| Reorder đơn cũ | Thêm vào giỏ, hiện snackbar "Đã thêm X sản phẩm, bỏ qua Y" (hết hàng) |

### 5.4 Giỏ hàng

| Trường hợp | Xử lý |
|---|---|
| Sync thất bại (offline/lỗi mạng) | Rollback về trạng thái trước, hiện lỗi |
| Mutation version conflict | Client giữ version cao nhất, discard version cũ |
| Thêm vào giỏ khi token hết hạn | Trigger refresh token, retry sau khi refresh |

### 5.5 Giao diện & Cài đặt

| Trường hợp | Xử lý |
|---|---|
| `DateTime` tháng 13+ | `DateTime(year, month + n, ...)` tự xử lý overflow sang năm sau |
| Snackbar khi widget đã unmount | Check `!mounted` trước khi gọi ScaffoldMessenger |
| Snackbar từ `didChangeDependencies` | Dùng `addPostFrameCallback` (`_showSnackBarDeferred`) |
| Theme `system` | Lưu chuỗi `'system'`, không lưu sai thành `'light'` |

---

## 6. Sự khác nhau giữa các nền tảng

### Dealer App (Mobile) vs Admin Dashboard (Web)

| Tính năng | Dealer App | Admin Dashboard |
|---|---|---|
| Xem đơn hàng | Chỉ đơn của chính dealer | Toàn bộ đơn hàng |
| Thay đổi trạng thái đơn | Không (chỉ xem) | Có (PENDING→CONFIRMED→SHIPPING→COMPLETED) |
| Ghi nhận thanh toán | Dealer tự ghi | Admin xác nhận / ghi đè |
| Quản lý sản phẩm | Chỉ đọc (xem, thêm vào giỏ) | CRUD đầy đủ |
| Quản lý serial | Import + kích hoạt bảo hành | Xem, đánh dấu defective |
| Thông báo | WebSocket + push notification | Dashboard thông báo |
| Ngôn ngữ | VI / EN (user chọn) | Cố định (thường EN hoặc VI) |
| Cài đặt theme | Có (light/dark/system) | Có (tùy implementation) |
| Audit log | Không có | Có (mọi hành động admin) |

### Main Website vs Dealer App

| Tính năng | Main Website (Next.js) | Dealer App (Flutter) |
|---|---|---|
| Mục tiêu | Khách hàng public, SEO | Đại lý đã xác thực |
| Xem sản phẩm | Có (ISR, cached) | Có (live API) |
| Đặt hàng | Không (chỉ giới thiệu) | Có |
| Thông tin giá | Có thể không hiển thị | Hiển thị đầy đủ |
| Auth | Không bắt buộc | Bắt buộc (JWT) |

---

## 7. Các giả định & điểm chưa rõ

### 7.1 Giả định hiện tại

1. **Một đơn hàng = một warehouse**: Không hỗ trợ đơn lấy hàng từ nhiều kho khác nhau.
2. **Giá cố định tại thời điểm đặt**: Không có cơ chế cập nhật lại giá đơn đã tạo.
3. **VAT = 10% cố định**: Áp dụng cho tất cả sản phẩm, không phân biệt loại hàng.
4. **Một serial = một lần kích hoạt**: Không hỗ trợ chuyển bảo hành.
5. **Thanh toán manual**: Không tích hợp payment gateway tự động, admin xác nhận thủ công.
6. **Công nợ không có lãi suất**: Outstanding amount không tính lãi theo thời gian.

### 7.2 Điểm chưa rõ / Có thể gây hiểu nhầm

| Điểm | Mô tả | Cần làm rõ |
|---|---|---|
| `overpayment` | `amount > outstandingAmount` được phép, nhưng không có logic hoàn tiền | Cần quy tắc xử lý số dư dương |
| Hủy đơn có serial đã assign | Stock hoàn lại, nhưng serial status chuyển về gì? | Cần xác định: `available` hay `defective` hay giữ nguyên |
| Admin override giá | Order có `subtotalOverride`, `vatOverride`, `totalOverride` — ai được override, khi nào? | Cần document rõ use case |
| Bulk discount + product-specific rule cùng tồn tại | Áp dụng rule nào khi cả hai đều match? | Code hiện ưu tiên product-specific, cần confirm |
| Dealer credit limit | `Dealer` có field `creditLimit` nhưng chưa thấy enforce logic | Khi nào block đặt hàng theo credit limit? |
| Warranty transfer | Không có tính năng chuyển bảo hành sang chủ mới | Có cần không? |
| Serial `defective` flow | Admin đánh dấu defective nhưng không thấy workflow đổi hàng | Quy trình RMA cần bổ sung? |
| `paymentStatus` vs `status` | Hai field độc lập — payment `paid` nhưng order vẫn `PENDING` là hợp lệ? | Cần làm rõ quan hệ |
| Notification read/unread | `DistributorNotice` có dispatch tracking, nhưng không rõ read state | Có badge "chưa đọc" không? |
| Support ticket SLA | Không thấy timeout/SLA cho ticket | Cần bổ sung nếu cam kết thời gian phản hồi |

---

*Tài liệu này được tạo tự động từ phân tích source code. Cập nhật khi có thay đổi nghiệp vụ.*
