export interface ResellerTier {
    id: string;
    name: string;
    description: string;
    level: number;
    requirements: string[];
    benefits: string[];
    commission: number;
    minimumOrder: number;
    color?: string;
    icon?: string;
}

export interface ResellerLocation {
    id: string;
    name: string;
    type: 'store' | 'online' | 'distributor';
    address?: {
        street: string;
        city: string;
        province: string;
        country: string;
        postalCode?: string;
    };
    coordinates?: {
        lat: number;
        lng: number;
    };
    contactInfo: {
        phone?: string;
        email?: string;
        website?: string;
    };
    workingHours?: {
        [key: string]: string;
    };
    tier: ResellerTier;
    isActive: boolean;
    joinedDate: string;
    lastUpdated?: string;
}

export interface ResellerRequirement {
    id: string;
    title: string;
    description: string;
    type: 'financial' | 'operational' | 'technical' | 'legal';
    isRequired: boolean;
    applicableTiers: string[];
    details?: string[];
}

export interface ResellerBenefit {
    id: string;
    title: string;
    description: string;
    type: 'financial' | 'marketing' | 'technical' | 'operational';
    applicableTiers: string[];
    value?: string;
    details?: string[];
}

export interface ResellerSupport {
    id: string;
    type: 'training' | 'marketing' | 'technical' | 'sales';
    title: string;
    description: string;
    availability: string;
    contactInfo?: {
        phone?: string;
        email?: string;
        person?: string;
    };
    materials?: string[];
}

export interface ResellerApplication {
    id: string;
    businessName: string;
    contactPerson: string;
    email: string;
    phone: string;
    address: {
        street: string;
        city: string;
        province: string;
        country: string;
        postalCode?: string;
    };
    businessType: string;
    targetTier: string;
    expectedVolume: number;
    experience: string;
    status: 'pending' | 'approved' | 'rejected' | 'under_review';
    submittedAt: string;
    reviewedAt?: string;
    notes?: string;
}
