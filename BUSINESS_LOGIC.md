# BUSINESS_LOGIC

Last aligned with codebase: `2026-03-29`

## 1. Scope

Tài liệu này mô tả hành vi runtime hiện tại của repo `4thitek`.

- Dùng cho `backend`, `admin-fe`, `dealer`, `main-fe`, QA.
- Ưu tiên mô tả behavior đang chạy trong code, không mô tả intent cũ chưa ship.
- Nếu PR thay đổi business rule hoặc API contract, phải update file này trong cùng PR.

## 2. Conventions

- Timezone nghiệp vụ: `Asia/Ho_Chi_Minh`.
- Hầu hết phép tính tiền được xử lý theo VND nguyên; các chỗ nhận input payment sẽ `HALF_UP` về số nguyên VND trước khi validate.
- `soft delete` hiện dùng cho `products`, `blogs`, `orders`.
- Các admin mutation qua `AdminController` được audit tự động; payload có redact các field nhạy cảm như password/token/secret.

## 3. Roles And Permissions

### 3.1 Runtime RBAC

Runtime RBAC thực tế chỉ có các authority sau:

- `DEALER`
- `ADMIN`
- `SUPER_ADMIN`

`Admin.roleTitle` chỉ là chức danh hiển thị. Nó không tạo thêm permission mới.

- Admin staff API trả:
  - `role`: display title / chức danh nội bộ
  - `systemRole`: authority thật của backend (`ADMIN` hoặc `SUPER_ADMIN`)
- Admin user invite UI chỉ cho nhập `role` display; không có path UI để gán granular RBAC hoặc tự gán `SUPER_ADMIN`.

### 3.2 Route-level permission summary

| Actor | Quyền chính |
| --- | --- |
| Anonymous | `auth`, public content/blog/product, public warranty lookup, public dealer listing, `GET /api/v1/upload/**`, `POST /api/v1/webhooks/sepay`, websocket handshake `/ws/**` |
| DEALER | Toàn bộ `/api/v1/dealer/**`, `POST /api/v1/warranty-activation`, upload avatar/payment proof của dealer |
| ADMIN | Toàn bộ `/api/v1/admin/**` trừ các route bị chặn riêng cho `SUPER_ADMIN` |
| SUPER_ADMIN | Toàn bộ quyền `ADMIN` + `GET /api/v1/admin/audit-logs` + `/api/v1/admin/settings` + `/api/v1/admin/users/**` |

### 3.3 Dealer account access policy

`Dealer.customerStatus` là gate cho dealer portal.

| Status | Dealer login/refresh | Public dealer listing | Notes |
| --- | --- | --- | --- |
| `UNDER_REVIEW` | Bị chặn | Không | Self-registration mặc định vào trạng thái này |
| `ACTIVE` | Cho phép | Có | Đây là trạng thái vận hành bình thường |
| `SUSPENDED` | Bị chặn | Không | `suspendedAt` được set để áp dụng grace period 24h cho PENDING orders |

Transition hiện tại:

- `UNDER_REVIEW -> ACTIVE`
- `UNDER_REVIEW -> SUSPENDED`
- `ACTIVE -> SUSPENDED`
- `SUSPENDED -> ACTIVE`

Rule bổ sung:

- Endpoint đổi trạng thái: `PATCH /api/v1/admin/dealers/accounts/{id}/status`
- `status=SUSPENDED` bắt buộc có `reason`
- Request contract hiện tại:
  - `reason` tối đa `500` ký tự
  - `reason` chỉ-whitespace hoặc bỏ trống sẽ bị reject khi `status=SUSPENDED`
  - validation bị chặn ngay ở request DTO và vẫn được guard lại ở service layer
- Khi dealer bị chuyển sang `SUSPENDED`, hệ thống ghi `suspendedAt`.
- `PendingOrderTimeoutJob` auto-cancel các `PENDING` order của dealer đã bị suspend quá `24h`.

### 3.4 Staff user policy

- Staff user status hiện có: `PENDING`, `ACTIVE`.
- Chỉ `SUPER_ADMIN` được quản lý `/api/v1/admin/users/**`.
- Staff được tạo với authority runtime là `ADMIN`.
- `requirePasswordChange=true` khi tạo staff mới.

## 4. Product Lifecycle

### 4.1 Product visibility

`Product.publishStatus`:

