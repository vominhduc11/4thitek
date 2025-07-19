import { BlogPost, BlogCategory, BlogAuthor, BlogTag } from '@/types/blog';

// Blog Authors
export const blogAuthors: BlogAuthor[] = [
    {
        id: 'tech-team',
        name: 'Tech Team 4THITEK',
        title: 'Technical Writer',
        avatar: '/authors/tech-team.png',
        bio: 'Đội ngũ kỹ thuật với hơn 10 năm kinh nghiệm trong lĩnh vực âm thanh gaming',
        socialLinks: {
            facebook: 'https://facebook.com/4thitek',
            linkedin: 'https://linkedin.com/company/4thitek'
        }
    },
    {
        id: 'product-manager',
        name: 'Nguyễn Minh Anh',
        title: 'Product Manager',
        avatar: '/authors/product-manager.png',
        bio: 'Chuyên gia về sản phẩm âm thanh và gaming hardware',
        socialLinks: {
            linkedin: 'https://linkedin.com/in/nguyen-minh-anh'
        }
    }
];

// Blog Categories
export const blogCategories: BlogCategory[] = [
    {
        id: 'reviews',
        name: 'Reviews & Testing',
        slug: 'reviews',
        description: 'Đánh giá và test chi tiết các sản phẩm âm thanh',
        color: '#3B82F6'
    },
    {
        id: 'tech-news',
        name: 'Tech News',
        slug: 'tech-news',
        description: 'Tin tức công nghệ mới nhất trong lĩnh vực âm thanh',
        color: '#10B981'
    },
    {
        id: 'guides',
        name: 'Guides & Tips',
        slug: 'guides',
        description: 'Hướng dẫn và mẹo sử dụng sản phẩm âm thanh',
        color: '#F59E0B'
    }
];

// Blog Tags
export const blogTags: BlogTag[] = [
    { id: 'gaming-headset', name: 'Gaming Headset', slug: 'gaming-headset', postsCount: 15 },
    { id: 'wireless', name: 'Wireless', slug: 'wireless', postsCount: 8 },
    { id: 'esports', name: 'Esports', slug: 'esports', postsCount: 12 },
    { id: 'audio-quality', name: 'Audio Quality', slug: 'audio-quality', postsCount: 20 },
    { id: 'setup-guide', name: 'Setup Guide', slug: 'setup-guide', postsCount: 6 }
];

// Blog Posts
export const blogPosts: BlogPost[] = [
    {
        id: 'sx-pro-elite-review',
        title: 'Review TUNECORE SX Pro Elite - Tai nghe gaming cao cấp đáng đầu tư 2024',
        slug: 'review-tunecore-sx-pro-elite-2024',
        excerpt: 'Đánh giá chi tiết TUNECORE SX Pro Elite - tai nghe gaming premium với công nghệ ANC, driver 50mm và âm thanh 7.1 surround chân thực.',
        content: `
## Giới thiệu TUNECORE SX Pro Elite

TUNECORE SX Pro Elite là flagship gaming headset mới nhất từ 4THITEK, được thiết kế dành cho game thủ chuyên nghiệp và những người đam mê âm thanh chất lượng cao.

## Thiết kế và chất lượng build

- Khung nhôm cao cấp
- Đệm tai memory foam
- Headband có thể điều chỉnh
- Trọng lượng 350g

## Chất lượng âm thanh

Driver 50mm neodymium cho âm thanh chi tiết và mạnh mẽ. Hỗ trợ 7.1 surround sound ảo.

## Kết luận

TUNECORE SX Pro Elite là lựa chọn tuyệt vời cho game thủ muốn trải nghiệm âm thanh chất lượng cao.
        `,
        featuredImage: '/blog/sx-pro-elite-review/featured.jpg',
        author: blogAuthors[0],
        category: blogCategories[0],
        tags: [blogTags[0], blogTags[3]],
        publishedAt: '2024-01-25T10:00:00Z',
        isPublished: true,
        isFeatured: true,
        readingTime: 8,
        views: 2450,
        likes: 189,
        comments: 23
    },
    {
        id: 'wireless-gaming-guide',
        title: 'Hướng dẫn chọn tai nghe gaming không dây năm 2024',
        slug: 'huong-dan-chon-tai-nghe-gaming-khong-day-2024',
        excerpt: 'Toàn bộ kiến thức cần biết khi chọn tai nghe gaming không dây: từ độ trễ, pin, chất lượng âm thanh đến budget phù hợp.',
        content: `
## Tại sao nên chọn tai nghe gaming không dây?

Tai nghe gaming không dây mang lại sự tự do di chuyển và tiện lợi trong việc sử dụng.

## Các yếu tố cần xem xét

### 1. Độ trễ (Latency)
- Tầm quan trọng trong gaming
- Công nghệ giảm độ trễ

### 2. Thời lượng pin
- Thời gian sử dụng liên tục
- Thời gian sạc

### 3. Chất lượng âm thanh
- Driver và frequency response
- Công nghệ âm thanh không gian

## Kết luận

Chọn tai nghe gaming không dây phù hợp sẽ nâng cao trải nghiệm gaming của bạn.
        `,
        featuredImage: '/blog/wireless-guide/featured.jpg',
        author: blogAuthors[1],
        category: blogCategories[2],
        tags: [blogTags[1], blogTags[4]],
        publishedAt: '2024-01-20T14:30:00Z',
        isPublished: true,
        readingTime: 6,
        views: 1850,
        likes: 142,
        comments: 18
    }
];

// Helper functions
export const getPostsByCategory = (categoryId: string): BlogPost[] => {
    return blogPosts.filter(post => post.category.id === categoryId);
};

export const getPostsByTag = (tagId: string): BlogPost[] => {
    return blogPosts.filter(post => post.tags.some(tag => tag.id === tagId));
};

export const getFeaturedPosts = (): BlogPost[] => {
    return blogPosts.filter(post => post.isFeatured);
};

export const getPublishedPosts = (): BlogPost[] => {
    return blogPosts.filter(post => post.isPublished);
};