# TK HiTek Dealer FE Product-Ready Report

## 1. Coverage Report Dealer FE

| Surface | Scope | Status | Notes |
| --- | --- | --- | --- |
| Routes / screens | `launch`, `login`, `forgot_password`, `home shell`, `dashboard`, `products`, `product detail`, `cart`, `checkout`, `orders`, `order detail`, `notifications`, `inventory`, `account`, `account settings`, `preferences`, `support`, `warranty hub`, `warranty activation`, `warranty export` | `done` | Core dealer journeys now sit on the same TK HiTek Material 3 token system with role-appropriate brand density. Runtime hiện hành là `BANK_TRANSFER` only across active checkout and payment flows. |
| Dialogs | confirm logout, cancel order, payment dialogs, auth/system dialogs | `inherits shared system` | Dialog styling is centralized by `main.dart` plus shared panel tokens. |
| Bottom sheets | notification detail, transfer/payment sheets, operational mobile sheets | `inherits shared system` | Radius, dark panel, drag handle and CTA tone are now shared by theme primitives. |
| Drawers / navigation shell | app shell, rail, bottom nav, launch shell, app bars | `done` | Dealer shell now uses one restrained brand language instead of page-by-page blue variants. |
| Shared components | brand identity, section card, stock badge, support history widgets | `done` | Shared widgets are now the visual source of truth for operational cards and statuses. |
| Tables / dense lists | order list, notification list, support history, inventory list | `inherits shared system` | Readability is preserved with Source Sans priority, tighter surfaces and restrained accents. |
| Forms | login, forgot password, checkout, account settings, operational search/filter inputs | `done` | Focus rings, CTA hierarchy, card surfaces and spacing are aligned. |
| Loading / empty / error / success | launch shell, auth states, notification empty state, support history states, cart/checkout feedback | `done` | States now use consistent panel, border and accent rules instead of isolated one-off treatments. |
| Responsive / adaptive | mobile, tablet, desktop shell and high-density panels | `done` | Shared token layer supports mobile bottom nav, tablet/desktop rail and adaptive panel widths. |

## 2. Audit Toàn Bộ Surface UI

### Điểm đã khóa tốt

- `dashboard`, `cart`, `checkout`, `orders`, `notifications`, `account` đều đã giữ ưu tiên vận hành: data và action dễ quét hơn brand expression.
- `login` và `forgot password` đã cùng một identity với phần app shell, không còn cảm giác tách thành một app khác.
- `catalog` và `product detail` vẫn giữ đủ chất thương hiệu qua màu, hình, badge và panel, nhưng không cản search/filter/cart flow.
- `notifications` được nâng từ danh sách thô lên panel có summary, unread emphasis và empty state đúng brand.
- `section card` và `stock badge` đã trở thành primitive chung, giảm drift giữa các screen.

### Các điểm UX đã chỉnh

- Giảm mức dùng Montserrat trong các heading nhỏ và app bar để Source Sans tiếp tục là font chủ đạo, đúng guideline và tốt hơn cho dense B2B UI.
- Tăng tính nhất quán của operational sections bằng header pattern có accent bar, icon badge và spacing thống nhất.
- Chuẩn hóa badge tồn kho theo trạng thái `in stock / low stock / out of stock`, đồng thời bổ sung label song ngữ theo locale hiện tại.
- Làm rõ hierarchy ở `checkout` bằng icon hóa từng panel: shipping, payment, order lines, note, summary.
- Cải thiện notification flow bằng một summary surface trước danh sách, giúp đại lý đọc nhanh số lượng chưa đọc và hành động “mark all read” rõ ràng hơn.

### Responsive / adaptive audit

- Mobile: bottom nav và summary bar trong cart vẫn là ưu tiên chính; notification summary và section headers không gây nặng màn hình.
- Tablet: các card và panel giữ nhịp spacing đều, icon header giúp scan nhanh hơn khi có hai cột.
- Desktop: rail + constrained content vẫn rõ ràng; section card mới không làm layout quá marketing hay quá dày hiệu ứng.