- `DRAFT`
- `PUBLISHED`
- `ARCHIVED`

`Product.isDeleted=true` luôn thắng mọi publish state.

Public surface chỉ đọc product thỏa đồng thời:

- `isDeleted = false`
- `publishStatus = PUBLISHED`

Admin page đọc product chưa delete, không lọc theo publish status.

### 4.2 Product stock source of truth

`Product.stock` không phải input tay. Đây là field sync.

Available stock được tính từ `product_serials` thỏa:

- `product_id = X`
- `dealer IS NULL`
- `order IS NULL`
- `status = AVAILABLE`

`ProductStockSyncSupport` cập nhật lại `Product.stock` sau các thao tác import/reserve/release/warranty/delete serial.

## 5. Inventory And Serial Lifecycle

### 5.1 Serial statuses

Runtime enum:

- `AVAILABLE`
- `RESERVED`
- `ASSIGNED`
- `WARRANTY`
- `DEFECTIVE`
- `RETURNED`
- `INSPECTING`
- `SCRAPPED`

### 5.2 Serial ownership model

- Serial ở kho trung tâm: `dealer=null`, `order=null`, `status=AVAILABLE`.
- Serial đã reserve cho order: `order!=null`, `status=RESERVED`.
- Serial đã bàn giao cho dealer: `dealer!=null`, `status=ASSIGNED` hoặc `WARRANTY`.
- Dealer inventory screen chỉ lấy serial của dealer mà `order` null hoặc `order.status=COMPLETED`.

### 5.3 Serial creation/import rules

Admin import (`POST /api/v1/admin/serials/import`):

- Có thể import `AVAILABLE` hoặc `DEFECTIVE` nếu không link order.
- Nếu link order:
  - order `COMPLETED` => status thực tế phải là `ASSIGNED`
  - order chưa completed nhưng không cancelled => status thực tế phải là `RESERVED`
- Không cho import vào order `CANCELLED`.
- Nếu `dealerId` và `orderId` cùng có mặt thì dealer phải khớp owner của order.
- Không cho vượt ordered quantity của product trong order.

Dealer serial import:

- Không có public route dealer serial import trong `DealerController`.
- `DealerPortalService.importSerials(...)` còn tồn tại ở service layer nhưng hiện không exposed ra API; không dùng làm business contract chính thức.

### 5.4 Serial status mutation rules

Admin manual status update (`PATCH /api/v1/admin/serials/{id}/status`):

- Không cho set `RETURNED` hoặc `RESERVED` bằng manual admin route.
- `WARRANTY` yêu cầu warranty active.
- `ASSIGNED` yêu cầu có linked order và không có active warranty.
- `AVAILABLE` hoặc `DEFECTIVE` bị chặn nếu serial vẫn link warranty.
- `DEFECTIVE` bị chặn nếu serial đã thuộc dealer.
- `INSPECTING` và `SCRAPPED` hiện được phép qua manual admin route nếu không vướng các guard ở trên.

Dealer manual status update (`PATCH /api/v1/dealer/serials/{id}/status`):

- Chỉ cho `ASSIGNED` hoặc `WARRANTY` -> `DEFECTIVE` hoặc `RETURNED`.
- Không có dealer path để set `INSPECTING` hoặc `SCRAPPED`.

### 5.5 RMA flow

Dedicated RMA endpoint:

- `PATCH /api/v1/admin/serials/{id}/rma`

Allowed actions:

- `START_INSPECTION`: `DEFECTIVE | RETURNED -> INSPECTING`
- `PASS_QC`: `INSPECTING -> AVAILABLE`
- `SCRAP`: `INSPECTING -> SCRAPPED`

Validation:

- Mọi action đều bắt buộc `reason`
- `PASS_QC` bắt buộc `proofUrls` có ít nhất 1 phần tử
- Mỗi action tạo audit log riêng

## 6. Cart, Order, Payment, Shipping, Warranty

### 6.1 Cart

Cart là convenience layer, không giữ stock.

Rules:

- `quantity > 0`; muốn bỏ item phải dùng `DELETE`
- FE/pre-check cart quantity chỉ là UX
- `DealerCartSupport` check available stock tại thời điểm upsert cart
- Cart lưu `priceSnapshot` cho display, nhưng order pricing thật được tính lại khi tạo order

### 6.2 Order creation

Dealer tạo order qua `POST /api/v1/dealer/orders`.

