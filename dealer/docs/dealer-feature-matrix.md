# Dealer App - Tổng hợp chức năng

Cập nhật: 2026-03-01  
Phạm vi: ứng dụng Flutter trong thư mục `dealer/lib`.

## 1) Xác thực và phiên đăng nhập

- Đăng nhập bằng email + mật khẩu, có validate dữ liệu và xử lý lỗi theo từng trường hợp.
- Có tùy chọn `Remember me`.
- Hỗ trợ tự động đăng nhập nếu có phiên hợp lệ.
- Đăng ký tài khoản đại lý (form đầy đủ thông tin + đồng ý điều khoản).
- Quên mật khẩu (gửi yêu cầu reset, mock flow).
- Đăng xuất và xóa phiên đăng nhập.

## 2) Điều hướng và cấu hình ứng dụng

- Shell chính có 5 tab: `Products`, `Orders`, `Overview`, `Inventory`, `Account`.
- Điều hướng responsive:
- Mobile dùng `BottomNavigationBar`.
- Desktop dùng `NavigationRail`.
- Hỗ trợ theme:
- Chuyển `Light/Dark mode`.
- Hỗ trợ ngôn ngữ:
- Chuyển `VI/EN`.
- Lưu theme và ngôn ngữ bằng `SharedPreferences`.

## 3) Quản lý sản phẩm

- Danh sách sản phẩm có:
- Tìm kiếm (có debounce).
- Lọc theo tồn kho.
- Sắp xếp (giá, tên).
- Lọc nâng cao (giá, bảo hành...).
- Xem chi tiết sản phẩm.
- Chọn số lượng theo giới hạn tồn kho và thêm vào giỏ hàng.

## 4) Giỏ hàng và checkout

- Giỏ hàng:
- Thêm, giảm/tăng số lượng, xóa từng dòng, xóa tất cả.
- Kiểm tra tồn kho khả dụng theo từng sản phẩm.
- Checkout:
- Nhập thông tin người nhận.
- Chọn phương thức thanh toán (`COD`, `Chuyển khoản`, `Công nợ`).
- Hiển thị tổng tiền, giảm giá, VAT, shipping.
- Hướng dẫn chuyển khoản + thao tác copy số tiền/nội dung.
- Tạo đơn hàng và chuyển đến màn hình thành công.

## 5) Đơn hàng và công nợ

- Danh sách đơn hàng:
- Hiển thị trạng thái đơn và trạng thái thanh toán.
- Xem chi tiết đơn hàng.
- Re-order (đặt lại đơn cũ theo tồn kho hiện tại).
- Xử lý serial cho đơn đã hoàn thành.
- Theo dõi công nợ:
- Danh sách đơn còn nợ.
- Ghi nhận thanh toán (mock): số tiền, kênh thanh toán, ghi chú, file chứng từ (UI mock).
- Lịch sử thanh toán công nợ.

## 6) Dashboard tổng quan

- KPI tổng quan theo kỳ.
- Lọc thời gian theo tháng/quý.
- Revenue chart theo tháng.
- Phân bố trạng thái đơn hàng.
- Công nợ theo tuổi nợ.
- Cảnh báo tồn kho thấp.
- Trend kích hoạt bảo hành.
- Donut trạng thái bảo hành.
- Danh sách đơn gần đây và điều hướng nhanh sang Orders/Products/Inventory.

## 7) Kho và tồn kho

- Quản lý tồn kho theo SKU:
- Tìm kiếm, lọc, sắp xếp.
- Summary chips (tổng SKU, tổng tồn, sắp hết).
- Phân trang/load thêm theo cuộn.
- Màn hình chi tiết tồn kho theo sản phẩm.
- Quick actions:
- Xuất hàng.
- Nhập hàng từ PO (mock flow qua Orders).
- Quét QR/Barcode serial.

## 8) Bảo hành và serial

- Hub bảo hành:
- Tổng quan xử lý serial.
- Truy cập nhanh đến xử lý serial và kho serial.
- Xử lý serial theo đơn:
- Quét QR.
- Dán serial hàng loạt.
- Validate serial theo đơn/sản phẩm/trạng thái.
- Kho serial:
- Tìm kiếm serial/SKU/mã đơn.
- Lọc theo trạng thái (sẵn sàng/đã kích hoạt).
- Lọc theo đơn/SKU và sắp xếp mới-cũ.
- Sao chép serial, mở chi tiết đơn từ serial.
- Quét serial:
- Hỗ trợ camera, đèn flash, đổi camera, nhập tay nếu cần.

## 9) Tài khoản, thông báo, hỗ trợ

- Hồ sơ đại lý:
- Xem thông tin profile.
- Chỉnh sửa và lưu thông tin tài khoản.
- Thông báo:
- Xem danh sách thông báo.
- Hỗ trợ:
- Gọi hotline (copy thông tin).
- Gửi email (copy thông tin).
- Form gửi ticket hỗ trợ (category, priority, mô tả).
- Cài đặt ứng dụng:
- Vào màn hình `Giao diện và ngôn ngữ`.
- Chuyển dark/light.
- Chuyển VI/EN.

## 10) Dữ liệu và kiến trúc

- Dữ liệu đang ở chế độ mock (`mock_data.dart`, `MockAuthService`).
- State management dùng `ChangeNotifier` + `InheritedNotifier`:
- `CartController`
- `OrderController`
- `WarrantyController`
- `AppSettingsController`
- Có bộ lưu trữ local:
- Auth: `FlutterSecureStorage` + fallback `SharedPreferences`.
- Profile đại lý: `SharedPreferences`.
- App settings (theme/locale): `SharedPreferences`.
