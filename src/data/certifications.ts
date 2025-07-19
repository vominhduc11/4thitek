import { 
    CertificationStandard, 
    ProductCertification, 
    CertificationCategory, 
    TestingLaboratory,
    ComplianceRequirement 
} from '@/types/certification';

// Certification Standards
export const certificationStandards: CertificationStandard[] = [
    // Audio Quality Standards
    {
        id: 'hi-res-audio',
        name: 'Hi-Res Audio',
        fullName: 'High-Resolution Audio Certification',
        description: 'Chứng nhận chất lượng âm thanh độ phân giải cao, đảm bảo tái tạo âm thanh với độ chính xác và chi tiết vượt trội',
        issuingOrganization: 'Japan Audio Society (JAS)',
        category: 'audio-quality',
        logo: '/certifications/hi-res-audio-logo.png',
        website: 'https://www.jas-audio.or.jp',
        importance: 'critical'
    },
    {
        id: 'thx-certified',
        name: 'THX Certified',
        fullName: 'THX Audio Certification',
        description: 'Chứng nhận THX đảm bảo âm thanh đạt tiêu chuẩn chất lượng cao nhất cho gaming và entertainment',
        issuingOrganization: 'THX Ltd.',
        category: 'audio-quality',
        logo: '/certifications/thx-logo.png',
        website: 'https://www.thx.com',
        importance: 'important'
    },
    {
        id: 'dolby-atmos',
        name: 'Dolby Atmos',
        fullName: 'Dolby Atmos Certification',
        description: 'Chứng nhận hỗ trợ công nghệ âm thanh không gian 3D Dolby Atmos',
        issuingOrganization: 'Dolby Laboratories',
        category: 'audio-quality',
        logo: '/certifications/dolby-atmos-logo.png',
        website: 'https://www.dolby.com',
        importance: 'important'
    },

    // Safety Standards
    {
        id: 'ce-marking',
        name: 'CE Marking',
        fullName: 'Conformité Européenne',
        description: 'Chứng nhận tuân thủ các yêu cầu an toàn và sức khỏe của Liên minh Châu Âu',
        issuingOrganization: 'European Union',
        category: 'safety',
        logo: '/certifications/ce-logo.png',
        website: 'https://ec.europa.eu/growth/single-market/ce-marking_en',
        importance: 'critical'
    },
    {
        id: 'fcc-certification',
        name: 'FCC Certification',
        fullName: 'Federal Communications Commission Certification',
        description: 'Chứng nhận tuân thủ quy định về thiết bị điện tử tại Hoa Kỳ',
        issuingOrganization: 'Federal Communications Commission (FCC)',
        category: 'safety',
        logo: '/certifications/fcc-logo.png',
        website: 'https://www.fcc.gov',
        importance: 'critical'
    },
    {
        id: 'rohs-compliant',
        name: 'RoHS Compliant',
        fullName: 'Restriction of Hazardous Substances',
        description: 'Chứng nhận không sử dụng các chất có hại theo tiêu chuẩn RoHS',
        issuingOrganization: 'European Union',
        category: 'environmental',
        logo: '/certifications/rohs-logo.png',
        website: 'https://ec.europa.eu/environment/waste/rohs_eee',
        importance: 'important'
    },

    // Manufacturing & Quality
    {
        id: 'iso-9001',
        name: 'ISO 9001',
        fullName: 'ISO 9001:2015 Quality Management Systems',
        description: 'Chứng nhận hệ thống quản lý chất lượng theo tiêu chuẩn quốc tế',
        issuingOrganization: 'International Organization for Standardization (ISO)',
        category: 'manufacturing',
        logo: '/certifications/iso-9001-logo.png',
        website: 'https://www.iso.org',
        importance: 'important'
    },
    {
        id: 'iso-14001',
        name: 'ISO 14001',
        fullName: 'ISO 14001:2015 Environmental Management Systems',
        description: 'Chứng nhận hệ thống quản lý môi trường theo tiêu chuẩn quốc tế',
        issuingOrganization: 'International Organization for Standardization (ISO)',
        category: 'environmental',
        logo: '/certifications/iso-14001-logo.png',
        website: 'https://www.iso.org',
        importance: 'beneficial'
    },

    // Wireless & Connectivity
    {
        id: 'bluetooth-sig',
        name: 'Bluetooth SIG',
        fullName: 'Bluetooth Special Interest Group Certification',
        description: 'Chứng nhận tuân thủ tiêu chuẩn Bluetooth và khả năng tương thích',
        issuingOrganization: 'Bluetooth Special Interest Group',
        category: 'international',
        logo: '/certifications/bluetooth-logo.png',
        website: 'https://www.bluetooth.com',
        importance: 'critical'
    },
    {
        id: 'wi-fi-certified',
        name: 'Wi-Fi Certified',
        fullName: 'Wi-Fi Alliance Certification',
        description: 'Chứng nhận tuân thủ tiêu chuẩn Wi-Fi và khả năng tương thích',
        issuingOrganization: 'Wi-Fi Alliance',
        category: 'international',
        logo: '/certifications/wifi-logo.png',
        website: 'https://www.wi-fi.org',
        importance: 'important'
    }
];