Rules:

- Bắt buộc header `X-Idempotency-Key`
- Idempotency TTL mặc định `10 phút`
- Duplicate key trong TTL trả cached order, không tạo order mới
- `shippingFee` do server kiểm soát; client gửi non-zero sẽ bị reject
- `receiverName`, `receiverAddress`, `receiverPhone` fallback từ profile dealer nếu request để trống
- `orderCode` canonical format:
  - `SCS-{dealerId}-{epochMillis}-{random6}`
- Parser SePay vẫn accept legacy format `SCS-{dealerId}-{number}` để backward compatibility

Stock reservation:

- Product rows được lock bằng `PESSIMISTIC_WRITE`
- Serial available được pick bằng `PESSIMISTIC_WRITE`
- Nếu race làm hết stock:
  - thiếu stock thực tế => `400 Insufficient stock for product ...`
  - lock conflict/timeout => `409 Stock is being updated by another request; please retry`

### 6.3 Order status semantics

`OrderStatus` runtime:

- `PENDING`
- `CONFIRMED`
- `SHIPPING`
- `COMPLETED`
- `CANCELLED`

Dealer transitions:

- `PENDING -> CANCELLED`
- `CONFIRMED -> CANCELLED`
- dealer không được `SHIPPING -> COMPLETED`

Admin transitions:

- `PENDING -> CONFIRMED | CANCELLED`
- `CONFIRMED -> SHIPPING | CANCELLED`
- `SHIPPING -> COMPLETED`

Side effects:

- Cancel order:
  - release non-warranty serials
  - restore stock
  - nếu `paidAmount > 0` thì set `financialSettlementRequired=true` và tạo `FinancialSettlement(PENDING)`
- Complete order:
  - serial `RESERVED`/`AVAILABLE` trong order sẽ được gán dealer và chuyển `ASSIGNED`
- `completedAt` được set/clear theo status

### 6.4 Order soft delete

Current rule:

- Chỉ order `CANCELLED` mới được soft-delete
- Soft-delete set `isDeleted=true`
- Dealer queries và admin default queries chỉ đọc visible orders (`isDeleted=false` hoặc `null`)
- Hiện chưa có API `restore` và chưa có `includeDeleted`

### 6.4.1 Concurrency and locking

Current implementation dùng kết hợp optimistic lock và pessimistic lock:

- `Order.version` dùng `@Version` để chặn lost update trên order aggregate.
- Pessimistic write lock được dùng khi mutate stock/order critical path:
  - order fetch-for-update trong update status / cancel / payment / timeout job
  - product fetch-for-update khi reserve/release stock
  - serial query lock khi assign serial khả dụng
  - một số flow transactional khác cũng dùng pessimistic lock ở repo layer, nhưng release-critical path hiện tại là order/product/serial

Conflict behavior:

- optimistic lock conflict -> HTTP `409` với message: `The record was modified by another request; please retry`
- pessimistic lock / lock-timeout conflict -> HTTP `409` với message: `Stock is being updated by another request; please retry`
- UI phải treat `409` là retryable concurrency error, không phải validation error.

### 6.5 Pending order timeout

Scheduled job:

- check mỗi `1h` mặc định
- `PENDING` quá `48h`:
  - `paidAmount = 0` => auto-cancel, restore stock, `paymentStatus=CANCELLED`
  - `paidAmount > 0` => `staleReviewRequired=true`, tạo `FinancialSettlement(type=STALE_ORDER_REVIEW, status=PENDING)`, không auto-cancel
- warning notification gửi trước timeout `6h`

### 6.6 Discount and pricing

Pricing runtime:

- `subtotal = sum(orderItems.quantity * unitPrice)`
- discount tính trước VAT
- VAT cố định `10%`
- total = `subtotal - discount + VAT + shippingFee`

Discount precedence:

- Nếu có product-specific rule match cho line item thì ưu tiên rule đó
- Nếu không có, dùng global rule match theo total quantity
- Khi nhiều rule cùng match, sort ưu tiên:
  - product-specific trước
  - `minQuantity` lớn hơn
  - `discountPercent` lớn hơn
  - `updatedAt` mới hơn

### 6.6.1 Discount rule admin CRUD

Current admin contract:

