# Dealer App - Use Cases

Cập nhật: 2026-03-01  
Phạm vi: use case nghiệp vụ chính cho ứng dụng `dealer`.

## 1) Danh sách use case

| Mã | Tên use case | Actor chính | Ưu tiên |
|---|---|---|---|
| UC-01 | Đăng nhập hệ thống | Nhân viên đại lý | Cao |
| UC-02 | Đăng xuất hệ thống | Nhân viên đại lý | Cao |
| UC-03 | Đăng ký tài khoản đại lý | Đại lý mới | Trung bình |
| UC-04 | Quên mật khẩu | Nhân viên đại lý | Trung bình |
| UC-05 | Tạo đơn hàng | Nhân viên đại lý | Cao |
| UC-06 | Thanh toán chuyển khoản | Nhân viên đại lý | Cao |
| UC-07 | Ghi nhận thanh toán công nợ | Nhân viên đại lý | Cao |
| UC-08 | Xử lý/kích hoạt serial | Nhân viên đại lý | Cao |
| UC-09 | Quản lý tồn kho theo SKU | Nhân viên kho/đại lý | Cao |
| UC-10 | Gửi yêu cầu hỗ trợ | Nhân viên đại lý | Trung bình |
| UC-11 | Đổi giao diện và ngôn ngữ | Nhân viên đại lý | Trung bình |

---

## UC-01 - Đăng nhập hệ thống

- Actor chính: Nhân viên đại lý
- Tiền điều kiện: Ứng dụng mở thành công, có kết nối mạng (với backend thật)
- Kích hoạt: Người dùng nhập email/mật khẩu và bấm `Đăng nhập`

### Luồng chính
1. Hệ thống hiển thị màn hình `Login`.
2. Người dùng nhập email và mật khẩu hợp lệ.
3. Người dùng chọn/tắt `Remember me`.
4. Hệ thống xác thực thông tin đăng nhập.
5. Hệ thống tạo phiên làm việc.
6. Hệ thống điều hướng vào `DealerHomeShell`.

### Luồng ngoại lệ
- A1: Email sai định dạng -> báo lỗi tại trường email.
- A2: Sai mật khẩu/email -> báo lỗi xác thực.
- A3: Lỗi mạng -> báo không kết nối được.
- A4: Token không hợp lệ sau auto-login -> quay lại Login.

### Hậu điều kiện
- Thành công: Người dùng vào hệ thống và có session.
- Thất bại: Người dùng ở lại Login với thông báo lỗi rõ ràng.

---

## UC-02 - Đăng xuất hệ thống

- Actor chính: Nhân viên đại lý
- Tiền điều kiện: Đang đăng nhập
- Kích hoạt: Người dùng bấm `Đăng xuất` tại `Account`

### Luồng chính
1. Hệ thống hiển thị trạng thái đang đăng xuất.
2. Hệ thống xóa thông tin phiên (token, remember state).
3. Hệ thống điều hướng về `Login`.

### Luồng ngoại lệ
- A1: Lỗi lưu trữ local -> hệ thống fallback xóa dữ liệu khả dụng và vẫn về Login.

### Hậu điều kiện
- Người dùng không còn phiên đăng nhập hợp lệ.

---

## UC-03 - Đăng ký tài khoản đại lý

- Actor chính: Đại lý mới
- Tiền điều kiện: Chưa có tài khoản
- Kích hoạt: Chọn `Đăng ký đại lý` từ màn Login

### Luồng chính
1. Hệ thống mở form đăng ký.
2. Người dùng nhập thông tin đại lý, liên hệ, địa chỉ, tài khoản.
3. Người dùng đồng ý điều khoản.
4. Người dùng bấm `Gửi đăng ký`.
5. Hệ thống validate dữ liệu.
6. Hệ thống ghi nhận yêu cầu đăng ký và hiển thị trạng thái thành công.

### Luồng ngoại lệ
- A1: Thiếu trường bắt buộc -> báo lỗi tương ứng.
- A2: Email/phone/password không hợp lệ -> báo lỗi.
- A3: Chưa đồng ý điều khoản -> không cho gửi.

### Hậu điều kiện
- Yêu cầu đăng ký được tạo thành công (mock hiện tại).

---

## UC-04 - Quên mật khẩu

