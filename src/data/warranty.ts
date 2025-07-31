import {
    WarrantyPlan,
    ServiceCenter,
    WarrantyProcess,
    WarrantyFAQ,
    WarrantyPolicy,
    WarrantyTerm
} from '@/types/warranty';

// Warranty Terms
export const warrantyTerms: WarrantyTerm[] = [
    // Coverage Terms
    {
        id: 'manufacturing-defects',
        title: 'Lỗi sản xuất',
        description: 'Bảo hành toàn bộ lỗi do quá trình sản xuất và kiểm định chất lượng',
        category: 'coverage',
        priority: 1
    },
    {
        id: 'component-failure',
        title: 'Hỏng hóc linh kiện',
        description: 'Thay thế miễn phí các linh kiện bị hỏng trong quá trình sử dụng bình thường',
        category: 'coverage',
        priority: 2
    },
    {
        id: 'firmware-issues',
        title: 'Lỗi firmware',
        description: 'Cập nhật và sửa lỗi firmware, software đi kèm sản phẩm',
        category: 'coverage',
        priority: 3
    },

    // Condition Terms
    {
        id: 'original-purchase',
        title: 'Hóa đơn mua hàng',
        description: 'Phải có hóa đơn mua hàng hợp lệ từ đại lý ủy quyền',
        category: 'condition',
        priority: 1
    },
    {
        id: 'warranty-registration',
        title: 'Đăng ký bảo hành',
        description: 'Sản phẩm phải được đăng ký bảo hành trong vòng 30 ngày kể từ ngày mua',
        category: 'condition',
        priority: 2
    },
    {
        id: 'proper-usage',
        title: 'Sử dụng đúng cách',
        description: 'Sản phẩm được sử dụng theo hướng dẫn và không bị can thiệp trái phép',
        category: 'condition',
        priority: 3
    },

    // Exclusion Terms
    {
        id: 'physical-damage',
        title: 'Hư hại vật lý',
        description: 'Không bảo hành các hư hại do rơi vỡ, va đập, cháy nổ',
        category: 'exclusion',
        priority: 1
    },
    {
        id: 'liquid-damage',
        title: 'Hư hại do chất lỏng',
        description: 'Không bảo hành hư hại do nước, các chất lỏng khác',
        category: 'exclusion',
        priority: 2
    },
    {
        id: 'natural-wear',
        title: 'Hao mòn tự nhiên',
        description: 'Không bảo hành hao mòn tự nhiên như đệm tai, đệm đầu',
        category: 'exclusion',
        priority: 3
    }
];

// Warranty Plans
export const warrantyPlans: WarrantyPlan[] = [
    {
        id: 'standard-warranty',
        name: 'Bảo hành tiêu chuẩn',
        duration: '12 tháng',
        durationInMonths: 12,
        description: 'Bảo hành cơ bản cho tất cả sản phẩm 4THITEK',
        features: [
            'Sửa chữa miễn phí lỗi kỹ thuật',
            'Thay thế linh kiện bị hỏng',
            'Hỗ trợ kỹ thuật qua hotline',
            'Kiểm tra và vệ sinh sản phẩm'
        ],
        terms: warrantyTerms.filter((term) =>
            [
                'manufacturing-defects',
                'component-failure',
                'original-purchase',
                'proper-usage',
                'physical-damage'
            ].includes(term.id)
        ),
        registrationRequired: false,
        transferable: false,
        serviceLocations: ['Hà Nội', 'TP. Hồ Chí Minh', 'Đà Nẵng'],
        contactInfo: {
            hotline: '1900-4THITEK (1900-484835)',
            email: 'warranty@4thitek.com',
            workingHours: 'T2-T6: 8:00-17:30, T7: 8:00-12:00'
        }
    },
    {
        id: 'premium-warranty',
        name: 'Bảo hành Premium',
        duration: '24 tháng',
        durationInMonths: 24,
        description: 'Bảo hành mở rộng cho dòng sản phẩm cao cấp',
        features: [
            'Tất cả quyền lợi bảo hành tiêu chuẩn',
            'Thời gian bảo hành kéo dài 24 tháng',
            'Hỗ trợ thay thế sản phẩm trong 24h',
            'Vệ sinh và bảo dưỡng định kỳ miễn phí',
            'Hỗ trợ firmware update trọn đời',
            'Tư vấn kỹ thuật chuyên sâu'
        ],
        terms: warrantyTerms,
        registrationRequired: true,
        transferable: true,
        serviceLocations: ['Toàn quốc'],
        contactInfo: {
            hotline: '1900-4THITEK (1900-484835)',
            email: 'premium@4thitek.com',
            workingHours: '24/7 (Hotline), T2-CN: 8:00-20:00 (Service)'
        }
    },
    {
        id: 'ultimate-warranty',
        name: 'Bảo hành Ultimate',
        duration: '36 tháng',
        durationInMonths: 36,
        description: 'Bảo hành toàn diện cho sản phẩm flagship',
        features: [
            'Tất cả quyền lợi bảo hành Premium',
            'Thời gian bảo hành 36 tháng',
            'Thay thế sản phẩm mới 100% nếu sửa >2 lần',
            'Pickup & delivery service miễn phí',
            'Bảo hành quốc tế',
            'Ưu tiên hỗ trợ VIP',
            'Insurance coverage cho accidental damage'
        ],
        terms: warrantyTerms,
        registrationRequired: true,
        transferable: true,
        serviceLocations: ['Toàn cầu'],
        contactInfo: {
            hotline: '1900-4THITEK (1900-484835)',
            email: 'ultimate@4thitek.com',
            workingHours: '24/7 toàn cầu'
        }
    }
];