- `GET /api/v1/admin/discount-rules`
- `POST /api/v1/admin/discount-rules`
- `PATCH /api/v1/admin/discount-rules/{id}/status`
- `GET /api/v1/dealer/discount-rules`

Actor:

- `ADMIN` hoặc `SUPER_ADMIN`
- dealer chỉ có read path `GET /api/v1/dealer/discount-rules`

Create validation:

- `label` bắt buộc, không được blank
- `range` bắt buộc, không được blank, phải parse được thành khoảng quantity hợp lệ
- `percent` bắt buộc, `> 0`, `<= 100`, tối đa `2` chữ số thập phân
- nếu request không truyền `status` thì backend default `DRAFT`

Status semantics:

- `DRAFT`: rule mới tạo mặc định, chưa có hiệu lực dealer-facing
- `PENDING`: trạng thái chờ rà soát nội bộ
- `ACTIVE`: dealer-facing pricing chỉ dùng các rule đang `ACTIVE`

Notes:

- API hiện chưa có edit/delete body đầy đủ cho discount rule; runtime admin mutation hiện có là create + đổi status.
- `range` response là label canonical backend đang dùng để match pricing.
- Dealer read path chỉ trả các rule `ACTIVE`, đã sort theo đúng precedence pricing runtime.

### 6.7 Payment methods

Runtime enum:

- `BANK_TRANSFER`
- `DEBT`

### 6.8 Payment status semantics

`PaymentStatus` được dùng cho cả order aggregate và payment attempt, nhưng không cùng ý nghĩa ở mọi state.

- `PENDING`: order aggregate còn outstanding hoặc payment chưa confirm
- `PAID`: aggregate đã đủ tiền
- `DEBT_RECORDED`: order dùng `PaymentMethod=DEBT`
- `FAILED`: legacy compatibility value cho historical payment-attempt rows; current runtime không tạo mới và aggregate `order.paymentStatus` không emit state này
- `CANCELLED`: chỉ dùng khi order đã cancel và chưa có confirmed payment

Important:

- Nếu order bị cancel sau khi đã có `paidAmount > 0`, aggregate payment status không ép về `CANCELLED`; refund/settlement được track qua `FinancialSettlement`
- Admin FE dùng naming `pending`; dealer app cũng dùng internal enum `pending` cho order-level unpaid state. Không còn alias runtime `unpaid` trong code.

### 6.9 Manual payment rules

Dealer record payment (`POST /api/v1/dealer/orders/{id}/payments`):

- Không cho payment trên order `CANCELLED`
- amount được `HALF_UP` về số nguyên VND
- amount sau round phải `>= 1`
- Không cho vượt outstanding
- Không cho trả tiền nếu order đã fully paid
- Nếu `PaymentMethod=BANK_TRANSFER` và SePay đang enabled => dealer manual payment bị chặn
- Nếu `PaymentMethod=DEBT`:
  - partial payment tối thiểu mặc định `100000 VND`
  - ngoại lệ: khoản tất toán cuối cùng được nhỏ hơn ngưỡng nếu `amount == outstanding`
- Nếu `outstanding >= 10,000,000 VND` thì dealer phải gửi `proofFileName`
- duplicate payment cùng order + cùng amount trong `30 giây` bị reject
- `transactionCode` nếu có phải unique toàn hệ thống

Admin record payment (`POST /api/v1/admin/orders/{id}/payments`):

- Bypass restriction manual bank-transfer của dealer
- Không áp ngưỡng partial DEBT tối thiểu của dealer
- Vẫn phải tôn trọng outstanding balance

Current compensating controls for debt payment:

- dealer payment trên order có `outstanding >= 10,000,000 VND` bắt buộc có `proofFileName`
- duplicate payment cùng order + cùng amount trong `30 giây` bị reject
- `transactionCode` nếu có phải unique toàn hệ thống
- stale paid pending orders được đẩy vào manual review qua `FinancialSettlement(type=STALE_ORDER_REVIEW, status=PENDING)` và `staleReviewRequired=true`
- admin review surfaces hiện có:
  - Financial settlements page
  - Unmatched payments page
  - order list/detail stale-review indicator

Not implemented today:

- chưa có automated daily reconciliation job riêng cho debt payment
- chưa có anomaly scoring/flag model riêng cho debt payment
- chưa có dedicated admin dashboard chỉ cho debt-payment review
- current risk: ops vẫn phải dựa vào manual review surfaces, nên anomaly nhỏ hoặc lệch đối soát trong ngày có thể chỉ được phát hiện thủ công

