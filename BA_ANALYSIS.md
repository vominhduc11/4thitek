# Phân tích Nghiệp vụ — Hệ thống 4thitek
**Góc nhìn: Business Analyst**
**Phiên bản: 2026-03-21**

---

## I. Tóm tắt điều hành (Executive Summary)

4thitek là **nền tảng quản lý phân phối B2B** kết nối nhà sản xuất/nhập khẩu với mạng lưới đại lý. Hệ thống giải quyết 4 bài toán cốt lõi:

| # | Bài toán | Giải pháp |
|---|---|---|
| 1 | Đại lý đặt hàng từ xa, nhiều phương thức thanh toán | Dealer App (Flutter) + API đặt hàng + SePay tự động |
| 2 | Kiểm soát công nợ, không để đại lý vượt hạn mức | Credit limit check real-time khi tạo đơn ghi nợ |
| 3 | Truy xuất nguồn gốc sản phẩm đến từng serial | Serial-first lifecycle: AVAILABLE → RESERVED → ASSIGNED → WARRANTY |
| 4 | Bảo hành minh bạch — khách hàng tự tra cứu | Public warranty check + QR code export |

**Vai trò người dùng:**

```
SUPER_ADMIN (1) ──► quản lý toàn bộ staff + hệ thống
ADMIN (n)       ──► vận hành: đơn hàng, kho, dealer, nội dung
DEALER (n)      ──► đặt hàng, thanh toán, kích hoạt bảo hành
Public          ──► tra cứu bảo hành, xem sản phẩm/blog
```

---

## II. Bản đồ nghiệp vụ (Business Domain Map)

```
┌──────────────────────────────────────────────────────────────────┐
│                      LUỒNG CHÍNH (Core Flow)                     │
│                                                                  │
│  [Đại lý] ──► Đặt hàng ──► [Admin] Duyệt ──► Giao hàng         │
│      │             │                               │             │
│      │         Thanh toán                    Serial vào kho      │
│      │       (SePay / ghi nợ)                      │             │
│      │                                     Kích hoạt bảo hành   │
│      └──────────────────────────────────────────► [Khách hàng]  │
│                                              Tra cứu bảo hành    │
└──────────────────────────────────────────────────────────────────┘
```

---

## III. Business Logic theo mức độ ưu tiên

---

### 🔴 CRITICAL — Bắt buộc đúng, sai là lỗi hệ thống

---

#### BL-01 🔴 Kiểm soát hạn mức tín dụng (Credit Limit Guard)

Khi đại lý đặt hàng theo phương thức **ghi nợ**, hệ thống kiểm tra:
```
currentOutstandingDebt + orderTotal ≤ creditLimit
```
Vượt ngưỡng → từ chối đơn ngay. Dùng `SELECT FOR UPDATE` trên row Dealer để tránh race condition khi nhiều đơn đặt đồng thời.

> **Rủi ro nếu sai:** Đại lý nợ không giới hạn → mất kiểm soát dòng tiền.
> **Lưu ý:** Chỉ áp dụng với `paymentMethod = DEBT`. Đơn `BANK_TRANSFER` không qua bước này.

---

#### BL-02 🔴 Reserve Serial khi tạo đơn (Atomic Reservation)

Khi đặt hàng thành công, hệ thống lock serial khả dụng (`AVAILABLE`) đúng số lượng và chuyển sang `RESERVED` trong cùng transaction (`SELECT FOR UPDATE` trên Product row).

```
Tạo đơn   ──► AVAILABLE → RESERVED
Hủy đơn   ──► RESERVED  → AVAILABLE   (hoàn lại)
COMPLETED ──► RESERVED  → ASSIGNED    (chốt)
```

> **Rủi ro nếu sai:** Hai đại lý nhận cùng serial — bán trùng hàng.
> **Điều kiện:** Không đủ serial → từ chối đơn, không tạo đơn thiếu hàng.

---

#### BL-03 🔴 Luật chuyển trạng thái đơn hàng

Chỉ các transition sau hợp lệ:

