# Dealer App - User Flow chi tiết

Cập nhật: 2026-03-01  
Phạm vi: các luồng nghiệp vụ chính phục vụ Product/Dev/QA/UAT.

Ghi chú:
- Tài liệu này đi sâu theo từng bước và nhánh xử lý.
- Tài liệu tổng quan xem tại `docs/dealer-user-journey.md`.

## 1) User Flow: Đăng nhập và phiên làm việc

### Mục tiêu
- Người dùng vào được hệ thống nhanh, đúng quyền và giữ phiên ổn định.

### Entry point
- Mở app.

### Flow chính
1. App mở -> hiển thị `_LaunchScreen`.
2. Hệ thống load app settings (theme/locale) + kiểm tra auto-login.
3. Quyết định:
- Có phiên hợp lệ -> vào `DealerHomeShell`.
- Không có phiên -> vào `LoginScreen`.
4. Người dùng nhập email + mật khẩu.
5. Người dùng bấm `Đăng nhập`.
6. Hệ thống xác thực:
- Thành công -> lưu session (nếu remember me bật) -> vào Home.
- Thất bại -> hiển thị lỗi tương ứng.

### Nhánh lỗi chính
- Email sai định dạng -> chặn submit và báo lỗi field email.
- Sai mật khẩu/email -> báo lỗi theo từng loại thất bại.
- Lỗi mạng -> báo không kết nối được máy chủ.
- Token không hợp lệ khi auto-login -> quay về Login.

### Exit condition
- Người dùng vào được `DealerHomeShell` hoặc ở lại Login với lỗi rõ ràng.

---

## 2) User Flow: Đăng ký tài khoản đại lý

### Mục tiêu
- Người dùng chưa có tài khoản gửi yêu cầu đăng ký thành công.

### Entry point
- Từ `LoginScreen` bấm `Đăng ký đại lý`.

### Flow chính
1. Mở `RegisterScreen`.
2. Nhập đầy đủ thông tin doanh nghiệp, liên hệ, địa chỉ, tài khoản.
3. Đồng ý điều khoản.
4. Bấm `Gửi đăng ký`.
5. Hệ thống validate dữ liệu.
6. Thành công -> hiển thị trạng thái đã gửi yêu cầu.
7. Người dùng chọn:
- Gửi đăng ký mới.
- Quay lại đăng nhập.

### Nhánh lỗi chính
- Thiếu trường bắt buộc.
- Email/phone/password/confirm password không hợp lệ.
- Chưa tick đồng ý điều khoản.

### Exit condition
- Trạng thái gửi yêu cầu thành công hiển thị rõ.

---

## 3) User Flow: Quên mật khẩu

### Mục tiêu
- Người dùng gửi được yêu cầu đặt lại mật khẩu.

### Entry point
- Từ `LoginScreen` bấm `Quên mật khẩu`.

### Flow chính
1. Mở `ForgotPasswordScreen`.
2. Nhập email.
3. Bấm gửi liên kết.
4. Hệ thống validate email.
5. Thành công -> hiển thị màn hình xác nhận đã gửi (mô phỏng).
6. Người dùng có thể gửi lại, đổi email khác hoặc quay về Login.

### Nhánh lỗi chính
- Email trống/sai format.

### Exit condition
- Người dùng nhận được thông báo rõ ràng về bước tiếp theo.

---

## 4) User Flow: Tìm sản phẩm -> Thêm giỏ -> Checkout -> Tạo đơn

### Mục tiêu
- Hoàn tất đặt hàng thành công từ catalog.

### Entry point
- Tab `Products`.

### Flow chính
1. Người dùng vào `ProductListScreen`.
2. Tìm kiếm/lọc/sắp xếp danh mục.
3. Chọn sản phẩm:
- Bấm `Chi tiết` -> `ProductDetailScreen`.
- Hoặc bấm `Thêm vào giỏ` trực tiếp.
4. Chọn số lượng hợp lệ theo tồn kho.
5. Mở `CartScreen` và rà soát giỏ.
6. Bấm `Thanh toán` -> `CheckoutScreen`.
7. Chọn phương thức thanh toán:
- Chuyển khoản.
- Công nợ.
8. Xác nhận đặt hàng.
9. Hệ thống tạo đơn + clear giỏ.
10. Chuyển sang `OrderSuccessScreen`.

