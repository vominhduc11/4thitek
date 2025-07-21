export interface ContactInfo {
    id: string;
    type: 'phone' | 'email' | 'address' | 'social' | 'website';
    label: string;
    value: string;
    icon?: string;
    isPublic: boolean;
    isPrimary: boolean;
    department?: string;
    workingHours?: string;
    notes?: string;
}

export interface SocialMedia {
    id: string;
    platform: 'facebook' | 'instagram' | 'youtube' | 'linkedin' | 'twitter' | 'tiktok' | 'zalo';
    name: string;
    url: string;
    handle?: string; // @username
    followers?: number;
    isVerified: boolean;
    isActive: boolean;
    description?: string;
    icon: string;
    color: string;
}

export interface OfficeLocation {
    id: string;
    name: string;
    type: 'headquarters' | 'branch' | 'warehouse' | 'service-center' | 'showroom';
    address: {
        street: string;
        district: string;
        city: string;
        province: string;
        country: string;
        postalCode?: string;
    };
    coordinates?: {
        lat: number;
        lng: number;
    };
    contactInfo: ContactInfo[];
    workingHours: {
        monday?: string;
        tuesday?: string;
        wednesday?: string;
        thursday?: string;
        friday?: string;
        saturday?: string;
        sunday?: string;
        holidays?: string;
    };
    services: string[];
    languages: string[];
    facilities: string[];
    isMainOffice: boolean;
    image?: string;
}

export interface Department {
    id: string;
    name: string;
    description: string;
    contactInfo: ContactInfo[];
    responsibilities: string[];
    teamMembers?: {
        name: string;
        title: string;
        email?: string;
        phone?: string;
        avatar?: string;
    }[];
    workingHours?: string;
}

export interface ContactForm {
    id: string;
    name: string;
    description: string;
    fields: {
        id: string;
        name: string;
        label: string;
        type: 'text' | 'email' | 'phone' | 'select' | 'textarea' | 'checkbox' | 'radio';
        required: boolean;
        placeholder?: string;
        options?: string[]; // for select, checkbox, radio
        validation?: {
            minLength?: number;
            maxLength?: number;
            pattern?: string;
        };
    }[];
    submitSettings: {
        successMessage: string;
        errorMessage: string;
        redirectUrl?: string;
        emailNotification: boolean;
        autoReply: boolean;
    };
    isActive: boolean;
}

export interface ContactFAQ {
    id: string;
    category: 'general' | 'products' | 'support' | 'business' | 'technical';
    question: string;
    answer: string;
    tags: string[];
    order: number;
    isVisible: boolean;
    lastUpdated: string;
    relatedFAQs?: string[];
}

export interface BusinessHours {
    day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    dayName: string;
    isOpen: boolean;
    openTime?: string;
    closeTime?: string;
    breaks?: {
        startTime: string;
        endTime: string;
        description: string;
    }[];
    notes?: string;
}

export interface EmergencyContact {
    id: string;
    name: string;
    role: string;
    phone: string;
    email?: string;
    availability: string; // e.g., "24/7", "Weekends only"
    languages: string[];
    specialization: string[];
}
