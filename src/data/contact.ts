import { ContactInfo, SocialMedia, OfficeLocation, Department, BusinessHours, EmergencyContact } from '@/types/contact';

// Contact Information
export const contactInfo: ContactInfo[] = [
    {
        id: 'main-phone',
        type: 'phone',
        label: 'Hotline chính',
        value: '1900-4THITEK (1900-484835)',
        icon: '📞',
        isPublic: true,
        isPrimary: true,
        workingHours: 'T2-T6: 8:00-17:30, T7: 8:00-12:00',
        notes: 'Hỗ trợ tư vấn sản phẩm và bảo hành'
    },
    {
        id: 'business-phone',
        type: 'phone',
        label: 'Kinh doanh B2B',
        value: '024-3845-6789',
        icon: '📱',
        isPublic: true,
        isPrimary: false,
        department: 'Business Development',
        workingHours: 'T2-T6: 8:00-17:30'
    },
    {
        id: 'support-phone',
        type: 'phone',
        label: 'Hỗ trợ kỹ thuật',
        value: '028-3123-4567',
        icon: '🔧',
        isPublic: true,
        isPrimary: false,
        department: 'Technical Support',
        workingHours: 'T2-T6: 8:00-17:30, T7: 8:00-16:00'
    },
    {
        id: 'main-email',
        type: 'email',
        label: 'Email chính',
        value: 'info@4thitek.com',
        icon: '📧',
        isPublic: true,
        isPrimary: true,
        notes: 'Email chính cho mọi liên hệ'
    },
    {
        id: 'business-email',
        type: 'email',
        label: 'Hợp tác kinh doanh',
        value: 'business@4thitek.com',
        icon: '💼',
        isPublic: true,
        isPrimary: false,
        department: 'Business Development'
    },
    {
        id: 'support-email',
        type: 'email',
        label: 'Hỗ trợ kỹ thuật',
        value: 'support@4thitek.com',
        icon: '🛠️',
        isPublic: true,
        isPrimary: false,
        department: 'Technical Support'
    },
    {
        id: 'warranty-email',
        type: 'email',
        label: 'Bảo hành',
        value: 'warranty@4thitek.com',
        icon: '🔧',
        isPublic: true,
        isPrimary: false,
        department: 'Warranty Service'
    }
];

// Social Media
export const socialMedia: SocialMedia[] = [
    {
        id: 'facebook',
        platform: 'facebook',
        name: '4THITEK Official',
        url: 'https://facebook.com/4thitek',
        handle: '@4thitek',
        followers: 15420,
        isVerified: true,
        isActive: true,
        description: 'Trang Facebook chính thức của 4THITEK - Cập nhật tin tức và sản phẩm mới',
        icon: '👥',
        color: '#1877F2'
    },
    {
        id: 'instagram',
        platform: 'instagram',
        name: '4THITEK',
        url: 'https://instagram.com/4thitek',
        handle: '@4thitek',
        followers: 8750,
        isVerified: true,
        isActive: true,
        description: 'Instagram chính thức - Hình ảnh và video sản phẩm mới nhất',
        icon: '📸',
        color: '#E4405F'
    },
    {
        id: 'youtube',
        platform: 'youtube',
        name: '4THITEK Channel',
        url: 'https://youtube.com/@4thitek',
        handle: '@4thitek',
        followers: 12300,
        isVerified: true,
        isActive: true,
        description: 'Kênh YouTube - Review, unboxing và hướng dẫn sử dụng',
        icon: '📹',
        color: '#FF0000'
    },
    {
        id: 'linkedin',
        platform: 'linkedin',
        name: '4THITEK Company',
        url: 'https://linkedin.com/company/4thitek',
        followers: 2890,
        isVerified: true,
        isActive: true,
        description: 'LinkedIn - Tin tức doanh nghiệp và cơ hội nghề nghiệp',
        icon: '💼',
        color: '#0A66C2'
    },
    {
        id: 'tiktok',
        platform: 'tiktok',
        name: '4THITEK',
        url: 'https://tiktok.com/@4thitek',
        handle: '@4thitek',
        followers: 5420,
        isVerified: false,
        isActive: true,
        description: 'TikTok - Video ngắn về gaming và công nghệ',
        icon: '🎵',
        color: '#000000'
    },
    {
        id: 'zalo',
        platform: 'zalo',
        name: '4THITEK Official',
        url: 'https://zalo.me/4thitek',
        followers: 3450,
        isVerified: true,
        isActive: true,
        description: 'Zalo OA - Hỗ trợ khách hàng nhanh chóng',
        icon: '💬',
        color: '#0068FF'
    }
];