// Certification Categories
export const certificationCategories: CertificationCategory[] = [
    {
        id: 'audio-quality',
        name: 'Chất lượng âm thanh',
        description: 'Các chứng nhận đảm bảo chất lượng âm thanh và hiệu suất âm học',
        icon: '🎵',
        color: '#3B82F6',
        standards: ['hi-res-audio', 'thx-certified', 'dolby-atmos'],
        importance: 5
    },
    {
        id: 'safety',
        name: 'An toàn sản phẩm',
        description: 'Chứng nhận đảm bảo an toàn cho người sử dụng và tuân thủ quy định',
        icon: '🛡️',
        color: '#10B981',
        standards: ['ce-marking', 'fcc-certification'],
        importance: 5
    },
    {
        id: 'environmental',
        name: 'Thân thiện môi trường',
        description: 'Chứng nhận về tính bền vững và thân thiện với môi trường',
        icon: '🌱',
        color: '#059669',
        standards: ['rohs-compliant', 'iso-14001'],
        importance: 3
    },
    {
        id: 'manufacturing',
        name: 'Chất lượng sản xuất',
        description: 'Chứng nhận hệ thống quản lý chất lượng và quy trình sản xuất',
        icon: '🏭',
        color: '#8B5CF6',
        standards: ['iso-9001'],
        importance: 4
    },
    {
        id: 'international',
        name: 'Tiêu chuẩn quốc tế',
        description: 'Chứng nhận tuân thủ các tiêu chuẩn kết nối và tương thích quốc tế',
        icon: '🌐',
        color: '#F59E0B',
        standards: ['bluetooth-sig', 'wi-fi-certified'],
        importance: 4
    }
];

