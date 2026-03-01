# Dealer App - User Journey toàn bộ dự án

Cập nhật: 2026-03-01  
Phạm vi: hành trình người dùng cho app dealer (Flutter).

## 1) Persona chính

- Vai trò: nhân viên đại lý/chủ đại lý.
- Mục tiêu:
- Đặt hàng nhanh từ nhà phân phối.
- Theo dõi trạng thái đơn, công nợ.
- Xử lý serial và kích hoạt bảo hành.
- Kiểm soát tồn kho tại điểm bán.

## 2) Hành trình tổng quan (end-to-end)

### Stage A - Vào app và xác thực

1. Mở app -> splash (`_LaunchScreen`) hiển thị loading.
2. Hệ thống đọc app settings + kiểm tra auto-login.
3. Nếu chưa có phiên hợp lệ -> vào `LoginScreen`.
4. Người dùng đăng nhập:
- Thành công -> vào `DealerHomeShell`.
- Thất bại -> hiển thị lỗi theo field/email/password.
5. Nếu chưa có tài khoản -> vào `RegisterScreen`, gửi yêu cầu đăng ký, quay lại login.
6. Nếu quên mật khẩu -> vào `ForgotPasswordScreen`, gửi yêu cầu reset.

### Stage B - Khám phá và chọn sản phẩm

1. Vào tab `Products` (`ProductListScreen`).
2. Tìm kiếm theo tên/SKU, lọc theo tồn kho, sắp xếp, lọc nâng cao (giá + warranty).
3. Xem chi tiết sản phẩm (`ProductDetailScreen`) để đọc mô tả/video/thông số.
4. Chọn số lượng và:
- Thêm vào giỏ.
- Hoặc mua ngay.

### Stage C - Giỏ hàng và checkout

1. Mở `CartScreen`.
2. Điều chỉnh số lượng từng dòng, xem tạm tính/giảm giá/VAT/tổng cộng.
3. Chọn `Thanh toán` -> `CheckoutScreen`.
4. Chọn phương thức thanh toán:
- Chuyển khoản: quét QR, copy thông tin, xác nhận đã chuyển.
- Công nợ: ghi nhận thanh toán sau.
5. Xác nhận đặt hàng -> tạo đơn -> vào `OrderSuccessScreen`.

### Stage D - Theo dõi đơn hàng sau mua

1. Từ `OrderSuccessScreen`, người dùng:
- Xem chi tiết đơn (`OrderDetailScreen`).
- Hoặc tiếp tục mua hàng.
2. Vào tab `Orders` (`OrdersScreen`) để theo dõi danh sách đơn.
3. Thao tác trên đơn:
- Xem chi tiết.
- Đặt lại đơn cũ (re-order).
- Xử lý serial (nếu đơn đã completed).

### Stage E - Công nợ và đối soát thanh toán

1. Từ dashboard vào `DebtTrackingScreen`.
2. Xem tổng công nợ hiện tại + danh sách đơn còn nợ.
3. Ghi nhận thanh toán từng đơn (mock): amount, channel, note, proof.
4. Theo dõi lịch sử thanh toán đã ghi nhận.

### Stage F - Xử lý serial và bảo hành

1. Bắt đầu từ:
- `OrdersScreen` -> nút `Xử lý serial`.
- `InventoryScreen` quick action.
- `WarrantyHubScreen` (nếu vào flow bảo hành).
2. Vào `WarrantyActivationScreen`:
- Điền thông tin khách hàng.
- Nhập/quét serial theo từng item.
- Dán nhiều serial nếu cần.
- Validate serial theo order + product + trạng thái.
3. Xác nhận kích hoạt -> lưu activation records.
4. Theo dõi serial trong `WarrantySerialInventoryScreen`:
- Tìm/lọc theo serial, order, SKU, status.
- Copy serial, mở chi tiết đơn.
5. Hỗ trợ scan riêng trong `SerialScanScreen`:
- Camera real-time.
- Quét từ ảnh gallery.
- Fallback nhập tay.

### Stage G - Quản lý kho

