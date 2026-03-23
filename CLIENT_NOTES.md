# Client Notes — 4thitek

Tài liệu này giữ các ghi chú **implementation detail** cho Flutter/React/Next.js.
Các note ở đây hỗ trợ dev và QA, nhưng không phải business contract chính.

## 1. Dealer App (Flutter)

- Cart mutation có optimistic update; khi sync fail thì rollback theo last synced state.
- Mutation conflict ở cart ưu tiên local state mới nhất thay vì overwrite mù từ response cũ.
- Snackbar và UI side-effect cần tránh chạy sau khi widget đã unmount.
- Những flow cần trigger UI sau lifecycle hook nên defer sang frame sau thay vì gọi trực tiếp trong lúc widget đang dựng.
- Theme preference và language preference là client persistence detail, không phải business rule.
- `WarrantyExportScreen` là tên legacy trong code; behavior thực tế là flow gom serial để xử lý warranty/xuất hàng, không phải export PDF/Excel.

## 2. Admin Dashboard (React)

- Runtime config nên đi qua một chỗ tập trung cho `apiOrigin + apiVersion`.
- Không hardcode `/api/v1` rải rác trong component/page.
- Internal numeric `id` không nên được dùng thay cho `orderCode` ở màn hình user-facing.

## 3. Main Website (Next.js)

- Public route nên dùng canonical path/slug thay vì raw id nếu đã có SEO path chuẩn.
- Build-time fetch failure không nên làm đội nghĩ rằng business contract thay đổi; đây là deploy/runtime concern.

## 4. Shared Frontend Guidance

- FE phải render lỗi dựa trên `status code + ApiResponse envelope`, không nên chỉ parse raw string.
- Nếu backend trả field legacy để tương thích, FE không được dùng field đó làm nguồn write mới.
- Mọi endpoint version mới nên được cấu hình tập trung theo `origin + version`, và chỉ override version ở endpoint level khi backend rollout không đồng loạt.
