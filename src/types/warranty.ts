export interface WarrantyTerm {
    id: string;
    title: string;
    description: string;
    category: 'coverage' | 'condition' | 'exclusion' | 'procedure';
    priority: number;
}

export interface WarrantyPlan {
    id: string;
    name: string;
    duration: string; // e.g., "12 months", "24 months"
    durationInMonths: number;
    description: string;
    features: string[];
    terms: WarrantyTerm[];
    registrationRequired: boolean;
    transferable: boolean;
    serviceLocations: string[]; // Service center locations
    contactInfo: {
        hotline: string;
        email: string;
        workingHours: string;
    };
}

export interface ServiceCenter {
    id: string;
    name: string;
    address: string;
    city: string;
    district: string;
    province: string;
    phone: string;
    email?: string;
    workingHours: string;
    services: string[];
    coordinates?: {
        lat: number;
        lng: number;
    };
    isOfficial: boolean;
}

export interface WarrantyProcess {
    id: string;
    title: string;
    description: string;
    steps: {
        stepNumber: number;
        title: string;
        description: string;
        estimatedTime: string;
        requiredDocuments?: string[];
        notes?: string[];
    }[];
    totalEstimatedTime: string;
    applicableProducts: string[]; // Product series or categories
}

export interface WarrantyClaim {
    id: string;
    claimNumber: string;
    productId: string;
    productName: string;
    serialNumber: string;
    purchaseDate: string;
    claimDate: string;
    issueDescription: string;
    status: 'submitted' | 'under-review' | 'approved' | 'in-repair' | 'completed' | 'rejected';
    estimatedCompletionDate?: string;
    serviceCenter: ServiceCenter;
    contactPerson: {
        name: string;
        phone: string;
        email: string;
    };
    updates: {
        date: string;
        status: string;
        notes: string;
        updatedBy: string;
    }[];
}

export interface WarrantyRegistration {
    id: string;
    productId: string;
    serialNumber: string;
    purchaseDate: string;
    purchaseLocation: string;
    customerInfo: {
        name: string;
        email: string;
        phone: string;
        address: string;
    };
    registrationDate: string;
    warrantyPlan: WarrantyPlan;
    warrantyExpiry: string;
    isActive: boolean;
}

export interface WarrantyFAQ {
    id: string;
    category: 'general' | 'registration' | 'claims' | 'service' | 'products';
    question: string;
    answer: string;
    tags: string[];
    popularity: number;
    relatedFAQs?: string[];
    lastUpdated: string;
}

export interface WarrantyPolicy {
    id: string;
    title: string;
    version: string;
    effectiveDate: string;
    lastUpdated: string;
    content: {
        section: string;
        subsections: {
            title: string;
            content: string;
            items?: string[];
        }[];
    }[];
    applicableProducts: string[];
    applicableRegions: string[];
}

// API Response types for warranty check
export interface WarrantyCheckResponse {
    success: boolean;
    message: string;
    data: WarrantyCheckData;
}

export interface WarrantyCheckData {
    id: number;
    idProductSerial: number;
    idCustomer: number | null;
    warrantyCode: string;
    status: 'ACTIVE' | 'EXPIRED' | 'INVALID';
    purchaseDate: string;
    createdAt: string;
    customer: {
        name: string;
        phone: string;
        email: string;
        address: string;
    };
    productSerial: {
        id: number;
        serialNumber: string;
        productName: string;
        productSku: string;
        status: string;
        image: string;
    };
}

// UI interface for warranty check results
export interface WarrantyInfo {
    serialNumber: string;
    productName: string;
    purchaseDate: string;
    warrantyStatus: 'active' | 'expired' | 'invalid';
    warrantyEndDate: string;
    remainingDays: number;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    customerAddress?: string;
    dealerName?: string;
    warrantyCode?: string;
    warrantyPeriodMonths?: number;
    productSku?: string;
    productImage?: string;
}