// Office Locations
export const officeLocations: OfficeLocation[] = [
    {
        id: 'hanoi-headquarters',
        name: '4THITEK Headquarters',
        type: 'headquarters',
        address: {
            street: '123 Láng Hạ, Ba Đình',
            district: 'Ba Đình',
            city: 'Hà Nội',
            province: 'Hà Nội',
            country: 'Việt Nam',
            postalCode: '100000'
        },
        coordinates: {
            lat: 21.0285,
            lng: 105.8542
        },
        contactInfo: [
            {
                id: 'hn-phone',
                type: 'phone',
                label: 'Điện thoại',
                value: '024-3845-6789',
                isPublic: true,
                isPrimary: true
            },
            {
                id: 'hn-email',
                type: 'email',
                label: 'Email',
                value: 'hanoi@4thitek.com',
                isPublic: true,
                isPrimary: true
            }
        ],
        workingHours: {
            monday: '8:00 - 17:30',
            tuesday: '8:00 - 17:30',
            wednesday: '8:00 - 17:30',
            thursday: '8:00 - 17:30',
            friday: '8:00 - 17:30',
            saturday: '8:00 - 12:00',
            sunday: 'Đóng cửa'
        },
        services: [
            'Tư vấn sản phẩm',
            'Bảo hành và sửa chữa',
            'Đào tạo kỹ thuật',
            'Hỗ trợ đại lý',
            'Demo sản phẩm'
        ],
        languages: ['Tiếng Việt', 'English'],
        facilities: [
            'Phòng demo âm thanh',
            'Trung tâm bảo hành',
            'Khu vực đào tạo',
            'Bãi đỗ xe',
            'Wifi miễn phí'
        ],
        isMainOffice: true,
        image: '/offices/hanoi-hq.jpg'
    },
    {
        id: 'hcm-branch',
        name: '4THITEK TP.HCM',
        type: 'branch',
        address: {
            street: '456 Nguyễn Văn Cừ, Quận 5',
            district: 'Quận 5',
            city: 'TP. Hồ Chí Minh',
            province: 'TP. Hồ Chí Minh',
            country: 'Việt Nam',
            postalCode: '700000'
        },
        coordinates: {
            lat: 10.7769,
            lng: 106.6951
        },
        contactInfo: [
            {
                id: 'hcm-phone',
                type: 'phone',
                label: 'Điện thoại',
                value: '028-3123-4567',
                isPublic: true,
                isPrimary: true
            },
            {
                id: 'hcm-email',
                type: 'email',
                label: 'Email',
                value: 'hcm@4thitek.com',
                isPublic: true,
                isPrimary: true
            }
        ],
        workingHours: {
            monday: '8:00 - 17:30',
            tuesday: '8:00 - 17:30',
            wednesday: '8:00 - 17:30',
            thursday: '8:00 - 17:30',
            friday: '8:00 - 17:30',
            saturday: '8:00 - 16:00',
            sunday: 'Đóng cửa'
        },
        services: [
            'Tư vấn sản phẩm',
            'Bảo hành và sửa chữa',
            'Hỗ trợ kỹ thuật',
            'Training workshop',
            'Demo showroom'
        ],
        languages: ['Tiếng Việt', 'English'],
        facilities: [
            'Showroom trưng bày',
            'Phòng bảo hành',
            'Khu vực training',
            'Bãi đỗ xe máy'
        ],
        isMainOffice: false,
        image: '/offices/hcm-branch.jpg'
    },
    {
        id: 'danang-service',
        name: '4THITEK Service Center Đà Nẵng',
        type: 'service-center',
        address: {
            street: '789 Lê Duẩn, Hải Châu',
            district: 'Hải Châu',
            city: 'Đà Nẵng',
            province: 'Đà Nẵng',
            country: 'Việt Nam',
            postalCode: '550000'
        },
        coordinates: {
            lat: 16.0471,
            lng: 108.2068
        },
        contactInfo: [
            {
                id: 'dn-phone',
                type: 'phone',
                label: 'Điện thoại',
                value: '0236-3987-654',
                isPublic: true,
                isPrimary: true
            },
            {
                id: 'dn-email',
                type: 'email',
                label: 'Email',
                value: 'danang@4thitek.com',
                isPublic: true,
                isPrimary: true
            }
        ],
        workingHours: {
            monday: '8:00 - 17:00',
            tuesday: '8:00 - 17:00',
            wednesday: '8:00 - 17:00',
            thursday: '8:00 - 17:00',
            friday: '8:00 - 17:00',
            saturday: '8:00 - 12:00',
            sunday: 'Đóng cửa'
        },
        services: [
            'Bảo hành sản phẩm',
            'Sửa chữa chuyên nghiệp',
            'Tư vấn kỹ thuật',
            'Vệ sinh bảo dưỡng'
        ],
        languages: ['Tiếng Việt'],
        facilities: [
            'Khu vực tiếp nhận',
            'Phòng sửa chữa',
            'Kho linh kiện'
        ],
        isMainOffice: false,
        image: '/offices/danang-service.jpg'
    }
];