### 6.10 Credit limit and DEBT order policy

Dealer chỉ được tạo order `DEBT` nếu:

- `dealer.creditLimit > 0`
- projected outstanding debt sau order mới không vượt credit limit

FE có thể pre-check để báo UX, nhưng backend là source of truth.

### 6.11 SePay webhook

SePay chỉ áp dụng cho `BANK_TRANSFER`.

Rules:

- Chỉ nhận incoming transfer
- Bắt buộc webhook token hợp lệ
- Chỉ match order `BANK_TRANSFER`, chưa deleted, chưa cancelled
- Chỉ accept exact outstanding amount, không accept partial webhook payment
- Duplicate transaction được dedupe bằng `transactionCode`
- Nếu không match được hoặc sai amount:
  - tạo `UnmatchedPayment`
  - notify admin sau commit

Unmatched payment reasons hiện có:

- `ORDER_NOT_FOUND`
- `AMOUNT_MISMATCH`
- `ORDER_ALREADY_SETTLED`
- `ORDER_CANCELLED`

### 6.12 Financial settlement and order adjustment

Financial settlement:

- Tracked riêng qua `FinancialSettlement`
- Status:
  - `PENDING`
  - `REFUNDED`
  - `WRITTEN_OFF`
  - `CREDITED`

Order adjustment là path override tài chính hiện có trong production:

- `GET /api/v1/admin/orders/{id}/adjustments`
- `POST /api/v1/admin/orders/{id}/adjustments`

Rules:

- actor: `ADMIN` hoặc `SUPER_ADMIN`
- Không có persisted fields `subtotalOverride`, `vatOverride`, `totalOverride`
- Override tài chính hiện tại là append-only adjustment
- `reason` tối thiểu 10 ký tự
- `COMPLETED` order bắt buộc `confirmOverride=true`
- Sau adjustment, `paidAmount = sum(payments) + sum(adjustments)`
- Các field pricing trả về cho admin/dealer response (`subtotal`, `discountPercent`, `discountAmount`, `vatPercent`, `vatAmount`, `totalAmount`) là computed snapshot của backend tại thời điểm response, không phải explicit manual override fields.

### 6.13 Warranty lifecycle

Warranty activation/update của dealer:

- Chỉ áp dụng cho serial thuộc dealer
- Yêu cầu serial thuộc order `COMPLETED`
- Không cho activate nếu serial đang `DEFECTIVE` hoặc `RETURNED`
- `purchaseDate` bắt buộc:
  - không được ở tương lai
  - không được sớm hơn ngày tạo order
- `customerName`, `customerEmail`, `customerPhone`, `customerAddress` bắt buộc
- `customerPhone` phải hợp lệ theo phone validator backend
- Dealer app hiện pre-validate cùng regex `^0\d{9}$` trong shared validation utils cho account settings, warranty activation, warranty export.

Warranty period:

- source of truth là `purchaseDate + product.warrantyPeriod months`
- nếu product không có `warrantyPeriod` hợp lệ => default `12 tháng`
- `warrantyEnd` được persist

Warranty status semantics:

- Persisted field: `warrantyEnd`, `status`
- Runtime effective status:
  - `VOID` nếu persisted status = `VOID`
  - `EXPIRED` nếu `warrantyEnd` đã qua
  - `EXPIRED` nếu persisted status = `EXPIRED`
  - còn lại là `ACTIVE`

Serial side effect:

- Warranty active => serial `WARRANTY`
- Warranty delete => serial về:
  - `ASSIGNED` nếu order completed hoặc serial đang ở `WARRANTY`
  - `AVAILABLE` nếu chưa hoàn tất giao
  - giữ nguyên `DEFECTIVE` hoặc `RETURNED`

### 6.14 Support tickets

Support ticket categories runtime:

- `order`
- `warranty`
- `product`
- `payment`
- `returnOrder`
- `other`

Enum `DealerSupportCategory.RETURN` serialize ra wire value `"returnOrder"`.

Support ticket statuses:

- `open`
- `in_progress`
- `resolved`
- `closed`

Current model là single-thread:

- dealer tạo ticket với message gốc
- admin cập nhật `status`
- admin có tối đa một field `adminReply`
- chưa có conversation thread nhiều lượt