// Service Centers
export const serviceCenters: ServiceCenter[] = [
    {
        id: 'hanoi-center',
        name: '4THITEK Service Center Hà Nội',
        address: '123 Láng Hạ, Ba Đình',
        city: 'Hà Nội',
        district: 'Ba Đình',
        province: 'Hà Nội',
        phone: '024-3845-6789',
        email: 'hanoi@4thitek.com',
        workingHours: 'T2-T6: 8:00-17:30, T7: 8:00-12:00',
        services: [
            'Bảo hành sản phẩm',
            'Sửa chữa chuyên nghiệp',
            'Tư vấn kỹ thuật',
            'Kiểm tra và vệ sinh',
            'Cập nhật firmware'
        ],
        coordinates: {
            lat: 21.0285,
            lng: 105.8542
        },
        isOfficial: true
    },
    {
        id: 'hcm-center',
        name: '4THITEK Service Center TP.HCM',
        address: '456 Nguyễn Văn Cừ, Quận 5',
        city: 'TP. Hồ Chí Minh',
        district: 'Quận 5',
        province: 'TP. Hồ Chí Minh',
        phone: '028-3123-4567',
        email: 'hcm@4thitek.com',
        workingHours: 'T2-T6: 8:00-17:30, T7: 8:00-16:00',
        services: [
            'Bảo hành sản phẩm',
            'Sửa chữa chuyên nghiệp',
            'Tư vấn kỹ thuật',
            'Training và workshop',
            'Demo sản phẩm mới'
        ],
        coordinates: {
            lat: 10.7769,
            lng: 106.6951
        },
        isOfficial: true
    },
    {
        id: 'danang-center',
        name: '4THITEK Service Center Đà Nẵng',
        address: '789 Lê Duẩn, Hải Châu',
        city: 'Đà Nẵng',
        district: 'Hải Châu',
        province: 'Đà Nẵng',
        phone: '0236-3987-654',
        email: 'danang@4thitek.com',
        workingHours: 'T2-T6: 8:00-17:00, T7: 8:00-12:00',
        services: ['Bảo hành sản phẩm', 'Sửa chữa cơ bản', 'Tư vấn kỹ thuật', 'Vệ sinh sản phẩm'],
        coordinates: {
            lat: 16.0471,
            lng: 108.2068
        },
        isOfficial: true
    }
];