## 3. Audit Mức Độ Bám Brand Guideline

### Color

- Đã bám đúng trục nhận diện chính: `#29ABE2`, `#0071BC`, dark surface và neutral sáng.
- Blue/gradient được dùng như điểm nhấn cho `active`, `CTA`, `accent bar`, `badge`, `selected state`, `notification unread`.
- Support color chỉ dùng tiết chế cho trạng thái phụ trợ như `low stock`, không chiếm vai trò nhận diện chính.

### Typography

- `Source Sans 3` tiếp tục đóng vai trò runtime-safe cho `Source Sans Pro` và là font chủ đạo của body, menu, label, data-heavy UI.
- `Montserrat` chỉ còn giữ ở display emphasis và fallback wordmark, không còn lấn sang app bar/title nhỏ như trước.
- Hierarchy tổng thể phù hợp hơn với operational readability của Dealer FE.

### Icon / layout / grid

- Icon tone giữ trong nhóm xanh dương, trắng, đen, error/status color tiết chế.
- Layout vẫn theo tinh thần grid chặt và ưu tiên vùng thao tác, không đẩy brand vào mức “hero marketing”.
- Section header mới giúp các block cùng một hệ visual mà không làm loãng thông tin.

### Imagery / logo usage

- Logo app shell và auth surfaces vẫn dùng asset hiện có, không tạo biến thể mới.
- Brand icon/wordmark trên shell và app bar giữ contrast tốt trên dark surface.
- Dealer FE tiếp tục hạn chế imagery mạnh ở flow vận hành; brand được thể hiện chủ yếu qua token, shell và panel treatment.

## 4. Danh Sách File Cần Sửa

### Đã sửa trực tiếp

- `dealer/lib/main.dart`
- `dealer/lib/app_router.dart`
- `dealer/lib/login_screen.dart`
- `dealer/lib/forgot_password_screen.dart`
- `dealer/lib/dashboard_screen.dart`
- `dealer/lib/cart_screen.dart`
- `dealer/lib/checkout_screen.dart`
- `dealer/lib/notifications_screen.dart`
- `dealer/lib/widgets/brand_identity.dart`
- `dealer/lib/widgets/section_card.dart`
- `dealer/lib/widgets/stock_badge.dart`
- `dealer/lib/widgets/support_ticket_history.dart`

### Được phủ qua shared system hoặc audit không cần patch trực tiếp

- `dealer/lib/home_shell.dart`
- `dealer/lib/product_list_screen.dart`
- `dealer/lib/product_detail_screen.dart`
- `dealer/lib/orders_screen.dart`
- `dealer/lib/order_detail_screen.dart`
- `dealer/lib/order_success_screen.dart`
- Legacy payment tracking screens are no longer part of the audited runtime surface.
- `dealer/lib/inventory_screen.dart`
- `dealer/lib/inventory_product_detail_screen.dart`
- `dealer/lib/account_screen.dart`
- `dealer/lib/account_settings_screen.dart`
- `dealer/lib/app_preferences_screen.dart`
- `dealer/lib/change_password_screen.dart`
- `dealer/lib/support_screen.dart`
- `dealer/lib/warranty_hub_screen.dart`
- `dealer/lib/warranty_activation_screen.dart`
- `dealer/lib/warranty_export_screen.dart`
- `dealer/lib/warranty_serial_inventory_screen.dart`
- `dealer/lib/serial_scan_screen.dart`

## 5. Code Changes

### Shared brand system

- Chuẩn hóa theme Dealer FE tại `main.dart`: token màu TK HiTek, Material 3 surfaces, focus states, button/input/dialog/bottom sheet/navigation theme.
- Giảm overuse của Montserrat ở title/app bar để Source Sans vẫn là font dẫn dắt trên operational UI.
- Nâng `SectionCard` thành shared pattern có accent bar, optional icon, optional subtitle/action, dùng cho panel density cao mà vẫn cùng brand.
- Chuẩn hóa `StockBadge` với trạng thái rõ hơn, support color tiết chế và text song ngữ theo locale.