### Nhánh thanh toán
- Chuyển khoản:
1. Mở sheet QR.
2. Người dùng quét/chuyển khoản.
3. Bấm `Đã quét / Đã chuyển`.
4. Tạo đơn.

- Công nợ:
1. Bỏ qua sheet QR.
2. Tạo đơn với trạng thái công nợ.

### Nhánh lỗi chính
- Giỏ rỗng -> không cho checkout.
- Sản phẩm hết hàng/tạm ngưng phân phối.
- Số lượng vượt tồn kho hoặc dưới mức tối thiểu.
- Không xác nhận chuyển khoản (đóng sheet) -> không tạo đơn.

### Exit condition
- Có đơn mới trong `OrdersScreen` và người dùng thấy màn hình thành công.

---

## 5) User Flow: Theo dõi đơn và đặt lại đơn cũ

### Mục tiêu
- Theo dõi tiến trình đơn và tái đặt hàng nhanh.

### Entry point
- Tab `Orders`.

### Flow chính
1. Mở `OrdersScreen`.
2. Chọn đơn cần xem -> `OrderDetailScreen`.
3. Trên danh sách đơn có thể bấm `Đặt lại đơn cũ`.
4. Hệ thống add lại item vào giỏ theo tồn kho hiện tại.
5. Người dùng tiếp tục checkout nếu muốn.

### Nhánh lỗi chính
- Tất cả item trong đơn cũ đều hết tồn -> báo không thể đặt lại.

### Exit condition
- Giỏ cập nhật đúng theo khả năng tồn kho hiện tại.

---

## 6) User Flow: Xử lý serial cho đơn đã giao

### Mục tiêu
- Kích hoạt đúng serial cho đúng đơn/sản phẩm.

### Entry point
- Từ `OrdersScreen` hoặc `InventoryScreen` hoặc `WarrantyHubScreen`.

### Flow chính
1. Người dùng mở `WarrantyActivationScreen` theo `orderId`.
2. Hệ thống kiểm tra đơn:
- Nếu chưa completed -> khóa flow.
- Nếu completed -> cho nhập serial.
3. Người dùng điền thông tin khách hàng (hoặc dùng dữ liệu sẵn từ đơn).
4. Nhập serial theo từng item bằng một trong các cách:
- Quét QR (`SerialScanScreen`).
- Dán nhiều serial.
- Nhập tay.
5. Hệ thống validate serial:
- Thuộc đúng đơn.
- Thuộc đúng sản phẩm.
- Chưa kích hoạt/trùng.
6. Bấm `Xác nhận kích hoạt serial`.
7. Hệ thống lưu activation record.

### Nhánh lỗi chính
- Không tìm thấy đơn.
- Đơn chưa đủ điều kiện (chưa completed).
- Serial sai định dạng/không thuộc đơn/sản phẩm.
- Serial trùng trong cùng lần nhập hoặc đã kích hoạt trước đó.
- Thiếu serial so với số lượng cần kích hoạt.

### Exit condition
- Progress serial cập nhật đúng, dữ liệu xuất hiện ở kho serial.

---

## 7) User Flow: Quét serial (camera/gallery/manual)

### Mục tiêu
- Lấy serial nhanh, chính xác trong nhiều điều kiện thiết bị.

### Entry point
- Màn `SerialScanScreen`.

### Flow chính
1. Mở camera và overlay khung quét.
2. Người dùng quét mã -> app nhận barcode/QR.
3. Thành công -> haptic + flash -> trả serial về màn hình trước.

### Nhánh thay thế
- Quét từ ảnh gallery.
- Nhập tay serial nếu camera không đọc được.

### Nhánh lỗi chính
- Từ chối quyền camera.
- Không tìm thấy mã trong ảnh.
- Camera lỗi/không khởi động lại được.
- Nhập tay nhưng để trống.

### Exit condition
- Trả về được chuỗi serial hợp lệ hoặc báo lỗi rõ ràng để người dùng thử lại.

