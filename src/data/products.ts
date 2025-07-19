import { Product, ProductSeries, ProductCategory } from '@/types/product';

// Product Series Data
export const productSeries: ProductSeries[] = [
    {
        id: 'sx-series',
        name: 'SX SERIES',
        description: 'Premium gaming headsets cho game thủ chuyên nghiệp',
        targetAudience: 'Professional Gamers & Esports Athletes',
        positionInMarket: 'Premium',
        thumbnail: '/productCards/card1/image1.png'
    },
    {
        id: 's-series',
        name: 'S SERIES',
        description: 'Professional gaming headsets với chất lượng âm thanh vượt trội',
        targetAudience: 'Professional Gamers & Content Creators',
        positionInMarket: 'Mid-range Premium',
        thumbnail: '/productCards/card2/image2.png'
    },
    {
        id: 'g-series',
        name: 'G SERIES',
        description: 'Advanced gaming headsets cho game thủ đam mê',
        targetAudience: 'Enthusiast Gamers & Streamers',
        positionInMarket: 'Mid-range',
        thumbnail: '/productCards/card3/image3.png'
    },
    {
        id: 'g-plus-series',
        name: 'G+ SERIES',
        description: 'Ultimate gaming experience với công nghệ tiên tiến nhất',
        targetAudience: 'Pro Gamers & Audiophiles',
        positionInMarket: 'Ultimate',
        thumbnail: '/productCards/card1/image1.png'
    }
];

// Product Categories
export const productCategories: ProductCategory[] = [
    {
        id: 'gaming-headsets',
        name: 'Gaming Headsets',
        description: 'Tai nghe gaming chuyên nghiệp',
        slug: 'gaming-headsets'
    },
    {
        id: 'wireless-headsets',
        name: 'Wireless Headsets',
        description: 'Tai nghe không dây cao cấp',
        slug: 'wireless-headsets'
    },
    {
        id: 'wired-headsets',
        name: 'Wired Headsets',
        description: 'Tai nghe có dây chất lượng cao',
        slug: 'wired-headsets'
    },
    {
        id: 'professional-audio',
        name: 'Professional Audio',
        description: 'Thiết bị âm thanh chuyên nghiệp',
        slug: 'professional-audio'
    }
];

