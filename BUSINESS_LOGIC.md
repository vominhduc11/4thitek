# Tài liệu Logic Nghiệp Vụ — Hệ thống 4thitek

> Phiên bản runtime truth: 2026-04-08
> Phạm vi: `backend` · `dealer` · `admin-fe` · `main-fe` · docs/runtime contract

---

## 0. Runtime Truth Bắt Buộc

Các rule dưới đây là contract production hiện hành. Nếu code, UI, test hoặc tài liệu phụ lệch khỏi các rule này thì được xem là defect.

### 0.1 Payment và order runtime

- Đơn hàng mới chỉ hỗ trợ `BANK_TRANSFER`.
- Backend là business authority cho order, payment, serial, warranty và reconciliation.
- Tạo order phải tạo đơn thật, sinh `orderCode`, giữ idempotency, reserve stock/serial đúng contract.
- Order mới bắt đầu với `order.status = PENDING` và `paymentStatus = PENDING`.
- Chỉ khi backend ghi nhận chuyển khoản hợp lệ thì order mới được chuyển tiếp sang các bước xử lý tiếp theo.
- Admin không được xác nhận hoặc xử lý đơn chưa thanh toán.

### 0.2 Debt semantics

- `DEBT`, `DEBT_RECORDED`, debt tracking, credit limit và các semantics công nợ không còn là runtime path active.
- Nếu các giá trị này còn tồn tại trong enum, dữ liệu cũ hoặc migration thì chúng chỉ là `historical compatibility only`.
- UI không được hiển thị debt như một lựa chọn thanh toán, quyền thao tác hay màn vận hành hiện hành.
- Docs chỉ được nhắc debt dưới dạng historical note hoặc migration/archive note.

### 0.3 Dealer app runtime

- Dealer app hiện dark-only.
- Không còn theme switch runtime trong dealer app.
- Language setting vẫn là runtime feature nếu màn tương ứng đang hỗ trợ.

### 0.4 Password reset canonical journey

- Dealer app chỉ khởi tạo yêu cầu quên mật khẩu.
- `main-fe` là canonical surface để hoàn tất reset password qua route `/reset-password`.
- Hành trình chuẩn là:
  1. Dealer hoặc public user gửi yêu cầu quên mật khẩu.
  2. Backend luôn trả thông điệp chung, không rò rỉ email có tồn tại hay không.
  3. Người dùng mở link từ email.
  4. `main-fe` validate token.
  5. `main-fe` gửi mật khẩu mới.
  6. Người dùng đăng nhập lại bằng mật khẩu mới.

### 0.5 Inventory và support

- Dealer inventory là feature hạng nhất, có contract backend riêng cho summary, serial list và serial detail/timeline.
- Support ticket là workflow nhiều lượt trao đổi, có thread messages, assignee, trạng thái và audit trail đủ dùng.
- Dealer và admin cùng nhìn vào cùng một conversation contract, không còn mô hình “ticket một lần + một adminReply”.

### 0.6 Public surface

- Public related blogs và related products phải dùng dedicated backend contract, không fetch full list rồi slice ở client.
- Public search dùng backend search contract rõ ràng, tránh overfetch vô nghĩa.
- Public dealer locator có route riêng, SEO-friendly và dùng dữ liệu dealer thật.

### 0.7 Observability

- Blog scheduled publish, webhook/payment async flow và push pipeline phải có structured logging hoặc signal đủ dùng để truy vết lỗi.
- Không thêm log noise; chỉ log những thông tin phục vụ truy vết, correlation và vận hành.

---

## 1. Kiến Trúc và Vai Trò

| Thành phần | Vai trò chính |
| --- | --- |
| `backend` | Business authority, API, scheduling, webhook, notification, persistence |
| `dealer` | App giao dịch cho đại lý: đăng nhập, đặt hàng, inventory, warranty, support |
| `admin-fe` | Điều hành nội bộ: đơn hàng, serial, support, reconciliation, cấu hình |
| `main-fe` | Public website: catalog, blogs, search, warranty lookup, dealer locator, reset password |

Nguyên tắc: mọi thay đổi behavior phải trace được từ route/page/screen tới API/controller, service, DTO, side effect và test.

---

## 2. Dealer Runtime Contract

### 2.1 Xác thực

