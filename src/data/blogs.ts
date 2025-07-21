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
        excerpt:
            'Đánh giá chi tiết TUNECORE SX Pro Elite - tai nghe gaming premium với công nghệ ANC, driver 50mm và âm thanh 7.1 surround chân thực.',
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
        excerpt:
            'Toàn bộ kiến thức cần biết khi chọn tai nghe gaming không dây: từ độ trễ, pin, chất lượng âm thanh đến budget phù hợp.',
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
    },
    {
        id: 'audio-trends-2024',
        title: 'Xu hướng công nghệ âm thanh gaming năm 2024',
        slug: 'xu-huong-cong-nghe-am-thanh-gaming-2024',
        excerpt:
            'Khám phá những xu hướng mới nhất trong công nghệ âm thanh gaming: từ 3D spatial audio, AI noise cancelling đến wireless technology.',
        content: `
## Những xu hướng nổi bật

### 1. 3D Spatial Audio
Công nghệ âm thanh không gian mang đến trải nghiệm gaming chân thực hơn.

### 2. AI-powered Noise Cancelling
Trí tuệ nhân tạo giúp loại bỏ tiếng ồn hiệu quả.

### 3. Low Latency Wireless
Kết nối không dây với độ trễ cực thấp.
        `,
        featuredImage: '/blog/audio-trends/featured.jpg',
        author: blogAuthors[0],
        category: blogCategories[1],
        tags: [blogTags[0], blogTags[1]],
        publishedAt: '2024-01-18T09:00:00Z',
        isPublished: true,
        isFeatured: false,
        readingTime: 7,
        views: 1680,
        likes: 156,
        comments: 24
    },
    {
        id: 'gaming-setup-guide',
        title: 'Cách thiết lập gaming setup hoàn hảo với TUNECORE',
        slug: 'cach-thiet-lap-gaming-setup-hoan-hao',
        excerpt:
            'Hướng dẫn chi tiết thiết lập bàn gaming với các sản phẩm TUNECORE để có trải nghiệm âm thanh tối ưu.',
        content: `
## Lựa chọn thiết bị

### 1. Tai nghe chính
Chọn tai nghe phù hợp với loại game yêu thích.

### 2. Microphone
Importance của chất lượng micro trong gaming.

### 3. Sound card
Vai trò của sound card trong setup gaming.
        `,
        featuredImage: '/blog/gaming-setup/featured.jpg',
        author: blogAuthors[1],
        category: blogCategories[2],
        tags: [blogTags[0], blogTags[4]],
        publishedAt: '2024-01-15T16:20:00Z',
        isPublished: true,
        isFeatured: true,
        readingTime: 9,
        views: 2100,
        likes: 198,
        comments: 31
    },
    {
        id: 'esports-audio-importance',
        title: 'Tầm quan trọng của âm thanh trong Esports chuyên nghiệp',
        slug: 'tam-quan-trong-cua-am-thanh-trong-esports',
        excerpt:
            'Phân tích vai trò của hệ thống âm thanh trong thành công của các game thủ esports chuyên nghiệp.',
        content: `
## Âm thanh trong Esports

### 1. Positional Audio
Khả năng xác định vị trí đối thủ qua âm thanh.

### 2. Communication
Giao tiếp team trong các trận đấu.

### 3. Focus và Concentration
Âm thanh giúp tập trung tối đa.
        `,
        featuredImage: '/blog/esports-audio/featured.jpg',
        author: blogAuthors[0],
        category: blogCategories[0],
        tags: [blogTags[2], blogTags[3]],
        publishedAt: '2024-01-12T11:45:00Z',
        isPublished: true,
        isFeatured: false,
        readingTime: 6,
        views: 1420,
        likes: 134,
        comments: 19
    },
    {
        id: 'headset-maintenance-tips',
        title: '10 mẹo bảo dưỡng tai nghe gaming để kéo dài tuổi thọ',
        slug: '10-meo-bao-duong-tai-nghe-gaming',
        excerpt:
            'Những mẹo đơn giản nhưng hiệu quả để bảo dưỡng tai nghe gaming, giúp thiết bị hoạt động tốt trong nhiều năm.',
        content: `
## Mẹo bảo dưỡng

### 1. Vệ sinh định kỳ
Cách vệ sinh tai nghe đúng cách.

### 2. Bảo quản
Nơi để tai nghe khi không sử dụng.

### 3. Kiểm tra cable
Bảo vệ dây cáp khỏi hư hỏng.
        `,
        featuredImage: '/blog/maintenance-tips/featured.jpg',
        author: blogAuthors[1],
        category: blogCategories[2],
        tags: [blogTags[0], blogTags[4]],
        publishedAt: '2024-01-10T14:15:00Z',
        isPublished: true,
        isFeatured: false,
        readingTime: 5,
        views: 980,
        likes: 87,
        comments: 12
    },
    {
        id: 'wireless-vs-wired-comparison',
        title: 'So sánh tai nghe gaming có dây vs không dây: Lựa chọn nào tốt hơn?',
        slug: 'so-sanh-tai-nghe-co-day-vs-khong-day',
        excerpt:
            'Phân tích ưu nhược điểm của tai nghe có dây và không dây để giúp bạn đưa ra lựa chọn phù hợp.',
        content: `
## So sánh chi tiết

### 1. Chất lượng âm thanh
So sánh chất lượng audio giữa hai loại.

### 2. Độ trễ
Latency trong gaming.

### 3. Tiện lợi sử dụng
Mobility và comfort.
        `,
        featuredImage: '/blog/wired-vs-wireless/featured.jpg',
        author: blogAuthors[0],
        category: blogCategories[0],
        tags: [blogTags[0], blogTags[1]],
        publishedAt: '2024-01-08T10:30:00Z',
        isPublished: true,
        isFeatured: true,
        readingTime: 8,
        views: 2350,
        likes: 201,
        comments: 28
    },
    {
        id: 'audio-codec-explained',
        title: 'Hiểu về Audio Codec: LDAC, aptX và những điều cần biết',
        slug: 'hieu-ve-audio-codec-ldac-aptx',
        excerpt:
            'Giải thích các chuẩn codec âm thanh phổ biến và ảnh hưởng của chúng đến chất lượng âm thanh gaming.',
        content: `
## Các loại Audio Codec

### 1. LDAC
High-resolution audio streaming.

### 2. aptX
Low latency codec for gaming.

### 3. SBC
Standard Bluetooth codec.
        `,
        featuredImage: '/blog/audio-codec/featured.jpg',
        author: blogAuthors[1],
        category: blogCategories[1],
        tags: [blogTags[1], blogTags[3]],
        publishedAt: '2024-01-05T13:20:00Z',
        isPublished: true,
        isFeatured: false,
        readingTime: 7,
        views: 1560,
        likes: 143,
        comments: 22
    },
    {
        id: 'fps-games-audio-guide',
        title: 'Tối ưu âm thanh cho FPS Games: CS2, Valorant, Apex Legends',
        slug: 'toi-uu-am-thanh-cho-fps-games',
        excerpt:
            'Hướng dẫn cài đặt và tối ưu âm thanh cho các game FPS phổ biến để có lợi thế cạnh tranh.',
        content: `
## Tối ưu cho từng game

### 1. Counter-Strike 2
Audio settings cho competitive play.

### 2. Valorant
3D audio và positioning.

### 3. Apex Legends
Audio cues và environmental sounds.
        `,
        featuredImage: '/blog/fps-audio/featured.jpg',
        author: blogAuthors[0],
        category: blogCategories[2],
        tags: [blogTags[0], blogTags[2]],
        publishedAt: '2024-01-03T15:45:00Z',
        isPublished: true,
        isFeatured: false,
        readingTime: 10,
        views: 1890,
        likes: 167,
        comments: 35
    },
    {
        id: 'budget-gaming-headset-guide',
        title: 'Top 5 tai nghe gaming giá rẻ dưới 1 triệu đồng',
        slug: 'top-5-tai-nghe-gaming-gia-re-duoi-1-trieu',
        excerpt:
            'Gợi ý những mẫu tai nghe gaming chất lượng với mức giá phù hợp cho game thủ có ngân sách hạn chế.',
        content: `
## Danh sách recommend

### 1. TUNECORE Entry Series
Best value for money.

### 2. Budget wireless options
Không dây giá rẻ.

### 3. Wired alternatives
Lựa chọn có dây tốt.
        `,
        featuredImage: '/blog/budget-headset/featured.jpg',
        author: blogAuthors[1],
        category: blogCategories[0],
        tags: [blogTags[0], blogTags[4]],
        publishedAt: '2024-01-01T12:00:00Z',
        isPublished: true,
        isFeatured: false,
        readingTime: 6,
        views: 2650,
        likes: 234,
        comments: 41
    },
    {
        id: 'streaming-audio-setup',
        title: 'Setup âm thanh cho Streaming: Từ Microphone đến Audio Interface',
        slug: 'setup-am-thanh-cho-streaming',
        excerpt:
            'Hướng dẫn thiết lập hệ thống âm thanh chuyên nghiệp cho streamer và content creator.',
        content: `
## Thiết bị cần thiết

### 1. Microphone chuyên nghiệp
Dynamic vs Condenser mics.

### 2. Audio Interface
Vai trò và lựa chọn.

### 3. Acoustic treatment
Xử lý âm học phòng stream.
        `,
        featuredImage: '/blog/streaming-audio/featured.jpg',
        author: blogAuthors[0],
        category: blogCategories[2],
        tags: [blogTags[3], blogTags[4]],
        publishedAt: '2023-12-28T09:30:00Z',
        isPublished: true,
        isFeatured: true,
        readingTime: 11,
        views: 1750,
        likes: 158,
        comments: 26
    },
    {
        id: 'rgb-gaming-peripherals',
        title: 'RGB trong Gaming Gear: Chỉ đẹp hay còn có tác dụng khác?',
        slug: 'rgb-trong-gaming-gear-co-tac-dung-gi',
        excerpt:
            'Phân tích xu hướng RGB trong gaming peripherals và liệu nó có thực sự cần thiết cho hiệu suất gaming.',
        content: `
## RGB Analysis

### 1. Tác động tâm lý
RGB và gaming experience.

### 2. Customization
Personalization trong gaming setup.

### 3. Performance impact
Có ảnh hưởng đến hiệu suất không?
        `,
        featuredImage: '/blog/rgb-gaming/featured.jpg',
        author: blogAuthors[1],
        category: blogCategories[1],
        tags: [blogTags[0], blogTags[2]],
        publishedAt: '2023-12-25T16:00:00Z',
        isPublished: true,
        isFeatured: false,
        readingTime: 5,
        views: 1320,
        likes: 89,
        comments: 15
    },
    {
        id: 'mobile-gaming-audio',
        title: 'Âm thanh cho Mobile Gaming: Tai nghe nào phù hợp?',
        slug: 'am-thanh-cho-mobile-gaming-tai-nghe-nao-phu-hop',
        excerpt:
            'Hướng dẫn chọn tai nghe phù hợp cho mobile gaming với các tựa game như PUBG Mobile, Mobile Legends.',
        content: `
## Mobile Gaming Audio

### 1. True Wireless Earbuds
Convenience cho mobile gaming.

### 2. Gaming-focused features
Low latency modes.

### 3. Comfort for long sessions
Ergonomics cho gaming dài.
        `,
        featuredImage: '/blog/mobile-gaming/featured.jpg',
        author: blogAuthors[0],
        category: blogCategories[0],
        tags: [blogTags[0], blogTags[1]],
        publishedAt: '2023-12-22T11:15:00Z',
        isPublished: true,
        isFeatured: false,
        readingTime: 7,
        views: 1980,
        likes: 176,
        comments: 29
    },
    {
        id: 'surround-sound-vs-stereo',
        title: 'Surround Sound vs Stereo: Cái nào tốt hơn cho Gaming?',
        slug: 'surround-sound-vs-stereo-cai-nao-tot-hon',
        excerpt:
            'So sánh chi tiết giữa âm thanh stereo và surround sound trong gaming để giúp bạn đưa ra lựa chọn đúng.',
        content: `
## So sánh âm thanh

### 1. Stereo advantage
Clarity và accuracy.

### 2. Surround benefits
Immersion và spatial awareness.

### 3. Game-specific recommendations
Phù hợp với từng thể loại game.
        `,
        featuredImage: '/blog/surround-vs-stereo/featured.jpg',
        author: blogAuthors[1],
        category: blogCategories[0],
        tags: [blogTags[0], blogTags[3]],
        publishedAt: '2023-12-20T14:45:00Z',
        isPublished: true,
        isFeatured: false,
        readingTime: 8,
        views: 1640,
        likes: 147,
        comments: 21
    }
];

// Helper functions
export const getPostsByCategory = (categoryId: string): BlogPost[] => {
    return blogPosts.filter((post) => post.category.id === categoryId);
};

export const getPostsByTag = (tagId: string): BlogPost[] => {
    return blogPosts.filter((post) => post.tags.some((tag) => tag.id === tagId));
};

export const getFeaturedPosts = (): BlogPost[] => {
    return blogPosts.filter((post) => post.isFeatured);
};

export const getPublishedPosts = (): BlogPost[] => {
    return blogPosts.filter((post) => post.isPublished);
};
