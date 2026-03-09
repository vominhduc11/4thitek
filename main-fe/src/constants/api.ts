// API Constants - centralized API configuration and endpoints

// Base URLs
const publicApiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || '/api').replace(/\/$/, '');
const internalApiBaseUrl = (
    process.env.INTERNAL_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'https://api.4thitek.vn/api'
).replace(/\/$/, '');

export const API_BASE_URL = typeof window === 'undefined' ? internalApiBaseUrl : publicApiBaseUrl;

// API Endpoints
export const API_ENDPOINTS = {
    // Blog endpoints
    BLOG: {
        BASE: '/blog',
        BLOGS: '/blog/blogs',
        BLOGS_HOMEPAGE: '/blog/blogs/homepage',
        BLOGS_SEARCH: '/blog/blogs/search',
        BLOGS_RELATED: (id: string) => `/blog/blogs/related/${id}`,
        BLOG_BY_ID: (id: string) => `/blog/${id}`,
        CATEGORIES: '/blog/categories',
        CATEGORY_BLOGS: (categoryId: number) => `/blog/categories/${categoryId}/blogs`
    },

    // Product endpoints
    PRODUCT: {
        BASE: '/product',
        PRODUCTS: '/product/products',
        PRODUCTS_HOMEPAGE: '/product/products/homepage',
        PRODUCTS_SEARCH: '/product/products/search',
        PRODUCTS_RELATED: (id: string) => `/product/products/related/${id}`,
        PRODUCT_BY_ID: (id: string) => `/product/${id}`
    },

    // User/Dealer endpoints
    USER: {
        DEALERS: '/user/dealer'
    },

    // Warranty endpoints
    WARRANTY: {
        CHECK: (serialNumber: string) => `/warranty/check/${serialNumber}`
    },

    CONTENT: {
        SECTION: (section: string, lang: string) => `/content/${section}?lang=${encodeURIComponent(lang)}`
    },

    // Health check
    HEALTH: '/health'
} as const;

// Default API parameters
export const API_DEFAULTS = {
    // Request timeouts (in milliseconds)
    TIMEOUTS: {
        DEFAULT: 10000,     // 10 seconds
        UPLOAD: 30000,      // 30 seconds
        DOWNLOAD: 60000     // 60 seconds
    },

    // Retry configuration
    RETRY: {
        MAX_RETRIES: 3,
        BASE_DELAY: 1000,   // 1 second
        MAX_DELAY: 10000,   // 10 seconds
        BACKOFF_FACTOR: 2
    },

    // Default field sets for common requests
    FIELDS: {
        BLOG_LIST: 'id,title,description,image,category,createdAt',
        BLOG_DETAIL: 'id,title,description,image,category,createdAt,introduction,showOnHomepage',
        PRODUCT_LIST: 'id,sku,name,shortDescription,image,price',
        PRODUCT_DETAIL: 'id,sku,name,shortDescription,description,image,price,specifications,videos',
        SEARCH: {
            BLOG: 'id,title,description,image,category',
            PRODUCT: 'id,sku,name,shortDescription,image'
        }
    },

    // Default limits
    LIMITS: {
        HOMEPAGE_BLOGS: 6,
        HOMEPAGE_PRODUCTS: 4,
        SEARCH_RESULTS: 10,
        RELATED_ITEMS: 4,
        PAGINATION: 20
    }
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_ALLOWED: 405,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504
} as const;

// Request headers
export const DEFAULT_HEADERS = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
} as const;

// Error messages
export const API_ERROR_MESSAGES = {
    NETWORK_ERROR: 'Network connection failed',
    TIMEOUT_ERROR: 'Request timeout',
    SERVER_ERROR: 'Server error occurred',
    NOT_FOUND: 'Resource not found',
    UNAUTHORIZED: 'Authentication required',
    FORBIDDEN: 'Access denied',
    VALIDATION_ERROR: 'Invalid data provided',
    UNKNOWN_ERROR: 'An unexpected error occurred'
} as const;

// Cache keys
export const CACHE_KEYS = {
    BLOGS: 'blogs',
    PRODUCTS: 'products',
    BLOG_CATEGORIES: 'blog_categories',
    DEALERS: 'dealers',
    SEARCH_RESULTS: (query: string) => `search_${query}`,
    BLOG_DETAIL: (id: string) => `blog_${id}`,
    PRODUCT_DETAIL: (id: string) => `product_${id}`
} as const;

// Cache durations (in milliseconds)
export const CACHE_DURATION = {
    SHORT: 5 * 60 * 1000,      // 5 minutes
    MEDIUM: 30 * 60 * 1000,    // 30 minutes
    LONG: 60 * 60 * 1000,      // 1 hour
    VERY_LONG: 24 * 60 * 60 * 1000  // 24 hours
} as const;
