import {
    ResellerTier,
    ResellerLocation,
    ResellerRequirement,
    ResellerBenefit,
    ResellerSupport
} from '@/types/reseller';

// Reseller Tiers
export const resellerTiers: ResellerTier[] = [
    {
        id: 'authorized-dealer',
        name: 'Authorized Dealer',
        description: 'Đại lý ủy quyền cấp cơ bản cho các cửa hàng nhỏ lẻ',
        level: 1,
        requirements: ['Đơn hàng tối thiểu 50 triệu VNĐ', 'Có cửa hàng thực tế', '1+ năm kinh nghiệm bán lẻ điện tử'],
        benefits: ['Chiết khấu 15%', 'Hỗ trợ marketing cơ bản', 'Hỗ trợ kỹ thuật', 'Chương trình đào tạo'],
        commission: 15,
        minimumOrder: 50000000,
        color: '#3B82F6'
    },
    {
        id: 'premium-partner',
        name: 'Premium Partner',
        description: 'Đối tác cao cấp với nhiều ưu đãi đặc biệt',
        level: 2,
        requirements: [
            'Đơn hàng tối thiểu 200 triệu VNĐ',
            'Có cửa hàng thực tế và online',
            '3+ năm kinh nghiệm',
            'Đội ngũ kỹ thuật chuyên nghiệp'
        ],
        benefits: [
            'Chiết khấu 25%',
            'Hỗ trợ marketing chuyên sâu',
            'Ưu tiên hỗ trợ kỹ thuật',
            'Đào tạo nâng cao',
            'Sản phẩm demo miễn phí'
        ],
        commission: 25,
        minimumOrder: 200000000,
        color: '#10B981'
    }
];

// Reseller Locations
export const resellerLocations: ResellerLocation[] = [
    {
        id: 'hanoi-tech-store',
        name: 'Hanoi Tech Store',
        type: 'store',
        address: {
            street: '123 Hoàng Quốc Việt',
            city: 'Hà Nội',
            province: 'Hà Nội',
            country: 'Việt Nam',
            postalCode: '100000'
        },
        coordinates: {
            lat: 21.0285,
            lng: 105.8542
        },
        contactInfo: {
            phone: '024-3456-7890',
            email: 'hanoi@techstore.vn',
            website: 'https://hanoitechstore.vn'
        },
        workingHours: {
            monday: '9:00 - 21:00',
            tuesday: '9:00 - 21:00',
            wednesday: '9:00 - 21:00',
            thursday: '9:00 - 21:00',
            friday: '9:00 - 21:00',
            saturday: '9:00 - 22:00',
            sunday: '10:00 - 20:00'
        },
        tier: resellerTiers[1],
        isActive: true,
        joinedDate: '2023-06-15T00:00:00Z'
    }
];

// Reseller Requirements
export const resellerRequirements: ResellerRequirement[] = [
    {
        id: 'financial-capacity',
        title: 'Năng lực tài chính',
        description: 'Đảm bảo khả năng tài chính để duy trì hoạt động kinh doanh',
        type: 'financial',
        isRequired: true,
        applicableTiers: ['authorized-dealer', 'premium-partner'],
        details: [
            'Giấy phép kinh doanh hợp lệ',
            'Báo cáo tài chính 12 tháng gần nhất',
            'Tài khoản ngân hàng doanh nghiệp'
        ]
    }
];

// Reseller Benefits
export const resellerBenefits: ResellerBenefit[] = [
    {
        id: 'discount-program',
        title: 'Chương trình chiết khấu',
        description: 'Ưu đãi giá mua sản phẩm theo cấp độ đại lý',
        type: 'financial',
        applicableTiers: ['authorized-dealer', 'premium-partner'],
        value: '15-25%',
        details: ['Chiết khấu theo số lượng', 'Ưu đãi đặc biệt cho sản phẩm mới', 'Chương trình khuyến mãi định kỳ']
    }
];

// Reseller Support
export const resellerSupport: ResellerSupport[] = [
    {
        id: 'technical-support',
        type: 'technical',
        title: 'Hỗ trợ kỹ thuật',
        description: 'Hỗ trợ kỹ thuật chuyên nghiệp cho đại lý và khách hàng',
        availability: 'T2-T6: 8:00-17:30',
        contactInfo: {
            phone: '1900-4THITEK',
            email: 'support@4thitek.com',
            person: 'Đội ngũ kỹ thuật'
        },
        materials: ['Tài liệu kỹ thuật sản phẩm', 'Video hướng dẫn', 'FAQ thường gặp']
    }
];

// Helper functions
export const getTierById = (id: string): ResellerTier | undefined => {
    return resellerTiers.find((tier) => tier.id === id);
};

export const getLocationsByTier = (tierId: string): ResellerLocation[] => {
    return resellerLocations.filter((location) => location.tier.id === tierId);
};

export const getActiveLocations = (): ResellerLocation[] => {
    return resellerLocations.filter((location) => location.isActive);
};
