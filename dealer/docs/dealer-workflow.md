# Dealer App - Workflow toàn bộ dự án

Cập nhật: 2026-03-01  
Phạm vi: workflow nghiệp vụ và kỹ thuật cho ứng dụng `dealer` (Flutter).

## 1) Mục tiêu tài liệu

- Mô tả luồng vận hành toàn bộ dự án theo góc nhìn người dùng + hệ thống.
- Làm baseline cho Product/Dev/QA/UAT.
- Tách rõ:
- Workflow đang chạy được ở bản hiện tại (mock/local).
- Workflow mục tiêu khi tích hợp backend thật.

## 2) Bản đồ workflow tổng quát

`Khởi động app` -> `Xác thực` -> `Home Shell` -> `Nghiệp vụ chính` -> `Hậu xử lý` -> `Vận hành tài khoản`

Nghiệp vụ chính gồm:
- Catalog và đặt hàng.
- Theo dõi đơn.
- Công nợ.
- Kho và serial.
- Bảo hành.

## 3) Workflow theo giai đoạn

### 3.1 Khởi động và xác thực

1. App mở (`_LaunchScreen`).
2. Load app settings:
- Theme mode.
- Locale.
3. Kiểm tra phiên đăng nhập:
- Nếu hợp lệ -> vào `DealerHomeShell`.
- Nếu không hợp lệ -> vào `LoginScreen`.
4. Login:
- Thành công -> lưu phiên (remember me nếu bật) -> vào Home.
- Thất bại -> hiển thị lỗi theo loại.
5. Các flow phụ:
- Đăng ký đại lý.
- Quên mật khẩu.

### 3.2 Điều hướng chính (Home Shell)

1. App vào `DealerHomeShell`.
2. Người dùng điều hướng qua 5 tab:
- Products.
- Orders.
- Overview.
- Inventory.
- Account.
3. Hệ thống giữ state tab bằng `IndexedStack`.

### 3.3 Catalog -> Cart -> Checkout -> Tạo đơn

1. Vào `ProductListScreen`.
2. Tìm kiếm/lọc/sắp xếp sản phẩm.
3. Mở `ProductDetailScreen` hoặc thêm giỏ trực tiếp.
4. Vào `CartScreen`:
- Chỉnh số lượng.
- Xem giảm giá/VAT/tổng.
5. Vào `CheckoutScreen`:
- Chọn phương thức thanh toán (chuyển khoản/công nợ).
- Nếu chuyển khoản: mở QR sheet xác nhận.
6. Xác nhận đặt hàng:
- Tạo `Order`.
- Clear giỏ.
- Điều hướng `OrderSuccessScreen`.
7. Hậu kiểm:
- Đơn xuất hiện trong `OrdersScreen`.

### 3.4 Theo dõi đơn và vòng đời đơn

1. Người dùng vào `OrdersScreen`.
2. Chọn đơn để xem `OrderDetailScreen`.
3. Thao tác nghiệp vụ:
- Re-order (đặt lại đơn cũ theo tồn khả dụng).
- Xử lý serial (chỉ khi đơn đã completed).
4. Dashboard cũng hiển thị đơn gần đây và link nhanh sang Orders.

### 3.5 Công nợ

1. Vào `DebtTrackingScreen` (thường từ Dashboard).
2. Xem:
- Tổng công nợ.
- Danh sách đơn còn nợ.
- Lịch sử thanh toán.
3. Thực hiện ghi nhận thanh toán:
- Nhập số tiền, kênh, ghi chú, chứng từ (mock).
4. Hệ thống cập nhật:
- Paid amount.
- Outstanding amount.
- Payment history.

### 3.6 Kho và tồn kho

1. Vào `InventoryScreen`.
2. Tìm/lọc/sắp xếp SKU.
3. Xem chỉ số tồn kho tổng hợp.
4. Vào `InventoryProductDetailScreen` để drill-down serial-level.
5. Quick actions:
- Xuất hàng.
- Nhập hàng từ PO (mock flow).
- Quét QR/Barcode.

### 3.7 Serial và bảo hành

