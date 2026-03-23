# Runtime Behavior Notes — Hệ thống 4thitek

Tài liệu này ghi lại **runtime behavior** và chi tiết kỹ thuật đang chạy.
Nó **không** thay thế [BUSINESS_LOGIC.md](/E:/Project/4thitek/BUSINESS_LOGIC.md). Khi có mâu thuẫn, `BUSINESS_LOGIC.md` vẫn là business contract chính, trừ các mục được gắn `[Pending Decision]`.

## 1. Session & Auth Runtime

- JWT access token TTL hiện tại: 30 phút.
- Refresh token TTL hiện tại: 7 ngày, không rotate.
- Không có server-side token blacklist.
- Dealer chỉ đăng nhập và refresh thành công khi `customerStatus = ACTIVE`.
- App dealer hiện phải có đủ access token + refresh token mới được auto-login; session nửa vời bị clear.

## 2. Inventory & Stock Runtime

- Tồn kho bán được hiện tại được tính từ pool serial:
  - `dealer IS NULL`
  - `order IS NULL`
  - `status = AVAILABLE`
- `product.stock` là read model đồng bộ từ pool serial khả dụng, không phải nguồn sự thật nghiệp vụ.
- Khi reserve/release/import/update serial, backend đồng bộ lại `product.stock`.
- Public product cache phải bị clear khi derived stock đổi để tránh UI hiển thị còn hàng nhưng cart/order backend đã chặn.

## 3. Notification & Realtime Runtime

- WebSocket user-specific dùng `/user/queue/...`.
- Dealer App hiện dùng WebSocket + reconnect/refetch; không chỉ dựa vào polling.
- FCM được dùng cho background/terminated notification; WebSocket vẫn là kênh realtime foreground.
- `PATCH /api/v1/dealer/notifications/read-all` không cần danh sách notification id riêng ở request.

## 4. Cart / Order / Payment Runtime

- Cart và một số thao tác UI có optimistic behavior ở client, nhưng backend vẫn là gate cuối cùng cho inventory và auth.
- Dealer payment cho đơn công nợ có hiệu lực ngay sau khi request hợp lệ commit thành công.
- Bank transfer khi `sepay.enabled = true` được xác nhận qua SePay webhook; dealer không tự ghi payment cho nhánh này.
- Hủy order không tự tạo refund hay reverse payment record.

## 5. Rate Limit / Cache / Compatibility

- Rate limit hiện tại là sliding-window in-memory, phù hợp single-instance hơn multi-instance.
- Public/product/blog/warranty lookup đang có cache runtime riêng theo backend.
- Một số route/auth compatibility alias có thể tồn tại để hỗ trợ bundle cũ trong giai đoạn chuyển tiếp; không nên xem đó là contract dài hạn.
