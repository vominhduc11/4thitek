# Thumbnail Layout Stability Fixes

## Vấn đề
Thanh thumbnail bị dịch chuyển nhẹ khi chọn ảnh ở 2 rìa (đầu và cuối) do:
1. Animation scale từ motion.button
2. Thay đổi opacity và pointer-events
3. Animation scale của counter

## Giải pháp đã áp dụng

### 1. Thay thế motion.button bằng button thường
**Trước:**
```jsx
<motion.button
  whileHover={{ scale: 1.1 }}
  whileTap={{ scale: 0.9 }}
  className="opacity-40 pointer-events-none"
>
```

**Sau:**
```jsx
<button
  className="opacity-40 cursor-not-allowed"
  disabled={condition}
>
```

### 2. Cải thiện CSS classes
- Thay `pointer-events-none` bằng `cursor-not-allowed`
- Thay `transition` bằng `transition-colors` (chỉ animate màu)
- Loại bỏ tất cả scale animations

### 3. Ổn định Counter
**Trước:**
```jsx
<motion.div
  initial={{ opacity: 0, scale: 0.8 }}
  animate={{ opacity: 1, scale: 1 }}
>
```

**Sau:**
```jsx
<div className="min-w-[2.5rem] text-center">
```

## Kết quả

### ✅ Đã sửa:
- **Không còn dịch chuyển** khi click thumbnail ở 2 rìa
- **Layout hoàn toàn ổn định** trong mọi trường hợp
- **Performance tốt hơn** (ít animation không cần thiết)
- **UX nhất quán** với visual feedback rõ ràng

### 🎯 Tính năng giữ lại:
- Hover effects (chỉ màu sắc)
- Disabled states (opacity + cursor)
- Thumbnail counter (vị trí cố định)
- Smooth scrolling (CSS native)

## Cấu trúc Layout ổn định

```
┌─────────────────────────────────────────────────┐
│ [←] [thumb1] [thumb2] [thumb3] [thumb4] [→] [1/4] │
│  ^     ^       ^       ^       ^      ^     ^   │
│  |     |       |       |       |      |     |   │
│ Fixed Fixed  Fixed   Fixed   Fixed  Fixed Fixed │
└─────────────────────────────────────────────────┘
```

Tất cả elements đều có kích thước cố định, không có animation scale, đảm bảo layout không bao giờ thay đổi.
