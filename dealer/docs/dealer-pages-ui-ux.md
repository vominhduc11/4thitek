# Dealer App - Danh sách trang và mô tả UI/UX chi tiết

Cập nhật: 2026-03-01  
Phạm vi: toàn bộ các trang hiện có trong `dealer/lib` (các class `*Screen`, `DealerHomeShell`, `_LaunchScreen`).

## 1) Tổng quan route/trang

| STT | Trang | File | Truy cập chính |
|---|---|---|---|
| 1 | _LaunchScreen | `lib/main.dart` | Tự động khi app khởi động |
| 2 | LoginScreen | `lib/login_screen.dart` | Màn hình đăng nhập mặc định |
| 3 | RegisterScreen | `lib/register_screen.dart` | Từ Login |
| 4 | ForgotPasswordScreen | `lib/forgot_password_screen.dart` | Từ Login |
| 5 | DealerHomeShell | `lib/home_shell.dart` | Sau khi đăng nhập/auto login |
| 6 | ProductListScreen | `lib/product_list_screen.dart` | Tab Products |
| 7 | ProductDetailScreen | `lib/product_detail_screen.dart` | Từ Product List |
| 8 | CartScreen | `lib/cart_screen.dart` | Nút giỏ hàng từ Product/List/Detail |
| 9 | CheckoutScreen | `lib/checkout_screen.dart` | Từ Cart |
| 10 | OrderSuccessScreen | `lib/order_success_screen.dart` | Sau khi đặt hàng thành công |
| 11 | OrdersScreen | `lib/orders_screen.dart` | Tab Orders |
| 12 | OrderDetailScreen | `lib/order_detail_screen.dart` | Từ Orders/Order Success/Serial |
| 13 | DebtTrackingScreen | `lib/debt_tracking_screen.dart` | Từ Dashboard |
| 14 | DashboardScreen | `lib/dashboard_screen.dart` | Tab Overview |
| 15 | InventoryScreen | `lib/inventory_screen.dart` | Tab Inventory |
| 16 | InventoryProductDetailScreen | `lib/inventory_product_detail_screen.dart` | Từ Inventory |
| 17 | WarrantyHubScreen | `lib/warranty_hub_screen.dart` | Trang bảo hành (có trong code) |
| 18 | WarrantyActivationScreen | `lib/warranty_activation_screen.dart` | Từ Orders/Inventory/Warranty Hub |
| 19 | WarrantySerialInventoryScreen | `lib/warranty_serial_inventory_screen.dart` | Từ Warranty Hub |
| 20 | SerialScanScreen | `lib/serial_scan_screen.dart` | Từ Inventory/Warranty Activation |
| 21 | AccountScreen | `lib/account_screen.dart` | Tab Account |
| 22 | AccountSettingsScreen | `lib/account_settings_screen.dart` | Từ Account |
| 23 | AppPreferencesScreen | `lib/app_preferences_screen.dart` | Từ Account |
| 24 | NotificationsScreen | `lib/notifications_screen.dart` | Từ nhiều AppBar |
| 25 | SupportScreen | `lib/support_screen.dart` | Từ Account |

## 2) Mô tả UI/UX từng trang

### 1. _LaunchScreen (`lib/main.dart`)
- Mục đích: splash/loading trong lúc bootstrap app settings + auto-login.
- UI: logo icon + wordmark + circular progress indicator, bố cục giữa màn hình.
- UX: giúp người dùng nhận biết app đang khởi tạo, tránh nhảy màn hình đột ngột.
- Trạng thái: chỉ có 1 state loading, sau đó điều hướng sang Login hoặc Home.

### 2. LoginScreen (`lib/login_screen.dart`)
- Mục đích: đăng nhập tài khoản đại lý.
- UI: nền gradient xanh, card login trung tâm, input email/mật khẩu, checkbox remember me, CTA đăng nhập, nút quên mật khẩu/đăng ký.
- UX: validate realtime, thông báo lỗi theo từng trường hợp (email sai, password sai, invalid credentials), auto focus và scroll đến field lỗi.
- Micro interaction: toggle hiện/ẩn mật khẩu, shake animation cho field mật khẩu khi sai, loading state trên nút submit.
- Session UX: nếu remember me được bật, email và token được lưu để auto login.

### 3. RegisterScreen (`lib/register_screen.dart`)
- Mục đích: tạo yêu cầu đăng ký đại lý mới.
- UI: form dài theo từng section (thông tin đại lý, liên hệ, địa chỉ, tài khoản), checkbox đồng ý điều khoản, CTA gửi đăng ký.
- UX: validate đầy đủ/format (email, phone, confirm password), disable thao tác khi đang submit.
- Completion UX: sau submit hiển thị màn hình success trong cùng card, cho phép tạo đăng ký mới hoặc quay lại login.
- Khung nhìn: bố cục mobile-first, scroll view + card nội dung.

