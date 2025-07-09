# Thumbnail Logic Fix

## 🐛 Vấn đề ban đầu

Khi click vào thumbnail, **tất cả 4 series cards** đều thay đổi ảnh thay vì chỉ series đang active.

### Nguyên nhân:
```javascript
// TẤT CẢ series cards đều dùng cùng activeThumb
<Image src={item.thumbs?.[activeThumb]?.src || item.img} />
```

### Kết quả sai:
1. Click thumbnail thứ 3 của SX SERIES
2. `activeThumb = 2`
3. **Tất cả 4 series** cố hiển thị ảnh index 2:
   - SX SERIES: ✅ Hiển thị ảnh thứ 3 (đúng)
   - S SERIES: ❌ Hiển thị ảnh thứ 3 (sai - không liên quan)
   - G SERIES: ❌ Hiển thị ảnh thứ 3 (sai - có thể không tồn tại)
   - G+ SERIES: ❌ Fallback về ảnh mặc định (chỉ có 2 ảnh)

## ✅ Giải pháp

### Logic mới:
```javascript
src={
  idx === activeIndex 
    ? (item.thumbs?.[activeThumb]?.src || item.img)  // Series active
    : (item.thumbs?.[0]?.src || item.img)            // Series khác
}
```

### Cách hoạt động:
- **Series đang active** (`idx === activeIndex`): Sử dụng `activeThumb` để hiển thị ảnh được chọn
- **Series khác**: Luôn hiển thị ảnh đầu tiên (`index 0`) hoặc ảnh mặc định

## 🎯 Kết quả sau khi sửa

### Scenario 1: SX SERIES active, click thumbnail thứ 3
- **SX SERIES**: Hiển thị ảnh thứ 3 ✅
- **S SERIES**: Hiển thị ảnh đầu tiên ✅
- **G SERIES**: Hiển thị ảnh đầu tiên ✅
- **G+ SERIES**: Hiển thị ảnh đầu tiên ✅

### Scenario 2: Chuyển sang G SERIES
- **G SERIES**: Trở thành active, `activeThumb` reset về 0 ✅
- **SX, S, G+ SERIES**: Hiển thị ảnh đầu tiên ✅

## 🔄 Luồng hoạt động đúng

1. **Chọn series** → Series đó active, thumbnails hiển thị
2. **Click thumbnail** → Chỉ series active thay đổi ảnh
3. **Series khác** → Luôn giữ ảnh đại diện (ảnh đầu tiên)
4. **Chuyển series** → Series mới active, reset thumbnail

## 💡 Lợi ích

- **UX logic**: Thumbnails chỉ ảnh hưởng series đang chọn
- **Performance**: Không cần re-render ảnh của series khác
- **Consistency**: Series không active luôn hiển thị ảnh đại diện
- **No errors**: Không còn lỗi khi series có ít thumbnail hơn

## 🎨 Visual Behavior

```
Before Fix:
[SX Active] [S] [G] [G+]  ← All change when click thumbnail
    ↓        ↓   ↓   ↓
  Thumb3   Thumb3 Thumb3 Default

After Fix:
[SX Active] [S] [G] [G+]  ← Only active changes
    ↓        ↓   ↓   ↓
  Thumb3   Thumb1 Thumb1 Thumb1
```

Bây giờ thumbnail hoạt động đúng logic: chỉ ảnh hưởng đến series đang được chọn!