// Warranty Processes
export const warrantyProcesses: WarrantyProcess[] = [
    {
        id: 'standard-repair-process',
        title: 'Quy trình bảo hành tiêu chuẩn',
        description: 'Quy trình bảo hành cho các lỗi kỹ thuật thông thường',
        steps: [
            {
                stepNumber: 1,
                title: 'Liên hệ và báo cáo lỗi',
                description: 'Liên hệ hotline hoặc email để báo cáo vấn đề và nhận hướng dẫn',
                estimatedTime: '15-30 phút',
                requiredDocuments: ['Hóa đơn mua hàng', 'Phiếu bảo hành'],
                notes: ['Chuẩn bị serial number sản phẩm', 'Mô tả chi tiết vấn đề gặp phải']
            },
            {
                stepNumber: 2,
                title: 'Kiểm tra sơ bộ',
                description: 'Nhân viên kỹ thuật kiểm tra và xác định vấn đề qua điện thoại/email',
                estimatedTime: '30-60 phút',
                notes: ['Có thể được hướng dẫn khắc phục từ xa', 'Xác định cần mang sản phẩm đến trung tâm hay không']
            },
            {
                stepNumber: 3,
                title: 'Mang sản phẩm đến trung tâm',
                description: 'Mang sản phẩm và giấy tờ liên quan đến trung tâm bảo hành gần nhất',
                estimatedTime: 'Tùy thuộc vị trí',
                requiredDocuments: ['Sản phẩm lỗi', 'Hóa đơn gốc', 'Phiếu bảo hành', 'CMND/CCCD'],
                notes: ['Backup dữ liệu nếu có', 'Gỡ bỏ các phụ kiện cá nhân']
            },
            {
                stepNumber: 4,
                title: 'Kiểm tra và chẩn đoán',
                description: 'Kỹ thuật viên kiểm tra chi tiết và đưa ra phương án xử lý',
                estimatedTime: '1-2 giờ',
                notes: ['Nhận phiếu tiếp nhận', 'Được thông báo thời gian dự kiến hoàn thành']
            },
            {
                stepNumber: 5,
                title: 'Sửa chữa/Thay thế',
                description: 'Thực hiện sửa chữa hoặc thay thế linh kiện bị lỗi',
                estimatedTime: '1-3 ngày làm việc',
                notes: ['Có thể kéo dài nếu cần đặt linh kiện', 'Được cập nhật tiến độ qua SMS/email']
            },
            {
                stepNumber: 6,
                title: 'Kiểm tra chất lượng',
                description: 'Kiểm tra hoạt động và chất lượng sau sửa chữa',
                estimatedTime: '2-4 giờ',
                notes: ['Test toàn bộ chức năng', 'Đảm bảo đạt tiêu chuẩn chất lượng']
            },
            {
                stepNumber: 7,
                title: 'Liên hệ nhận sản phẩm',
                description: 'Thông báo hoàn thành và hẹn lịch nhận sản phẩm',
                estimatedTime: '15 phút',
                notes: ['Mang theo phiếu tiếp nhận', 'Kiểm tra sản phẩm trước khi nhận']
            }
        ],
        totalEstimatedTime: '2-5 ngày làm việc',
        applicableProducts: ['All products']
    },
    {
        id: 'express-replacement-process',
        title: 'Quy trình thay thế nhanh',
        description: 'Quy trình thay thế sản phẩm mới cho khách hàng Premium/Ultimate',
        steps: [
            {
                stepNumber: 1,
                title: 'Liên hệ hotline Premium',
                description: 'Gọi hotline Premium để báo cáo lỗi và yêu cầu thay thế',
                estimatedTime: '10-15 phút',
                requiredDocuments: ['Mã số bảo hành Premium'],
                notes: ['Ưu tiên xử lý cho khách hàng Premium']
            },
            {
                stepNumber: 2,
                title: 'Xác thực và chẩn đoán',
                description: 'Xác thực thông tin và chẩn đoán sơ bộ qua điện thoại',
                estimatedTime: '15-30 phút',
                notes: ['Có thể yêu cầu video/ảnh minh chứng']
            },
            {
                stepNumber: 3,
                title: 'Giao sản phẩm thay thế',
                description: 'Giao sản phẩm mới và thu hồi sản phẩm lỗi tại nhà/văn phòng',
                estimatedTime: '4-24 giờ',
                notes: ['Miễn phí giao hàng', 'Nhận sản phẩm lỗi cùng lúc']
            }
        ],
        totalEstimatedTime: '4-24 giờ',
        applicableProducts: ['Premium series', 'Ultimate series']
    }
];