### 4. ForgotPasswordScreen (`lib/forgot_password_screen.dart`)
- Mục đích: gửi yêu cầu đặt lại mật khẩu.
- UI: layout cùng visual style với Login/Register, 1 field email, CTA gửi liên kết.
- UX: validate email, loading state khi gửi, thông điệp hướng dẫn check mail/spam sau khi gửi.
- Flow UX: cho phép gửi lại liên kết, đổi email khác, quay về login.

### 5. DealerHomeShell (`lib/home_shell.dart`)
- Mục đích: vỏ điều hướng chính cho toàn bộ app sau login.
- UI mobile: `BottomNavigationBar` 5 tab (`Products`, `Orders`, `Overview`, `Inventory`, `Account`).
- UI desktop: `NavigationRail` + content pane, tự mở rộng rail khi màn hình lớn.
- UX: dùng `IndexedStack` để giữ state từng tab, chuyển nhãn tab không mất context.
- Language UX: label tab đổi theo ngôn ngữ VI/EN từ AppSettings.

### 6. ProductListScreen (`lib/product_list_screen.dart`)
- Mục đích: danh mục sản phẩm để tìm, lọc, xem chi tiết và thêm giỏ.
- UI: header card (summary + search), sticky filter bar (stock filter/sort/advanced filter), danh sách card sản phẩm có paging.
- UX tìm kiếm: debounce ~320ms, clear nhanh bằng icon close.
- UX lọc: lọc tồn kho, sắp xếp, modal bộ lọc nâng cao (giá + warranty), hiển thị chip số bộ lọc đang áp dụng.
- UX state: skeleton first page, error indicator + retry, no-result message theo nguyên nhân (có/không filter).
- Action UX: vào chi tiết, thêm giỏ (có loading), mở cart, mở notifications.

### 7. ProductDetailScreen (`lib/product_detail_screen.dart`)
- Mục đích: xem thông tin chi tiết một sản phẩm và đặt mua.
- UI: appbar + cart badge, hero image, card thông tin giá/SKU/tồn kho, section mô tả, video, thông số kỹ thuật, bottom action bar.
- UX state: loading detail (skeleton), loaded state, thông báo snack bar khi add cart/buy now.
- Quantity UX: dialog chọn số lượng có min/max theo tồn kho + validation.
- Video UX: lazy load video, có fallback/retry nếu lỗi player hoặc URL.
- CTA UX: `Thêm vào giỏ` và `Mua ngay`, disable theo tồn kho/trạng thái orderable.

### 8. CartScreen (`lib/cart_screen.dart`)
- Mục đích: quản lý giỏ hàng trước khi checkout.
- UI: danh sách item card + `SpinBox` chỉnh quantity; bottom summary sticky (tạm tính, giảm giá, VAT, tổng cộng).
- UX empty: trạng thái giỏ rỗng với CTA quay lại mua hàng.
- UX quantity: thay đổi linh hoạt trong giới hạn tồn kho/min order.
- Pricing UX: hiển thị logic giảm giá theo tổng số lượng, gợi ý mua thêm để đạt mốc discount.
- CTA UX: nút `Thanh toán` đẩy sang Checkout.

### 9. CheckoutScreen (`lib/checkout_screen.dart`)
- Mục đích: xác nhận đặt hàng và thanh toán.
- UI: section thông tin nhận hàng, radio payment method, section thông tin chuyển khoản (nếu bank transfer), section tóm tắt đơn.
- UX validate: kiểm tra giỏ hàng (stock, min qty, orderable) trước khi tạo đơn.
- UX payment: nếu chuyển khoản thì mở bottom sheet QR, có copy amount/content/account, auto-complete mô phỏng, nút xác nhận đã chuyển.
- UX feedback: dialog lỗi validation rõ ràng theo từng sản phẩm, snack bar cho hành động copy.
- Completion UX: tạo order, clear cart, điều hướng sang OrderSuccess.

### 10. OrderSuccessScreen (`lib/order_success_screen.dart`)
- Mục đích: xác nhận kết quả đặt hàng thành công.
- UI: icon success, thông tin mã đơn, summary card (số lượng + tổng tiền), 2 nút action.
- UX: cho người dùng 2 hướng nhanh: xem chi tiết đơn hoặc tiếp tục mua hàng.
- Navigation UX: appbar không back button để tránh quay ngược flow thanh toán.