- Dealer chỉ đăng nhập được khi tài khoản hợp lệ và đang ở trạng thái cho phép.
- Refresh token và logout do backend quản lý.

### 2.2 Quên mật khẩu

#### Backend

- `POST /api/v1/auth/forgot-password`
  - Nhận email.
  - Luôn trả thông điệp thành công chung.
  - Không tiết lộ email có tồn tại hay không.
- `GET /api/v1/auth/reset-password/validate?token=...`
  - Trả trạng thái token hợp lệ, không hợp lệ hoặc đã hết hạn.
- `POST /api/v1/auth/reset-password`
  - Đặt mật khẩu mới nếu token hợp lệ.
  - Token hết hạn hoặc sai phải trả lỗi hợp lý ở mức flow, không lộ thông tin nhạy cảm về tài khoản.

#### Dealer app

- Chỉ có màn yêu cầu gửi email reset.
- Copy phải nói rõ việc đặt mật khẩu mới sẽ hoàn tất trên website từ link trong email.
- Dealer app không được tạo cảm giác có native reset-completion flow.

#### Main website

- `/reset-password` là canonical completion flow.
- Phải có đầy đủ các trạng thái:
  - chưa có token và gửi yêu cầu reset
  - token hợp lệ
  - token không hợp lệ
  - token hết hạn
  - submit thành công
  - submit thất bại

### 2.3 Đặt hàng và thanh toán

- Dealer tạo đơn bằng `BANK_TRANSFER`.
- Không có lựa chọn debt trong checkout runtime.
- Các payment được ghi nhận qua chuyển khoản hoặc reconciliation/admin flow tương ứng.

### 2.4 Inventory

- Dealer inventory dùng read model chuyên biệt từ backend.
- Contract tối thiểu:
  - `GET /api/v1/dealer/inventory/summary`
  - `GET /api/v1/dealer/inventory/serials`
  - `GET /api/v1/dealer/inventory/serials/{id}`
- Summary trả về tồn theo product.
- Serial list trả về các serial dealer đang sở hữu hoặc có quyền nhìn thấy theo lifecycle thực tế.
- Serial detail phải giải thích được:
  - serial nào
  - đang ở trạng thái gì
  - dealer sở hữu vì sao
  - timeline lifecycle tối thiểu

### 2.5 Support

- Dealer tạo ticket mới từ app.
- Dealer xem được thread public replies/history.
- Dealer có thể follow-up bằng message mới nếu ticket chưa đóng hoàn toàn.
- Nếu dealer follow-up sau khi ticket đã `RESOLVED`, hệ thống có thể reopen về `IN_PROGRESS`.

### 2.6 Settings

- Dealer app không có runtime theme switch.
- Nếu UI còn khu vực preferences thì phải diễn đạt đây là dark interface mặc định hoặc chỉ là mô tả hệ thống.
- Không được lưu hoặc hiển thị state gây hiểu nhầm rằng user có thể đổi light/dark runtime.

---

## 3. Admin Runtime Contract

### 3.1 Dealer management

- Admin quản lý hồ sơ và trạng thái đại lý.
- Không mô tả `credit limit` như runtime control hiện hành trên admin surface.
- Nếu dữ liệu lịch sử còn field credit/debt thì không được dùng làm primary operational UX.

### 3.2 Support operations

- Admin xem ticket list và thread chi tiết.
- Admin có thể:
  - đổi trạng thái theo transition hợp lệ
  - assign assignee
  - gửi public reply nhiều lượt
  - ghi internal note nếu cần
- Mỗi thay đổi phải để lại audit trail tối thiểu qua message/system note hoặc log tương ứng.

### 3.3 Payment reconciliation

- Admin theo dõi recent bank-transfer payments và unmatched payments.
- Copy/UI phải phản ánh đây là reconciliation của chuyển khoản, không phải màn công nợ active.

---

## 4. Public Website Runtime Contract

### 4.1 Catalog và related content

- Product detail dùng dedicated related-products API.
- Blog detail dùng dedicated related-blogs API.
- Không fetch toàn bộ dữ liệu rồi slice để render related items.

### 4.2 Search

- Public search dùng backend contract riêng.
- Nếu chưa có ranking phức tạp thì backend vẫn phải là nơi chuẩn hóa payload search, tránh orchestration thừa ở client.

