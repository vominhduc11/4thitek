import { Product, ProductCategory } from '@/types/product';

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

// Individual Product SKUs - No Series Concept
export const products: Product[] = [
    // Premium Gaming Headsets
    {
        id: 'sx-pro-elite',
        name: 'TUNECORE SX Pro Elite',
        subtitle: 'Professional Gaming Headset',
        description: 'Tai nghe gaming cao cấp với driver 50mm và công nghệ noise cancelling tiên tiến',
        longDescription:
            'TUNECORE SX Pro Elite là đỉnh cao của công nghệ âm thanh gaming, được thiết kế dành riêng cho các game thủ chuyên nghiệp và những người đam mê esports. Với driver custom 50mm và công nghệ noise cancelling chủ động, SX Pro Elite mang đến trải nghiệm âm thanh immersive tuyệt đối.',
        category: productCategories[0], // Gaming Headsets

        images: [
            {
                id: 'sx-pro-elite-main',
                url: '/products/sx-pro-elite/main.jpg',
                alt: 'TUNECORE SX Pro Elite Gaming Headset',
                type: 'main',
                order: 1
            },
            {
                id: 'sx-pro-elite-side',
                url: '/products/sx-pro-elite/side.jpg',
                alt: 'SX Pro Elite Side View',
                type: 'angle',
                order: 2
            }
        ],

        videos: [
            {
                id: 'sx-pro-elite-review',
                title: 'SX Pro Elite Review',
                description: 'Đánh giá chi tiết TUNECORE SX Pro Elite',
                url: '/videos/sx-pro-elite-review.mp4',
                thumbnail: '/videos/thumbnails/sx-pro-elite-review.jpg',
                type: 'review'
            }
        ],

        specifications: {
            driver: '50mm Dynamic Driver',
            frequencyResponse: '20Hz - 20kHz',
            impedance: '32Ω',
            sensitivity: '110dB',
            maxPower: '50mW',
            cable: '2m Detachable Cable',
            weight: '350g',
            dimensions: '200 x 180 x 95mm',
            connector: '3.5mm + USB',
            compatibility: ['PC', 'PS5', 'Xbox Series X/S', 'Nintendo Switch', 'Mobile']
        },

        features: [
            {
                id: 'anc-technology',
                title: 'Công nghệ Khử ồn Chủ động (ANC)',
                subtitle: 'Tập trung vào âm thanh chính',
                description:
                    'Công nghệ ANC cao cấp loại bỏ tối đa tạp âm xung quanh, giúp bạn tận hưởng âm thanh trung thực và tập trung tuyệt đối.'
            },
            {
                id: 'surround-sound',
                title: 'Âm thanh Vòm 7.1 (Surround 7.1)',
                subtitle: 'Định vị âm thanh chính xác',
                description:
                    'Hệ thống âm thanh vòm mô phỏng 7.1 kênh, tái tạo môi trường âm thanh sống động trong game, dễ dàng xác định hướng âm thanh.'
            },
            {
                id: 'rgb-lighting',
                title: 'Đèn LED RGB Động',
                subtitle: 'Hệ màu sắc 16,7 triệu',
                description:
                    'Công nghệ chiếu sáng RGB đẳng cấp với 16,7 triệu màu có thể tùy chỉnh đa hiệu ứng, phản ánh phong cách riêng.'
            }
        ],

        availability: {
            status: 'available',
            releaseDate: '2024-01-15T00:00:00Z'
        },

        warranty: {
            period: '24 tháng',
            coverage: ['Lỗi sản xuất', 'Driver bị hỏng', 'Kết nối không ổn định'],
            conditions: ['Sử dụng đúng cách', 'Không tháo máy', 'Có hóa đơn mua hàng'],
            excludes: ['Hỏng do nước', 'Rơi vỡ', 'Hao mòn tự nhiên'],
            registrationRequired: true
        },

        highlights: [
            'Driver custom 50mm chất lượng cao',
            'Công nghệ ANC tiên tiến',
            '7.1 Virtual Surround Sound',
            'RGB Lighting 16.7M màu',
            'Tương thích đa nền tảng'
        ],

        targetAudience: ['Professional Gamers', 'Esports Athletes', 'Content Creators'],
        useCases: ['Gaming cạnh tranh', 'Streaming', 'Recording'],

        popularity: 95,
        rating: 4.8,
        reviewCount: 1250,
        tags: ['gaming', 'premium', 'anc', 'rgb', 'professional'],
        sku: 'SX-PRO-ELITE-001',

        relatedProductIds: ['sx-wireless-pro', 'g-plus-ultimate'],
        accessories: ['replacement-cushions', 'carrying-case'],

        seoTitle: 'TUNECORE SX Pro Elite - Gaming Headset Cao Cấp | 4THITEK',
        seoDescription:
            'TUNECORE SX Pro Elite gaming headset premium với ANC, 7.1 surround, RGB lighting. Chính hãng bảo hành 24 tháng.',

        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T00:00:00Z',
        publishedAt: '2024-01-15T00:00:00Z'
    },

    {
        id: 'sx-wireless-pro',
        name: 'TUNECORE SX Wireless Pro',
        subtitle: 'Wireless Gaming Headset',
        description: 'Tai nghe gaming không dây với độ trễ thấp và pin 30 giờ',
        longDescription:
            'SX Wireless Pro mang đến sự tự do hoàn toàn với công nghệ không dây 2.4GHz độ trễ thấp. Pin lithium-ion cao cấp cho thời gian sử dụng lên đến 30 giờ liên tục.',
        category: productCategories[1], // Wireless Headsets

        images: [
            {
                id: 'sx-wireless-main',
                url: '/products/sx-wireless/main.jpg',
                alt: 'TUNECORE SX Wireless Pro',
                type: 'main',
                order: 1
            }
        ],

        videos: [],

        specifications: {
            driver: '40mm Dynamic Driver',
            frequencyResponse: '20Hz - 20kHz',
            impedance: '32Ω',
            sensitivity: '105dB',
            maxPower: '30mW',
            cable: 'USB-C Charging Cable',
            weight: '280g',
            dimensions: '190 x 170 x 85mm',
            connector: '2.4GHz Wireless + Bluetooth 5.0',
            compatibility: ['PC', 'PS5', 'Mobile', 'Tablet']
        },

        features: [
            {
                id: 'low-latency',
                title: 'Low Latency 2.4GHz',
                subtitle: 'Độ trễ thấp < 20ms',
                description: 'Kết nối không dây siêu nhanh cho gaming'
            },
            {
                id: 'long-battery',
                title: '30H Battery Life',
                subtitle: 'Pin 30 giờ liên tục',
                description: 'Chơi game cả ngày không lo hết pin'
            }
        ],

        availability: {
            status: 'available'
        },

        warranty: {
            period: '24 tháng',
            coverage: ['Lỗi sản xuất', 'Pin chai', 'Kết nối không ổn định'],
            conditions: ['Sử dụng đúng cách', 'Không tháo máy', 'Có hóa đơn mua hàng'],
            excludes: ['Hỏng do nước', 'Rơi vỡ', 'Hao mòn tự nhiên'],
            registrationRequired: true
        },

        highlights: [
            'Không dây 2.4GHz độ trễ thấp',
            'Pin 30 giờ sử dụng',
            'Bluetooth 5.0 đa kết nối',
            'Sạc nhanh USB-C'
        ],

        targetAudience: ['Gamers', 'Mobile Gamers', 'Casual Users'],
        useCases: ['Gaming', 'Music', 'Video Call'],

        popularity: 85,
        rating: 4.6,
        reviewCount: 850,
        tags: ['wireless', 'gaming', 'long-battery', 'bluetooth'],
        sku: 'SX-WIRELESS-PRO-001',

        relatedProductIds: ['sx-pro-elite', 'g-plus-ultimate'],
        accessories: ['wireless-dongle', 'carrying-case'],

        seoTitle: 'TUNECORE SX Wireless Pro - Tai Nghe Gaming Không Dây | 4THITEK',
        seoDescription: 'SX Wireless Pro gaming headset không dây với pin 30h, độ trễ thấp. Tương thích đa nền tảng.',

        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-10T00:00:00Z',
        publishedAt: '2024-01-10T00:00:00Z'
    },

    // Mid-range Products
    {
        id: 'g-plus-ultimate',
        name: 'TUNECORE G+ Ultimate',
        subtitle: 'Advanced Gaming Audio',
        description: 'Tai nghe gaming cao cấp với công nghệ planar magnetic',
        longDescription:
            'G+ Ultimate sử dụng công nghệ planar magnetic tiên tiến, mang đến chất lượng âm thanh audiophile trong gaming. Thiết kế ergonomic và vật liệu cao cấp.',
        category: productCategories[0], // Gaming Headsets

        images: [
            {
                id: 'g-plus-main',
                url: '/products/g-plus/main.jpg',
                alt: 'TUNECORE G+ Ultimate',
                type: 'main',
                order: 1
            }
        ],

        videos: [],

        specifications: {
            driver: 'Planar Magnetic 50mm',
            frequencyResponse: '10Hz - 50kHz',
            impedance: '60Ω',
            sensitivity: '100dB',
            maxPower: '100mW',
            cable: '3m Oxygen-Free Copper Cable',
            weight: '420g',
            dimensions: '210 x 190 x 100mm',
            connector: '3.5mm + 6.3mm Adapter',
            compatibility: ['PC', 'Audio Interface', 'High-end Gaming Setup']
        },

        features: [
            {
                id: 'planar-magnetic',
                title: 'Planar Magnetic Drivers',
                subtitle: 'Driver planar magnetic 50mm',
                description: 'Công nghệ driver tiên tiến cho âm thanh chi tiết'
            },
            {
                id: 'open-back',
                title: 'Open-Back Design',
                subtitle: 'Thiết kế mở tự nhiên',
                description: 'Soundstage rộng và âm thanh tự nhiên'
            }
        ],

        availability: {
            status: 'available'
        },

        warranty: {
            period: '36 tháng',
            coverage: ['Lỗi sản xuất', 'Driver bị hỏng'],
            conditions: ['Sử dụng đúng cách', 'Có hóa đơn mua hàng'],
            excludes: ['Hỏng do nước', 'Rơi vỡ'],
            registrationRequired: true
        },

        highlights: [
            'Planar Magnetic 50mm drivers',
            'Open-back design tự nhiên',
            'Hi-Res Audio certified',
            'Vật liệu cao cấp',
            'Bảo hành 3 năm'
        ],

        targetAudience: ['Audiophiles', 'Pro Gamers', 'Audio Engineers'],
        useCases: ['High-end Gaming', 'Music Production', 'Critical Listening'],

        popularity: 90,
        rating: 4.9,
        reviewCount: 650,
        tags: ['ultimate', 'planar-magnetic', 'audiophile', 'open-back'],
        sku: 'G-PLUS-ULTIMATE-001',

        relatedProductIds: ['sx-pro-elite', 'professional-studio'],
        accessories: ['premium-cable', 'stand'],

        seoTitle: 'TUNECORE G+ Ultimate - Tai Nghe Planar Magnetic | 4THITEK',
        seoDescription: 'G+ Ultimate với driver planar magnetic, Hi-Res Audio, thiết kế open-back cho audiophiles.',

        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-05T00:00:00Z',
        publishedAt: '2024-01-05T00:00:00Z'
    },

    // Entry Level Products
    {
        id: 'g-essential',
        name: 'TUNECORE G Essential',
        subtitle: 'Entry Gaming Headset',
        description: 'Tai nghe gaming entry-level với chất lượng âm thanh tốt',
        longDescription:
            'G Essential mang đến trải nghiệm gaming tuyệt vời với mức giá phải chăng. Thiết kế nhẹ, thoải mái cho sử dụng lâu dài.',
        category: productCategories[0], // Gaming Headsets

        images: [
            {
                id: 'g-essential-main',
                url: '/products/g-essential/main.jpg',
                alt: 'TUNECORE G Essential',
                type: 'main',
                order: 1
            }
        ],

        videos: [],

        specifications: {
            driver: '40mm Dynamic Driver',
            frequencyResponse: '20Hz - 20kHz',
            impedance: '32Ω',
            sensitivity: '108dB',
            maxPower: '30mW',
            cable: '1.5m Fixed Cable',
            weight: '250g',
            dimensions: '180 x 160 x 80mm',
            connector: '3.5mm',
            compatibility: ['PC', 'Mobile', 'Console']
        },

        features: [
            {
                id: 'lightweight',
                title: 'Lightweight Design',
                subtitle: 'Thiết kế nhẹ 250g',
                description: 'Thoải mái cho sử dụng lâu dài'
            },
            {
                id: 'clear-mic',
                title: 'Clear Microphone',
                subtitle: 'Micro chất lượng cao',
                description: 'Giao tiếp rõ ràng trong game'
            }
        ],

        availability: {
            status: 'available'
        },

        warranty: {
            period: '12 tháng',
            coverage: ['Lỗi sản xuất'],
            conditions: ['Sử dụng đúng cách', 'Có hóa đơn mua hàng'],
            excludes: ['Hỏng do nước', 'Rơi vỡ', 'Hao mòn tự nhiên'],
            registrationRequired: false
        },

        highlights: ['Giá cả phải chăng', 'Thiết kế nhẹ thoải mái', 'Âm thanh rõ ràng', 'Tương thích đa nền tảng'],

        targetAudience: ['Budget Gamers', 'Students', 'Casual Users'],
        useCases: ['Casual Gaming', 'Online Learning', 'Video Call'],

        popularity: 70,
        rating: 4.3,
        reviewCount: 420,
        tags: ['entry', 'budget', 'lightweight', 'basic'],
        sku: 'G-ESSENTIAL-001',

        relatedProductIds: ['sx-wireless-pro', 'g-plus-ultimate'],
        accessories: ['replacement-cushions'],

        seoTitle: 'TUNECORE G Essential - Tai Nghe Gaming Giá Rẻ | 4THITEK',
        seoDescription:
            'G Essential gaming headset entry-level, chất lượng tốt, giá phải chăng cho game thủ mới bắt đầu.',

        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z',
        publishedAt: '2024-01-03T00:00:00Z'
    },

    // Professional Audio
    {
        id: 'professional-studio',
        name: 'TUNECORE Professional Studio',
        subtitle: 'Studio Reference Headphones',
        description: 'Tai nghe monitor studio chuyên nghiệp cho mixing và mastering',
        longDescription:
            'Professional Studio được thiết kế dành riêng cho các kỹ sư âm thanh và nhà sản xuất nhạc. Với khả năng tái tạo âm thanh trung thực tuyệt đối.',
        category: productCategories[3], // Professional Audio

        images: [
            {
                id: 'professional-main',
                url: '/products/professional/main.jpg',
                alt: 'TUNECORE Professional Studio',
                type: 'main',
                order: 1
            }
        ],

        videos: [],

        specifications: {
            driver: '45mm Studio Monitor Driver',
            frequencyResponse: '5Hz - 40kHz',
            impedance: '250Ω',
            sensitivity: '96dB',
            maxPower: '200mW',
            cable: '3m Coiled Professional Cable',
            weight: '380g',
            dimensions: '200 x 185 x 95mm',
            connector: '3.5mm + 6.3mm + XLR',
            compatibility: ['Audio Interface', 'Mixing Console', 'Studio Equipment']
        },

        features: [
            {
                id: 'flat-response',
                title: 'Flat Frequency Response',
                subtitle: 'Đáp ứng tần số phẳng',
                description: 'Tái tạo âm thanh trung thực cho mixing'
            },
            {
                id: 'comfort-design',
                title: 'Extended Comfort',
                subtitle: 'Thiết kế thoải mái lâu dài',
                description: 'Sử dụng liên tục 8+ giờ không mệt mỏi'
            }
        ],

        availability: {
            status: 'available'
        },

        warranty: {
            period: '36 tháng',
            coverage: ['Lỗi sản xuất', 'Driver bị hỏng'],
            conditions: ['Sử dụng đúng cách', 'Có hóa đơn mua hàng'],
            excludes: ['Hỏng do nước', 'Rơi vỡ'],
            registrationRequired: true
        },

        highlights: [
            'Studio reference quality',
            'Flat frequency response',
            'Professional build quality',
            'Multiple connector options',
            'Extended wearing comfort'
        ],

        targetAudience: ['Audio Engineers', 'Music Producers', 'Sound Designers'],
        useCases: ['Mixing', 'Mastering', 'Recording', 'Critical Listening'],

        popularity: 88,
        rating: 4.7,
        reviewCount: 320,
        tags: ['professional', 'studio', 'reference', 'monitoring'],
        sku: 'PROF-STUDIO-001',

        relatedProductIds: ['g-plus-ultimate', 'sx-pro-elite'],
        accessories: ['studio-stand', 'replacement-cable'],

        seoTitle: 'TUNECORE Professional Studio - Tai Nghe Monitor Studio | 4THITEK',
        seoDescription: 'Professional Studio reference headphones cho mixing, mastering với flat response.',

        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-08T00:00:00Z',
        publishedAt: '2024-01-08T00:00:00Z'
    },

    {
        id: 'wireless-ultimate',
        name: 'TUNECORE Wireless Ultimate',
        subtitle: 'Premium Wireless Audio',
        description: 'Tai nghe không dây premium với ANC và Hi-Res Audio',
        longDescription:
            'Wireless Ultimate kết hợp công nghệ không dây tiên tiến với chất lượng âm thanh Hi-Res, mang đến trải nghiệm âm nhạc hoàn hảo.',
        category: productCategories[1], // Wireless Headsets

        images: [
            {
                id: 'wireless-ultimate-main',
                url: '/products/wireless-ultimate/main.jpg',
                alt: 'TUNECORE Wireless Ultimate',
                type: 'main',
                order: 1
            }
        ],

        videos: [],

        specifications: {
            driver: '40mm Hi-Res Driver',
            frequencyResponse: '20Hz - 40kHz',
            impedance: '32Ω',
            sensitivity: '110dB',
            maxPower: '40mW',
            cable: 'USB-C Fast Charging',
            weight: '320g',
            dimensions: '195 x 175 x 90mm',
            connector: 'Bluetooth 5.2 + LDAC',
            compatibility: ['Android', 'iOS', 'PC', 'Hi-Res Players']
        },

        features: [
            {
                id: 'adaptive-anc',
                title: 'Adaptive ANC',
                subtitle: 'Khử tiếng ồn thích ứng',
                description: 'Tự động điều chỉnh theo môi trường'
            },
            {
                id: 'hi-res-wireless',
                title: 'Hi-Res Wireless',
                subtitle: 'LDAC & aptX HD',
                description: 'Chất lượng âm thanh không dây cao cấp'
            }
        ],

        availability: {
            status: 'available'
        },

        warranty: {
            period: '24 tháng',
            coverage: ['Lỗi sản xuất', 'Pin chai', 'Kết nối không ổn định'],
            conditions: ['Sử dụng đúng cách', 'Không tháo máy', 'Có hóa đơn mua hàng'],
            excludes: ['Hỏng do nước', 'Rơi vỡ', 'Hao mòn tự nhiên'],
            registrationRequired: true
        },

        highlights: [
            'Hi-Res Audio certified',
            'Adaptive Active Noise Cancelling',
            'LDAC & aptX HD support',
            '40-hour battery life',
            'Quick charge 15min = 4h'
        ],

        targetAudience: ['Audiophiles', 'Professionals', 'Travelers'],
        useCases: ['Music Listening', 'Travel', 'Work from Home'],

        popularity: 92,
        rating: 4.8,
        reviewCount: 780,
        tags: ['wireless', 'premium', 'anc', 'hi-res', 'audiophile'],
        sku: 'WIRELESS-ULT-001',

        relatedProductIds: ['sx-wireless-pro', 'professional-studio'],
        accessories: ['carrying-case', 'audio-cable'],

        seoTitle: 'TUNECORE Wireless Ultimate - Tai Nghe Không Dây Hi-Res | 4THITEK',
        seoDescription: 'Wireless Ultimate với ANC, Hi-Res Audio, LDAC support cho audiophiles.',

        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-12T00:00:00Z',
        publishedAt: '2024-01-12T00:00:00Z'
    },

    {
        id: 'sport-wireless',
        name: 'TUNECORE Sport Wireless',
        subtitle: 'Active Lifestyle Headphones',
        description: 'Tai nghe thể thao không dây chống nước IPX7',
        longDescription:
            'Sport Wireless được thiết kế dành cho lối sống năng động với khả năng chống nước IPX7 và thiết kế ergonomic tối ưu.',
        category: productCategories[1], // Wireless Headsets

        images: [
            {
                id: 'sport-wireless-main',
                url: '/products/sport-wireless/main.jpg',
                alt: 'TUNECORE Sport Wireless',
                type: 'main',
                order: 1
            }
        ],

        videos: [],

        specifications: {
            driver: '40mm Dynamic Driver',
            frequencyResponse: '20Hz - 20kHz',
            impedance: '32Ω',
            sensitivity: '105dB',
            maxPower: '30mW',
            cable: 'USB-C Charging Cable',
            weight: '260g',
            dimensions: '185 x 170 x 85mm',
            connector: 'Bluetooth 5.0',
            compatibility: ['Smartphone', 'Tablet', 'Smartwatch', 'Fitness Tracker']
        },

        features: [
            {
                id: 'ipx7-waterproof',
                title: 'IPX7 Waterproof',
                subtitle: 'Chống nước chuẩn IPX7',
                description: 'An toàn với mồ hôi và mưa nhẹ'
            },
            {
                id: 'secure-fit',
                title: 'Secure Sport Fit',
                subtitle: 'Thiết kế ôm sát thể thao',
                description: 'Không bị rơi khi vận động mạnh'
            }
        ],

        availability: {
            status: 'available'
        },

        warranty: {
            period: '18 tháng',
            coverage: ['Lỗi sản xuất', 'Pin chai', 'Lỗi chống nước'],
            conditions: ['Sử dụng đúng cách', 'Có hóa đơn mua hàng'],
            excludes: ['Hỏng do va đập mạnh', 'Hao mòn tự nhiên'],
            registrationRequired: false
        },

        highlights: [
            'IPX7 waterproof rating',
            'Secure sport fit design',
            '25-hour battery life',
            'Quick pair technology',
            'Built-in fitness tracking'
        ],

        targetAudience: ['Athletes', 'Fitness Enthusiasts', 'Active Users'],
        useCases: ['Workout', 'Running', 'Cycling', 'Outdoor Activities'],

        popularity: 75,
        rating: 4.4,
        reviewCount: 560,
        tags: ['sport', 'wireless', 'waterproof', 'fitness', 'active'],
        sku: 'SPORT-WIRELESS-001',

        relatedProductIds: ['sx-wireless-pro', 'wireless-ultimate'],
        accessories: ['sport-case', 'ear-hooks'],

        seoTitle: 'TUNECORE Sport Wireless - Tai Nghe Thể Thao Chống Nước | 4THITEK',
        seoDescription: 'Sport Wireless IPX7 waterproof cho workout, running với thiết kế secure fit.',

        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-14T00:00:00Z',
        publishedAt: '2024-01-14T00:00:00Z'
    },

    {
        id: 'wired-pro',
        name: 'TUNECORE Wired Pro',
        subtitle: 'Professional Wired Headphones',
        description: 'Tai nghe có dây chuyên nghiệp với cable detachable',
        longDescription:
            'Wired Pro mang đến chất lượng âm thanh tuyệt đối với kết nối có dây ổn định, ideal cho studio work và critical listening.',
        category: productCategories[2], // Wired Headsets

        images: [
            {
                id: 'wired-pro-main',
                url: '/products/wired-pro/main.jpg',
                alt: 'TUNECORE Wired Pro',
                type: 'main',
                order: 1
            }
        ],

        videos: [],

        specifications: {
            driver: '50mm Neodymium Driver',
            frequencyResponse: '15Hz - 25kHz',
            impedance: '80Ω',
            sensitivity: '98dB',
            maxPower: '100mW',
            cable: '3m Detachable OFC Cable',
            weight: '340g',
            dimensions: '195 x 180 x 90mm',
            connector: '3.5mm + 6.3mm Adapter',
            compatibility: ['Audio Interface', 'Amplifier', 'PC', 'Mobile']
        },

        features: [
            {
                id: 'detachable-cable',
                title: 'Detachable Cable',
                subtitle: 'Cable rời tiện lợi',
                description: 'Dễ dàng thay thế và bảo trì'
            },
            {
                id: 'wide-soundstage',
                title: 'Wide Soundstage',
                subtitle: 'Soundstage rộng tự nhiên',
                description: 'Imaging chính xác và chi tiết'
            }
        ],

        availability: {
            status: 'available'
        },

        warranty: {
            period: '24 tháng',
            coverage: ['Lỗi sản xuất', 'Driver bị hỏng', 'Lỗi cable'],
            conditions: ['Sử dụng đúng cách', 'Có hóa đơn mua hàng'],
            excludes: ['Hỏng do nước', 'Rơi vỡ', 'Hao mòn cable'],
            registrationRequired: true
        },

        highlights: [
            '50mm neodymium drivers',
            'Detachable OFC cable',
            'Wide natural soundstage',
            'Professional build quality',
            'Multiple connector options'
        ],

        targetAudience: ['Audio Professionals', 'Music Lovers', 'Home Studio Users'],
        useCases: ['Music Production', 'Critical Listening', 'Home Audio'],

        popularity: 82,
        rating: 4.6,
        reviewCount: 440,
        tags: ['wired', 'professional', 'detachable', 'studio', 'audiophile'],
        sku: 'WIRED-PRO-001',

        relatedProductIds: ['professional-studio', 'g-plus-ultimate'],
        accessories: ['replacement-cable', 'adapter-set'],

        seoTitle: 'TUNECORE Wired Pro - Tai Nghe Có Dây Chuyên Nghiệp | 4THITEK',
        seoDescription: 'Wired Pro với driver 50mm, detachable cable cho studio work và audiophiles.',

        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-16T00:00:00Z',
        publishedAt: '2024-01-16T00:00:00Z'
    },

    {
        id: 'compact-wireless',
        name: 'TUNECORE Compact Wireless',
        subtitle: 'Portable Wireless Headphones',
        description: 'Tai nghe không dây compact gọn nhẹ cho di động',
        longDescription:
            'Compact Wireless được thiết kế với tính di động tối đa, gập gọn tiện lợi mà vẫn duy trì chất lượng âm thanh tuyệt vời.',
        category: productCategories[1], // Wireless Headsets

        images: [
            {
                id: 'compact-wireless-main',
                url: '/products/compact-wireless/main.jpg',
                alt: 'TUNECORE Compact Wireless',
                type: 'main',
                order: 1
            }
        ],

        videos: [],

        specifications: {
            driver: '40mm Dynamic Driver',
            frequencyResponse: '20Hz - 20kHz',
            impedance: '32Ω',
            sensitivity: '108dB',
            maxPower: '25mW',
            cable: 'USB-C Charging Cable',
            weight: '220g',
            dimensions: '170 x 150 x 70mm (folded)',
            connector: 'Bluetooth 5.0',
            compatibility: ['Smartphone', 'Tablet', 'Laptop', 'PC']
        },

        features: [
            {
                id: 'foldable-design',
                title: 'Foldable Design',
                subtitle: 'Thiết kế gập gọn',
                description: 'Dễ dàng mang theo mọi lúc mọi nơi'
            },
            {
                id: 'quick-charge',
                title: 'Quick Charge',
                subtitle: 'Sạc nhanh 10 phút = 2 giờ',
                description: 'Không lo gián đoạn khi di chuyển'
            }
        ],

        availability: {
            status: 'available'
        },

        warranty: {
            period: '18 tháng',
            coverage: ['Lỗi sản xuất', 'Pin chai'],
            conditions: ['Sử dụng đúng cách', 'Có hóa đơn mua hàng'],
            excludes: ['Hỏng do nước', 'Rơi vỡ', 'Hao mòn tự nhiên'],
            registrationRequired: false
        },

        highlights: [
            'Ultra-portable foldable design',
            'Quick charge technology',
            '22-hour battery life',
            'Lightweight 220g',
            'Universal compatibility'
        ],

        targetAudience: ['Students', 'Commuters', 'Travelers', 'Casual Users'],
        useCases: ['Commuting', 'Study', 'Travel', 'Daily Use'],

        popularity: 78,
        rating: 4.2,
        reviewCount: 680,
        tags: ['compact', 'portable', 'wireless', 'foldable', 'travel'],
        sku: 'COMPACT-WIRELESS-001',

        relatedProductIds: ['sport-wireless', 'g-essential'],
        accessories: ['travel-case', 'audio-cable'],

        seoTitle: 'TUNECORE Compact Wireless - Tai Nghe Gọn Nhẹ Di Động | 4THITEK',
        seoDescription: 'Compact Wireless foldable design, 22h battery cho commuting và travel.',

        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-18T00:00:00Z',
        publishedAt: '2024-01-18T00:00:00Z'
    },

    {
        id: 'gaming-rgb-elite',
        name: 'TUNECORE Gaming RGB Elite',
        subtitle: 'RGB Gaming Powerhouse',
        description: 'Tai nghe gaming RGB với hiệu ứng ánh sáng 360 độ',
        longDescription:
            'Gaming RGB Elite mang đến trải nghiệm gaming đỉnh cao với hệ thống RGB 360 độ và âm thanh surround 7.1 chân thực.',
        category: productCategories[0], // Gaming Headsets

        images: [
            {
                id: 'gaming-rgb-elite-main',
                url: '/products/gaming-rgb-elite/main.jpg',
                alt: 'TUNECORE Gaming RGB Elite',
                type: 'main',
                order: 1
            }
        ],

        videos: [],

        specifications: {
            driver: '53mm RGB Dynamic Driver',
            frequencyResponse: '20Hz - 20kHz',
            impedance: '32Ω',
            sensitivity: '115dB',
            maxPower: '60mW',
            cable: '2.5m RGB USB Cable',
            weight: '390g',
            dimensions: '210 x 190 x 100mm',
            connector: 'USB + 3.5mm',
            compatibility: ['PC', 'PS5', 'Xbox Series X/S', 'RGB Software']
        },

        features: [
            {
                id: '360-rgb',
                title: '360° RGB Lighting',
                subtitle: 'RGB 360 độ đồng bộ',
                description: 'Hiệu ứng ánh sáng đồng bộ với game'
            },
            {
                id: 'haptic-feedback',
                title: 'Haptic Feedback',
                subtitle: 'Phản hồi xúc giác',
                description: 'Cảm nhận rung động từ game'
            }
        ],

        availability: {
            status: 'available'
        },

        warranty: {
            period: '24 tháng',
            coverage: ['Lỗi sản xuất', 'Driver bị hỏng', 'Lỗi RGB', 'Lỗi haptic'],
            conditions: ['Sử dụng đúng cách', 'Cài đặt software chính thức'],
            excludes: ['Hỏng do nước', 'Rơi vỡ', 'Hao mòn tự nhiên'],
            registrationRequired: true
        },

        highlights: [
            '360° RGB lighting system',
            'Haptic feedback technology',
            '7.1 Virtual Surround Sound',
            'Gaming software integration',
            'Premium build quality'
        ],

        targetAudience: ['RGB Gaming Enthusiasts', 'Streamers', 'Esports Players'],
        useCases: ['RGB Gaming Setup', 'Streaming', 'Competitive Gaming'],

        popularity: 87,
        rating: 4.5,
        reviewCount: 920,
        tags: ['gaming', 'rgb', 'haptic', 'elite', 'streaming'],
        sku: 'GAMING-RGB-ELITE-001',

        relatedProductIds: ['sx-pro-elite', 'sx-wireless-pro'],
        accessories: ['rgb-controller', 'software-license'],

        seoTitle: 'TUNECORE Gaming RGB Elite - Tai Nghe Gaming RGB 360° | 4THITEK',
        seoDescription: 'Gaming RGB Elite với RGB 360°, haptic feedback cho gaming setup đỉnh cao.',

        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-20T00:00:00Z',
        publishedAt: '2024-01-20T00:00:00Z'
    }
];