### 11. OrdersScreen (`lib/orders_screen.dart`)
- Mục đích: theo dõi lịch sử đơn và thao tác liên quan.
- UI: list card đơn hàng, chip trạng thái, thông tin tổng quát (tổng tiền, payment status, công nợ), nhóm action button.
- UX empty: thông điệp không có đơn + hướng dẫn đặt đơn.
- UX action: xem chi tiết, đặt lại đơn cũ theo tồn kho hiện tại, xử lý serial cho đơn đã completed.
- Mobile UX: có FAB tạo đơn mới nhanh.

### 12. OrderDetailScreen (`lib/order_detail_screen.dart`)
- Mục đích: xem đầy đủ thông tin 1 đơn.
- UI: các section card rõ ràng: thông tin đơn, người nhận, danh sách item, thanh toán.
- UX clarity: thông tin tổng tiền/đã thanh toán/còn nợ được tách dòng để dễ đối soát.
- UX serial: CTA xử lý serial chỉ enable khi đơn đã completed.
- Error UX: nếu không tìm thấy order thì hiển thị state thông báo đơn giản.

### 13. DebtTrackingScreen (`lib/debt_tracking_screen.dart`)
- Mục đích: quản lý công nợ và lịch sử thanh toán.
- UI: summary debt card, danh sách đơn còn nợ, lịch sử payment.
- UX payment action: mỗi đơn có CTA `Ghi nhận thanh toán` mở dialog nhập amount/channel/note/proof mock.
- UX state: empty card cho từng phần (không có đơn nợ, chưa có lịch sử).
- Feedback UX: snack bar thông báo thành công/thất bại khi record payment.

### 14. DashboardScreen (`lib/dashboard_screen.dart`)
- Mục đích: tổng quan kinh doanh và vận hành.
- UI: overview KPI card + nhiều panel analytics (order status distribution, aging debt, low stock, activation trend, warranty donut, revenue chart) + danh sách đơn gần đây.
- UX filter thời gian: bottom sheet chọn `theo tháng/theo quý`, điều hướng kỳ trước/kỳ sau, khóa kỳ tương lai.
- UX state: loading view (skeleton), error view + retry, empty card cho từng panel khi thiếu dữ liệu.
- UX action: link nhanh sang tạo đơn, xem đơn, xem công nợ, xem tồn kho.

### 15. InventoryScreen (`lib/inventory_screen.dart`)
- Mục đích: theo dõi tồn kho theo SKU và thao tác nhanh.
- UI: search field, chip filter tồn kho, sort menu, summary chip, danh sách item kho, FAB `Tác vụ nhanh`.
- UX performance: lazy load item theo trang khi cuộn (infinite-like local paging).
- UX state: loading skeleton, error + retry, empty kho, empty theo filter.
- Quick action UX: bottom sheet thao tác (`Xuất hàng`, `Nhập hàng từ PO`, `Quét QR/Barcode`).
- Cross-flow UX: vào chi tiết kho từng sản phẩm và sang luồng xử lý serial.

### 16. InventoryProductDetailScreen (`lib/inventory_product_detail_screen.dart`)
- Mục đích: xem chi tiết tồn kho/serial của 1 SKU.
- UI: card thông tin sản phẩm + metric tồn/nhập/bán, nút nhanh (`Xuất hàng`, `Quét QR`), chip lọc serial, list serial card.
- UX serial status: phân loại `available/sold/defective`, đổi màu chip theo trạng thái.
- UX action: copy serial, mở chi tiết đơn, toggle đánh dấu lỗi.
- Validation UX: scan serial có check đúng product/đúng order/đủ điều kiện kích hoạt trước khi điều hướng.

### 17. WarrantyHubScreen (`lib/warranty_hub_screen.dart`)
- Mục đích: trung tâm theo dõi và xử lý serial/bảo hành.
- UI: card `Xử lý serial nhanh`, card `Kho serial` (metric chips + CTA xem serial), danh sách kích hoạt gần đây.
- UX quick start: tự động chọn đơn completed còn thiếu serial để xử lý ngay.
- UX state: thông điệp rõ ràng nếu chưa có đơn hoàn thành hoặc đã xử lý hết serial.
- Cross-navigation: vào `WarrantyActivationScreen` hoặc `WarrantySerialInventoryScreen`.

### 18. WarrantyActivationScreen (`lib/warranty_activation_screen.dart`)
- Mục đích: kích hoạt serial theo đơn hàng.
- UI: section thông tin đơn + progress bar tổng, thông tin khách hàng, section theo từng line item để nhập serial.
- UX gating: nếu order không tồn tại hoặc chưa completed thì khóa flow và hiển thị lý do.
- UX input: hỗ trợ quét QR, dán nhiều serial, nhập tay serial; hiển thị chip serial đã kích hoạt.
- UX validation: check serial hợp lệ theo order/product, chống trùng trong lần nhập, kiểm soát số lượng còn thiếu.
- Completion UX: kích hoạt xong thông báo số serial thành công, đồng bộ lại input còn trống.

