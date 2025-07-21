export interface CertificationStandard {
    id: string;
    name: string;
    fullName: string;
    description: string;
    issuingOrganization: string;
    category: 'audio-quality' | 'safety' | 'environmental' | 'manufacturing' | 'international';
    logo?: string;
    website?: string;
    importance: 'critical' | 'important' | 'beneficial';
}

export interface ProductCertification {
    id: string;
    productId: string;
    productName: string;
    certificationStandard: CertificationStandard;
    certificateNumber: string;
    issueDate: string;
    expiryDate?: string;
    isActive: boolean;
    certificateFile?: string; // URL to certificate document
    testReport?: string; // URL to test report
    notes?: string;
}

export interface CertificationCategory {
    id: string;
    name: string;
    description: string;
    icon: string;
    color: string;
    standards: string[]; // IDs of certification standards
    importance: number; // 1-5 scale
}

export interface CertificationProcess {
    id: string;
    standardId: string;
    processName: string;
    description: string;
    steps: {
        stepNumber: number;
        title: string;
        description: string;
        duration: string;
        responsible: 'manufacturer' | 'testing-lab' | 'certification-body';
        requiredDocuments?: string[];
    }[];
    totalDuration: string;
    cost?: {
        min: number;
        max: number;
        currency: string;
    };
    renewalRequired: boolean;
    renewalPeriod?: string;
}

export interface TestingLaboratory {
    id: string;
    name: string;
    country: string;
    city: string;
    address: string;
    website?: string;
    accreditations: string[];
    specializations: string[];
    certificationStandards: string[]; // Standards they can test for
    contactInfo: {
        phone: string;
        email: string;
    };
    isAccredited: boolean;
}

export interface CertificationTimeline {
    id: string;
    productId: string;
    certificationId: string;
    milestones: {
        date: string;
        title: string;
        description: string;
        status: 'completed' | 'in-progress' | 'pending' | 'failed';
        documents?: string[];
    }[];
    currentStatus: 'planning' | 'testing' | 'review' | 'certified' | 'expired' | 'withdrawn';
    estimatedCompletion?: string;
    actualCompletion?: string;
}

export interface ComplianceRequirement {
    id: string;
    region: string; // e.g., 'EU', 'US', 'Asia', 'Global'
    country?: string;
    productCategory: string;
    mandatoryCertifications: string[]; // Required certification IDs
    recommendedCertifications: string[]; // Optional but beneficial
    marketAccessRequirements: string[];
    lastUpdated: string;
    effectiveDate: string;
    notes?: string;
}