1. Vào tab `Inventory` (`InventoryScreen`).
2. Tìm/lọc/sắp xếp tồn kho theo SKU.
3. Xem summary chips: tổng SKU, tổng tồn, sắp hết.
4. Mở chi tiết từng SKU (`InventoryProductDetailScreen`) để xem serial-level.
5. Dùng quick actions:
- Xuất hàng.
- Nhập hàng từ PO (mock luồng).
- Quét QR/Barcode.

### Stage H - Tài khoản, hỗ trợ, cá nhân hóa

1. Vào tab `Account` (`AccountScreen`).
2. Xem profile đại lý, cập nhật tại `AccountSettingsScreen`.
3. Mở `SupportScreen` để:
- Lấy hotline/email nhanh.
- Gửi ticket hỗ trợ.
4. Mở `AppPreferencesScreen` để:
- Chuyển Dark/Light mode.
- Chuyển ngôn ngữ VI/EN.
5. Xem `NotificationsScreen` để cập nhật thông báo từ distributor.
6. Đăng xuất -> quay lại `LoginScreen`.

## 3) Journey theo tình huống sử dụng thực tế

### Journey 1 - Đặt đơn nhanh (happy path)

1. Login thành công.
2. Tìm sản phẩm trong Product List.
3. Thêm vào giỏ.
4. Checkout bằng chuyển khoản.
5. Xác nhận đặt hàng.
6. Theo dõi đơn trong Orders.

### Journey 2 - Đặt đơn và ghi nhận công nợ

1. Login -> Product List -> Cart -> Checkout.
2. Chọn phương thức `Công nợ`.
3. Tạo đơn.
4. Sau đó vào Debt Tracking để ghi nhận thanh toán từng đợt.

### Journey 3 - Xử lý serial sau khi đơn giao

1. Từ Orders chọn đơn completed.
2. Vào Warranty Activation.
3. Quét serial bằng camera hoặc dán hàng loạt.
4. Xác nhận kích hoạt.
5. Kiểm tra lại trong Warranty Serial Inventory.

### Journey 4 - Kiểm soát tồn kho và serial theo SKU

1. Vào Inventory.
2. Lọc sản phẩm sắp hết/hot.
3. Mở Inventory Product Detail.
4. Xem serial-level, đánh dấu serial lỗi, mở chi tiết đơn liên quan.

### Journey 5 - Vận hành hỗ trợ và cài đặt

1. Vào Account.
2. Nếu cần, cập nhật thông tin doanh nghiệp.
3. Gửi ticket hỗ trợ khi gặp sự cố.
4. Điều chỉnh giao diện/ngôn ngữ theo người dùng.

## 4) Điểm chạm UX quan trọng

- Login UX:
- Validate rõ theo từng lỗi.
- Remember me + auto login.

- Catalog UX:
- Search debounce.
- Sticky filter bar + advanced filters.
- Loading/error/empty states đầy đủ.

- Checkout UX:
- Tóm tắt tiền minh bạch (discount + VAT + total).
- QR transfer flow có copy nhanh thông tin.

- Serial UX:
- Multi-input theo dòng sản phẩm.
- Scan camera/gallery/manual.
- Validation nghiệp vụ chặt (order/product/duplicate/status).

- Inventory UX:
- Quick actions cho thao tác nhanh.
- Drill-down SKU -> serial-level.

- Account UX:
- Cài đặt app level (theme/language) lưu persistent.
- Support và notifications để giữ kết nối vận hành.

## 5) Đầu ra mong đợi theo mỗi giai đoạn

- Sau Stage A: người dùng vào được shell chính.
- Sau Stage C: đơn mới được tạo thành công.
- Sau Stage D/E: đơn được theo dõi rõ ràng, công nợ có lịch sử.
- Sau Stage F: serial được kích hoạt đúng quy trình.
- Sau Stage G: tồn kho được kiểm soát theo SKU + serial.
- Sau Stage H: tài khoản và trải nghiệm được cá nhân hóa, dễ vận hành dài hạn.
