import { ContactInfo, SocialMedia, OfficeLocation, Department, BusinessHours, EmergencyContact } from '@/types/contact';

// Contact Information
export const contactInfo: ContactInfo[] = [
    {
        id: 'main-phone',
        type: 'phone',
        label: 'Main Hotline',
        value: '1900-4THITEK (1900-484835)',
        icon: '📞',
        isPublic: true,
        isPrimary: true,
        workingHours: 'Mon-Fri: 8:00-17:30, Sat: 8:00-12:00',
        notes: 'Product consultation and warranty support'
    },
    {
        id: 'business-phone',
        type: 'phone',
        label: 'B2B Business',
        value: '024-3845-6789',
        icon: '📱',
        isPublic: true,
        isPrimary: false,
        department: 'Business Development',
        workingHours: 'Mon-Fri: 8:00-17:30'
    },
    {
        id: 'support-phone',
        type: 'phone',
        label: 'Technical Support',
        value: '028-3123-4567',
        icon: '🔧',
        isPublic: true,
        isPrimary: false,
        department: 'Technical Support',
        workingHours: 'Mon-Fri: 8:00-17:30, Sat: 8:00-16:00'
    },
    {
        id: 'main-email',
        type: 'email',
        label: 'Main Email',
        value: 'info@4thitek.com',
        icon: '📧',
        isPublic: true,
        isPrimary: true,
        notes: 'Main email for all inquiries'
    },
    {
        id: 'business-email',
        type: 'email',
        label: 'Business Partnership',
        value: 'business@4thitek.com',
        icon: '💼',
        isPublic: true,
        isPrimary: false,
        department: 'Business Development'
    },
    {
        id: 'support-email',
        type: 'email',
        label: 'Technical Support',
        value: 'support@4thitek.com',
        icon: '🛠️',
        isPublic: true,
        isPrimary: false,
        department: 'Technical Support'
    },
    {
        id: 'warranty-email',
        type: 'email',
        label: 'Warranty',
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
        description: 'Official Facebook page of 4THITEK - Updates on news and new products',
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
        description: 'Official Instagram - Latest product images and videos',
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
        description: 'YouTube Channel - Reviews, unboxing and user guides',
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
        description: 'LinkedIn - Corporate news and career opportunities',
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
        description: 'TikTok - Short videos about gaming and technology',
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
        description: 'Zalo OA - Quick customer support',
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
            street: '123 Lang Ha, Ba Dinh',
            district: 'Ba Dinh District',
            city: 'Hanoi',
            province: 'Hanoi',
            country: 'Vietnam',
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
                label: 'Phone',
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
            sunday: 'Closed'
        },
        services: [
            'Product consultation',
            'Warranty and repair',
            'Technical training',
            'Dealer support',
            'Product demo'
        ],
        languages: ['Vietnamese', 'English'],
        facilities: ['Audio demo room', 'Warranty center', 'Training area', 'Parking area', 'Free WiFi'],
        isMainOffice: true,
        image: '/offices/hanoi-hq.jpg'
    },
    {
        id: 'hcm-branch',
        name: '4THITEK TP.HCM',
        type: 'branch',
        address: {
            street: '456 Nguyen Van Cu, District 5',
            district: 'District 5',
            city: 'Ho Chi Minh City',
            province: 'Ho Chi Minh City',
            country: 'Vietnam',
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
                label: 'Phone',
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
            sunday: 'Closed'
        },
        services: [
            'Product consultation',
            'Warranty and repair',
            'Technical support',
            'Training workshop',
            'Demo showroom'
        ],
        languages: ['Vietnamese', 'English'],
        facilities: ['Display showroom', 'Warranty room', 'Training area', 'Motorcycle parking'],
        isMainOffice: false,
        image: '/offices/hcm-branch.jpg'
    },
    {
        id: 'danang-service',
        name: '4THITEK Service Center Đà Nẵng',
        type: 'service-center',
        address: {
            street: '789 Le Duan, Hai Chau',
            district: 'Hai Chau District',
            city: 'Da Nang',
            province: 'Da Nang',
            country: 'Vietnam',
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
                label: 'Phone',
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
            sunday: 'Closed'
        },
        services: ['Product warranty', 'Professional repair', 'Technical consultation', 'Cleaning and maintenance'],
        languages: ['Tiếng Việt'],
        facilities: ['Reception area', 'Repair room', 'Parts warehouse'],
        isMainOffice: false,
        image: '/offices/danang-service.jpg'
    }
];