```
PENDING ──► CONFIRMED ──► SHIPPING ──► COMPLETED   (chỉ tiến)
PENDING ──► CANCELLED                               (hủy sớm)
CONFIRMED ──► CANCELLED                             (hủy trước giao)
❌ SHIPPING không thể hủy
❌ COMPLETED / CANCELLED là trạng thái cuối
```

Admin dùng `SELECT FOR UPDATE` trên row Order khi cập nhật trạng thái.

> **Rủi ro nếu sai:** Serial sai trạng thái, công nợ tính sai, không thể đối soát.

---

#### BL-04 🔴 Điều kiện kích hoạt bảo hành

Serial chỉ được kích hoạt khi **đồng thời** thỏa 3 điều kiện:
- Serial thuộc kho của đại lý đang thao tác
- Serial chưa được kích hoạt bao giờ
- Đơn hàng liên kết ở trạng thái `COMPLETED`

**Ràng buộc ngày:** `purchaseDate` không trước ngày tạo đơn, không sau hôm nay.
**Thông tin bắt buộc:** tên, email, SĐT, địa chỉ khách hàng, ngày mua.

> **Rủi ro nếu sai:** Bảo hành sai người/sản phẩm → tranh chấp pháp lý.

---

#### BL-05 🔴 Chống thanh toán trùng lặp (Idempotency)

Hai lớp bảo vệ độc lập:

| Lớp | Phạm vi | Cơ chế |
|---|---|---|
| SePay webhook | `transactionCode` | Bỏ qua nếu đã xử lý |
| Dealer ghi payment | Cùng `orderId` + `amount` trong 5 giây | `ConflictException` |

> **Rủi ro nếu sai:** Mạng chập chờn → ghi tiền 2 lần → `outstandingAmount` âm, sổ sách sai.

---

#### BL-06 🔴 Phân quyền theo tầng (Authorization Layers)

Phân quyền thực thi **trên server**, không tin vào client:

```
SUPER_ADMIN  ──► tất cả + quản lý staff (/admin/users/**)
ADMIN        ──► /admin/** (trừ user management)
DEALER       ──► /dealer/**, /warranty-activation
Public       ──► /auth/**, /product/**, /warranty/check/**, /blog/**, /content/**
```

**Điểm đặc biệt:**
- `ADMIN` và `SUPER_ADMIN` được truy cập `/dealer/**` để hỗ trợ dealer
- Dealer chỉ xóa file trong folder của mình (path-scoped delete)
- Dealer `status ≠ ACTIVE` bị chặn ở **mọi** dealer endpoint, không chỉ login

> **Rủi ro nếu sai:** Dữ liệu lộ, thao tác trái phép.

---

#### BL-07 🔴 Giá snapshot — Bảo toàn giá trị đơn hàng

Tại thời điểm tạo đơn, `unitPrice` được sao chép vào `DealerOrderItem`. Giá sản phẩm thay đổi sau không ảnh hưởng đơn cũ. `shippingFee = 0` được enforce cứng phía server.

> **Rủi ro nếu sai:** Đơn hàng cũ tự thay đổi giá trị → không thể đối soát tài chính.

---

### 🟡 IMPORTANT — Quan trọng với vận hành, sai gây sự cố nghiêm trọng

---

#### BL-08 🟡 SePay Webhook — Xác nhận thanh toán tự động

SePay gọi `POST /api/v1/webhooks/sepay` khi nhận giao dịch ngân hàng. Hệ thống khớp theo:
- Mã đơn trong nội dung chuyển khoản: `SCS-{dealerId}-{timestamp}`
- Số tiền phải **chính xác bằng** `outstandingAmount` (không chấp nhận thanh toán một phần)

Khi SePay enabled → dealer **không thể** tự ghi payment cho đơn bank transfer. Admin vẫn override được qua `/admin/orders/{id}/payments`.

---

#### BL-09 🟡 Vòng đời tài khoản đại lý

```
Đăng ký ──► UNDER_REVIEW ──► ACTIVE     (admin duyệt)
                          └──► SUSPENDED  (admin tạm khóa)
```