// FAQs
export const warrantyFAQs: WarrantyFAQ[] = [
    {
        id: 'how-to-register-warranty',
        category: 'registration',
        question: 'Làm thế nào để đăng ký bảo hành sản phẩm?',
        answer: 'Bạn có thể đăng ký bảo hành qua website 4thitek.com/warranty-check, gọi hotline 1900-4THITEK hoặc mang sản phẩm đến trung tâm bảo hành. Cần có hóa đơn mua hàng và thông tin sản phẩm.',
        tags: ['registration', 'how-to', 'warranty'],
        popularity: 95,
        relatedFAQs: ['warranty-period', 'required-documents'],
        lastUpdated: '2024-01-20T00:00:00Z'
    },
    {
        id: 'warranty-period',
        category: 'general',
        question: 'Thời gian bảo hành của sản phẩm là bao lâu?',
        answer: 'Thời gian bảo hành tùy thuộc vào dòng sản phẩm: G Series (12 tháng), S Series (18 tháng), SX Series (24 tháng), G+ Series (36 tháng). Thời gian tính từ ngày mua hàng.',
        tags: ['period', 'duration', 'warranty'],
        popularity: 90,
        relatedFAQs: ['how-to-register-warranty', 'warranty-coverage'],
        lastUpdated: '2024-01-20T00:00:00Z'
    },
    {
        id: 'warranty-coverage',
        category: 'general',
        question: 'Bảo hành có cover những gì?',
        answer: 'Bảo hành bao gồm: lỗi sản xuất, hỏng hóc linh kiện trong quá trình sử dụng bình thường, lỗi firmware. Không bao gồm: hư hại do rơi vỡ, nước, hao mòn tự nhiên.',
        tags: ['coverage', 'terms', 'warranty'],
        popularity: 88,
        relatedFAQs: ['warranty-exclusions', 'what-not-covered'],
        lastUpdated: '2024-01-20T00:00:00Z'
    },
    {
        id: 'required-documents',
        category: 'claims',
        question: 'Cần giấy tờ gì khi claim bảo hành?',
        answer: 'Cần có: hóa đơn mua hàng gốc, phiếu bảo hành hoặc mã đăng ký bảo hành, CMND/CCCD của người mua. Đối với bảo hành Premium cần thêm giấy đăng ký bảo hành.',
        tags: ['documents', 'claims', 'requirements'],
        popularity: 85,
        relatedFAQs: ['how-to-claim', 'lost-receipt'],
        lastUpdated: '2024-01-20T00:00:00Z'
    },
    {
        id: 'service-center-locations',
        category: 'service',
        question: 'Trung tâm bảo hành ở đâu?',
        answer: 'Hiện tại 4THITEK có 3 trung tâm bảo hành chính: Hà Nội (123 Láng Hạ), TP.HCM (456 Nguyễn Văn Cừ), Đà Nẵng (789 Lê Duẩn). Ngoài ra có mạng lưới đại lý ủy quyền toàn quốc.',
        tags: ['location', 'service-center', 'address'],
        popularity: 80,
        relatedFAQs: ['working-hours', 'contact-info'],
        lastUpdated: '2024-01-20T00:00:00Z'
    },
    {
        id: 'warranty-transfer',
        category: 'general',
        question: 'Có thể chuyển nhượng bảo hành không?',
        answer: 'Bảo hành tiêu chuẩn không thể chuyển nhượng. Bảo hành Premium và Ultimate có thể chuyển nhượng thông qua thủ tục đổi tên trên hệ thống.',
        tags: ['transfer', 'ownership', 'warranty'],
        popularity: 60,
        relatedFAQs: ['warranty-period', 'registration-change'],
        lastUpdated: '2024-01-20T00:00:00Z'
    }
];