- Actor chính: Nhân viên đại lý
- Tiền điều kiện: Có email tài khoản
- Kích hoạt: Bấm `Quên mật khẩu` từ Login

### Luồng chính
1. Hệ thống mở màn hình quên mật khẩu.
2. Người dùng nhập email.
3. Người dùng bấm gửi yêu cầu.
4. Hệ thống validate email.
5. Hệ thống hiển thị thông báo gửi liên kết thành công.

### Luồng ngoại lệ
- A1: Email trống/sai định dạng -> báo lỗi.

### Hậu điều kiện
- Người dùng nhận hướng dẫn bước tiếp theo (mock hiện tại).

---

## UC-05 - Tạo đơn hàng

- Actor chính: Nhân viên đại lý
- Tiền điều kiện: Đăng nhập thành công, có sản phẩm khả dụng
- Kích hoạt: Người dùng chọn mua sản phẩm

### Luồng chính
1. Người dùng tìm/lọc sản phẩm.
2. Người dùng thêm sản phẩm vào giỏ (có chọn số lượng).
3. Người dùng mở `Giỏ hàng`.
4. Người dùng rà soát số lượng và tổng tiền.
5. Người dùng bấm `Thanh toán`.
6. Hệ thống mở `Checkout`.
7. Người dùng chọn phương thức thanh toán.
8. Người dùng xác nhận đặt hàng.
9. Hệ thống tạo đơn hàng.
10. Hệ thống xóa giỏ và chuyển sang màn hình thành công.

### Luồng ngoại lệ
- A1: Giỏ hàng rỗng -> không cho checkout.
- A2: Sản phẩm hết hàng/tạm ngưng -> không cho thêm.
- A3: Số lượng vượt tồn/min order không hợp lệ -> yêu cầu điều chỉnh.

### Hậu điều kiện
- Thành công: Đơn mới được tạo và xuất hiện ở danh sách đơn.

---

## UC-06 - Thanh toán chuyển khoản

- Actor chính: Nhân viên đại lý
- Tiền điều kiện: Đang ở `Checkout`, chọn phương thức chuyển khoản
- Kích hoạt: Bấm xác nhận thanh toán chuyển khoản

### Luồng chính
1. Hệ thống mở QR sheet thanh toán.
2. Người dùng xem/copy thông tin chuyển khoản.
3. Người dùng thực hiện chuyển khoản.
4. Người dùng bấm `Đã quét / Đã chuyển`.
5. Hệ thống xác nhận flow thanh toán.
6. Hệ thống tạo đơn.

### Luồng ngoại lệ
- A1: Người dùng đóng QR sheet trước xác nhận -> không tạo đơn.
- A2: Dữ liệu chuyển khoản thiếu -> không cho xác nhận (backend thật cần kiểm tra server-side).

### Hậu điều kiện
- Đơn hàng được tạo theo flow chuyển khoản.

---

## UC-07 - Ghi nhận thanh toán công nợ

- Actor chính: Nhân viên đại lý
- Tiền điều kiện: Có đơn còn nợ
- Kích hoạt: Chọn `Ghi nhận thanh toán` tại `Debt Tracking`

### Luồng chính
1. Người dùng mở danh sách công nợ.
2. Chọn đơn cần ghi nhận.
3. Nhập số tiền thanh toán, kênh, ghi chú/chứng từ.
4. Xác nhận ghi nhận.
5. Hệ thống cập nhật số đã thanh toán và số còn nợ.
6. Hệ thống thêm bản ghi vào lịch sử thanh toán.

### Luồng ngoại lệ
- A1: Số tiền không hợp lệ -> từ chối ghi nhận.
- A2: Đơn không còn nợ -> không cho ghi nhận.
- A3: Không tìm thấy đơn -> báo lỗi.

### Hậu điều kiện
- Công nợ và lịch sử thanh toán được cập nhật nhất quán.

---

## UC-08 - Xử lý/kích hoạt serial

- Actor chính: Nhân viên đại lý
- Tiền điều kiện: Đơn hàng ở trạng thái completed
- Kích hoạt: Bấm `Xử lý serial`