// Departments
export const departments: Department[] = [
    {
        id: 'sales',
        name: 'Sales Department',
        description: 'Product consultation, quotation and enterprise customer support',
        contactInfo: [
            {
                id: 'sales-phone',
                type: 'phone',
                label: 'Sales Hotline',
                value: '1900-4THITEK',
                isPublic: true,
                isPrimary: true
            },
            {
                id: 'sales-email',
                type: 'email',
                label: 'Sales Email',
                value: 'sales@4thitek.com',
                isPublic: true,
                isPrimary: true
            }
        ],
        responsibilities: [
            'Audio solution consultation',
            'Quotation and contract negotiation',
            'Enterprise customer support',
            'Dealer relationship management',
            'New market development'
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
        workingHours: 'Mon-Fri: 8:00-17:30, Sat: 8:00-12:00'
    },
    {
        id: 'technical-support',
        name: 'Technical Support',
        description: 'Technical support, troubleshooting and product usage training',
        contactInfo: [
            {
                id: 'tech-phone',
                type: 'phone',
                label: 'Technical Hotline',
                value: '028-3123-4567',
                isPublic: true,
                isPrimary: true
            },
            {
                id: 'tech-email',
                type: 'email',
                label: 'Technical Email',
                value: 'support@4thitek.com',
                isPublic: true,
                isPrimary: true
            }
        ],
        responsibilities: [
            'Technical support via phone/email',
            'Troubleshooting and issue resolution',
            'Setup and configuration guidance',
            'Product usage training',
            'Technical documentation creation'
        ],
        teamMembers: [
            {
                name: 'Lê Minh Tuấn',
                title: 'Technical Support Manager',
                email: 'tuan.le@4thitek.com',
                phone: '0123-456-791'
            }
        ],
        workingHours: 'Mon-Fri: 8:00-17:30, Sat: 8:00-16:00'
    },
    {
        id: 'warranty',
        name: 'Warranty',
        description: 'Processing warranty requests, repairs and product replacement',
        contactInfo: [
            {
                id: 'warranty-phone',
                type: 'phone',
                label: 'Warranty Hotline',
                value: '1900-4THITEK',
                isPublic: true,
                isPrimary: true
            },
            {
                id: 'warranty-email',
                type: 'email',
                label: 'Warranty Email',
                value: 'warranty@4thitek.com',
                isPublic: true,
                isPrimary: true
            }
        ],
        responsibilities: [
            'Receive and process warranty requests',
            'Product inspection and diagnosis',
            'Repair and component replacement',
            'Parts inventory management',
            'Warranty status reporting'
        ],
        workingHours: 'Mon-Fri: 8:00-17:30, Sat: 8:00-12:00'
    }
];

// Business Hours
export const businessHours: BusinessHours[] = [
    {
        day: 'monday',
        dayName: 'Monday',
        isOpen: true,
        openTime: '08:00',
        closeTime: '17:30'
    },
    {
        day: 'tuesday',
        dayName: 'Tuesday',
        isOpen: true,
        openTime: '08:00',
        closeTime: '17:30'
    },
    {
        day: 'wednesday',
        dayName: 'Wednesday',
        isOpen: true,
        openTime: '08:00',
        closeTime: '17:30'
    },
    {
        day: 'thursday',
        dayName: 'Thursday',
        isOpen: true,
        openTime: '08:00',
        closeTime: '17:30'
    },
    {
        day: 'friday',
        dayName: 'Friday',
        isOpen: true,
        openTime: '08:00',
        closeTime: '17:30'
    },
    {
        day: 'saturday',
        dayName: 'Saturday',
        isOpen: true,
        openTime: '08:00',
        closeTime: '12:00',
        notes: 'Warranty support and basic consultation only'
    },
    {
        day: 'sunday',
        dayName: 'Sunday',
        isOpen: false,
        notes: 'Closed for rest'
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
        availability: 'Sat, Sun: 9:00-18:00',
        languages: ['Vietnamese', 'English'],
        specialization: ['Technical Issues', 'Product Setup', 'Troubleshooting']
    },
    {
        id: 'emergency-warranty',
        name: 'Nguyễn Thị Hoa',
        role: 'Warranty Service Lead',
        phone: '0123-456-792',
        email: 'hoa.nguyen@4thitek.com',
        availability: 'Weekends and holidays',
        languages: ['Tiếng Việt'],
        specialization: ['Warranty Claims', 'Urgent Repairs', 'Replacement Authorization']
    }
];

// Helper functions
export const getContactByType = (type: string): ContactInfo[] => {
    return contactInfo.filter((contact) => contact.type === type);
};

export const getPrimaryContacts = (): ContactInfo[] => {
    return contactInfo.filter((contact) => contact.isPrimary);
};

export const getOfficeById = (id: string): OfficeLocation | undefined => {
    return officeLocations.find((office) => office.id === id);
};

export const getMainOffice = (): OfficeLocation | undefined => {
    return officeLocations.find((office) => office.isMainOffice);
};

export const getDepartmentById = (id: string): Department | undefined => {
    return departments.find((dept) => dept.id === id);
};

export const getActiveSocialMedia = (): SocialMedia[] => {
    return socialMedia.filter((social) => social.isActive);
};

export const getVerifiedSocialMedia = (): SocialMedia[] => {
    return socialMedia.filter((social) => social.isVerified);
};

// Export counts
export const TOTAL_CONTACTS = contactInfo.length;
export const TOTAL_OFFICES = officeLocations.length;
export const TOTAL_DEPARTMENTS = departments.length;
export const TOTAL_SOCIAL_MEDIA = socialMedia.length;