### 6.15 Dealer dashboard snapshot behavior

Dealer dashboard hiện chỉ hỗ trợ `month` hoặc `quarter`, chưa có custom date range.

Snapshot rules hiện tại:

- Order KPI (`periodRevenue`, `periodOrderCount`, `periodCompletedOrderCount`) bám đúng kỳ đang chọn.
- Activation trend line dùng cửa sổ `30 ngày` khi filter là `month`, và `90 ngày` khi filter là `quarter`.
- Warranty donut không bám trực tiếp theo full order period; nó luôn build từ activation series tối đa `90 ngày`, với điểm cuối neo theo cuối kỳ đang xem.
- Warranty donut range selector hiện dùng:
  - month view: `7`, `30`
  - quarter view: `7`, `30`, `90`
- Card warranty donut hiện chưa có backend status breakdown thực để phân loại serial theo status; app chủ động render trạng thái `N/A` thay vì tự suy diễn các status giả.
- current risk: QA không được kỳ vọng donut thể hiện breakdown status warranty thật; đây hiện chỉ là card snapshot với range selector và unavailable state có chủ đích.

## 7. Notification

### 7.1 REST notification APIs

Dealer:

- list notifications
- paged notifications
- mark read
- mark unread
- mark all read

Admin:

- paged notifications
- create outbound notifications theo audience

### 7.2 WebSocket contract

Canonical client subscription contract:

- dealer:
  - `/user/queue/notifications`
  - `/user/queue/order-status`
  - `/user/queue/login-confirmed`
- admin:
  - `/topic/dealer-registrations`
  - `/topic/admin/new-orders`
  - `/topic/admin/support-tickets`

Rules:

- Client `SEND` destinations bị disable
- Unknown subscription destination bị reject
- `/user/queue/*` là contract public chuẩn; không dùng physical queue cũ

### 7.3 Dealer polling fallback

Dealer app có polling fallback khi realtime không ổn định:

- interval: `45 giây`
- refresh notifications + order signal
- timer được cleanup khi logout/session expired/dispose

## 8. Reporting And Audit

### 8.1 Report export

Export route:

- `GET /api/v1/admin/reports/export?type={type}&format={format}`

Types:

- `ORDERS`
- `REVENUE`
- `WARRANTIES`
- `SERIALS`

Formats:

- `XLSX`
- `PDF`

Current spec:

| Type | Sort mặc định | Columns |
| --- | --- | --- |
| ORDERS | `createdAt desc` | `Order Code`, `Dealer`, `Status`, `Payment`, `Total`, `Paid`, `Items`, `Created At` |
| REVENUE | `gross revenue desc` | `Dealer`, `Orders`, `Gross Revenue`, `Paid Revenue`, `Outstanding`, `Last Order` |
| WARRANTIES | `createdAt desc` | `Warranty Code`, `Product`, `Serial`, `Dealer`, `Customer`, `Status`, `Start`, `End` |
| SERIALS | `importedAt desc` | `Serial`, `Product`, `SKU`, `Status`, `Warehouse`, `Dealer`, `Customer`, `Imported At` |

Current limitations:

- chưa có custom filters
- chưa có custom date range
- chưa có custom sort
- export luôn lấy full dataset của report type tương ứng
- orders/revenue export hiện build từ toàn bộ `orders` table, không áp visible-order filter

### 8.2 Audit log

Audit read API:

- `GET /api/v1/admin/audit-logs`
- chỉ `SUPER_ADMIN`

Write path:

- admin mutation qua `AdminController` với method `POST|PUT|PATCH|DELETE` sẽ tạo `AuditLog`
- payload có redact field nhạy cảm
- RMA flow cũng tự ghi audit thủ công bổ sung

Current audit response fields:

- `id`
- `createdAt`
- `actor`
- `actorRole`
- `action`
- `requestMethod`
- `requestPath`
- `entityType`
- `entityId`
- `ipAddress`

## 9. Rate Limiting

### 9.1 Effective source of truth

Rate limit runtime được resolve theo thứ tự:

1. DB `admin_settings` override nếu đã set
2. env/application defaults trong `application.properties`

Admin settings hiện có thể override các bucket sau:

- `auth`
- `passwordReset`
- `warrantyLookup`
- `upload`
- `webhook`

### 9.2 Default buckets