// Product Certifications
export const productCertifications: ProductCertification[] = [
    // TUNECORE SX Pro Elite
    {
        id: 'sx-pro-elite-hi-res',
        productId: 'sx-pro-elite',
        productName: 'TUNECORE SX Pro Elite',
        certificationStandard: certificationStandards[0], // Hi-Res Audio
        certificateNumber: 'JAS-HRA-2024-001',
        issueDate: '2024-01-15T00:00:00Z',
        isActive: true,
        certificateFile: '/certificates/sx-pro-elite-hi-res.pdf',
        testReport: '/reports/sx-pro-elite-audio-test.pdf',
        notes: 'Đạt chuẩn Hi-Res Audio với frequency response 10Hz-40kHz'
    },
    {
        id: 'sx-pro-elite-thx',
        productId: 'sx-pro-elite',
        productName: 'TUNECORE SX Pro Elite',
        certificationStandard: certificationStandards[1], // THX Certified
        certificateNumber: 'THX-CERT-2024-SX001',
        issueDate: '2024-01-20T00:00:00Z',
        isActive: true,
        certificateFile: '/certificates/sx-pro-elite-thx.pdf',
        notes: 'THX Spatial Audio certified for gaming'
    },
    {
        id: 'sx-pro-elite-ce',
        productId: 'sx-pro-elite',
        productName: 'TUNECORE SX Pro Elite',
        certificationStandard: certificationStandards[3], // CE Marking
        certificateNumber: 'CE-2024-4T-001',
        issueDate: '2024-01-10T00:00:00Z',
        isActive: true,
        certificateFile: '/certificates/sx-pro-elite-ce.pdf'
    },
    {
        id: 'sx-pro-elite-fcc',
        productId: 'sx-pro-elite',
        productName: 'TUNECORE SX Pro Elite',
        certificationStandard: certificationStandards[4], // FCC
        certificateNumber: 'FCC-ID-2024-4THITEK-SX',
        issueDate: '2024-01-12T00:00:00Z',
        isActive: true,
        certificateFile: '/certificates/sx-pro-elite-fcc.pdf'
    },

    // TUNECORE SX Wireless Pro
    {
        id: 'sx-wireless-bluetooth',
        productId: 'sx-wireless-pro',
        productName: 'TUNECORE SX Wireless Pro',
        certificationStandard: certificationStandards[8], // Bluetooth SIG
        certificateNumber: 'BT-SIG-2024-4T-002',
        issueDate: '2024-01-08T00:00:00Z',
        isActive: true,
        certificateFile: '/certificates/sx-wireless-bluetooth.pdf',
        notes: 'Bluetooth 5.2 certified with low latency profile'
    },
    {
        id: 'sx-wireless-ce',
        productId: 'sx-wireless-pro',
        productName: 'TUNECORE SX Wireless Pro',
        certificationStandard: certificationStandards[3], // CE Marking
        certificateNumber: 'CE-2024-4T-002',
        issueDate: '2024-01-05T00:00:00Z',
        isActive: true,
        certificateFile: '/certificates/sx-wireless-ce.pdf'
    },

    // TUNECORE G+ Ultimate
    {
        id: 'g-plus-hi-res',
        productId: 'g-plus-ultimate',
        productName: 'TUNECORE G+ Ultimate',
        certificationStandard: certificationStandards[0], // Hi-Res Audio
        certificateNumber: 'JAS-HRA-2024-003',
        issueDate: '2024-02-01T00:00:00Z',
        isActive: true,
        certificateFile: '/certificates/g-plus-hi-res.pdf',
        notes: 'Premium Hi-Res certification với planar magnetic drivers'
    },
    {
        id: 'g-plus-dolby',
        productId: 'g-plus-ultimate',
        productName: 'TUNECORE G+ Ultimate',
        certificationStandard: certificationStandards[2], // Dolby Atmos
        certificateNumber: 'DOLBY-ATMOS-2024-4T-001',
        issueDate: '2024-02-05T00:00:00Z',
        isActive: true,
        certificateFile: '/certificates/g-plus-dolby.pdf',
        notes: 'Spatial Audio với haptic feedback integration'
    }
];

// Testing Laboratories
export const testingLaboratories: TestingLaboratory[] = [
    {
        id: 'intertek-vietnam',
        name: 'Intertek Vietnam',
        country: 'Vietnam',
        city: 'Ho Chi Minh City',
        address: '12th Floor, Vietcombank Tower, 5 Me Linh Square, District 1',
        website: 'https://www.intertek.com/vietnam',
        accreditations: ['ISO/IEC 17025', 'ILAC', 'APLAC'],
        specializations: ['Electronics Testing', 'EMC Testing', 'Safety Testing'],
        certificationStandards: ['ce-marking', 'fcc-certification', 'rohs-compliant'],
        contactInfo: {
            phone: '+84-28-3821-8218',
            email: 'vietnam.info@intertek.com'
        },
        isAccredited: true
    },
    {
        id: 'sgs-vietnam',
        name: 'SGS Vietnam',
        country: 'Vietnam',
        city: 'Ho Chi Minh City',
        address: 'Floor 11, Vincom Center, 72 Le Thanh Ton Street, District 1',
        website: 'https://www.sgs.com/en/locations/vietnam',
        accreditations: ['ISO/IEC 17025', 'VILAS', 'ILAC'],
        specializations: ['Product Testing', 'Certification', 'Quality Assurance'],
        certificationStandards: ['iso-9001', 'iso-14001', 'rohs-compliant'],
        contactInfo: {
            phone: '+84-28-3820-6666',
            email: 'vietnam.info@sgs.com'
        },
        isAccredited: true
    },
    {
        id: 'tvu-japan',
        name: 'TÜV Rheinland Japan',
        country: 'Japan',
        city: 'Tokyo',
        address: '1-4-1 Koraku, Bunkyo-ku, Tokyo 112-0004',
        website: 'https://www.tuv.com/japan',
        accreditations: ['JIS', 'ISO/IEC 17025', 'ILAC'],
        specializations: ['Audio Testing', 'Hi-Res Audio Certification'],
        certificationStandards: ['hi-res-audio', 'bluetooth-sig'],
        contactInfo: {
            phone: '+81-3-6973-6900',
            email: 'info@jp.tuv.com'
        },
        isAccredited: true
    }
];