// Departments
export const departments: Department[] = [
    {
        id: 'sales',
        name: 'Bộ phận Kinh doanh',
        description: 'Tư vấn sản phẩm, báo giá và hỗ trợ khách hàng doanh nghiệp',
        contactInfo: [
            {
                id: 'sales-phone',
                type: 'phone',
                label: 'Hotline Kinh doanh',
                value: '1900-4THITEK',
                isPublic: true,
                isPrimary: true
            },
            {
                id: 'sales-email',
                type: 'email',
                label: 'Email Kinh doanh',
                value: 'sales@4thitek.com',
                isPublic: true,
                isPrimary: true
            }
        ],
        responsibilities: [
            'Tư vấn giải pháp âm thanh',
            'Báo giá và đàm phán hợp đồng',
            'Hỗ trợ khách hàng doanh nghiệp',
            'Quản lý mối quan hệ đại lý',
            'Phát triển thị trường mới'
        ],
        teamMembers: [
            {
                name: 'Nguyễn Văn Anh',
                title: 'Sales Manager',
                email: 'anh.nguyen@4thitek.com',
                phone: '0123-456-789'
            },
            {
                name: 'Trần Thị Bình',
                title: 'Senior Sales Executive',
                email: 'binh.tran@4thitek.com',
                phone: '0123-456-790'
            }
        ],
        workingHours: 'T2-T6: 8:00-17:30, T7: 8:00-12:00'
    },
    {
        id: 'technical-support',
        name: 'Hỗ trợ Kỹ thuật',
        description: 'Hỗ trợ kỹ thuật, troubleshooting và đào tạo sử dụng sản phẩm',
        contactInfo: [
            {
                id: 'tech-phone',
                type: 'phone',
                label: 'Hotline Kỹ thuật',
                value: '028-3123-4567',
                isPublic: true,
                isPrimary: true
            },
            {
                id: 'tech-email',
                type: 'email',
                label: 'Email Kỹ thuật',
                value: 'support@4thitek.com',
                isPublic: true,
                isPrimary: true
            }
        ],
        responsibilities: [
            'Hỗ trợ kỹ thuật qua điện thoại/email',
            'Troubleshooting và giải quyết sự cố',
            'Hướng dẫn setup và cấu hình',
            'Đào tạo sử dụng sản phẩm',
            'Tạo tài liệu kỹ thuật'
        ],
        teamMembers: [
            {
                name: 'Lê Minh Tuấn',
                title: 'Technical Support Manager',
                email: 'tuan.le@4thitek.com',
                phone: '0123-456-791'
            }
        ],
        workingHours: 'T2-T6: 8:00-17:30, T7: 8:00-16:00'
    },
    {
        id: 'warranty',
        name: 'Bảo hành',
        description: 'Xử lý yêu cầu bảo hành, sửa chữa và thay thế sản phẩm',
        contactInfo: [
            {
                id: 'warranty-phone',
                type: 'phone',
                label: 'Hotline Bảo hành',
                value: '1900-4THITEK',
                isPublic: true,
                isPrimary: true
            },
            {
                id: 'warranty-email',
                type: 'email',
                label: 'Email Bảo hành',
                value: 'warranty@4thitek.com',
                isPublic: true,
                isPrimary: true
            }
        ],
        responsibilities: [
            'Tiếp nhận và xử lý yêu cầu bảo hành',
            'Kiểm tra và chẩn đoán sản phẩm',
            'Sửa chữa và thay thế linh kiện',
            'Quản lý kho linh kiện',
            'Báo cáo tình trạng bảo hành'
        ],
        workingHours: 'T2-T6: 8:00-17:30, T7: 8:00-12:00'
    }
];