| Bucket | Default |
| --- | --- |
| Auth login | `10 req / 60s` |
| Password reset | `5 req / 300s` |
| Warranty lookup | `30 req / 60s` |
| Upload | `20 req / 60s` |
| SePay webhook | `120 req / 60s` |

Runtime behavior:

- trả `429 Too many requests`
- key theo client IP
- ưu tiên Redis nếu có `StringRedisTemplate`; fallback in-memory nếu không có
- `app.rate-limit.trust-forwarded-for=false` mặc định

## 10. State Machines

### 10.1 OrderStatus

| Current | Allowed next | Actor | Side effects |
| --- | --- | --- | --- |
| `PENDING` | `CONFIRMED`, `CANCELLED` | Admin; Dealer chỉ được `CANCELLED` | Cancel release stock/serial |
| `CONFIRMED` | `SHIPPING`, `CANCELLED` | Admin; Dealer chỉ được `CANCELLED` | Cancel release stock/serial |
| `SHIPPING` | `COMPLETED` | Admin only | Complete assigns reserved serials to dealer |
| `COMPLETED` | none | none | terminal |
| `CANCELLED` | none | none | terminal, soft-delete eligible |

### 10.2 PaymentStatus

| Status | Scope | Meaning | Notes |
| --- | --- | --- | --- |
| `PENDING` | Order aggregate / payment attempt | chưa settle đủ | aggregate default cho BANK_TRANSFER còn outstanding |
| `PAID` | Order aggregate / payment attempt | đã settle đủ | aggregate khi `paidAmount >= totalAmount` |
| `DEBT_RECORDED` | Order aggregate | order dùng debt | aggregate cho `PaymentMethod=DEBT` khi chưa fully settled |
| `FAILED` | Legacy payment attempt compatibility | historical failed attempt | runtime hiện tại không emit state này cho aggregate hoặc new writes |
| `CANCELLED` | Order aggregate | order cancel và chưa có confirmed payment | không dùng cho cancelled order đã có tiền |

### 10.3 ApprovalStatus

Không có standalone enum `ApprovalStatus`.

Approval semantics hiện được encode trong các field khác:

| Workflow | Pending | Approved | Rejected/Blocked | Stored field |
| --- | --- | --- | --- | --- |
| Dealer onboarding | `UNDER_REVIEW` | `ACTIVE` | `SUSPENDED` | `Dealer.customerStatus` |
| Order approval | `PENDING` | `CONFIRMED` | `CANCELLED` | `Order.status` |

### 10.4 ShippingStatus

Không có standalone enum `ShippingStatus`.

Shipping semantics hiện chỉ là milestone coarse trong `Order.status`:

| Logical shipping state | Stored as | Actor | Notes |
| --- | --- | --- | --- |
| Chưa xuất kho | `PENDING` / `CONFIRMED` | Admin | chưa có tracking model |
| Đang giao | `SHIPPING` | Admin | không có `carrier`, `trackingNumber`, `ETA`, `proofOfDelivery` |
| Đã giao | `COMPLETED` | Admin | dealer không có confirm-received path |

### 10.5 WarrantyStatus

| Status | Effective rule | Actor |
| --- | --- | --- |
| `ACTIVE` | `warrantyEnd` chưa hết hạn và không bị `VOID` | Dealer/Admin/runtime compute |
| `EXPIRED` | `warrantyEnd` đã qua hoặc persisted status là `EXPIRED` | Runtime compute/Admin |
| `VOID` | manual override | Admin |

### 10.6 SerialStatus

| Status | Entered by | Main exits | Notes |
| --- | --- | --- | --- |
| `AVAILABLE` | Admin import, RMA PASS_QC | `RESERVED`, `DEFECTIVE`, `INSPECTING`, delete | counted vào stock available |
| `RESERVED` | Order workflow, admin/dealer import linked to non-completed order | `ASSIGNED`, release về `AVAILABLE` | không set bằng manual admin status route |
| `ASSIGNED` | Order complete, linked import | `WARRANTY`, `DEFECTIVE`, `RETURNED`, `INSPECTING`, `SCRAPPED` | dealer-owned inventory |
| `WARRANTY` | Warranty active | `DEFECTIVE`, `RETURNED`, back to `ASSIGNED` khi warranty inactive/delete | dealer-owned inventory |
| `DEFECTIVE` | Dealer/admin | `INSPECTING` qua RMA hoặc manual admin status | admin không được mark defective nếu serial đã thuộc dealer |
| `RETURNED` | Dealer | `INSPECTING` qua RMA | admin manual route không được set `RETURNED` |
| `INSPECTING` | Admin RMA / admin manual status | `AVAILABLE`, `SCRAPPED` | trạng thái quarantine coarse |
| `SCRAPPED` | Admin RMA / admin manual status | none defined | terminal trong runtime hiện tại |

