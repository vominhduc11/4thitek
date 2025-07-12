# Blog Page Documentation

## Tổng quan

Trang blog được thiết kế với giao diện tương tự như trang products, bao gồm các tính năng:

- Hero section với video background
- Header với category filters và view mode toggle
- Sticky breadcrumb navigation
- Grid/List view modes
- Advanced filtering sidebar
- Pagination
- Responsive design

## Cấu trúc thư mục

```
src/app/blog/
├── page.tsx                    # Main blog page
├── [id]/
│   └── page.tsx               # Blog detail page
├── _components/
│   ├── BlogHero.tsx           # Hero section with video (for blog list)
│   ├── BlogDetailHero.tsx     # Hero section with video + breadcrumb (for detail)
│   ├── BlogHeader.tsx         # Header with filters and controls
│   ├── BlogGrid.tsx           # Blog posts grid/list display
│   ├── BlogPagination.tsx     # Pagination component
│   ├── BlogFilterSidebar.tsx  # Advanced filter sidebar
│   ├── BlogEmptyState.tsx     # Empty state when no posts found
│   ├── BlogStickyBreadcrumbFilter.tsx # Sticky navigation
│   ├── types.ts               # TypeScript interfaces
│   └── index.ts               # Component exports
└── README.md                  # This documentation
```

## Tính năng chính

### 1. Hero Section

- **Blog List**: Video background với fallback image
- **Blog Detail**: Dedicated hero với featured image, meta info, và reading progress
- Responsive design
- Scroll indicator animation

### 2. Blog Detail Page

- **Minimal Hero**: Video background với breadcrumb navigation
- **Banner Header**: Ảnh banner 16:9 với overlay và tiêu đề in hoa
- **Intro Section**: Văn bản tóm tắt trên nền tối
- **Content Frame**: Khung nội dung trắng với shadow và padding
- **Rich Content**: Hỗ trợ headings, paragraphs, images, lists, quotes
- **Sidebar**: Bài viết liên quan với thumbnail và metadata
- **Responsive Design**: Mobile-first với grid layout

### 3. Category Filtering

- 6 categories: Tất Cả, Công Nghệ, Hướng Dẫn, Tin Tức, Đánh Giá, Mẹo Hay
- Quick filter buttons trong header
- Advanced filtering trong sidebar

### 3. View Modes

- **Grid View**: 3-column responsive grid
- **List View**: Full-width list với detailed preview

### 4. Sorting Options

- Mới nhất (default)
- Cũ nhất
- Phổ biến nhất
- Tiêu đề A-Z / Z-A
- Thời gian đọc

### 5. Tag System

- Dynamic tag filtering
- Tag display trong blog cards
- Tag-based navigation

### 6. Responsive Design

- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Touch-friendly interface

## Icons

Tất cả icons sử dụng **react-icons** thay vì lucide-react:

### Material Design Icons (react-icons/md)

- `MdHome` - Home icon
- `MdChevronRight` - Navigation arrows
- `MdFilterList` - Filter icon
- `MdSearch` - Search icon
- `MdRefresh` - Refresh/reset icon
- `MdClose` - Close icon
- `MdCalendarToday` - Calendar icon
- `MdAccessTime` - Clock icon
- `MdPerson` - User icon
- `MdLocalOffer` - Tag icon
- `MdStar` - Star icon
- `MdFavorite` - Heart icon
- `MdShare` - Share icon
- `MdArrowBack` - Back arrow
- `MdMenuBook` - Book icon
- `MdMoreHoriz` - More horizontal dots
- `MdChevronLeft` - Left chevron
- `MdChevronRight` - Right chevron

### Bootstrap Icons (react-icons/bs)

- `BsGrid3X3Gap` - Grid view icon
- `BsList` - List view icon

### Heroicons (react-icons/hi)

- `HiFilter` - Alternative filter icon

## Data Structure

### BlogPost Interface

```typescript
interface BlogPost {
    id: number;
    title: string;
    category: string;
    tags: string[];
    image: string;
    excerpt: string;
    content: string;
    author: string;
    publishDate: string;
    readTime: number;
    featured: boolean;
    popularity: number;
}
```

### Categories

- `TECHNOLOGY` - Công Nghệ
- `TUTORIAL` - Hướng Dẫn
- `NEWS` - Tin Tức
- `REVIEW` - Đánh Giá
- `TIPS` - Mẹo Hay

## Styling

- **Framework**: Tailwind CSS
- **Color Scheme**: Dark theme với accent color `#4FC8FF`
- **Typography**: Responsive font sizes
- **Animations**: Smooth transitions và hover effects

## URL Structure

- `/blog` - Main blog page
- `/blog?category=TECHNOLOGY` - Category filtered view
- `/blog?tag=bluetooth` - Tag filtered view
- `/blog/1` - Individual blog post

## Performance Optimizations

- Image lazy loading với Next.js Image component
- Memoized calculations cho filtering và pagination
- Smooth scrolling animations
- Optimized re-renders với proper dependency arrays

## Accessibility

- Semantic HTML structure
- ARIA labels cho interactive elements
- Keyboard navigation support
- Screen reader friendly
- High contrast ratios

## Future Enhancements

- Search functionality
- Related posts suggestions
- Social sharing integration
- Comment system
- Reading progress indicator
- Dark/light theme toggle
- RSS feed support