### 19. WarrantySerialInventoryScreen (`lib/warranty_serial_inventory_screen.dart`)
- Mục đích: danh mục toàn bộ serial đã nhập kho.
- UI: search, chip filter trạng thái, menu lọc order/SKU, menu sắp xếp, summary chips, list serial card.
- UX tìm/lọc: filter nhanh theo serial, SKU, tên sản phẩm, mã đơn.
- UX action: popup mỗi dòng (`Sao chép serial`, `Xem chi tiết đơn`).
- UX state: thông điệp empty khi không có serial phù hợp bộ lọc.

### 20. SerialScanScreen (`lib/serial_scan_screen.dart`)
- Mục đích: quét serial từ camera hoặc ảnh gallery, fallback nhập tay.
- UI: camera fullscreen + overlay khung quét, scan line animation, status badge trên, manual input panel dưới.
- UX controls: torch toggle, switch camera, quét từ ảnh, retry camera.
- UX feedback: haptic impact khi quét thành công, success flash, auto pop về màn hình trước với giá trị serial.
- Error UX: state riêng cho permission denied/camera lỗi/không đọc được QR từ ảnh, snack bar thông báo rõ ràng.

### 21. AccountScreen (`lib/account_screen.dart`)
- Mục đích: thông tin tài khoản đại lý và các chức năng cá nhân.
- UI: card profile doanh nghiệp, card menu (`Cài đặt tài khoản`, `Hỗ trợ`, `Giao diện và ngôn ngữ`), nút đăng xuất.
- UX data: load profile async từ local storage.
- UX session: đăng xuất có loading overlay và clear session trước khi quay về Login.
- Navigation UX: vào notifications/support/settings nhanh từ appbar/menu.

### 22. AccountSettingsScreen (`lib/account_settings_screen.dart`)
- Mục đích: cập nhật thông tin doanh nghiệp và liên hệ.
- UI: 3 section card (doanh nghiệp, địa chỉ-liên hệ, chính sách bán hàng), field dealer code read-only, nút `Lưu thay đổi`.
- UX state: loading khi nạp profile, saving indicator khi lưu.
- UX validate: bắt buộc đầy đủ thông tin + regex email/phone.
- Feedback UX: snack bar thông báo kết quả lưu.

### 23. AppPreferencesScreen (`lib/app_preferences_screen.dart`)
- Mục đích: cài đặt giao diện và ngôn ngữ app.
- UI: card gồm `Switch dark mode` và `SegmentedButton VI/EN`.
- UX theming: đổi `ThemeMode` ngay lập tức toàn app.
- UX i18n: đổi locale ngay lập tức, label trang này tự thay đổi theo ngôn ngữ đã chọn.
- Persistence UX: lưu setting qua `SharedPreferences`.

### 24. NotificationsScreen (`lib/notifications_screen.dart`)
- Mục đích: hiển thị thông báo từ distributor.
- UI: appbar có số lượng thông báo, list card thông báo với tiêu đề/nội dung/ngày.
- UX readability: sort mới nhất trước, animation nhỏ khi render list.
- Data UX: dùng mock notice data, hiển thị nhanh không có thao tác phức tạp.

### 25. SupportScreen (`lib/support_screen.dart`)
- Mục đích: hỗ trợ đại lý qua contact nhanh + tạo ticket.
- UI: section liên hệ nhanh (hotline/email + copy), section FAQ, section form ticket (category, priority, subject, message).
- UX productivity: bộ đếm ký tự, SLA text theo priority, generate ticket id demo sau submit.
- UX feedback: status card hiển thị thông tin request vừa gửi, cho phép clear; snack bar cho copy/submit/validate.
- Form UX: bắt buộc subject + message, giúp người dùng gửi mô tả đủ chi tiết.

## 3) Ghi chú UX hệ thống

- Theme và language là app-level setting, tác động đến tất cả trang.
- Nhiều trang có nhóm loading/empty/error state, giúp UX ổn định trong trường hợp dữ liệu khác nhau.
- Các flow nghiệp vụ chính đã có đường dẫn liên màn hình rõ ràng:
- Sản phẩm -> Giỏ hàng -> Checkout -> Đơn hàng.
- Đơn hàng/Kho -> Xử lý serial -> Theo dõi serial.
- Dashboard -> Đơn hàng/Công nợ/Kho.
