export interface ProductSpecification {
    driver: string;
    frequencyResponse: string;
    impedance: string;
    sensitivity: string;
    maxPower: string;
    cable: string;
    weight: string;
    dimensions: string;
    connector: string;
    compatibility: string[];
}

export interface ProductFeature {
    id: string;
    title: string;
    subtitle?: string;
    description: string;
    icon?: string;
    image?: string;
}

export interface ProductVideo {
    id: string;
    title: string;
    description: string;
    url: string;
    thumbnail?: string;
    duration?: string;
    type: 'review' | 'unboxing' | 'tutorial' | 'demo';
}

export interface ProductImage {
    id: string;
    url: string;
    alt: string;
    type: 'main' | 'gallery' | 'angle' | 'detail';
    order: number;
}

export interface ProductWarranty {
    period: string;
    coverage: string[];
    conditions: string[];
    excludes: string[];
    registrationRequired: boolean;
}

export interface ProductAvailability {
    status: 'available' | 'pre-order' | 'coming-soon' | 'discontinued';
    releaseDate?: string;
    estimatedDelivery?: string;
}

// ProductSeries interface removed - using individual SKUs instead

export interface ProductCategory {
    id: string;
    name: string;
    description: string;
    slug: string;
}

export interface Product {
    id: string;
    name: string;
    subtitle: string;
    description: string;
    longDescription?: string;
    category: ProductCategory;

    // Media
    images: ProductImage[];
    videos: ProductVideo[];

    // Technical Details
    specifications: ProductSpecification;
    features: ProductFeature[];

    // Business Info
    availability: ProductAvailability;
    warranty: ProductWarranty;

    // Marketing
    highlights: string[];
    targetAudience: string[];
    useCases: string[];

    // Metadata
    popularity: number;
    rating?: number;
    reviewCount?: number;
    tags: string[];
    sku: string;

    // Related
    relatedProductIds: string[];
    accessories: string[];

    // SEO
    seoTitle?: string;
    seoDescription?: string;

    // Timestamps
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
}

// Simplified interface for product listing
export interface SimpleProduct {
    id: string;
    name: string;
    shortDescription: string;
    description: string;
    image: string;
    price?: number;
    category?: string;
    specifications?: unknown[];
    inStock?: boolean;
    featured?: boolean;
    rating?: number;
    reviews?: number;
    tags?: string[];
    videos?: unknown[];
    relatedProducts?: unknown[];
    wholesalePrice?: string;
}

export interface ProductFilter {
    category?: string[];
    availability?: string[];
    features?: string[];
    tags?: string[];
    targetAudience?: string[];
}

export interface ProductSort {
    field: 'name' | 'popularity' | 'rating' | 'releaseDate';
    direction: 'asc' | 'desc';
}

export interface ProductSearchParams {
    query?: string;
    filters?: ProductFilter;
    sort?: ProductSort;
    page?: number;
    limit?: number;
}

export interface ProductListResponse {
    products: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    filters: {
        availableCategories: ProductCategory[];
        availableFeatures: string[];
        availableTargetAudience: string[];
    };
}
