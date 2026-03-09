export interface AboutCardContent {
    key: string;
    title: string;
    description: string;
}

export interface AboutContent {
    purpose: {
        title: string;
        description: string;
    };
    cards: AboutCardContent[];
}

export interface ContactInfoCard {
    key: string;
    title: string;
    content: string[];
}

export interface ContactSocialItem {
    key: string;
    label: string;
    href: string;
}

export interface ContactContent {
    infoCards: ContactInfoCard[];
    social: {
        title: string;
        items: ContactSocialItem[];
    };
}

export interface CertificationItem {
    id: string;
    name: string;
    logo: string;
    description: string;
    issuedBy: string;
    link: string;
}

export interface CertificationContent {
    list: {
        title: string;
        description: string;
        issuedBy: string;
        details: string;
    };
    items: CertificationItem[];
}

export interface PolicySectionContent {
    intro?: string;
    commitment?: string;
    conditions?: string;
    conditionsList?: string[];
    contact?: string;
    processing?: string;
    notification?: string;
    shipping?: string;
    collectTitle?: string;
    collectList?: string[];
    purposeTitle?: string;
    purposeList?: string[];
    rights?: string;
    global?: string;
    application?: string;
    law?: string;
    validity?: string;
    compliance?: string;
    recommendation?: string;
    [key: string]: string | string[] | undefined;
}

export interface PolicyDataEntry {
    title: string;
    sections: Record<
        string,
        {
            title: string;
            content: PolicySectionContent;
        }
    >;
}

export interface PolicyContentPayload {
    title: string;
    descriptions: Record<string, string>;
    policies: Array<{
        key: string;
        label: string;
    }>;
    content: Record<string, PolicyDataEntry>;
}

export interface ResellerLocationsContent {
    locations: {
        cities: string[];
        districtsByCity: Record<string, string[]>;
    };
}