// Complete Products Data
export const products: Product[] = [
    // SX SERIES Products
    {
        id: 'sx-pro-elite',
        name: 'TUNECORE SX Pro Elite',
        subtitle: 'Professional Gaming Headset',
        description: 'Tai nghe gaming cao cấp với driver 50mm và công nghệ noise cancelling tiên tiến',
        longDescription: 'TUNECORE SX Pro Elite là đỉnh cao của công nghệ âm thanh gaming, được thiết kế dành riêng cho các game thủ chuyên nghiệp và những người đam mê esports. Với driver custom 50mm và công nghệ noise cancelling chủ động, SX Pro Elite mang đến trải nghiệm âm thanh immersive tuyệt đối.',
        series: productSeries[0], // SX SERIES
        category: productCategories[0], // Gaming Headsets
        
        images: [
            {
                id: 'sx-pro-elite-main',
                url: '/products/sx-pro-elite-main.png',
                alt: 'TUNECORE SX Pro Elite - Main View',
                type: 'main',
                order: 1
            },
            {
                id: 'sx-pro-elite-side',
                url: '/products/sx-pro-elite-side.png',
                alt: 'TUNECORE SX Pro Elite - Side View',
                type: 'angle',
                order: 2
            },
            {
                id: 'sx-pro-elite-detail',
                url: '/products/sx-pro-elite-detail.png',
                alt: 'TUNECORE SX Pro Elite - Detail View',
                type: 'detail',
                order: 3
            }
        ],
        
        videos: [
            {
                id: 'sx-pro-elite-review',
                title: 'Đánh giá chi tiết TUNECORE SX Pro Elite',
                description: 'Video đánh giá toàn diện về sản phẩm, từ unboxing đến test thực tế',
                url: '/videos/futuristic-background-2022-08-04-19-57-56-utc.mp4',
                type: 'review'
            },
            {
                id: 'sx-pro-elite-unbox',
                title: 'Unboxing TUNECORE SX Pro Elite',
                description: 'Khui hộp và first impression về sản phẩm',
                url: '/videos/futuristic-background-2022-08-04-19-57-56-utc.mp4',
                type: 'unboxing'
            }
        ],
        
        specifications: {
            driver: 'Custom 50mm Neodymium Drivers',
            frequencyResponse: '10Hz - 40kHz',
            impedance: '32Ω ± 15%',
            sensitivity: '108dB ± 3dB',
            maxPower: '100mW',
            cable: '2m braided cable + 1.5m extension',
            weight: '350g',
            dimensions: '200 x 180 x 95mm',
            connector: '3.5mm + USB-C',
            compatibility: ['PC', 'PS5', 'Xbox Series', 'Nintendo Switch', 'Mobile']
        },
        
        features: [
            {
                id: 'noise-cancelling',
                title: 'Active Noise Cancelling',
                subtitle: 'Công nghệ chống ồn chủ động',
                description: 'Loại bỏ hoàn toàn tiếng ồn môi trường, cho phép tập trung 100% vào game',
                icon: '🔇'
            },
            {
                id: 'surround-sound',
                title: '7.1 Virtual Surround',
                subtitle: 'Âm thanh vòm ảo 7.1',
                description: 'Định vị chính xác âm thanh trong game, tạo lợi thế chiến thuật',
                icon: '🎵'
            },
            {
                id: 'custom-eq',
                title: 'Custom EQ Profiles',
                subtitle: 'Tùy chỉnh âm thanh cá nhân',
                description: 'Nhiều profile âm thanh được điều chỉnh cho từng thể loại game',
                icon: '🎛️'
            },
            {
                id: 'comfort-design',
                title: 'Ultra Comfort Design',
                subtitle: 'Thiết kế siêu thoải mái',
                description: 'Đệm tai memory foam và headband có thể điều chỉnh cho phiên gaming dài',
                icon: '😌'
            }
        ],
        
        availability: {
            status: 'available',
            estimatedDelivery: '3-5 ngày làm việc'
        },
        
        warranty: {
            period: '24 tháng',
            coverage: [
                'Lỗi kỹ thuật từ nhà sản xuất',
                'Hỏng hóc trong quá trình sử dụng bình thường',
                'Miễn phí thay thế linh kiện'
            ],
            conditions: [
                'Bảo quản theo hướng dẫn',
                'Không tự ý sửa chữa',
                'Có hóa đơn mua hàng'
            ],
            excludes: [
                'Hỏng hóc do rơi vỡ, va đập',
                'Hư hại do nước, chất lỏng',
                'Hao mòn tự nhiên'
            ],
            registrationRequired: true
        },
        
        highlights: [
            'Driver custom 50mm cho âm bass sâu',
            'Công nghệ Active Noise Cancelling',
            'Microphone có thể tháo rời',
            'RGB LED đồng bộ',
            'Software tùy chỉnh chuyên nghiệp'
        ],
        
        targetAudience: ['Professional Gamers', 'Esports Athletes', 'Content Creators'],
        useCases: ['Competitive Gaming', 'Streaming', 'Content Creation', 'Music Production'],
        
        popularity: 95,
        rating: 4.8,
        reviewCount: 234,
        tags: ['premium', 'noise-cancelling', 'wireless', 'rgb', 'professional'],
        sku: 'TC-SX-PRO-ELITE-001',
        
        relatedProductIds: ['sx-wireless-pro', 's-gaming-master'],
        accessories: ['stand', 'carry-case', 'extra-cable'],
        
        seoTitle: 'TUNECORE SX Pro Elite - Tai nghe gaming chuyên nghiệp',
        seoDescription: 'Tai nghe gaming cao cấp với driver 50mm, Active Noise Cancelling và âm thanh vòm 7.1. Dành cho game thủ chuyên nghiệp.',
        
        createdAt: '2024-01-15T00:00:00Z',
        updatedAt: '2024-01-20T00:00:00Z',
        publishedAt: '2024-01-15T00:00:00Z'
    },
    
    {
        id: 'sx-wireless-pro',
        name: 'TUNECORE SX Wireless Pro',
        subtitle: 'Wireless Gaming Excellence',
        description: 'Tai nghe gaming không dây với độ trễ cực thấp và pin 30 giờ',
        longDescription: 'TUNECORE SX Wireless Pro mang đến sự tự do hoàn toàn với công nghệ không dây tiên tiến. Độ trễ siêu thấp dưới 1ms và thời lượng pin lên đến 30 giờ.',
        series: productSeries[0],
        category: productCategories[1],
        
        images: [
            {
                id: 'sx-wireless-main',
                url: '/products/product1.png',
                alt: 'TUNECORE SX Wireless Pro - Main View',
                type: 'main',
                order: 1
            }
        ],
        
        videos: [
            {
                id: 'sx-wireless-review',
                title: 'Đánh giá TUNECORE SX Wireless Pro',
                description: 'Test độ trễ và chất lượng âm thanh không dây',
                url: '/videos/futuristic-background-2022-08-04-19-57-56-utc.mp4',
                type: 'review'
            }
        ],
        
        specifications: {
            driver: 'Custom 40mm Drivers',
            frequencyResponse: '20Hz - 20kHz',
            impedance: '32Ω',
            sensitivity: '105dB',
            maxPower: '50mW',
            cable: 'USB-C charging cable',
            weight: '280g',
            dimensions: '190 x 170 x 85mm',
            connector: '2.4GHz Wireless + Bluetooth 5.2',
            compatibility: ['PC', 'PS5', 'Xbox Series', 'Mobile', 'Nintendo Switch']
        },
        
        features: [
            {
                id: 'low-latency',
                title: 'Ultra Low Latency',
                subtitle: 'Độ trễ siêu thấp < 1ms',
                description: 'Công nghệ không dây 2.4GHz cho độ trễ tối thiểu',
                icon: '⚡'
            },
            {
                id: 'long-battery',
                title: '30H Battery Life',
                subtitle: 'Pin 30 giờ liên tục',
                description: 'Chơi game suốt ngày đêm không lo hết pin',
                icon: '🔋'
            }
        ],
        
        availability: {
            status: 'available',
            estimatedDelivery: '2-4 ngày làm việc'
        },
        
        warranty: {
            period: '24 tháng',
            coverage: ['Lỗi kỹ thuật', 'Pin và sạc'],
            conditions: ['Sử dụng đúng cách'],
            excludes: ['Hỏng do rơi vỡ'],
            registrationRequired: true
        },
        
        highlights: [
            'Không dây 2.4GHz độ trễ thấp',
            'Pin 30 giờ',
            'Bluetooth dual connection',
            'Quick charge 15 phút = 3 giờ'
        ],
        
        targetAudience: ['Gamers', 'Mobile Gamers'],
        useCases: ['Gaming', 'Music', 'Calls'],
        
        popularity: 88,
        rating: 4.6,
        reviewCount: 156,
        tags: ['wireless', 'low-latency', 'long-battery'],
        sku: 'TC-SX-WIRELESS-PRO-002',
        
        relatedProductIds: ['sx-pro-elite'],
        accessories: ['charging-stand', 'travel-case'],
        
        createdAt: '2024-01-10T00:00:00Z',
        updatedAt: '2024-01-18T00:00:00Z',
        publishedAt: '2024-01-10T00:00:00Z'
    },

    // S SERIES Products
    {
        id: 's-gaming-master',
        name: 'TUNECORE S Gaming Master',
        subtitle: 'Professional Gaming Audio',
        description: 'Tai nghe gaming chuyên nghiệp với âm thanh Hi-Res và microphone chống ồn',
        longDescription: 'TUNECORE S Gaming Master được thiết kế cho những game thủ đòi hỏi chất lượng âm thanh tuyệt đối. Với chứng nhận Hi-Res Audio và microphone chống ồn AI.',
        series: productSeries[1],
        category: productCategories[0],
        
        images: [
            {
                id: 's-gaming-main',
                url: '/products/product1.png',
                alt: 'TUNECORE S Gaming Master - Main View',
                type: 'main',
                order: 1
            }
        ],
        
        videos: [
            {
                id: 's-gaming-review',
                title: 'Review TUNECORE S Gaming Master',
                description: 'Test chất lượng âm thanh Hi-Res trong gaming',
                url: '/videos/futuristic-background-2022-08-04-19-57-56-utc.mp4',
                type: 'review'
            }
        ],
        
        specifications: {
            driver: 'Hi-Res 50mm Drivers',
            frequencyResponse: '10Hz - 40kHz',
            impedance: '32Ω',
            sensitivity: '110dB',
            maxPower: '80mW',
            cable: '2m detachable cable',
            weight: '320g',
            dimensions: '195 x 175 x 90mm',
            connector: '3.5mm + USB',
            compatibility: ['PC', 'PS5', 'Xbox', 'Mobile']
        },
        
        features: [
            {
                id: 'hi-res-audio',
                title: 'Hi-Res Audio Certified',
                subtitle: 'Chứng nhận Hi-Res Audio',
                description: 'Chất lượng âm thanh studio trong gaming',
                icon: '🎧'
            },
            {
                id: 'ai-noise-cancelling-mic',
                title: 'AI Noise Cancelling Mic',
                subtitle: 'Micro chống ồn AI',
                description: 'Loại bỏ hoàn toàn tiếng ồn nền khi giao tiếp',
                icon: '🎤'
            }
        ],
        
        availability: {
            status: 'available',
            estimatedDelivery: '1-3 ngày làm việc'
        },
        
        warranty: {
            period: '18 tháng',
            coverage: ['Lỗi kỹ thuật', 'Driver âm thanh'],
            conditions: ['Đăng ký bảo hành'],
            excludes: ['Hao mòn đệm tai'],
            registrationRequired: true
        },
        
        highlights: [
            'Hi-Res Audio certification',
            'AI-powered noise cancelling mic',
            'Detachable microphone',
            'Custom sound profiles'
        ],
        
        targetAudience: ['Professional Gamers', 'Content Creators'],
        useCases: ['Competitive Gaming', 'Streaming'],
        
        popularity: 85,
        rating: 4.7,
        reviewCount: 198,
        tags: ['hi-res', 'professional', 'ai-mic'],
        sku: 'TC-S-GAMING-MASTER-003',
        
        relatedProductIds: ['sx-pro-elite', 's-studio-pro'],
        accessories: ['mic-windscreen', 'cable-set'],
        
        createdAt: '2024-01-12T00:00:00Z',
        updatedAt: '2024-01-19T00:00:00Z',
        publishedAt: '2024-01-12T00:00:00Z'
    },

    // G SERIES Products  
    {
        id: 'g-esports-edition',
        name: 'TUNECORE G Esports Edition',
        subtitle: 'Competitive Gaming Headset',
        description: 'Tai nghe gaming được thiết kế riêng cho esports với độ chính xác âm thanh cao',
        longDescription: 'TUNECORE G Esports Edition được phát triển với sự hợp tác của các đội tuyển esports hàng đầu. Tối ưu hóa cho competitive gaming.',
        series: productSeries[2],
        category: productCategories[0],
        
        images: [
            {
                id: 'g-esports-main',
                url: '/products/product1.png',
                alt: 'TUNECORE G Esports Edition - Main View',
                type: 'main',
                order: 1
            }
        ],
        
        videos: [
            {
                id: 'g-esports-review',
                title: 'TUNECORE G Esports Edition trong competitive',
                description: 'Test trong môi trường thi đấu thực tế',
                url: '/videos/futuristic-background-2022-08-04-19-57-56-utc.mp4',
                type: 'demo'
            }
        ],
        
        specifications: {
            driver: 'Precision 40mm Drivers',
            frequencyResponse: '15Hz - 25kHz',
            impedance: '32Ω',
            sensitivity: '103dB',
            maxPower: '60mW',
            cable: '1.5m fixed cable',
            weight: '250g',
            dimensions: '185 x 165 x 80mm',
            connector: '3.5mm',
            compatibility: ['PC', 'Console', 'Mobile']
        },
        
        features: [
            {
                id: 'competitive-tuning',
                title: 'Competitive Audio Tuning',
                subtitle: 'Điều chỉnh âm thanh cho thi đấu',
                description: 'Tối ưu hóa để nghe rõ footsteps và gunshots',
                icon: '🎯'
            },
            {
                id: 'lightweight',
                title: 'Ultra Lightweight',
                subtitle: 'Siêu nhẹ 250g',
                description: 'Thoải mái trong các trận đấu dài',
                icon: '🪶'
            }
        ],
        
        availability: {
            status: 'available',
            estimatedDelivery: '1-2 ngày làm việc'
        },
        
        warranty: {
            period: '12 tháng',
            coverage: ['Lỗi kỹ thuật cơ bản'],
            conditions: ['Hóa đơn mua hàng'],
            excludes: ['Hao mòn thường'],
            registrationRequired: false
        },
        
        highlights: [
            'Optimized for competitive gaming',
            'Ultra lightweight design',
            'Precision audio positioning',
            'Esports team endorsed'
        ],
        
        targetAudience: ['Esports Players', 'Competitive Gamers'],
        useCases: ['Competitive Gaming', 'Tournaments'],
        
        popularity: 78,
        rating: 4.5,
        reviewCount: 124,
        tags: ['esports', 'competitive', 'lightweight'],
        sku: 'TC-G-ESPORTS-004',
        
        relatedProductIds: ['g-rgb-gaming'],
        accessories: ['tournament-case'],
        
        createdAt: '2024-01-08T00:00:00Z',
        updatedAt: '2024-01-16T00:00:00Z',
        publishedAt: '2024-01-08T00:00:00Z'
    },

    // G+ SERIES Products
    {
        id: 'g-plus-ultimate',
        name: 'TUNECORE G+ Ultimate',
        subtitle: 'The Ultimate Gaming Experience',
        description: 'Đỉnh cao công nghệ gaming audio với haptic feedback và spatial audio',
        longDescription: 'TUNECORE G+ Ultimate là sự kết hợp hoàn hảo giữa âm thanh, haptic feedback và spatial audio, mang đến trải nghiệm gaming không giới hạn.',
        series: productSeries[3],
        category: productCategories[3],
        
        images: [
            {
                id: 'g-plus-ultimate-main',
                url: '/products/product1.png',
                alt: 'TUNECORE G+ Ultimate - Main View',
                type: 'main',
                order: 1
            }
        ],
        
        videos: [
            {
                id: 'g-plus-ultimate-demo',
                title: 'TUNECORE G+ Ultimate - Haptic Experience',
                description: 'Trải nghiệm haptic feedback trong gaming',
                url: '/videos/futuristic-background-2022-08-04-19-57-56-utc.mp4',
                type: 'demo'
            }
        ],
        
        specifications: {
            driver: 'Planar Magnetic 60mm + Haptic Drivers',
            frequencyResponse: '5Hz - 50kHz',
            impedance: '25Ω',
            sensitivity: '115dB',
            maxPower: '150mW',
            cable: '3m braided cable + wireless module',
            weight: '420g',
            dimensions: '210 x 190 x 100mm',
            connector: 'USB-C + Wireless + 3.5mm',
            compatibility: ['PC', 'PS5', 'Xbox Series', 'VR Systems']
        },
        
        features: [
            {
                id: 'haptic-feedback',
                title: 'Haptic Feedback System',
                subtitle: 'Hệ thống phản hồi xúc giác',
                description: 'Cảm nhận từng rung động trong game',
                icon: '📳'
            },
            {
                id: 'spatial-audio',
                title: '3D Spatial Audio',
                subtitle: 'Âm thanh không gian 3D',
                description: 'Định vị chính xác 360 độ trong không gian',
                icon: '🌐'
            },
            {
                id: 'planar-magnetic',
                title: 'Planar Magnetic Drivers',
                subtitle: 'Driver Planar Magnetic',
                description: 'Chất lượng âm thanh audiophile',
                icon: '🎛️'
            }
        ],
        
        availability: {
            status: 'pre-order',
            releaseDate: '2024-03-01',
            estimatedDelivery: 'Q1 2024'
        },
        
        warranty: {
            period: '36 tháng',
            coverage: [
                'Toàn bộ linh kiện điện tử',
                'Haptic feedback system',
                'Wireless module',
                'Software support'
            ],
            conditions: [
                'Đăng ký bảo hành online',
                'Firmware updates'
            ],
            excludes: ['Physical damage'],
            registrationRequired: true
        },
        
        highlights: [
            'Revolutionary haptic feedback',
            'Planar magnetic drivers',
            '3D spatial audio technology',
            'Premium build quality',
            'VR gaming optimized'
        ],
        
        targetAudience: ['Audiophiles', 'VR Enthusiasts', 'Premium Gamers'],
        useCases: ['VR Gaming', 'Immersive Gaming', 'Audio Production'],
        
        popularity: 92,
        rating: 4.9,
        reviewCount: 87,
        tags: ['premium', 'haptic', 'spatial-audio', 'planar-magnetic', 'vr'],
        sku: 'TC-GPLUS-ULTIMATE-005',
        
        relatedProductIds: ['sx-pro-elite'],
        accessories: ['premium-stand', 'vr-adapter', 'travel-case'],
        
        seoTitle: 'TUNECORE G+ Ultimate - Tai nghe gaming cao cấp nhất',
        seoDescription: 'Tai nghe gaming đỉnh cao với haptic feedback, spatial audio và driver planar magnetic. Trải nghiệm gaming không giới hạn.',
        
        createdAt: '2024-01-20T00:00:00Z',
        updatedAt: '2024-01-25T00:00:00Z',
        publishedAt: '2024-02-01T00:00:00Z'
    }
];

// Helper functions
export const getProductById = (id: string): Product | undefined => {
    return products.find(product => product.id === id);
};

export const getProductsBySeries = (seriesId: string): Product[] => {
    return products.filter(product => product.series.id === seriesId);
};

export const getProductsByCategory = (categoryId: string): Product[] => {
    return products.filter(product => product.category.id === categoryId);
};

export const getFeaturedProducts = (): Product[] => {
    return products
        .filter(product => product.popularity >= 85)
        .sort((a, b) => b.popularity - a.popularity);
};

export const getRelatedProducts = (productId: string): Product[] => {
    const product = getProductById(productId);
    if (!product) return [];
    
    return products.filter(p => 
        product.relatedProductIds.includes(p.id) || 
        (p.series.id === product.series.id && p.id !== productId)
    ).slice(0, 4);
};

export const searchProducts = (query: string): Product[] => {
    const searchTerm = query.toLowerCase();
    return products.filter(product =>
        product.name.toLowerCase().includes(searchTerm) ||
        product.description.toLowerCase().includes(searchTerm) ||
        product.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
};

// Export counts for UI
export const TOTAL_PRODUCTS = products.length;
export const SERIES_COUNT = productSeries.length;
export const CATEGORY_COUNT = productCategories.length;