### Luồng chính
1. Hệ thống mở màn hình xử lý serial theo `orderId`.
2. Người dùng nhập/chỉnh thông tin khách hàng (nếu được phép).
3. Người dùng nhập serial theo từng sản phẩm bằng:
- Quét camera.
- Quét từ ảnh.
- Dán nhiều serial.
- Nhập tay.
4. Hệ thống validate serial theo đơn + sản phẩm + trạng thái.
5. Người dùng xác nhận kích hoạt.
6. Hệ thống lưu activation records.
7. Hệ thống cập nhật tiến độ kích hoạt serial.

### Luồng ngoại lệ
- A1: Đơn chưa completed -> khóa xử lý.
- A2: Serial không thuộc đơn/sản phẩm -> báo lỗi.
- A3: Serial trùng/đã kích hoạt -> báo lỗi.
- A4: Thiếu serial so với số lượng cần kích hoạt -> từ chối submit.

### Hậu điều kiện
- Serial hợp lệ được kích hoạt và truy vết được ở kho serial.

---

## UC-09 - Quản lý tồn kho theo SKU

- Actor chính: Nhân viên kho/đại lý
- Tiền điều kiện: Đăng nhập thành công
- Kích hoạt: Mở tab `Inventory`

### Luồng chính
1. Người dùng tìm kiếm/lọc/sắp xếp SKU.
2. Người dùng xem số liệu tổng quan tồn kho.
3. Chọn một SKU để xem chi tiết.
4. Hệ thống hiển thị serial-level và trạng thái.
5. Người dùng thao tác:
- Copy serial.
- Xem đơn liên quan.
- Đánh dấu serial lỗi.
6. Người dùng có thể gọi quick action (`Xuất hàng`, `Quét QR`, `Nhập hàng`).

### Luồng ngoại lệ
- A1: Không có dữ liệu theo bộ lọc -> hiển thị empty state.
- A2: Quét nhầm serial không thuộc SKU -> báo lỗi.

### Hậu điều kiện
- Người dùng có dữ liệu đủ để quyết định thao tác kho.

---

## UC-10 - Gửi yêu cầu hỗ trợ

- Actor chính: Nhân viên đại lý
- Tiền điều kiện: Đăng nhập thành công
- Kích hoạt: Vào `Support` và bấm `Gửi yêu cầu`

### Luồng chính
1. Người dùng chọn loại yêu cầu và mức ưu tiên.
2. Nhập tiêu đề và nội dung.
3. Bấm gửi yêu cầu.
4. Hệ thống tạo mã ticket.
5. Hệ thống hiển thị thông tin ticket đã gửi.

### Luồng ngoại lệ
- A1: Thiếu tiêu đề hoặc nội dung -> báo lỗi.

### Hậu điều kiện
- Ticket hỗ trợ được ghi nhận (mock hiện tại).

---

## UC-11 - Đổi giao diện và ngôn ngữ

- Actor chính: Nhân viên đại lý
- Tiền điều kiện: Đăng nhập thành công
- Kích hoạt: Mở `Giao diện và ngôn ngữ`

### Luồng chính
1. Người dùng bật/tắt Dark mode.
2. Người dùng chọn VI/EN.
3. Hệ thống áp dụng thay đổi ngay toàn app.
4. Hệ thống lưu thiết lập vào local storage.

### Luồng ngoại lệ
- A1: Lỗi lưu local -> áp dụng tạm thời cho phiên hiện tại và cảnh báo (nếu có).

### Hậu điều kiện
- Thiết lập giao diện/ngôn ngữ được giữ ổn định sau khi mở lại app.

---

## 2) Quy tắc nghiệp vụ cốt lõi

- BR-01: Chỉ đơn `completed` mới cho xử lý serial.
- BR-02: Serial kích hoạt phải thuộc đúng `orderId` và `productId`.
- BR-03: Không cho trùng serial trong cùng lần nhập hoặc đã kích hoạt trước đó.
- BR-04: Checkout chỉ hợp lệ khi giỏ thỏa tồn kho và min order.
- BR-05: Ghi nhận công nợ không vượt quá số còn nợ.

## 3) Gợi ý sử dụng

- Product/BA: dùng để xác nhận phạm vi nghiệp vụ.
- Dev: dùng làm chuẩn implement xử lý nhánh.
- QA/UAT: tách test case theo từng use case + ngoại lệ.