### Operational screens

- `checkout`: icon hóa và đồng bộ hierarchy cho shipping, payment, product lines, note, summary.
- `cart`: summary panel nhận cùng section language với checkout và shell.
- `notifications`: thêm summary panel, unread metrics, CTA rõ ràng hơn, empty state cùng pattern section card.

### Auth / shell continuity

- `login`, `forgot password`, `launch/app shell`, `dashboard`, `support history` tiếp tục được giữ trong cùng language đã triển khai trước đó, không tách khỏi product family.

## 6. Checklist Test Cuối

### Verification đã chạy

- [x] `flutter analyze` pass tại `E:\Project\4thitek\dealer`
- [x] `flutter build web` pass tại `E:\Project\4thitek\dealer`

### Search / filter / sort

- [ ] Catalog search trả kết quả đúng khi đổi query liên tục
- [ ] Stock filter và sort trên `product_list_screen.dart` không bị mất state khi đổi breakpoint
- [ ] Search CTA, filter chips và active states vẫn rõ trên mobile/tablet/desktop

### Cart / checkout / payment

- [ ] Cart quantity debounce vẫn đúng và không lệch calculation
- [ ] Checkout summary vẫn đúng subtotal, discount, VAT, total
- [ ] Payment method bank transfer không ảnh hưởng flow runtime hiện tại
- [ ] Active runtime keeps only the supported bank-transfer payment flow

### Order flows

- [ ] Order list filter/search vẫn đúng dữ liệu
- [ ] Order detail cancel/reorder/payment helper không đổi logic
- [ ] Order success và follow-up actions vẫn điều hướng đúng

### Notifications

- [ ] Mark read / mark unread / mark all read vẫn đúng state
- [ ] Open related content từ notification vẫn điều hướng đúng
- [ ] Empty state và populated state không overflow ở mobile width nhỏ

### Mobile / tablet / desktop

- [ ] Rail, bottom nav, app bar và constrained content không overflow
- [ ] Checkout/cart summary panel đúng thứ bậc trên mobile và side panel trên desktop
- [ ] Notification summary panel và list tiles giữ tap target đủ lớn

### Loading / empty / error

- [ ] Launch/auth/cart/notification/support states vẫn có feedback đúng
- [ ] Retry actions trên error state vẫn hoạt động
- [ ] Processing / syncing indicators không bị giảm contrast sau khi đổi token

### Brand consistency

- [ ] Blue / gradient TK HiTek vẫn là điểm nhấn nhận diện mạnh nhất
- [ ] Dealer FE không bị đẩy sang phong cách marketing-heavy
- [ ] Section cards, badges, app bars, dialogs và nav shell cùng một ngôn ngữ thiết kế

### Operational usability

- [ ] Dense lists vẫn đọc nhanh, không bị mất contrast hay spacing
- [ ] Typography ưu tiên scan speed, không bị headline hóa quá mức
- [ ] Primary CTA, selected state, active filter, unread badge và important status vẫn nổi bật đúng vai trò

### Logo usage / typography hierarchy

- [ ] Logo/icon trên login, app bar, shell và empty brand surfaces giữ contrast tốt
- [ ] Source Sans vẫn chiếm ưu thế so với Montserrat trên toàn app
- [ ] Heading, body, CTA và menu hierarchy không bị lẫn sau các patch theme

## Ràng Buộc Đã Giữ Nguyên

- Không sửa backend
- Không sửa API contract
- Không đổi pricing logic
- Không đổi cart calculation
- Không đổi discount logic
- Không đổi order / payment invariants đã đúng; runtime vẫn giữ mô hình thanh toán bank transfer hiện hành
- Không đổi data shape, controller signature hay infra