// Helper functions - updated to work with individual products instead of series
export const getProductById = (id: string): Product | undefined => {
    return products.find((product) => product.id === id);
};

export const getProductsByCategory = (categoryId: string): Product[] => {
    return products.filter((product) => product.category.id === categoryId);
};

export const getRelatedProducts = (productId: string, limit: number = 4): Product[] => {
    const product = getProductById(productId);
    if (!product) return [];

    const related = products.filter(
        (p) => p.id !== productId && (product.relatedProductIds.includes(p.id) || p.category.id === product.category.id)
    );

    return related.slice(0, limit);
};

export const getPopularProducts = (limit: number = 6): Product[] => {
    return products.sort((a, b) => b.popularity - a.popularity).slice(0, limit);
};

export const searchProducts = (query: string): Product[] => {
    const lowercaseQuery = query.toLowerCase();
    return products.filter(
        (product) =>
            product.name.toLowerCase().includes(lowercaseQuery) ||
            product.description.toLowerCase().includes(lowercaseQuery) ||
            product.tags.some((tag) => tag.toLowerCase().includes(lowercaseQuery))
    );
};

// Get available filter options

export const getAvailableCategories = (): ProductCategory[] => {
    return productCategories;
};

export const getAvailableFeatures = (): string[] => {
    const features = new Set<string>();
    products.forEach((product) => {
        product.features.forEach((feature) => {
            features.add(feature.title);
        });
    });
    return Array.from(features);
};

export const getAvailableTargetAudience = (): string[] => {
    const audiences = new Set<string>();
    products.forEach((product) => {
        product.targetAudience.forEach((audience) => {
            audiences.add(audience);
        });
    });
    return Array.from(audiences);
};
