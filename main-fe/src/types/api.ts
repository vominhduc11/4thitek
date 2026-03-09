// Common API response types

export interface BaseApiResponse {
    success: boolean;
    message?: string;
    error?: string;
}

export interface BlogResponse extends BaseApiResponse {
    data: {
        id: string;
        title: string;
        description: string;
        content: string;
        image: string;
        category: string;
        createdAt: string;
        updatedAt: string;
    };
}

export interface ProductResponse extends BaseApiResponse {
    data: {
        id: string;
        name: string;
        sku?: string;
        shortDescription: string;
        description: string;
        image: string;
        price: number;
        specifications: string;
        videos: string;
    };
}

export interface BlogListResponse extends BaseApiResponse {
    data: Array<{
        id: string;
        title: string;
        description: string;
        image: string;
        category: string;
        createdAt: string;
    }>;
}

export interface ProductListResponse extends BaseApiResponse {
    data: Array<{
        id: string;
        name: string;
        sku?: string;
        shortDescription: string;
        image: string;
        price?: number;
    }>;
}

export interface ApiProduct {
    id: string;
    name: string;
    sku?: string;
    shortDescription: string;
    image: string;
}

export interface BlogCategory {
    id: string;
    name: string;
}

export interface BlogCategoriesResponse extends BaseApiResponse {
    data: BlogCategory[];
}

export interface BlogDetailResponse extends BaseApiResponse {
    data: {
        id: string;
        title: string;
        description: string;
        image: string;
        category: string;
        createdAt: string;
        introduction: string;
        showOnHomepage: boolean;
    };
}

// Search API response types
export interface SearchProductResponse extends BaseApiResponse {
    data: Array<{
        id: string;
        name: string;
        sku?: string;
        shortDescription: string;
        image: string;
    }>;
}

export interface SearchBlogResponse extends BaseApiResponse {
    data: Array<{
        id: string;
        title: string;
        description: string;
        image: string;
        category: string;
    }>;
}

export interface SearchCombinedResponse extends BaseApiResponse {
    data: {
        products: Array<{
            id: string;
            name: string;
            sku?: string;
            shortDescription: string;
            image: string;
        }>;
        blogs: Array<{
            id: string;
            title: string;
            description: string;
            image: string;
            category: string;
        }>;
    };
}

// Image data interface for parsing JSON strings
export interface ImageData {
    imageUrl: string;
    public_id: string;
    file_id?: string;
}

// Detailed product response
export interface ProductDetailResponse extends BaseApiResponse {
    data: {
        id: string;
        name: string;
        sku?: string;
        shortDescription: string;
        description: string;
        image: string;
        price: number;
        specifications: Array<{
            title: string;
            value: string;
        }> | string;
        videos: Array<{
            title: string;
            url: string;
        }> | string;
        category: string;
        features?: string[];
        tags?: string[];
        descriptions?: string;
    };
}