// Compliance Requirements
export const complianceRequirements: ComplianceRequirement[] = [
    {
        id: 'eu-requirements',
        region: 'EU',
        productCategory: 'Audio Equipment',
        mandatoryCertifications: ['ce-marking', 'rohs-compliant'],
        recommendedCertifications: ['iso-9001', 'iso-14001'],
        marketAccessRequirements: [
            'CE marking affixed to product',
            'Declaration of Conformity',
            'Technical documentation',
            'EU representative appointed'
        ],
        lastUpdated: '2024-01-15T00:00:00Z',
        effectiveDate: '2024-01-01T00:00:00Z',
        notes: 'New EU regulations on electronic waste management effective 2024'
    },
    {
        id: 'us-requirements',
        region: 'US',
        productCategory: 'Consumer Electronics',
        mandatoryCertifications: ['fcc-certification'],
        recommendedCertifications: ['thx-certified', 'hi-res-audio'],
        marketAccessRequirements: [
            'FCC ID on product label',
            'Equipment authorization',
            'User manual with compliance statement',
            'Import/export documentation'
        ],
        lastUpdated: '2024-01-10T00:00:00Z',
        effectiveDate: '2024-01-01T00:00:00Z'
    },
    {
        id: 'vietnam-requirements',
        region: 'Asia',
        country: 'Vietnam',
        productCategory: 'Electronic Products',
        mandatoryCertifications: [],
        recommendedCertifications: ['iso-9001'],
        marketAccessRequirements: [
            'Import license for electronics',
            'Vietnamese product labeling',
            'Local distributor registration',
            'Tax compliance documentation'
        ],
        lastUpdated: '2024-01-20T00:00:00Z',
        effectiveDate: '2024-01-01T00:00:00Z',
        notes: 'Vietnam encourages but does not mandate international certifications for audio equipment'
    }
];

// Helper functions
export const getCertificationsByProductId = (productId: string): ProductCertification[] => {
    return productCertifications.filter(cert => cert.productId === productId);
};

export const getCertificationsByCategory = (categoryId: string): CertificationStandard[] => {
    return certificationStandards.filter(standard => standard.category === categoryId);
};

export const getCertificationById = (id: string): ProductCertification | undefined => {
    return productCertifications.find(cert => cert.id === id);
};

export const getStandardById = (id: string): CertificationStandard | undefined => {
    return certificationStandards.find(standard => standard.id === id);
};

export const getActiveCertifications = (): ProductCertification[] => {
    return productCertifications.filter(cert => cert.isActive);
};

export const getCertificationsByImportance = (importance: 'critical' | 'important' | 'beneficial'): CertificationStandard[] => {
    return certificationStandards.filter(standard => standard.importance === importance);
};

export const getComplianceByRegion = (region: string): ComplianceRequirement[] => {
    return complianceRequirements.filter(req => req.region === region);
};

export const searchCertifications = (query: string): CertificationStandard[] => {
    const searchTerm = query.toLowerCase();
    return certificationStandards.filter(standard =>
        standard.name.toLowerCase().includes(searchTerm) ||
        standard.fullName.toLowerCase().includes(searchTerm) ||
        standard.description.toLowerCase().includes(searchTerm)
    );
};

// Export counts
export const TOTAL_STANDARDS = certificationStandards.length;
export const TOTAL_CERTIFICATIONS = productCertifications.length;
export const TOTAL_CATEGORIES = certificationCategories.length;
export const TOTAL_LABS = testingLaboratories.length;