### 4.3 Dealer locator

- Public dealer locator có route riêng.
- Route phải dùng dữ liệu dealer public thật.
- Có search/filter cơ bản nếu dữ liệu cho phép.
- Alias cũ có thể redirect để giữ compatibility.

### 4.4 Warranty lookup

- Public warranty lookup vẫn phải bám đúng serial/warranty invariant hiện có.

---

## 5. Backend Domain Rules Bắt Buộc

### 5.1 Order và payment

- Idempotency tạo order phải được giữ nguyên.
- Payment reconciliation và exact-match policy đã harden thì không được regress.
- Nếu order stale nhưng đã có dấu hiệu tài chính, không được auto-cancel mù.

### 5.2 Serial lifecycle

- Inventory read model phải bám serial lifecycle hiện tại.
- Không được phá status transition đang đúng của serial/warranty.

### 5.3 Support workflow

- Ticket status tối thiểu gồm `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`.
- Thread message phải phân biệt được author role.
- Internal note không được lộ sang dealer surface.

### 5.4 Historical compatibility only

Các semantics sau vẫn có thể còn trong enum, migration hoặc dữ liệu cũ nhưng chỉ phục vụ tương thích lịch sử:

- `PaymentMethod.DEBT`
- `PaymentStatus.DEBT_RECORDED`
- debt-tracking route/screen cũ
- credit/debt columns trong dữ liệu lịch sử

Mọi runtime mới không được tạo thêm bản ghi mới theo các semantics trên.

---

## 6. API Contract Tối Thiểu Đang Active

### 6.1 Auth

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/forgot-password`
- `GET /api/v1/auth/reset-password/validate`
- `POST /api/v1/auth/reset-password`

### 6.2 Dealer

- `GET /api/v1/dealer/inventory/summary`
- `GET /api/v1/dealer/inventory/serials`
- `GET /api/v1/dealer/inventory/serials/{id}`
- `GET /api/v1/dealer/support-tickets/latest`
- `GET /api/v1/dealer/support-tickets/page`
- `GET /api/v1/dealer/support-tickets`
- `POST /api/v1/dealer/support-tickets`
- `POST /api/v1/dealer/support-tickets/{id}/messages`

### 6.3 Admin

- `GET /api/v1/admin/support-tickets`
- `PATCH /api/v1/admin/support-tickets/{id}`
- `POST /api/v1/admin/support-tickets/{id}/messages`
- recent payments / unmatched payments / financial settlement endpoints phục vụ reconciliation hiện hành

### 6.4 Public

- `GET /api/v1/product/products`
- `GET /api/v1/product/{id}`
- `GET /api/v1/product/products/related/{id}`
- `GET /api/v1/blog/blogs`
- `GET /api/v1/blog/{id}`
- `GET /api/v1/blog/blogs/related/{id}`
- `GET /api/v1/search`
- `GET /api/v1/user/dealer`
- `GET /api/v1/user/dealer/page`

---

## 7. Observability Contract

- Blog publish job phải log khi có batch publish, số lượng item và item quan trọng nếu có.
- SePay webhook phải log trạng thái xử lý, lý do ignore/fail, orderCode và transactionCode khi có thể.
- Push token registration và push dispatch phải log sự kiện đăng ký, unregister, token bị deactivate và lỗi gửi push.
- Các log này phải đủ để admin/dev truy vết nhưng không log lộ dữ liệu nhạy cảm như token đầy đủ hoặc secret webhook.

---

## 8. Test Alignment Bắt Buộc

Sau mỗi thay đổi liên quan business contract, test phải bảo vệ tối thiểu:

- debt semantics không còn active trên runtime/UI/docs đã chạm tới
- password reset canonical journey
- support workflow nhiều lượt
- inventory contract mới
- related content/product contract
- public search contract
- observability side effects quan trọng nếu có test phù hợp
- UTF-8/copy trên các flow được sửa

---

## 9. Historical Note

Debt và credit-limit semantics chỉ còn là `historical compatibility only`.

- Không tạo flow runtime mới dựa trên debt.
- Không quảng bá hoặc mô tả debt như active feature trong brand docs, product-ready docs, UI copy hoặc acceptance checklist.
- Nếu cần dọn dữ liệu cũ, dùng tài liệu historical rollout riêng và migration/archive process.