// Warranty Policy
export const warrantyPolicy: WarrantyPolicy = {
    id: 'warranty-policy-v2024',
    title: 'Chính sách bảo hành sản phẩm 4THITEK',
    version: '2024.1',
    effectiveDate: '2024-01-01T00:00:00Z',
    lastUpdated: '2024-01-20T00:00:00Z',
    content: [
        {
            section: '1. Điều khoản chung',
            subsections: [
                {
                    title: '1.1 Phạm vi áp dụng',
                    content:
                        'Chính sách này áp dụng cho tất cả sản phẩm âm thanh 4THITEK được bán chính thức tại Việt Nam.'
                },
                {
                    title: '1.2 Thời gian bảo hành',
                    content: 'Thời gian bảo hành được tính từ ngày mua hàng và tùy thuộc vào dòng sản phẩm.',
                    items: ['G Series: 12 tháng', 'S Series: 18 tháng', 'SX Series: 24 tháng', 'G+ Series: 36 tháng']
                }
            ]
        },
        {
            section: '2. Điều kiện bảo hành',
            subsections: [
                {
                    title: '2.1 Điều kiện được bảo hành',
                    content: 'Sản phẩm được bảo hành khi đáp ứng đầy đủ các điều kiện sau:',
                    items: [
                        'Có hóa đơn mua hàng hợp lệ từ đại lý ủy quyền',
                        'Sản phẩm còn trong thời hạn bảo hành',
                        'Lỗi thuộc diện được bảo hành theo quy định',
                        'Sản phẩm không bị can thiệp trái phép'
                    ]
                },
                {
                    title: '2.2 Đăng ký bảo hành',
                    content:
                        'Khách hàng nên đăng ký bảo hành trong vòng 30 ngày kể từ ngày mua để được hỗ trợ tốt nhất.'
                }
            ]
        },
        {
            section: '3. Nội dung bảo hành',
            subsections: [
                {
                    title: '3.1 Các lỗi được bảo hành',
                    content: 'Bảo hành miễn phí các lỗi sau:',
                    items: [
                        'Lỗi do quá trình sản xuất',
                        'Hỏng hóc linh kiện trong sử dụng bình thường',
                        'Lỗi firmware và software đi kèm',
                        'Lỗi kết nối và tương thích'
                    ]
                },
                {
                    title: '3.2 Các trường hợp không được bảo hành',
                    content: 'Không bảo hành trong các trường hợp sau:',
                    items: [
                        'Hư hại do rơi vỡ, va đập, thiên tai',
                        'Hư hại do nước, chất lỏng, hóa chất',
                        'Hao mòn tự nhiên (đệm tai, đệm đầu)',
                        'Sản phẩm bị can thiệp, sửa chữa bởi bên thứ 3',
                        'Hết thời hạn bảo hành'
                    ]
                }
            ]
        }
    ],
    applicableProducts: ['All 4THITEK products'],
    applicableRegions: ['Vietnam']
};

// Helper functions
export const getWarrantyPlanById = (id: string): WarrantyPlan | undefined => {
    return warrantyPlans.find((plan) => plan.id === id);
};

export const getServiceCenterById = (id: string): ServiceCenter | undefined => {
    return serviceCenters.find((center) => center.id === id);
};

export const getServiceCentersByCity = (city: string): ServiceCenter[] => {
    return serviceCenters.filter((center) => center.city === city);
};

export const getFAQsByCategory = (category: string): WarrantyFAQ[] => {
    return warrantyFAQs.filter((faq) => faq.category === category);
};

export const searchFAQs = (query: string): WarrantyFAQ[] => {
    const searchTerm = query.toLowerCase();
    return warrantyFAQs.filter(
        (faq) =>
            faq.question.toLowerCase().includes(searchTerm) ||
            faq.answer.toLowerCase().includes(searchTerm) ||
            faq.tags.some((tag) => tag.toLowerCase().includes(searchTerm))
    );
};

export const getPopularFAQs = (limit: number = 5): WarrantyFAQ[] => {
    return warrantyFAQs.sort((a, b) => b.popularity - a.popularity).slice(0, limit);
};

// Export counts
export const TOTAL_WARRANTY_PLANS = warrantyPlans.length;
export const TOTAL_SERVICE_CENTERS = serviceCenters.length;
export const TOTAL_FAQS = warrantyFAQs.length;