- `UNDER_REVIEW` / `SUSPENDED` → đăng nhập được nhưng **không gọi được** bất kỳ dealer API nào
- `null status` → coi là `ACTIVE` (backward compatibility)
- Email tự động tại mỗi bước: nhận hồ sơ → duyệt/từ chối

---

#### BL-10 🟡 Chiết khấu theo số lượng — Thứ tự ưu tiên rule

Khi có nhiều rule có thể áp dụng:
1. Rule **product-specific** > rule **global**
2. Cùng loại: chọn `minQty` **cao nhất** phù hợp
3. Cùng `minQty`: chọn `discountPercent` **cao nhất**

```
total = (subtotal - discountAmount) × 1.10   // VAT 10% cố định
```

Chỉ rule `status = ACTIVE` được áp dụng.

---

#### BL-11 🟡 Admin bắt buộc đổi mật khẩu lần đầu

Admin mới luôn có `requirePasswordChange = true`. `AdminPasswordChangeRequiredFilter` chặn toàn bộ `/api/v1/admin/**` cho đến khi đổi mật khẩu, ngoại trừ `/auth/**` và `PATCH /api/v1/admin/password`.

---

#### BL-12 🟡 Cache Invalidation — Đồng bộ dữ liệu public

| Cache | Clear khi |
|---|---|
| `ADMIN_DASHBOARD` | Dealer đăng ký, admin cập nhật dealer status, dealer tạo đơn, tạo discount rule |
| `PUBLIC_PRODUCTS` (4 keys) | Admin tạo/cập nhật sản phẩm |
| `PUBLIC_WARRANTY_LOOKUP` | Warranty tạo/cập nhật/xóa/admin đổi status |

Cache cũ → khách hàng tra cứu bảo hành thấy kết quả không chính xác.

---

#### BL-13 🟡 Rate Limiting — Bảo vệ API

Sliding window per IP, cleanup mỗi 5 phút:

| Endpoint | Giới hạn | Mục đích |
|---|---|---|
| `POST /auth/login` | 10 / 60s | Chống brute force |
| `POST /auth/forgot-password` | 5 / 300s | Chống spam email |
| `GET /warranty/check/{serial}` | 30 / 60s | Chống enumeration serial |
| `POST /upload/**` | 20 / 60s | Chống lạm dụng storage |
| `POST /webhooks/sepay` | 120 / 60s | Đủ cho lưu lượng ngân hàng |

---

#### BL-14 🟡 WebSocket — Real-time vận hành

7 events, chia 2 loại:

| Loại | Events | Kỹ thuật |
|---|---|---|
| User-specific | `ORDER_STATUS_CHANGE`, `INCOMING_NOTICE`, `loginConfirmed`, `notificationCreated` | `convertAndSendToUser(username, ...)` |
| Broadcast (admin) | `dealerRegistrationFromAuth`, `adminNewOrder`, `adminNewSupportTicket` | `/topic/...` |

Fallback: polling khi mất kết nối WebSocket.

---

#### BL-15 🟡 Import serial — Partial success

Import bulk serial: item trùng trong cùng warehouse → bỏ qua item đó, các item còn lại **vẫn được import**. API không trả lỗi toàn bộ.

---

### ⚪ OPTIONAL — Phụ trợ, ảnh hưởng UX không ảnh hưởng nghiệp vụ cốt lõi

---

#### BL-16 ⚪ Serial-First UX

Dealer chỉ cần nhập/scan serial — hệ thống tự resolve đơn hàng. Không cần biết `orderId`. Áp dụng cho cả kích hoạt bảo hành và xuất báo cáo.

---

#### BL-17 ⚪ Dashboard — Hai cửa sổ thời gian khác nhau

| Card | Cửa sổ thời gian |
|---|---|
| Activation Trend | Theo kỳ được chọn (tháng/quý) |
| Warranty Status Donut | Cố định 90 ngày gần nhất |

---

#### BL-18 ⚪ Giỏ hàng — Optimistic Update + Rollback

Thao tác giỏ hàng cập nhật UI ngay, rollback nếu API thất bại. Không ảnh hưởng tính toán nghiệp vụ.

---