## 11. Edge Cases

- Dealer self-registration phone phải match `^0\\d{9}$`; FE phải pre-validate, backend vẫn validate lại.
- Dealer account settings / warranty activation / warranty export dùng cùng FE phone validator `^0\\d{9}$`.
- Order create là source-of-truth cho stock. Cart stock check chỉ là UX.
- Lock conflict trong stock/order update map về `409` với message retry rõ ràng.
- Order code parser SePay accept cả canonical và legacy regex để tránh miss webhook cũ.
- Warranty filter/reporting phải dùng effective status compute-on-read, không dùng raw persisted status nếu muốn biết còn hạn thực tế.
- `FAILED` payment status không được dùng làm alias order-level cho UI; nếu gặp legacy value từ dữ liệu cũ thì UI fallback về `pending`.
- Support category wire value cho `RETURN` là `"returnOrder"`.

## 12. Pending Decision

### 12.1 Shipping metadata

- Status: `Pending Decision`
- Decision owners: Product, Ops, Backend
- Current default behavior:
  - chỉ có `OrderStatus.SHIPPING`
  - chưa có `carrier`, `trackingNumber`, `ETA`, `proofOfDelivery`
  - admin là actor duy nhất đẩy order sang `SHIPPING` và `COMPLETED`
- Risk:
  - không có tracking/POD chi tiết để điều tra dispute giao hàng
  - QA không có metadata-level assertions ngoài coarse `OrderStatus`

### 12.2 Order/record restore for soft delete

- Status: `Pending Decision`
- Decision owners: Product, Ops, Backend
- Current default behavior:
  - deleted orders bị ẩn khỏi query mặc định
  - chưa có restore, chưa có includeDeleted
- Risk:
  - thao tác delete nhầm không có self-service restore path
  - QA và ops phải truy vết bằng DB/log thay vì API chính thức

## 13. Doc vs Code Alignment Notes

- `ADMIN` và `SUPER_ADMIN` là RBAC thật; `roleTitle` chỉ là display, còn `systemRole` mới là authority trả về cho admin user UI.
- `/user/queue/*` là websocket client contract chuẩn.
- Dealer không được mark order received; `SHIPPING -> COMPLETED` là admin-only.
- `PaymentStatus.FAILED` chỉ còn là legacy compatibility value cho dữ liệu cũ; current runtime không emit cho aggregate/new writes.
- `WarrantyStatus` là effective status compute-on-read dựa trên `warrantyEnd`, không cần scheduled expiry job.
- Public dealer serial import endpoint không tồn tại; internal service method còn lại không phải contract chính thức.

## 14. Known Limitations

- Chưa có granular RBAC thật ngoài `ADMIN` / `SUPER_ADMIN`.
- Chưa có shipping subsystem chi tiết.
- Chưa có support ticket threading nhiều lượt; model hiện chỉ có `adminReply` đơn.
- Chưa có SLA model cho support ticket.
- Chưa có report export filter/date-range/sort tùy biến.
- Chưa có audit log retention/export/access policy ngoài page đọc hiện tại.
- Chưa có order restore hoặc includeDeleted query mode.
- Chưa có automated daily debt-payment reconciliation hoặc dedicated anomaly dashboard.

## 15. Future Backlog

- Nếu business cần granular admin permissions, phải làm backend authorization thật trước khi mở UI role matrix.
- Nếu business cần shipping tracking/POD, nên tạo aggregate riêng thay vì nhồi thêm logic vào `OrderStatus`.
- Nếu business cần explicit finance override fields, phải design DB/API/UI/audit riêng; không mở bằng patch nhỏ.
- Nếu business cần automated debt-payment reconciliation hoặc anomaly scoring, phải thiết kế job + signal model + admin queue riêng; không suy diễn từ proof threshold hiện tại.
- Nếu business cần return workflow hoàn chỉnh, phải tách khỏi manual serial status và khỏi RMA coarse flow hiện tại.
