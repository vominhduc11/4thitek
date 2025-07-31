# Responsive Breakpoints

Tài liệu này mô tả các khoảng responsive được sử dụng trong dự án, dựa trên Tailwind CSS breakpoints.

## Tailwind CSS Breakpoints

| Breakpoint | Min Width | Description |
|------------|-----------|-------------|
| `xs` | 475px | Extra small devices |
| `sm` | 640px | Small devices (tablets) |
| `md` | 768px | Medium devices (small laptops) |
| `lg` | 1024px | Large devices (desktops) |
| `xl` | 1280px | Extra large devices (large desktops) |
| `2xl` | 1536px | 2X large devices (larger desktops) |
| `3xl` | 1920px | 3X large devices (Full HD+ screens) |
| `4xl` | 2560px | 4X large devices (2K/QHD screens) |

## Device Categories

### Mobile
- **Portrait**: < 475px
- **Landscape**: 475px - 639px (`xs`)

### Tablet  
- **Small**: 640px - 767px (`sm`)
- **Large**: 768px - 1023px (`md`)

### Desktop
- **Small**: 1024px - 1279px (`lg`) 
- **Medium**: 1280px - 1535px (`xl`)
- **Large**: 1536px - 1919px (`2xl`)
- **Extra Large**: 1920px - 2559px (`3xl`)
- **Ultra Large**: ≥ 2560px (`4xl`)

## Sidebar Considerations

Sidebar có chiều rộng cố định:
- Mobile: `w-16` (64px)
- Desktop: `w-20` (80px từ `sm` trở lên)

Content cần margin-left tương ứng để tránh bị sidebar che:
- `ml-16` (64px) cho mobile
- `sm:ml-20` (80px) cho desktop

## Layout Patterns

### Centered Content with Sidebar
```css
.content {
  @apply mx-auto ml-16 sm:ml-20 mr-4 sm:mr-12 md:mr-16 lg:mr-20;
  @apply pl-4 sm:pl-12 md:pl-16 lg:pl-20;
  @apply max-w-[1800px];
}
```

### Grid Responsive
```css
.product-grid {
  @apply grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4;
}
```

### Typography Scale
```css
.heading {
  @apply text-2xl sm:text-3xl md:text-4xl lg:text-5xl;
}
```

## Spacing Scale

| Size | Mobile | SM | MD | LG | XL | 2XL |
|------|--------|----|----|----|----|-----|
| Small | 4px | 12px | 16px | 20px | 20px | 20px |
| Medium | 16px | 48px | 64px | 80px | 80px | 80px |  
| Large | 32px | 96px | 128px | 160px | 160px | 160px |

## Best Practices

1. **Mobile First**: Luôn thiết kế cho mobile trước, sau đó mở rộng lên desktop
2. **Consistent Spacing**: Sử dụng scale spacing nhất quán
3. **Sidebar Offset**: Luôn tính toán sidebar width khi căn content
4. **Touch Targets**: Đảm bảo button/link ít nhất 44px cho mobile
5. **Content Width**: Giới hạn max-width để tránh content quá rộng trên màn hình lớn