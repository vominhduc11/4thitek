# Product Description Structure Documentation

## Overview

The Product Description component supports a flexible content structure that allows for different types of content blocks to be rendered dynamically.

## Data Structure

### ContentItem Interface

```typescript
interface ContentItem {
    type: 'title' | 'list_text' | 'image' | 'text';
    content?: string;
    link?: string;
}
```

### ProductDetailsProps Interface

```typescript
interface ProductDetailsProps {
    features: Feature[];
    highlights: string[];
    description: string;
    content?: ContentItem[];
}
```

## Content Types

### 1. Title (`type: "title"`)

Renders a large heading for the product.

**Properties:**

- `content`: The title text

**Example:**

```json
{
    "type": "title",
    "content": "TAI NGHE CHO MŨ BẢO HIỂM MÔ TÔ PHƯỢT BLUETOOTH INTERCOM SCS S-9"
}
```

**Rendered as:**

- Large heading (h3) with responsive text sizes
- White text color
- Bold font weight

---

### 2. List Text (`type: "list_text"`)

Renders an unordered list with bullet points.

**Properties:**

- `content`: String with items separated by `\n` (newline)

**Example:**

```json
{
    "type": "list_text",
    "content": "Bạn sẽ cảm thấy thoả mãn túi tiền với thiết kế cứng cáp, sang trọng từ bên ngoài của S-9\nNút S9 đặc trưng cho các thao tác chạm nghe cuộc gọi rãnh tay\nNút âm lượng cùng dãy với các thao tác Next/ Back"
}
```

**Rendered as:**

- HTML `<ul>` with `<li>` elements
- Automatic bullet points
- Gray text color
- Justified text alignment
- Proper spacing between items

---

### 3. Image (`type: "image"`)

Renders a responsive image with styling.

**Properties:**

- `link`: Image URL/path

**Example:**

```json
{
    "type": "image",
    "link": "/products/product1.png"
}
```

**Rendered as:**

- Full-width responsive image
- Fixed height container (h-192)
- Gradient background frame
- Border styling
- Object-cover for proper aspect ratio
- Fallback placeholder on error

---

### 4. Text (`type: "text"`)

Renders a paragraph of regular text.

**Properties:**

- `content`: The paragraph text

**Example:**

```json
{
    "type": "text",
    "content": "Tai nghe mũ bảo hiểm Bluetooth Intercom SCS S-9 là thiết bị liên lạc không dây hiện đại..."
}
```

**Rendered as:**

- Paragraph text
- Gray text color
- Justified alignment
- Relaxed line height

## Complete Example

```json
[
    {
        "type": "title",
        "content": "TAI NGHE CHO MŨ BẢO HIỂM MÔ TÔ PHƯỢT BLUETOOTH INTERCOM SCS S-9"
    },
    {
        "type": "list_text",
        "content": "Bạn sẽ cảm thấy thoả mãn túi tiền với thiết kế cứng cáp, sang trọng từ bên ngoài của S-9. Tinh tế và góc cạnh cùng với các cụm nút nhấn sắc xảo\nNút S9 đặc trưng cho các thao tác chạm nghe cuộc gọi rãnh tay nhanh chóng đến chuẩn xác\nNút âm lượng cùng dãy với các thao tác Next/ Back, Tăng/ Giảm âm thanh\nNút Intercom hình chiếc mũ bảo hiểm cho thao tác Nhận/ Ngưng cuộc gọi trong đoàn\nCổng Micro USB sạc và update hệ thống qua cáp USB\nCổng jack tai nghe 3.5mm trên đế S-9 kết nối micro và cổng AUX cho các kết nối âm thanh với các thiết bị khác qua cáp 2 đầu 3.5mm"
    },
    {
        "type": "image",
        "link": "/products/product1.png"
    },
    {
        "type": "text",
        "content": "Tai nghe mũ bảo hiểm Bluetooth Intercom SCS S-9 là thiết bị liên lạc không dây hiện đại, được thiết kế đặc biệt cho người đi xe máy, mô tô và những người yêu thích phượt. Với khả năng kết nối Bluetooth, thiết bị cho phép người dùng giao tiếp với nhau trong khoảng cách lên đến 1000m, nghe nhạc, nhận cuộc gọi và điều khiển bằng giọng nói."
    }
]
```

## Usage

### With Content Array

```tsx
<ProductDetails features={features} highlights={highlights} description={description} content={contentArray} />
```

### Without Content Array (Fallback)

```tsx
<ProductDetails features={features} highlights={highlights} description={description} />
```

When no `content` prop is provided, the component will:

1. First try to use demo data (if available)
2. Fall back to the original static content structure

## Styling Classes

### Title

- `text-xl md:text-2xl lg:text-3xl` - Responsive text sizes
- `font-bold text-white mb-4` - Bold white text with margin

### List Text

- `list-disc list-inside` - Bullet points
- `text-gray-300 leading-relaxed` - Gray text with relaxed spacing
- `space-y-3` - Vertical spacing between items
- `text-justify` - Justified text alignment

### Image

- `w-full h-192` - Full width, fixed height
- `object-cover` - Maintain aspect ratio
- `bg-gradient-to-br from-blue-600/20 to-purple-600/20` - Gradient background
- `rounded-2xl border border-gray-700/50` - Rounded corners and border

### Text

- `text-gray-300 leading-relaxed` - Gray text with relaxed spacing
- `text-justify` - Justified text alignment

## File Location

`src/app/products/[id]/components/ProductDetails.tsx`
