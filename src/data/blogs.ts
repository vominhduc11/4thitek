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
        content: [
            {
                type: 'title',
                content: 'Giới thiệu TUNECORE SX Pro Elite'
            },
            {
                type: 'text',
                content: 'TUNECORE SX Pro Elite là flagship gaming headset mới nhất từ 4THITEK, được thiết kế dành cho game thủ chuyên nghiệp và những người đam mê âm thanh chất lượng cao.'
            },
            {
                type: 'image',
                link: '/blog/sx-pro-elite-review/product-overview.jpg',
                content: 'TUNECORE SX Pro Elite - Overview'
            },
            {
                type: 'title',
                content: 'Thiết kế và chất lượng build'
            },
            {
                type: 'text',
                content: 'Tai nghe có thiết kế premium với khung nhôm cao cấp, đệm tai memory foam thoải mái, headband có thể điều chỉnh linh hoạt. Với trọng lượng chỉ 350g, TUNECORE SX Pro Elite mang lại cảm giác đeo nhẹ nhàng ngay cả trong các session gaming dài.'
            },
            {
                type: 'image',
                link: '/blog/sx-pro-elite-review/design-details.jpg',
                content: 'Chi tiết thiết kế TUNECORE SX Pro Elite'
            },
            {
                type: 'title',
                content: 'Chất lượng âm thanh'
            },
            {
                type: 'text',
                content: 'Driver 50mm neodymium cho âm thanh chi tiết và mạnh mẽ. Hỗ trợ công nghệ 7.1 surround sound ảo, mang đến trải nghiệm âm thanh không gian chân thực, giúp game thủ định vị chính xác vị trí đối thủ trong game.'
            },
            {
                type: 'image',
                link: '/blog/sx-pro-elite-review/audio-test.jpg',
                content: 'Test chất lượng âm thanh'
            },
            {
                type: 'title',
                content: 'Kết luận'
            },
            {
                type: 'text',
                content: 'TUNECORE SX Pro Elite là lựa chọn tuyệt vời cho game thủ muốn trải nghiệm âm thanh chất lượng cao. Với thiết kế premium, công nghệ âm thanh tiên tiến và độ thoải mái cao, đây chắc chắn là một trong những tai nghe gaming đáng đầu tư nhất năm 2024.'
            }
        ],
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
        content: [
            {
                type: 'title',
                content: 'Tại sao nên chọn tai nghe gaming không dây?'
            },
            {
                type: 'text',
                content: 'Tai nghe gaming không dây mang lại sự tự do di chuyển và tiện lợi trong việc sử dụng. Không còn bị ràng buộc bởi dây cáp, game thủ có thể thoải mái di chuyển trong quá trình gaming mà không lo lắng về việc làm rối hoặc kéo đứt dây.'
            },
            {
                type: 'image',
                link: '/blog/wireless-guide/wireless-benefits.jpg',
                content: 'Lợi ích của tai nghe gaming không dây'
            },
            {
                type: 'title',
                content: 'Các yếu tố cần xem xét'
            },
            {
                type: 'text',
                content: 'Khi chọn tai nghe gaming không dây, có 3 yếu tố quan trọng nhất cần cân nhắc: độ trễ, thời lượng pin và chất lượng âm thanh.'
            },
            {
                type: 'text',
                content: '**1. Độ trễ (Latency):** Đây là yếu tố quan trọng nhất trong gaming. Độ trễ cao có thể ảnh hưởng nghiêm trọng đến hiệu suất gaming, đặc biệt trong các game FPS. Các công nghệ như aptX Low Latency, LDAC giúp giảm thiểu độ trễ xuống mức chấp nhận được.'
            },
            {
                type: 'image',
                link: '/blog/wireless-guide/latency-comparison.jpg',
                content: 'So sánh độ trễ giữa các công nghệ'
            },
            {
                type: 'text',
                content: '**2. Thời lượng pin:** Thời gian sử dụng liên tục từ 20-40 giờ là lý tưởng. Thời gian sạc nhanh (quick charge) cũng rất quan trọng - 15 phút sạc có thể cho 2-3 giờ sử dụng.'
            },
            {
                type: 'text',
                content: '**3. Chất lượng âm thanh:** Driver chất lượng cao, frequency response rộng và các công nghệ âm thanh không gian như DTS Headphone:X, Dolby Atmos sẽ mang lại trải nghiệm gaming tốt nhất.'
            },
            {
                type: 'image',
                link: '/blog/wireless-guide/audio-features.jpg',
                content: 'Các tính năng âm thanh quan trọng'
            },
            {
                type: 'title',
                content: 'Kết luận'
            },
            {
                type: 'text',
                content: 'Chọn tai nghe gaming không dây phù hợp sẽ nâng cao trải nghiệm gaming của bạn đáng kể. Hãy ưu tiên các model có độ trễ thấp, pin lâu và chất lượng âm thanh tốt để có được sự đầu tư xứng đáng.'
            }
        ],
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
        content: [
            {
                type: 'title',
                content: 'Những xu hướng nổi bật trong công nghệ âm thanh gaming 2024'
            },
            {
                type: 'text',
                content: 'Năm 2024 đánh dấu những bước tiến vượt bậc trong công nghệ âm thanh gaming. Từ AI đến âm thanh không gian 3D, các nhà sản xuất đang đua nhau mang đến những trải nghiệm âm thanh chưa từng có.'
            },
            {
                type: 'image',
                link: '/blog/audio-trends/tech-overview.jpg',
                content: 'Tổng quan công nghệ âm thanh gaming 2024'
            },
            {
                type: 'title',
                content: '1. 3D Spatial Audio - Cách mạng âm thanh không gian'
            },
            {
                type: 'text',
                content: 'Công nghệ âm thanh không gian 3D không chỉ đơn thuần là surround sound. Nó tạo ra một không gian âm thanh 360 độ hoàn toàn chân thực, giúp game thủ có thể định vị chính xác vị trí đối thủ từ mọi hướng, kể cả trên và dưới.'
            },
            {
                type: 'image',
                link: '/blog/audio-trends/3d-spatial-demo.jpg',
                content: 'Demo công nghệ 3D Spatial Audio'
            },
            {
                type: 'title',
                content: '2. AI-powered Noise Cancelling - Trí tuệ nhân tạo loại bỏ tiếng ồn'
            },
            {
                type: 'text',
                content: 'AI hiện đại có thể học hỏi và thích ứng với môi trường xung quanh, loại bỏ không chỉ tiếng ồn liên tục mà còn cả những âm thanh đột ngột, không mong muốn. Điều này đặc biệt hữu ích trong môi trường gaming tại nhà hoặc gaming center.'
            },
            {
                type: 'image',
                link: '/blog/audio-trends/ai-noise-cancelling.jpg',
                content: 'Công nghệ AI Noise Cancelling'
            },
            {
                type: 'title',
                content: '3. Low Latency Wireless - Kết nối không dây siêu nhanh'
            },
            {
                type: 'text',
                content: 'Với độ trễ giảm xuống dưới 20ms, tai nghe gaming không dây giờ đây có thể cạnh tranh trực tiếp với tai nghe có dây về mặt hiệu suất. Các công nghệ như aptX Adaptive và LDAC đang dẫn đầu cuộc cách mạng này.'
            },
            {
                type: 'image',
                link: '/blog/audio-trends/low-latency-comparison.jpg',
                content: 'So sánh độ trễ các công nghệ wireless'
            }
        ],
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
        excerpt: 'Hướng dẫn chi tiết thiết lập bàn gaming với các sản phẩm TUNECORE để có trải nghiệm âm thanh tối ưu.',
        content: [
            {
                type: 'title',
                content: 'Lựa chọn thiết bị gaming setup hoàn hảo'
            },
            {
                type: 'text',
                content: 'Một gaming setup hoàn hảo không chỉ cần màn hình và bàn phím chuột tốt. Hệ thống âm thanh là yếu tố quyết định trải nghiệm gaming của bạn - từ việc nghe rõ tiếng chân đối thủ đến giao tiếp team hiệu quả.'
            },
            {
                type: 'image',
                link: '/blog/gaming-setup/complete-setup.jpg',
                content: 'Gaming setup hoàn chỉnh với TUNECORE'
            },
            {
                type: 'title',
                content: '1. Tai nghe chính - Trái tim của hệ thống '
            },
            {
                type: 'text',
                content: 'Chọn tai nghe phù hợp với loại game yêu thích là bước đầu tiên quan trọng. Game FPS cần tai nghe có khả năng định vị chính xác, trong khi game RPG cần âm thanh phong phú và chi tiết. TUNECORE SX Pro Elite là lựa chọn tối ưu cho mọi thể loại game.'
            },
            {
                type: 'image',
                link: '/blog/gaming-setup/headset-positioning.jpg',
                content: 'Vị trí đặt tai nghe lý tưởng'
            },
            {
                type: 'title',
                content: '2. Microphone - Giao tiếp team hiệu quả'
            },
            {
                type: 'text',
                content: 'Chất lượng microphone quyết định khả năng giao tiếp và phối hợp team trong gaming. Microphone cần có khả năng loại bỏ tiếng ồn tốt, độ nhạy cao và âm thanh rõ ràng. Đặc biệt quan trọng trong các game tầm nhìn như CS2, Valorant.'
            },
            {
                type: 'image',
                link: '/blog/gaming-setup/microphone-setup.jpg',
                content: 'Cài đặt microphone cho gaming'
            },
            {
                type: 'title',
                content: '3. Sound card - Nâng tầm chất lượng âm thanh'
            },
            {
                type: 'text',
                content: 'Sound card đóng vai trò quan trọng trong việc xử lý và khuếch đại tín hiệu âm thanh. Một sound card tốt sẽ giảm thiểu nhiễu, tăng độ phân giải âm thanh và hỗ trợ các công nghệ âm thanh tiên tiến như 7.1 surround, DTS.'
            },
            {
                type: 'image',
                link: '/blog/gaming-setup/sound-card-benefits.jpg',
                content: 'Lợi ích của sound card trong gaming'
            }
        ],
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
        excerpt: 'Phân tích vai trò của hệ thống âm thanh trong thành công của các game thủ esports chuyên nghiệp.',
        content: [
            {
                type: 'title',
                content: 'Âm thanh - Yếu tố quyết định trong Esports'
            },
            {
                type: 'text',
                content: 'Trong thế giới esports chuyên nghiệp, mỗi phần trăm lợi thế đều có thể quyết định thắng thua. Âm thanh không chỉ là trải nghiệm, mà là công cụ cạnh tranh quan trọng giúp các game thủ chuyên nghiệp vượt trội so với đối thủ.'
            },
            {
                type: 'image',
                link: '/blog/esports-audio/pro-gaming-setup.jpg',
                content: 'Setup âm thanh chuyên nghiệp trong esports'
            },
            {
                type: 'title',
                content: '1. Positional Audio - Định vị chính xác đối thủ'
            },
            {
                type: 'text',
                content: 'Khả năng xác định vị trí đối thủ qua âm thanh là kỹ năng cốt lõi trong các game FPS. Các game thủ pro có thể phân biệt được tiếng chân trên các bề mặt khác nhau, khoảng cách và hướng di chuyển chỉ qua âm thanh.'
            },
            {
                type: 'image',
                link: '/blog/esports-audio/positional-audio-demo.jpg',
                content: 'Demo khả năng định vị qua âm thanh'
            },
            {
                type: 'title',
                content: '2. Communication - Giao tiếp team hiệu quả'
            },
            {
                type: 'text',
                content: 'Giao tiếp team rõ ràng, không nhiễu trong các trận đấu tournament là yếu tố sống còn. Microphone chất lượng cao giúp đảm bảo mọi thông tin chiến thuật được truyền đạt chính xác, nhanh chóng và không bị nhiễu.'
            },
            {
                type: 'image',
                link: '/blog/esports-audio/team-communication.jpg',
                content: 'Tầm quan trọng của giao tiếp team'
            },
            {
                type: 'title',
                content: '3. Focus và Concentration - Tập trung tối đa'
            },
            {
                type: 'text',
                content: 'Âm thanh chất lượng giúp game thủ duy trì sự tập trung cao độ trong suốt trận đấu. Việc loại bỏ được tiếng ồn khán giả, âm thanh môi trường không mong muốn giúp các pro player duy trì trạng thái tối ưu.'
            },
            {
                type: 'image',
                link: '/blog/esports-audio/noise-isolation.jpg',
                content: 'Cách ly tiếng ồn trong môi trường thi đấu'
            }
        ],
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
        content: [
            {
                type: 'title',
                content: 'Tại sao cần bảo dưỡng tai nghe gaming?'
            },
            {
                type: 'text',
                content: 'Tai nghe gaming là thiết bị được sử dụng hàng ngày với thời gian dài. Việc bảo dưỡng đúng cách không chỉ giúp kéo dài tuổi thọ sản phẩm mà còn duy trì chất lượng âm thanh tối ưu và đảm bảo vệ sinh sức khỏe cho người sử dụng.'
            },
            {
                type: 'image',
                link: '/blog/maintenance-tips/headset-care-overview.jpg',
                content: 'Tổng quan về việc bảo dưỡng tai nghe gaming'
            },
            {
                type: 'title',
                content: '1. Vệ sinh định kỳ - Bước cơ bản nhất'
            },
            {
                type: 'text',
                content: 'Vệ sinh tai nghe hàng tuần bằng khăn mềm ẩm và dung dịch cồn 70%. Đặc biệt chú ý đến các khu vực tiếp xúc trực tiếp với da như đệm tai, headband. Tháo rời các phần có thể tháo được để vệ sinh kỹ lưỡng hơn.'
            },
            {
                type: 'image',
                link: '/blog/maintenance-tips/cleaning-process.jpg',
                content: 'Quy trình vệ sinh tai nghe chi tiết'
            },
            {
                type: 'title',
                content: '2. Bảo quản đúng cách - Kéo dài tuổi thọ'
            },
            {
                type: 'text',
                content: 'Luôn treo tai nghe trên giá đỡ chuyên dụng khi không sử dụng để tránh biến dạng headband. Tránh để tai nghe ở nơi có nhiệt độ cao, độ ẩm cao hoặc ánh nắng trực tiếp. Sử dụng túi bảo vệ khi di chuyển.'
            },
            {
                type: 'image',
                link: '/blog/maintenance-tips/proper-storage.jpg',
                content: 'Cách bảo quản tai nghe đúng cách'
            },
            {
                type: 'title',
                content: '3. Kiểm tra và bảo vệ dây cáp'
            },
            {
                type: 'text',
                content: 'Thường xuyên kiểm tra dây cáp để phát hiện sớm các dấu hiệu hư hỏng như nứt, bong tróc. Cuộn dây nhẹ nhàng, tránh gấp góc cứng. Sử dụng cable management để tránh dây bị rối hoặc kéo căng quá mức.'
            },
            {
                type: 'image',
                link: '/blog/maintenance-tips/cable-management.jpg',
                content: 'Quản lý và bảo vệ dây cáp tai nghe'
            },
            {
                type: 'title',
                content: '4. Thay thế phụ kiện khi cần thiết'
            },
            {
                type: 'text',
                content: 'Đệm tai và headband pad cần được thay thế định kỳ (6-12 tháng tùy mức độ sử dụng). Sử dụng phụ kiện chính hãng để đảm bảo chất lượng và độ tương thích. Việc thay thế kịp thời giúp duy trì độ thoải mái và vệ sinh.'
            },
            {
                type: 'image',
                link: '/blog/maintenance-tips/replacement-parts.jpg',
                content: 'Các phụ kiện cần thay thế định kỳ'
            },
            {
                type: 'title',
                content: '5. Những điều cần tránh'
            },
            {
                type: 'text',
                content: 'Không bao giờ ngâm tai nghe vào nước, sử dụng hóa chất mạnh để vệ sinh, hoặc sử dụng nhiệt độ cao để sấy khô. Tránh va đập mạnh, rơi từ độ cao hoặc để tai nghe dưới áp lực nặng trong thời gian dài.'
            },
            {
                type: 'image',
                link: '/blog/maintenance-tips/what-to-avoid.jpg',
                content: 'Những điều cần tránh khi bảo dưỡng tai nghe'
            }
        ],
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
        excerpt: 'Phân tích ưu nhược điểm của tai nghe có dây và không dây để giúp bạn đưa ra lựa chọn phù hợp.',
        content: [
            {
                type: 'title',
                content: 'Cuộc chiến giữa có dây và không dây'
            },
            {
                type: 'text',
                content: 'Việc lựa chọn giữa tai nghe gaming có dây và không dây luôn là chủ đề tranh cái trong cộng đồng game thủ. Mỗi loại đều có những ưu thế riêng biệt, và lựa chọn tốt nhất phụ thuộc vào nhu cầu và phong cách gaming của từng người.'
            },
            {
                type: 'image',
                link: '/blog/wired-vs-wireless/comparison-overview.jpg',
                content: 'So sánh tổng quan tai nghe có dây vs không dây'
            },
            {
                type: 'title',
                content: '1. Chất lượng âm thanh - Cuộc đua sít sao'
            },
            {
                type: 'text',
                content: 'Tai nghe có dây từ lâu được coi là vượt trội về chất lượng âm thanh nhờ kết nối trực tiếp, không bị nén dữ liệu. Tuy nhiên, với sự phát triển của codec như LDAC, aptX HD, tai nghe không dây hiện đại đã thu hẹp đáng kể khoảng cách này.'
            },
            {
                type: 'text',
                content: '**Tai nghe có dây:** Chất lượng âm thanh nguyên bản 100%, không bị nén, hỗ trợ full range frequency. Đặc biệt tốt cho audiophile và những ai yêu cầu chất lượng âm thanh tuyệt đối.'
            },
            {
                type: 'text',
                content: '**Tai nghe không dây:** Với codec tiên tiến, chất lượng âm thanh đã cải thiện đáng kể. LDAC có thể truyền tải 990kbps, gần như lossless. Phù hợp cho hầu hết game thủ.'
            },
            {
                type: 'image',
                link: '/blog/wired-vs-wireless/audio-quality-comparison.jpg',
                content: 'So sánh chất lượng âm thanh giữa hai loại'
            },
            {
                type: 'title',
                content: '2. Độ trễ - Yếu tố then chót trong gaming'
            },
            {
                type: 'text',
                content: 'Độ trễ (latency) là yếu tố quyết định trong gaming competitive. Mỗi millisecond đều có thể quyết định thắng thua trong các game FPS.'
            },
            {
                type: 'text',
                content: '**Tai nghe có dây:** Độ trễ gần như bằng 0 (dưới 1ms), phản hồi tức thời. Lựa chọn tối ưu cho esports và gaming competitive.'
            },
            {
                type: 'text',
                content: '**Tai nghe không dây:** Độ trễ dao động 20-40ms với Bluetooth thường, xuống 10-20ms với gaming mode. Các model gaming chuyên dụng có thể đạt dưới 10ms.'
            },
            {
                type: 'image',
                link: '/blog/wired-vs-wireless/latency-testing.jpg',
                content: 'Test độ trễ giữa tai nghe có dây và không dây'
            },
            {
                type: 'title',
                content: '3. Tiện lợi và tự do di chuyển'
            },
            {
                type: 'text',
                content: 'Tính tiện lợi là lợi thế lớn nhất của tai nghe không dây. Không còn bị ràng buộc bởi dây cáp, game thủ có thể thoải mái di chuyển, đứng dậy nghỉ giải lao mà không cần tháo tai nghe.'
            },
            {
                type: 'text',
                content: '**Lợi ích không dây:** Tự do di chuyển, không lo rối dây, dễ dàng kết nối với nhiều thiết bị, phù hợp cho streaming và content creation.'
            },
            {
                type: 'text',
                content: '**Hạn chế:** Cần sạc pin, có thể hết pin giữa chừng, dễ bị mất kết nối trong môi trường nhiều sóng wifi.'
            },
            {
                type: 'image',
                link: '/blog/wired-vs-wireless/mobility-benefits.jpg',
                content: 'Lợi ích về tính di động của tai nghe không dây'
            },
            {
                type: 'title',
                content: '4. Giá thành và độ bền'
            },
            {
                type: 'text',
                content: 'Tai nghe có dây thường có giá thành thấp hơn với cùng chất lượng âm thanh. Độ bền cao hơn nhờ ít linh kiện điện tử phức tạp. Tai nghe không dây có giá cao hơn nhưng mang lại nhiều tính năng tiện ích.'
            },
            {
                type: 'image',
                link: '/blog/wired-vs-wireless/price-durability.jpg',
                content: 'So sánh giá thành và độ bền'
            },
            {
                type: 'title',
                content: 'Kết luận - Lựa chọn nào phù hợp với bạn?'
            },
            {
                type: 'text',
                content: '**Chọn tai nghe có dây nếu:** Bạn là game thủ competitive, ưu tiên chất lượng âm thanh tuyệt đối, không muốn lo về pin, hoặc có ngân sách hạn chế.'
            },
            {
                type: 'text',
                content: '**Chọn tai nghe không dây nếu:** Bạn coi trọng sự tiện lợi, thường xuyên di chuyển khi gaming, sử dụng nhiều thiết bị khác nhau, hoặc là streamer/content creator.'
            }
        ],
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
        excerpt: 'Giải thích các chuẩn codec âm thanh phổ biến và ảnh hưởng của chúng đến chất lượng âm thanh gaming.',
        content: [
            {
                type: 'title',
                content: 'Audio Codec - Chìa khóa của chất lượng âm thanh không dây'
            },
            {
                type: 'text',
                content: 'Audio codec là công nghệ nén và giải nén dữ liệu âm thanh trong quá trình truyền tải không dây. Hiểu rõ về các codec sẽ giúp bạn chọn được tai nghe phù hợp và tối ưu trải nghiệm âm thanh gaming.'
            },
            {
                type: 'image',
                link: '/blog/audio-codec/codec-overview.jpg',
                content: 'Tổng quan về các loại audio codec'
            },
            {
                type: 'title',
                content: '1. LDAC - Codec cao cấp từ Sony'
            },
            {
                type: 'text',
                content: 'LDAC là codec được phát triển bởi Sony, có khả năng truyền tải dữ liệu âm thanh với tốc độ lên đến 990 kbps - gấp 3 lần so với các codec Bluetooth thông thường. Điều này cho phép truyền tải âm thanh Hi-Res gần như không mất chất lượng.'
            },
            {
                type: 'text',
                content: '**Ưu điểm LDAC:** Chất lượng âm thanh cao, hỗ trợ Hi-Res Audio (24bit/96kHz), adaptive bitrate tự động điều chỉnh theo chất lượng kết nối.'
            },
            {
                type: 'text',
                content: '**Nhược điểm:** Tiêu thụ pin nhiều hơn, yêu cầu thiết bị hỗ trợ, độ trễ cao hơn aptX Low Latency.'
            },
            {
                type: 'image',
                link: '/blog/audio-codec/ldac-performance.jpg',
                content: 'Hiệu suất và chất lượng của LDAC'
            },
            {
                type: 'title',
                content: '2. aptX - Gia đình codec từ Qualcomm'
            },
            {
                type: 'text',
                content: 'aptX là gia đình codec được phát triển bởi Qualcomm với nhiều biến thể khác nhau, mỗi loại tối ưu cho một mục đích cụ thể.'
            },
            {
                type: 'text',
                content: '**aptX Classic:** Codec cơ bản với chất lượng CD (16bit/48kHz), độ trễ khoảng 120-150ms.'
            },
            {
                type: 'text',
                content: '**aptX HD:** Hỗ trợ Hi-Res Audio 24bit/48kHz, chất lượng tốt hơn aptX Classic nhưng vẫn giữ độ trễ thấp.'
            },
            {
                type: 'text',
                content: '**aptX Low Latency:** Tối ưu cho gaming với độ trễ chỉ 32ms, lý tưởng cho game thủ competitive.'
            },
            {
                type: 'text',
                content: '**aptX Adaptive:** Codec thông minh nhất, tự động điều chỉnh chất lượng và độ trễ theo nhu cầu sử dụng.'
            },
            {
                type: 'image',
                link: '/blog/audio-codec/aptx-family.jpg',
                content: 'Gia đình codec aptX và đặc điểm của từng loại'
            },
            {
                type: 'title',
                content: '3. SBC - Codec chuẩn Bluetooth'
            },
            {
                type: 'text',
                content: 'SBC (Sub-band Coding) là codec cơ bản được tích hợp sẵn trong tất cả thiết bị Bluetooth. Mặc dù chất lượng không cao như các codec premium, SBC vẫn đảm bảo tính tương thích tối đa.'
            },
            {
                type: 'text',
                content: '**Đặc điểm SBC:** Bitrate thấp (328kbps), chất lượng âm thanh cơ bản, độ trễ cao (200ms+), tương thích với mọi thiết bị Bluetooth.'
            },
            {
                type: 'image',
                link: '/blog/audio-codec/sbc-compatibility.jpg',
                content: 'Tính tương thích của codec SBC'
            },
            {
                type: 'title',
                content: '4. So sánh các codec trong gaming'
            },
            {
                type: 'text',
                content: 'Trong gaming, độ trễ là yếu tố quan trọng nhất. aptX Low Latency và aptX Adaptive là lựa chọn tốt nhất cho game thủ. LDAC phù hợp cho những ai ưu tiên chất lượng âm thanh trong single-player games.'
            },
            {
                type: 'image',
                link: '/blog/audio-codec/gaming-comparison.jpg',
                content: 'So sánh các codec trong ứng dụng gaming'
            },
            {
                type: 'title',
                content: 'Cách chọn codec phù hợp'
            },
            {
                type: 'text',
                content: 'Chọn codec dựa trên nhu cầu sử dụng: aptX Low Latency cho competitive gaming, LDAC cho âm nhạc và single-player games, aptX Adaptive cho sử dụng đa năng. Luôn kiểm tra khả năng hỗ trợ codec của thiết bị nguồn trước khi mua tai nghe.'
            }
        ],
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
        excerpt: 'Hướng dẫn cài đặt và tối ưu âm thanh cho các game FPS phổ biến để có lợi thế cạnh tranh.',
        content: [
            {
                type: 'title',
                content: 'Tầm quan trọng của âm thanh trong FPS Games'
            },
            {
                type: 'text',
                content: 'Trong các game FPS, âm thanh không chỉ là yếu tố giải trí mà còn là công cụ thông tin quan trọng. Khả năng nghe và phân tích âm thanh đúng cách có thể quyết định thắng thua trong các pha clutch quan trọng.'
            },
            {
                type: 'image',
                link: '/blog/fps-audio/fps-audio-importance.jpg',
                content: 'Tầm quan trọng của âm thanh trong FPS gaming'
            },
            {
                type: 'title',
                content: '1. Counter-Strike 2 - Âm thanh chính xác tuyệt đối'
            },
            {
                type: 'text',
                content: 'CS2 sử dụng Steam Audio engine với khả năng mô phỏng âm thanh 3D chân thực. Game có hệ thống âm thanh rất chi tiết, từ tiếng chân trên các bề mặt khác nhau đến tiếng reload, defuse kit.'
            },
            {
                type: 'text',
                content: '**Cài đặt tối ưu CS2:** Sử dụng headphone mode, tắt các hiệu ứng âm thanh không cần thiết, điều chỉnh volume để nghe rõ footstep mà không bị tổn thương thính giác bởi tiếng súng.'
            },
            {
                type: 'text',
                content: '**Audio cues quan trọng:** Footstep patterns để nhận biết số lượng địch, direction audio để xác định vị trí, weapon sounds để biết loại súng đối phương đang sử dụng.'
            },
            {
                type: 'image',
                link: '/blog/fps-audio/cs2-audio-settings.jpg',
                content: 'Cài đặt âm thanh tối ưu cho Counter-Strike 2'
            },
            {
                type: 'title',
                content: '2. Valorant - 3D Audio và Agent Abilities'
            },
            {
                type: 'text',
                content: 'Valorant có hệ thống âm thanh 3D tiên tiến với khả năng định vị chính xác trong không gian ba chiều. Game cũng có nhiều âm thanh từ abilities của các Agent cần chú ý.'
            },
            {
                type: 'text',
                content: '**Cài đặt Valorant:** Enable HRTF (Head-Related Transfer Function) để có âm thanh 3D tốt nhất. Điều chỉnh separate volume cho effects, voice, và music.'
            },
            {
                type: 'text',
                content: '**Âm thanh đặc biệt:** Spike plant/defuse sounds, ability audio cues (Sova drone, Cypher traps), ultimate ready sounds, và environmental audio như metal footsteps.'
            },
            {
                type: 'image',
                link: '/blog/fps-audio/valorant-3d-audio.jpg',
                content: 'Hệ thống 3D audio trong Valorant'
            },
            {
                type: 'title',
                content: '3. Apex Legends - Environmental Audio Complex'
            },
            {
                type: 'text',
                content: 'Apex Legends có hệ thống âm thanh phức tạp nhất trong các game FPS hiện tại. Với map lớn, nhiều độ cao khác nhau, và combat system đa dạng, việc xử lý âm thanh trở nên cực kỳ quan trọng.'
            },
            {
                type: 'text',
                content: '**Audio layers trong Apex:** Gunfire positioning cho combat, third-party detection, footstep differentiation giữa teammate và enemy, ability sounds từ 20+ legends khác nhau.'
            },
            {
                type: 'text',
                content: '**Cài đặt đặc biệt:** Dynamic range compression để cân bằng giữa quiet và loud sounds, master volume tuning, dialogue volume riêng biệt.'
            },
            {
                type: 'image',
                link: '/blog/fps-audio/apex-environmental-audio.jpg',
                content: 'Hệ thống âm thanh môi trường phức tạp trong Apex Legends'
            },
            {
                type: 'title',
                content: '4. Hardware Requirements và Recommendations'
            },
            {
                type: 'text',
                content: 'Để tận dụng tối đa âm thanh trong FPS games, bạn cần tai nghe có response frequency rộng (20Hz-20kHz), impedance thấp để dễ drive, và đặc biệt là khả năng tái tạo soundstage rộng.'
            },
            {
                type: 'text',
                content: '**Recommended setup:** Open-back headphones cho soundstage tốt hơn (nếu môi trường yên tĩnh), closed-back cho isolation tốt hơn, sound card/DAC để tăng cường audio processing.'
            },
            {
                type: 'image',
                link: '/blog/fps-audio/hardware-recommendations.jpg',
                content: 'Hardware được khuyến nghị cho FPS gaming'
            },
            {
                type: 'title',
                content: '5. Training và Skill Development'
            },
            {
                type: 'text',
                content: 'Khả năng audio positioning là skill có thể luyện tập. Dành thời gian trong aim trainers, practice mode để làm quen với audio cues. Tập nghe và phân biệt các loại âm thanh khác nhau trong game.'
            },
            {
                type: 'image',
                link: '/blog/fps-audio/audio-training.jpg',
                content: 'Luyện tập khả năng nghe và định vị âm thanh'
            }
        ],
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
        excerpt: 'Gợi ý những mẫu tai nghe gaming chất lượng với mức giá phù hợp cho game thủ có ngân sách hạn chế.',
        content: [
            {
                type: 'title',
                content: 'Gaming chất lượng cao với ngân sách hạn chế'
            },
            {
                type: 'text',
                content: 'Không cần phải chi hàng triệu đồng để có được trải nghiệm gaming âm thanh tốt. Với ngân sách dưới 1 triệu đồng, bạn vẫn có thể tìm được những mẫu tai nghe gaming chất lượng, đáp ứng tốt nhu cầu chơi game và giải trí.'
            },
            {
                type: 'image',
                link: '/blog/budget-headset/budget-gaming-overview.jpg',
                content: 'Tổng quan tai nghe gaming ngân sách hạn chế'
            },
            {
                type: 'title',
                content: '1. TUNECORE Entry Series - Lựa chọn hàng đầu (700.000đ)'
            },
            {
                type: 'text',
                content: 'TUNECORE Entry Series mang đến giá trị tuyệt vời với driver 40mm, âm thanh balanced phù hợp mọi thể loại game. Microphone có thể tháo rời, thiết kế thoải mái cho gaming session dài.'
            },
            {
                type: 'text',
                content: '**Ưu điểm:** Chất lượng build tốt, âm thanh cân bằng, microphone rõ ràng, warranty chính hãng 24 tháng.'
            },
            {
                type: 'text',
                content: '**Phù hợp cho:** Game thủ mới bắt đầu, students, những ai cần tai nghe đa năng cho cả gaming và học tập.'
            },
            {
                type: 'image',
                link: '/blog/budget-headset/tunecore-entry-review.jpg',
                content: 'Review chi tiết TUNECORE Entry Series'
            },
            {
                type: 'title',
                content: '2. HyperX Cloud Stinger Core - Gaming focused (850.000đ)'
            },
            {
                type: 'text',
                content: 'HyperX Cloud Stinger Core được thiết kế dành riêng cho gaming với directional drivers 40mm, nhấn mạnh vào mid và high frequencies để nghe rõ footsteps và voice chat.'
            },
            {
                type: 'text',
                content: '**Đặc điểm nổi bật:** Extremely lightweight (275g), on-ear volume slider, noise-cancelling microphone với LED mute indicator.'
            },
            {
                type: 'image',
                link: '/blog/budget-headset/hyperx-stinger-features.jpg',
                content: 'Các tính năng nổi bật của HyperX Cloud Stinger Core'
            },
            {
                type: 'title',
                content: '3. SteelSeries Arctis 3 - Versatile choice (950.000đ)'
            },
            {
                type: 'text',
                content: 'Arctis 3 nổi bật với ski goggle headband design độc đáo, âm thanh signature của SteelSeries với soundstage rộng. Tương thích đa nền tảng từ PC, console đến mobile.'
            },
            {
                type: 'text',
                content: '**Ưu điểm đặc biệt:** Cross-platform compatibility, fabric ear cushions thoáng khí, ClearCast microphone với noise cancellation.'
            },
            {
                type: 'image',
                link: '/blog/budget-headset/arctis3-compatibility.jpg',
                content: 'Khả năng tương thích đa nền tảng của Arctis 3'
            },
            {
                type: 'title',
                content: '4. Corsair HS35 - Durability champion (650.000đ)'
            },
            {
                type: 'text',
                content: 'HS35 được xây dựng với triết lý "built to last" với construction chắc chắn, có thể chịu được tác động mạnh. Memory foam ear cups và adjustable headband đảm bảo comfort lâu dài.'
            },
            {
                type: 'text',
                content: '**Strength:** Excellent build quality, great warranty support, balanced sound signature, detachable microphone.'
            },
            {
                type: 'image',
                link: '/blog/budget-headset/corsair-hs35-durability.jpg',
                content: 'Test độ bền và chất lượng build của Corsair HS35'
            },
            {
                type: 'title',
                content: '5. Logitech G432 - Feature rich (880.000đ)'
            },
            {
                type: 'text',
                content: 'G432 đi kèm với Logitech G HUB software cho phép fine-tuning EQ, tạo custom sound profiles. 7.1 surround sound simulation và Blue VO!CE microphone technology.'
            },
            {
                type: 'text',
                content: '**Tech features:** 50mm drivers, DTS Headphone:X 2.0, flip-to-mute microphone, software customization.'
            },
            {
                type: 'image',
                link: '/blog/budget-headset/g432-software-features.jpg',
                content: 'Các tính năng software của Logitech G432'
            },
            {
                type: 'title',
                content: 'So sánh và lựa chọn phù hợp'
            },
            {
                type: 'text',
                content: 'Chọn TUNECORE Entry nếu bạn muốn value tốt nhất với warranty tốt. HyperX Stinger Core cho competitive gaming. Arctis 3 nếu cần multi-platform. Corsair HS35 cho độ bền cao. G432 nếu thích tùy chỉnh software.'
            },
            {
                type: 'image',
                link: '/blog/budget-headset/comparison-chart.jpg',
                content: 'Bảng so sánh các tai nghe gaming ngân sách'
            },
            {
                type: 'title',
                content: 'Tips mua tai nghe gaming budget'
            },
            {
                type: 'text',
                content: 'Ưu tiên comfort và build quality hơn fancy features. Kiểm tra warranty và after-sales support. Đọc review từ người dùng thực tế. Test trực tiếp nếu có thể. Cân nhắc mua trong các đợt sale để được giá tốt hơn.'
            }
        ],
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
        excerpt: 'Hướng dẫn thiết lập hệ thống âm thanh chuyên nghiệp cho streamer và content creator.',
        content: [
            {
                type: 'title',
                content: 'Streaming Audio - Yếu tố quyết định chất lượng content'
            },
            {
                type: 'text',
                content: 'Chất lượng âm thanh trong streaming không chỉ ảnh hưởng đến trải nghiệm của viewer mà còn trực tiếp tác động đến sự thành công của streamer. Một setup âm thanh chuyên nghiệp sẽ giúp bạn nổi bật trong hàng triệu content creator.'
            },
            {
                type: 'image',
                link: '/blog/streaming-audio/streaming-setup-overview.jpg',
                content: 'Tổng quan setup âm thanh streaming chuyên nghiệp'
            },
            {
                type: 'title',
                content: '1. Microphone - Trái tim của streaming setup'
            },
            {
                type: 'text',
                content: 'Lựa chọn microphone là quyết định quan trọng nhất trong streaming setup. Hai loại chính là Dynamic và Condenser, mỗi loại có ưu nhược điểm riêng biệt.'
            },
            {
                type: 'text',
                content: '**Dynamic Microphones:** Shure SM7B, ElectroVoice RE20 - ít nhạy với background noise, cần phantom power mạnh, âm thanh warm và professional. Phù hợp cho môi trường không được xử lý âm học hoàn hảo.'
            },
            {
                type: 'text',
                content: '**Condenser Microphones:** Audio-Technica AT2020, Rode PodMic - rất nhạy, chi tiết cao, cần phantom power, dễ bắt background noise. Lý tưởng cho phòng đã xử lý âm học tốt.'
            },
            {
                type: 'image',
                link: '/blog/streaming-audio/microphone-comparison.jpg',
                content: 'So sánh Dynamic vs Condenser microphones'
            },
            {
                type: 'title',
                content: '2. Audio Interface - Cầu nối quan trọng'
            },
            {
                type: 'text',
                content: 'Audio Interface chuyển đổi analog signal từ microphone thành digital signal cho computer. Nó cũng cung cấp phantom power, preamp gain, và monitoring capabilities.'
            },
            {
                type: 'text',
                content: '**Budget options:** Focusrite Scarlett Solo/2i2 - đủ tính năng cơ bản, giá cả hợp lý, preamp clean, compatible với mọi streaming software.'
            },
            {
                type: 'text',
                content: '**Professional options:** RME Babyface Pro, Universal Audio Apollo - preamp cao cấp, DSP processing, multiple inputs/outputs, hardware monitoring.'
            },
            {
                type: 'image',
                link: '/blog/streaming-audio/audio-interface-setup.jpg',
                content: 'Cách setup và kết nối Audio Interface'
            },
            {
                type: 'title',
                content: '3. Acoustic Treatment - Không gian âm thanh lý tưởng'
            },
            {
                type: 'text',
                content: 'Xử lý âm học phòng streaming là yếu tố quan trọng không kém microphone. Phòng không được xử lý sẽ tạo ra echo, reverb không mong muốn và làm giảm chất lượng âm thanh đáng kể.'
            },
            {
                type: 'text',
                content: '**Basic treatment:** Acoustic foam panels, bass traps ở góc phòng, thick curtains, carpet để giảm reflection. Đặt microphone ở vị trí tối ưu, tránh walls và hard surfaces.'
            },
            {
                type: 'text',
                content: '**Advanced treatment:** Professional acoustic panels, diffusers, isolation booth hoặc vocal booth, room measurement và tuning với REW software.'
            },
            {
                type: 'image',
                link: '/blog/streaming-audio/acoustic-treatment.jpg',
                content: 'Các phương pháp xử lý âm học phòng streaming'
            },
            {
                type: 'title',
                content: '4. Monitoring và Headphones'
            },
            {
                type: 'text',
                content: 'Monitoring system giúp streamer nghe được chính xác những gì viewers sẽ nghe. Cần có cả studio monitors và headphones chất lượng cao để kiểm soát âm thanh.'
            },
            {
                type: 'text',
                content: '**Studio Monitors:** Yamaha HS5, KRK Rokit series - flat frequency response, accurate reproduction, good for mixing và mastering.'
            },
            {
                type: 'text',
                content: '**Monitoring Headphones:** Sony MDR-7506, Audio-Technica ATH-M50x - closed-back design, accurate sound, comfortable cho long sessions.'
            },
            {
                type: 'image',
                link: '/blog/streaming-audio/monitoring-setup.jpg',
                content: 'Setup monitoring system cho streaming'
            },
            {
                type: 'title',
                content: '5. Software và Processing'
            },
            {
                type: 'text',
                content: 'Streaming software như OBS Studio, XSplit cần được cấu hình đúng cách. Audio processing plugins như noise gate, compressor, EQ sẽ giúp cải thiện chất lượng âm thanh significantly.'
            },
            {
                type: 'text',
                content: '**Essential plugins:** Noise Suppression (RTX Voice, Krisp), Compressor để even out volume, EQ để shape tone, Limiter để prevent clipping.'
            },
            {
                type: 'image',
                link: '/blog/streaming-audio/software-processing.jpg',
                content: 'Cấu hình software và audio processing'
            },
            {
                type: 'title',
                content: 'Budget Planning và ROI'
            },
            {
                type: 'text',
                content: 'Streaming audio setup có thể từ 5-50 triệu đồng tùy mức độ. Bắt đầu với basic setup (2-5 triệu) rồi upgrade dần. Chất lượng âm thanh tốt sẽ tăng viewer retention và subscriber growth, mang lại ROI tích cực cho investment.'
            }
        ],
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
        content: [
            {
                type: 'title',
                content: 'RGB Gaming Gear - Xu hướng hay tất yếu?'
            },
            {
                type: 'text',
                content: 'RGB lighting đã trở thành một phần không thể thiếu trong gaming culture hiện đại. Từ keyboard, mouse đến tai nghe, hầu hết gaming peripherals đều tích hợp LED RGB. Nhưng liệu đây chỉ là xu hướng thẩm mỹ hay thực sự mang lại giá trị?'
            },
            {
                type: 'image',
                link: '/blog/rgb-gaming/rgb-setup-showcase.jpg',
                content: 'Gaming setup với hệ thống RGB đồng bộ'
            },
            {
                type: 'title',
                content: '1. Tác động tâm lý - RGB và Gaming Performance'
            },
            {
                type: 'text',
                content: 'Nghiên cứu về color psychology cho thấy màu sắc có thể ảnh hưởng đến mood, focus và performance. Màu xanh lam giúp tăng concentration, đỏ tạo cảm giác urgency và energy, xanh lá cây có tác dụng calming.'
            },
            {
                type: 'text',
                content: '**Placebo Effect:** RGB có thể tạo ra "placebo effect" tích cực - khi game thủ cảm thấy setup của mình "pro" hơn, họ có xu hướng perform better. Điều này không hẳn là tâm lý học rẻ tiền mà có cơ sở khoa học.'
            },
            {
                type: 'text',
                content: '**Ambiance Creation:** RGB giúp tạo ra không gian gaming immersive hơn. Lighting phù hợp với game đang chơi (horror games với đỏ, racing với xanh dương) có thể enhance gaming experience.'
            },
            {
                type: 'image',
                link: '/blog/rgb-gaming/psychology-effects.jpg',
                content: 'Tác động tâm lý của màu sắc trong gaming'
            },
            {
                type: 'title',
                content: '2. Customization và Personal Branding'
            },
            {
                type: 'text',
                content: 'RGB cho phép game thủ customize setup theo phong cách cá nhân. Điều này đặc biệt quan trọng với streamers và content creators cần tạo ra brand identity riêng biệt.'
            },
            {
                type: 'text',
                content: '**Synchronization:** Các hãng như Razer Chroma, Corsair iCUE, ASUS Aura Sync cho phép đồng bộ lighting trên toàn bộ ecosystem. Hiệu ứng lighting có thể reactive với game events hoặc audio.'
            },
            {
                type: 'text',
                content: '**Content Creation Value:** Với sự phát triển của streaming và content creation, RGB setup tạo ra visual appeal cao cho video content, giúp tăng engagement và subscriber.'
            },
            {
                type: 'image',
                link: '/blog/rgb-gaming/customization-options.jpg',
                content: 'Các tùy chọn customization RGB'
            },
            {
                type: 'title',
                content: '3. Performance Impact - Có ảnh hưởng thực sự?'
            },
            {
                type: 'text',
                content: 'Về mặt technical, RGB không cải thiện performance của gaming gear. Tai nghe với RGB không có âm thanh tốt hơn, keyboard RGB không response nhanh hơn. Tuy nhiên, có một số tác động gián tiếp.'
            },
            {
                type: 'text',
                content: '**Functional RGB:** Một số ứng dụng RGB có thể mang lại lợi ích thực tế như health/mana indicators trong MMO games, notification lights, hoặc visual feedback cho key presses.'
            },
            {
                type: 'text',
                content: '**Power Consumption:** RGB tiêu thụ thêm power, có thể ảnh hưởng đến battery life của wireless devices. Tuy nhiên, impact này thường minimal với LED technology hiện đại.'
            },
            {
                type: 'image',
                link: '/blog/rgb-gaming/functional-rgb-examples.jpg',
                content: 'Các ứng dụng RGB có tính năng'
            },
            {
                type: 'title',
                content: '4. Chi phí và Value Proposition'
            },
            {
                type: 'text',
                content: 'RGB thường làm tăng giá thành sản phẩm 10-30%. Câu hỏi là liệu extra cost này có worth it hay không, phụ thuộc vào nhu cầu và budget của từng người.'
            },
            {
                type: 'text',
                content: '**When RGB worth it:** Content creators, streamers, enthusiasts yêu thích customization, những ai có budget comfortable và muốn complete aesthetic setup.'
            },
            {
                type: 'text',
                content: '**When to skip RGB:** Budget-conscious users, competitive gamers chỉ care about performance, minimalist setup preferences, office/shared space usage.'
            },
            {
                type: 'image',
                link: '/blog/rgb-gaming/cost-benefit-analysis.jpg',
                content: 'Phân tích chi phí - lợi ích của RGB'
            },
            {
                type: 'title',
                content: '5. Xu hướng tương lai của RGB'
            },
            {
                type: 'text',
                content: 'RGB đang phát triển theo hướng intelligent và contextual hơn. AI-driven lighting có thể adapt theo game content, biometric data, hoặc performance metrics. Integration với smart home systems cũng đang trở nên phổ biến.'
            },
            {
                type: 'text',
                content: '**Emerging trends:** Ambient lighting sync với game content, health monitoring through color changes, voice-controlled RGB, integration với VR/AR experiences.'
            },
            {
                type: 'image',
                link: '/blog/rgb-gaming/future-trends.jpg',
                content: 'Xu hướng tương lai của RGB gaming'
            },
            {
                type: 'title',
                content: 'Kết luận - RGB có đáng không?'
            },
            {
                type: 'text',
                content: 'RGB trong gaming gear không phải là revolutionary technology, nhưng nó mang lại value trong việc personalization, content creation, và psychological benefits. Nếu budget cho phép và bạn appreciate aesthetics, RGB là worthy investment. Nếu chỉ care về pure performance, có thể skip để tiết kiệm budget cho core components.'
            }
        ],
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
        excerpt: 'Hướng dẫn chọn tai nghe phù hợp cho mobile gaming với các tựa game như PUBG Mobile, Mobile Legends.',
        content: [
            {
                type: 'title',
                content: 'Mobile Gaming - Thị trường gaming lớn nhất thế giới'
            },
            {
                type: 'text',
                content: 'Mobile gaming đã vượt mặt PC và console về doanh thu, với hàng tỷ người chơi trên toàn thế giới. Chất lượng âm thanh trong mobile gaming không chỉ ảnh hưởng đến trải nghiệm mà còn trực tiếp tác động đến competitive performance trong các title như PUBG Mobile, Mobile Legends, Wild Rift.'
            },
            {
                type: 'image',
                link: '/blog/mobile-gaming/mobile-gaming-growth.jpg',
                content: 'Sự phát triển của mobile gaming market'
            },
            {
                type: 'title',
                content: '1. True Wireless Earbuds - Sự tiện lợi tối đa'
            },
            {
                type: 'text',
                content: 'True Wireless Earbuds (TWS) là lựa chọn phổ biến nhất cho mobile gaming nhờ tính portability và ease of use. Không có dây cáp rối, dễ dàng mang theo, và thường có battery life tốt.'
            },
            {
                type: 'text',
                content: '**Gaming-optimized TWS:** Razer Hammerhead True Wireless Pro, ASUS ROG Cetra True Wireless - được thiết kế riêng cho gaming với low latency modes, enhanced bass cho footsteps, và comfortable fit.'
            },
            {
                type: 'text',
                content: '**Mainstream options:** Apple AirPods Pro, Sony WF-1000XM4 - chất lượng âm thanh tổng thể tốt, ANC tuyệt vời, nhưng có thể có latency cao hơn gaming-specific models.'
            },
            {
                type: 'image',
                link: '/blog/mobile-gaming/tws-comparison.jpg',
                content: 'So sánh các True Wireless Earbuds cho gaming'
            },
            {
                type: 'title',
                content: '2. Low Latency - Yếu tố quyết định'
            },
            {
                type: 'text',
                content: 'Độ trễ âm thanh trong mobile gaming có thể quyết định thắng thua. Latency cao gây ra audio-visual desync, làm game thủ không thể reaction kịp thời với audio cues.'
            },
            {
                type: 'text',
                content: '**Latency benchmarks:** Gaming cạnh tranh cần <40ms latency. Gaming casual có thể chấp nhận 60-80ms. Media consumption thường okay với 100ms+.'
            },
            {
                type: 'text',
                content: '**Technology solutions:** aptX Low Latency (32ms), gaming modes trên các TWS gaming, 2.4GHz wireless dongles cho ultra-low latency.'
            },
            {
                type: 'image',
                link: '/blog/mobile-gaming/latency-testing.jpg',
                content: 'Test độ trễ của các tai nghe mobile gaming'
            },
            {
                type: 'title',
                content: '3. Comfort và Ergonomics'
            },
            {
                type: 'text',
                content: 'Mobile gaming sessions có thể kéo dài nhiều giờ, đặc biệt với các game như Genshin Impact, PUBG Mobile tournaments. Comfort trở thành yếu tố extremely important.'
            },
            {
                type: 'text',
                content: '**Earbud design considerations:** Multiple ear tip sizes, lightweight construction (dưới 6g mỗi bên), secure fit để không rơi khi di chuyển, materials không gây allergic reactions.'
            },
            {
                type: 'text',
                content: '**Heat management:** Mobile devices và earbuds đều generate heat. Good ventilation design và materials dissipation tốt giúp maintain comfort trong long sessions.'
            },
            {
                type: 'image',
                link: '/blog/mobile-gaming/comfort-ergonomics.jpg',
                content: 'Thiết kế ergonomic cho mobile gaming'
            },
            {
                type: 'title',
                content: '4. Game-specific Audio Requirements'
            },
            {
                type: 'text',
                content: 'Các thể loại mobile games có requirements âm thanh khác nhau. Understanding này giúp chọn tai nghe phù hợp với gaming preferences.'
            },
            {
                type: 'text',
                content: '**Battle Royale (PUBG Mobile, COD Mobile):** Cần excellent positional audio, enhanced footstep detection, clear voice chat. Wide soundstage preference.'
            },
            {
                type: 'text',
                content: '**MOBA (Mobile Legends, Wild Rift):** Balanced sound signature, clear ability sound effects, good communication quality. Mid-range clarity important.'
            },
            {
                type: 'text',
                content: '**RPG (Genshin Impact, Honkai):** Rich, immersive audio, excellent music reproduction, atmospheric sounds. Full frequency range preferred.'
            },
            {
                type: 'image',
                link: '/blog/mobile-gaming/game-specific-audio.jpg',
                content: 'Audio requirements cho các thể loại mobile games'
            },
            {
                type: 'title',
                content: '5. Connectivity và Compatibility'
            },
            {
                type: 'text',
                content: 'Mobile gaming audio cần tương thích với diverse ecosystem của mobile devices, từ iOS đến Android, các gaming phones khác nhau với different audio implementations.'
            },
            {
                type: 'text',
                content: '**iOS considerations:** Lightning connector alternatives, MFi certification, compatibility với iOS gaming features như spatial audio.'
            },
            {
                type: 'text',
                content: '**Android variations:** USB-C audio, different Bluetooth implementations, gaming-specific features trên ROG Phone, Black Shark, RedMagic.'
            },
            {
                type: 'image',
                link: '/blog/mobile-gaming/device-compatibility.jpg',
                content: 'Compatibility với các mobile gaming devices'
            },
            {
                type: 'title',
                content: 'Budget Recommendations'
            },
            {
                type: 'text',
                content: 'Budget dưới 1 triệu: QCY T13, Soundcore Liberty Air 2. Budget 1-2 triệu: Razer Hammerhead True Wireless, Galaxy Buds2. Premium 2-5 triệu: ASUS ROG Cetra True Wireless, Sony WF-1000XM4. Đầu tư theo nhu cầu gaming và budget available.'
            }
        ],
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
        content: [
            {
                type: 'title',
                content: 'Cuộc tranh luận bất tận: Stereo vs Surround Sound'
            },
            {
                type: 'text',
                content: 'Trong gaming community, ít chủ đề nào gây tranh cãi nhiều như việc lựa chọn giữa stereo và surround sound. Mỗi phe đều có những lập luận thuyết phục, và sự thật là cả hai đều có vị trí riêng trong gaming ecosystem.'
            },
            {
                type: 'image',
                link: '/blog/surround-vs-stereo/debate-overview.jpg',
                content: 'Cuộc tranh luận stereo vs surround trong gaming'
            },
            {
                type: 'title',
                content: '1. Stereo - Sự đơn giản hoàn hảo'
            },
            {
                type: 'text',
                content: 'Stereo sound với 2 channels (left/right) đã tồn tại hàng thập kỷ và vẫn được nhiều audiophiles và pro gamers ưa chuộng. Sự đơn giản của stereo mang lại những lợi thế không ngờ.'
            },
            {
                type: 'text',
                content: '**Clarity advantage:** Stereo không cần xử lý phức tạp để tạo ra virtual surround, do đó âm thanh giữ được độ trong trẻo và chi tiết cao. Đặc biệt quan trọng trong competitive gaming khi cần nghe rõ từng detail.'
            },
            {
                type: 'text',
                content: '**Accuracy:** Với stereo, những gì bạn nghe là exactly những gì sound engineer intended. Không có algorithm nào can thiệp vào signal, đảm bảo reference-quality audio.'
            },
            {
                type: 'text',
                content: '**Imaging precision:** Good stereo setup có thể create excellent soundstage và imaging. Brain tự nhiên interpret stereo cues để determine positioning, thường accurate hơn artificial surround.'
            },
            {
                type: 'image',
                link: '/blog/surround-vs-stereo/stereo-advantages.jpg',
                content: 'Các ưu điểm của stereo sound trong gaming'
            },
            {
                type: 'title',
                content: '2. Surround Sound - Immersion tối đa'
            },
            {
                type: 'text',
                content: 'Surround sound (5.1, 7.1, hoặc virtual surround) tạo ra không gian âm thanh 360 độ, mang lại trải nghiệm immersive và spatial awareness tốt hơn trong nhiều trường hợp.'
            },
            {
                type: 'text',
                content: '**True multichannel:** Physical 5.1/7.1 setup với separate speakers cho từng channel tạo ra authentic surround experience. Ideal cho single-player games và home theater gaming.'
            },
            {
                type: 'text',
                content: '**Virtual surround:** Headphone-based virtual surround sử dụng HRTF (Head-Related Transfer Function) để simulate multichannel audio trên stereo drivers. Technologies như DTS Headphone:X, Dolby Atmos for Headphones.'
            },
            {
                type: 'text',
                content: '**Spatial awareness:** Trong open-world games hoặc battle royale, surround sound giúp track multiple audio sources simultaneously, awareness about environment xung quanh.'
            },
            {
                type: 'image',
                link: '/blog/surround-vs-stereo/surround-benefits.jpg',
                content: 'Lợi ích của surround sound trong gaming'
            },
            {
                type: 'title',
                content: '3. Technical Deep Dive'
            },
            {
                type: 'text',
                content: 'Hiểu rõ technical aspects giúp đưa ra quyết định informed hơn về audio setup phù hợp.'
            },
            {
                type: 'text',
                content: '**Processing latency:** Stereo có zero processing latency. Virtual surround cần thời gian để process HRTF algorithms, thường 5-15ms additional latency.'
            },
            {
                type: 'text',
                content: '**Frequency response:** Stereo maintains original frequency response của drivers. Surround processing có thể alter frequency response để create spatial effects.'
            },
            {
                type: 'text',
                content: '**Dynamic range:** High-quality stereo setup thường có better dynamic range. Surround processing có thể compress dynamic range để maintain loudness balance across channels.'
            },
            {
                type: 'image',
                link: '/blog/surround-vs-stereo/technical-comparison.jpg',
                content: 'So sánh technical giữa stereo và surround'
            },
            {
                type: 'title',
                content: '4. Game-specific Recommendations'
            },
            {
                type: 'text',
                content: 'Lựa chọn stereo hay surround nên based trên types of games bạn chơi chủ yếu và competitive level.'
            },
            {
                type: 'text',
                content: '**Competitive FPS (CS2, Valorant):** Stereo được recommend bởi hầu hết pro players. Clarity và accuracy quan trọng hơn immersion. Footstep detection chính xác hơn.'
            },
            {
                type: 'text',
                content: '**Battle Royale (PUBG, Apex):** Virtual surround có lợi thế với large, open environments. Multiple threats từ different directions. Spatial awareness crucial.'
            },
            {
                type: 'text',
                content: '**Single-player RPG/Adventure:** Surround sound enhance storytelling và immersion. Environmental audio, music, atmospheric sounds benefit từ multichannel processing.'
            },
            {
                type: 'text',
                content: '**Racing/Flight Sims:** Surround excellent cho engine sounds, environmental audio, spatial positioning của other vehicles.'
            },
            {
                type: 'image',
                link: '/blog/surround-vs-stereo/game-recommendations.jpg',
                content: 'Recommendations theo thể loại game'
            },
            {
                type: 'title',
                content: '5. Hardware Considerations'
            },
            {
                type: 'text',
                content: 'Hardware setup cũng influence việc lựa chọn giữa stereo và surround sound.'
            },
            {
                type: 'text',
                content: '**Headphone types:** Open-back headphones naturally tạo wider soundstage, tốt cho both stereo và virtual surround. Closed-back focus hơn, better isolation.'
            },
            {
                type: 'text',
                content: '**Audio source:** Dedicated sound cards/DACs thường handle surround processing better. Onboard audio có thể struggle với complex surround algorithms.'
            },
            {
                type: 'text',
                content: '**Room acoustics:** Physical surround setup requires proper room treatment. Headphone-based solutions không dependent on room acoustics.'
            },
            {
                type: 'image',
                link: '/blog/surround-vs-stereo/hardware-setup.jpg',
                content: 'Hardware considerations cho stereo vs surround'
            },
            {
                type: 'title',
                content: 'Kết luận - Lựa chọn thông minh'
            },
            {
                type: 'text',
                content: 'Không có "right answer" tuyệt đối. Competitive gamers nên prioritize stereo cho accuracy. Casual gamers có thể enjoy surround cho immersion. Ideally, có capability để switch giữa hai modes depending on game và mood. Many modern audio solutions offer both options.'
            }
        ],
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