1. Điểm vào xử lý serial:
- Orders.
- Inventory.
- Warranty hub.
2. Vào `WarrantyActivationScreen` theo `orderId`.
3. Kiểm tra điều kiện:
- Đơn phải completed.
4. Nhập serial:
- Quét camera.
- Quét từ ảnh.
- Dán nhiều serial.
- Nhập tay.
5. Validate serial:
- Đúng đơn.
- Đúng sản phẩm.
- Không trùng/không đã kích hoạt.
6. Xác nhận kích hoạt.
7. Theo dõi serial tại `WarrantySerialInventoryScreen`.

### 3.8 Tài khoản, hỗ trợ, cài đặt

1. Vào `AccountScreen`.
2. Các nhánh:
- Cập nhật hồ sơ đại lý (`AccountSettingsScreen`).
- Gửi hỗ trợ (`SupportScreen`).
- Đổi giao diện/ngôn ngữ (`AppPreferencesScreen`).
- Xem thông báo (`NotificationsScreen`).
3. Đăng xuất:
- Xóa session.
- Quay lại Login.

## 4) Workflow kỹ thuật (state và dữ liệu)

### 4.1 State container chính

- `CartController`: giỏ hàng, tính tổng tiền, VAT, discount.
- `OrderController`: danh sách đơn, trạng thái, công nợ, lịch sử thanh toán.
- `WarrantyController`: serial nhập kho, activation records, validate serial.
- `AppSettingsController`: theme mode, locale.

Các controller được cấp phát từ `main.dart` qua scope:
- `CartScope`
- `OrderScope`
- `WarrantyScope`
- `AppSettingsScope`

### 4.2 Lưu trữ local

- Auth:
- `FlutterSecureStorage` (ưu tiên).
- Fallback `SharedPreferences`.
- App settings: `SharedPreferences`.
- Dealer profile: `SharedPreferences`.

### 4.3 Dòng dữ liệu hiện tại

- UI event -> Controller method -> notifyListeners -> UI rebuild.
- Nhiều dữ liệu nghiệp vụ đang lấy từ `mock_data.dart`.

## 5) Workflow hiện tại vs workflow mục tiêu

### 5.1 Hiện tại (đang có trong code)

- UI flow end-to-end chạy được.
- Validate đầu vào và xử lý state local đầy đủ ở mức ứng dụng.
- Có đầy đủ màn hình nghiệp vụ chính.
- Dữ liệu và auth chủ yếu là mock/local.

### 5.2 Mục tiêu khi tích hợp backend

- Auth qua API thật (token, refresh, revoke).
- Product/Inventory/Order/Warranty sync từ server.
- Payment reconciliation và công nợ chuẩn từ backend.
- Serial validation authoritative phía server.
- Notification và support ticket lưu/truy xuất qua API.

## 6) Điểm chặn (gating) trong workflow

- Login: cần email/password hợp lệ.
- Checkout: giỏ không rỗng, số lượng hợp lệ theo tồn kho.
- Serial activation: đơn phải completed và serial hợp lệ theo đơn/SKU.
- Debt payment: chỉ ghi nhận khi đơn còn outstanding.

## 7) Ma trận actor -> workflow

| Actor | Workflow chính | Kết quả mong đợi |
|---|---|---|
| Nhân viên đại lý | Đăng nhập, tìm sản phẩm, đặt hàng | Tạo đơn thành công |
| Nhân viên đại lý | Theo dõi đơn, xử lý serial | Kích hoạt đúng serial |
| Nhân viên đại lý | Theo dõi công nợ | Ghi nhận thanh toán đúng |
| Chủ đại lý | Quản lý hồ sơ/cài đặt app | Cấu hình và dữ liệu tài khoản chuẩn |
| Nhân viên kho | Xem tồn kho, quét serial | Quyết định xuất/nhập chính xác |

## 8) Tài liệu liên quan

- Tổng hợp tính năng: `docs/dealer-feature-matrix.md`
- Danh sách trang và UI/UX: `docs/dealer-pages-ui-ux.md`
- User Journey: `docs/dealer-user-journey.md`
- User Flow chi tiết: `docs/dealer-user-flows.md`