#### BL-19 ⚪ Audit Log tự động (Admin)

`AdminAuditLoggingAspect` tự ghi log mọi `POST/PUT/PATCH/DELETE` trong `/api/v1/admin/**`. Không can thiệp vào luồng nghiệp vụ.

---

#### BL-20 ⚪ Cài đặt ứng dụng Dealer

Theme (`light`/`dark`/`system`) và ngôn ngữ (`vi`/`en`) lưu trong `SharedPreferences`. Không đồng bộ lên server.

---

## IV. Ma trận rủi ro nghiệp vụ

| Logic | Nếu sai | Loại rủi ro | Mức độ |
|---|---|---|---|
| BL-01 Credit limit | Đại lý nợ không giới hạn | Tài chính | 🔴 |
| BL-02 Serial reservation | Bán trùng hàng cho 2 đại lý | Tồn kho | 🔴 |
| BL-03 Order state machine | Serial/công nợ sai trạng thái | Vận hành | 🔴 |
| BL-04 Warranty activation | Bảo hành sai người/sản phẩm | Pháp lý | 🔴 |
| BL-05 Idempotency | Ghi tiền 2 lần, sổ sách âm | Tài chính | 🔴 |
| BL-06 Authorization | Dữ liệu lộ, thao tác trái phép | Bảo mật | 🔴 |
| BL-07 Price snapshot | Đơn cũ thay đổi giá trị | Tài chính | 🔴 |
| BL-08 SePay webhook | Đơn không tự confirm, tắc nghẽn | Vận hành | 🟡 |
| BL-09 Dealer lifecycle | Dealer chưa duyệt vẫn đặt đơn được | Kinh doanh | 🟡 |
| BL-12 Cache invalidation | Bảo hành/sản phẩm hiển thị sai | Dữ liệu | 🟡 |
| BL-13 Rate limiting | API bị spam/brute force | Bảo mật | 🟡 |

---

## V. Điểm mở — Cần quyết định kinh doanh

| # | Vấn đề | Rủi ro nếu không xử lý |
|---|---|---|
| OP-01 | Serial `DEFECTIVE`/`RETURNED` không có lối thoát | Serial "chết" vĩnh viễn, không thể RMA hoặc tái sử dụng |
| OP-02 | Serial `RESERVED` không có timeout | Serial bị kẹt nếu admin không duyệt/hủy đơn → dealer khác không đặt được |
| OP-03 | `paymentStatus` vs `status` độc lập nhau | Tổ hợp `PAID + PENDING` có hợp lệ không? Cần document rõ |
| OP-04 | Admin override giá (`subtotalOverride`) | Ai được phép? Khi nào? Có audit trail không? |
| OP-05 | Bulk discount: product-specific ưu tiên global | Business decision hay implementation default? |
| OP-06 | Support ticket không có SLA | Dealer không biết bao giờ được phản hồi |

---

## VI. Quick Reference — Tóm tắt cho người đọc nhanh

```
Hệ thống 4thitek = Quản lý đặt hàng B2B + Kiểm soát serial + Bảo hành

7 logic KHÔNG được sai:
  BL-01  Credit limit check trước khi tạo đơn ghi nợ
  BL-02  Reserve serial ngay khi tạo đơn (atomic)
  BL-03  Trạng thái đơn chỉ tiến, không lùi (trừ cancel sớm)
  BL-04  Chỉ đơn COMPLETED mới cho kích hoạt bảo hành
  BL-05  Không ghi thanh toán trùng lặp (2 lớp idempotency)
  BL-06  Phân quyền enforce 100% trên server
  BL-07  Giá đơn là snapshot — không thay đổi sau khi tạo

3 điểm cần quyết định sớm:
  OP-01  Serial DEFECTIVE/RETURNED bị kẹt (cần flow admin reset + RMA)
  OP-02  Serial RESERVED không timeout (cần auto-cancel hoặc cảnh báo)
  OP-06  SLA support ticket (cần định nghĩa nếu có cam kết phản hồi)
```

---

*Phân tích dựa trên source code và BUSINESS_LOGIC.md — phiên bản 2026-03-21.*