// Business Hours
export const businessHours: BusinessHours[] = [
    {
        day: 'monday',
        dayName: 'Thứ Hai',
        isOpen: true,
        openTime: '08:00',
        closeTime: '17:30'
    },
    {
        day: 'tuesday',
        dayName: 'Thứ Ba',
        isOpen: true,
        openTime: '08:00',
        closeTime: '17:30'
    },
    {
        day: 'wednesday',
        dayName: 'Thứ Tư',
        isOpen: true,
        openTime: '08:00',
        closeTime: '17:30'
    },
    {
        day: 'thursday',
        dayName: 'Thứ Năm',
        isOpen: true,
        openTime: '08:00',
        closeTime: '17:30'
    },
    {
        day: 'friday',
        dayName: 'Thứ Sáu',
        isOpen: true,
        openTime: '08:00',
        closeTime: '17:30'
    },
    {
        day: 'saturday',
        dayName: 'Thứ Bảy',
        isOpen: true,
        openTime: '08:00',
        closeTime: '12:00',
        notes: 'Chỉ hỗ trợ bảo hành và tư vấn cơ bản'
    },
    {
        day: 'sunday',
        dayName: 'Chủ Nhật',
        isOpen: false,
        notes: 'Đóng cửa nghỉ ngơi'
    }
];

// Emergency Contacts
export const emergencyContacts: EmergencyContact[] = [
    {
        id: 'emergency-tech',
        name: 'Lê Minh Tuấn',
        role: 'Technical Support Manager',
        phone: '0123-456-791',
        email: 'tuan.le@4thitek.com',
        availability: 'T7, CN: 9:00-18:00',
        languages: ['Tiếng Việt', 'English'],
        specialization: ['Technical Issues', 'Product Setup', 'Troubleshooting']
    },
    {
        id: 'emergency-warranty',
        name: 'Nguyễn Thị Hoa',
        role: 'Warranty Service Lead',
        phone: '0123-456-792',
        email: 'hoa.nguyen@4thitek.com',
        availability: 'Cuối tuần và lễ',
        languages: ['Tiếng Việt'],
        specialization: ['Warranty Claims', 'Urgent Repairs', 'Replacement Authorization']
    }
];

// Helper functions
export const getContactByType = (type: string): ContactInfo[] => {
    return contactInfo.filter(contact => contact.type === type);
};

export const getPrimaryContacts = (): ContactInfo[] => {
    return contactInfo.filter(contact => contact.isPrimary);
};

export const getOfficeById = (id: string): OfficeLocation | undefined => {
    return officeLocations.find(office => office.id === id);
};

export const getMainOffice = (): OfficeLocation | undefined => {
    return officeLocations.find(office => office.isMainOffice);
};

export const getDepartmentById = (id: string): Department | undefined => {
    return departments.find(dept => dept.id === id);
};

export const getActiveSocialMedia = (): SocialMedia[] => {
    return socialMedia.filter(social => social.isActive);
};

export const getVerifiedSocialMedia = (): SocialMedia[] => {
    return socialMedia.filter(social => social.isVerified);
};

// Export counts
export const TOTAL_CONTACTS = contactInfo.length;
export const TOTAL_OFFICES = officeLocations.length;
export const TOTAL_DEPARTMENTS = departments.length;
export const TOTAL_SOCIAL_MEDIA = socialMedia.length;