---

## 8) User Flow: Quản lý kho và drill-down theo SKU

### Mục tiêu
- Theo dõi tồn kho theo SKU và serial-level.

### Entry point
- Tab `Inventory`.

### Flow chính
1. Mở `InventoryScreen`.
2. Tìm kiếm/lọc/sắp xếp danh sách SKU.
3. Chọn 1 SKU -> `InventoryProductDetailScreen`.
4. Xem metric tồn/nhập/đã bán và danh sách serial.
5. Thao tác serial:
- Copy serial.
- Mở đơn liên quan.
- Đánh dấu lỗi.
6. Dùng quick actions nếu cần (`Xuất hàng`, `Quét QR`, `Nhập hàng từ PO`).

### Nhánh lỗi chính
- Không có dữ liệu kho.
- Không có kết quả theo bộ lọc.
- Quét nhầm serial không thuộc SKU hiện tại.

### Exit condition
- Người dùng ra quyết định vận hành kho dựa trên dữ liệu SKU + serial.

---

## 9) User Flow: Công nợ và ghi nhận thanh toán

### Mục tiêu
- Theo dõi và cập nhật công nợ chính xác theo từng đơn.

### Entry point
- `DebtTrackingScreen` (thường từ Dashboard).

### Flow chính
1. Mở màn công nợ.
2. Xem tổng công nợ + danh sách đơn còn nợ.
3. Chọn đơn -> `Ghi nhận thanh toán`.
4. Nhập số tiền, kênh thanh toán, ghi chú/chứng từ (mock).
5. Xác nhận.
6. Hệ thống cập nhật paid amount, outstanding amount và lịch sử payment.

### Nhánh lỗi chính
- Amount không hợp lệ.
- Đơn không còn nợ.
- Không tìm thấy đơn.

### Exit condition
- Trạng thái nợ và lịch sử thanh toán cập nhật đồng nhất.

---

## 10) User Flow: Tài khoản, hỗ trợ, cài đặt ứng dụng

### Mục tiêu
- Duy trì thông tin đại lý và tối ưu trải nghiệm sử dụng.

### Entry point
- Tab `Account`.

### Flow chính
1. Mở `AccountScreen`.
2. Tùy nhu cầu:
- `Cài đặt tài khoản` -> cập nhật profile và lưu.
- `Hỗ trợ` -> gửi ticket hoặc lấy hotline/email.
- `Giao diện và ngôn ngữ` -> đổi Dark/Light và VI/EN.
3. Nếu cần kết thúc phiên -> bấm `Đăng xuất`.

### Nhánh lỗi chính
- Profile nhập thiếu/sai định dạng email-phone.
- Ticket hỗ trợ thiếu tiêu đề/nội dung.

### Exit condition
- Cấu hình và dữ liệu tài khoản lưu thành công, hoặc logout quay về Login.

---

## 11) Ma trận kiểm thử nhanh theo flow (QA checklist)

| Flow | Case Happy Path | Case Lỗi bắt buộc |
|---|---|---|
| Đăng nhập | Login thành công vào Home | Sai email/password, lỗi mạng |
| Đặt hàng | Tạo đơn thành công từ giỏ | Hết hàng, min qty, giỏ rỗng |
| Chuyển khoản | Xác nhận thanh toán và tạo đơn | Đóng sheet QR không xác nhận |
| Xử lý serial | Kích hoạt đủ serial cho đơn completed | Serial trùng/sai đơn/sai SKU |
| Công nợ | Ghi nhận thanh toán và giảm nợ | Amount sai/đơn không còn nợ |
| Kho | Lọc SKU và mở chi tiết serial | Không có dữ liệu theo bộ lọc |
| Cài đặt app | Đổi theme/language và giữ sau mở lại app | Giá trị setting không lưu |

## 12) Khuyến nghị sử dụng tài liệu

- Product/BA: dùng `User Journey` để mô tả bức tranh lớn.
- Dev/QA: dùng `User Flow` này để bám theo step-by-step và viết test case.
- UAT: lấy các flow ở mục 4 -> 10 làm kịch bản nghiệm thu chính.
