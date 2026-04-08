// API Constants - centralized API configuration and endpoints

// Base URLs
const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');
const stripApiSuffix = (value: string) => trimTrailingSlash(value).replace(/\/api(?:\/v[^/]+)?$/i, '');
const CANONICAL_API_ORIGIN = 'https://api.4thitek.vn';
const CANONICAL_API_VERSION = 'v1';
const CANONICAL_API_BASE_URL = `${CANONICAL_API_ORIGIN}/api/${CANONICAL_API_VERSION}`;

const isPlaceholderHost = (value: string) => {
    if (!value || value.startsWith('/')) {
        return false;
    }

    try {
        const parsed = new URL(value);
        return /(^|\.)example\.com$/i.test(parsed.hostname);
    } catch {
        return false;
    }
};

const normalizeConfiguredApiVersion = (value?: string | null) => {
    const trimmed = (value || '').trim();
    if (!trimmed || isPlaceholderHost(trimmed)) {
        return '';
    }
    if (/^\d+$/.test(trimmed)) {
        return `v${trimmed}`;
    }
    const lowered = trimmed.replace(/^\/+|\/+$/g, '').toLowerCase();
    if (!lowered) {
        return '';
    }
    if (/^v\d+$/.test(lowered)) {
        return lowered;
    }
    return lowered.startsWith('v') ? lowered : `v${lowered}`;
};

const normalizeConfiguredApiOrigin = (value?: string | null) => {
    const trimmed = (value || '').trim();
    if (!trimmed || isPlaceholderHost(trimmed)) {
        return '';
    }
    return stripApiSuffix(trimTrailingSlash(trimmed));
};

const normalizeConfiguredApiBaseUrl = (value?: string | null) => {
    const trimmed = (value || '').trim();
    if (!trimmed || isPlaceholderHost(trimmed)) {
        return '';
    }
    const normalized = trimTrailingSlash(trimmed);
    const versionMatch = normalized.match(/\/api\/(v[^/]+)$/i);
    if (versionMatch) {
        return `${stripApiSuffix(normalized)}/api/${normalizeConfiguredApiVersion(versionMatch[1])}`;
    }
    if (/\/api$/i.test(normalized)) {
        return `${normalized}/${CANONICAL_API_VERSION}`;
    }
    return `${stripApiSuffix(normalized)}/api/${CANONICAL_API_VERSION}`;
};

const deriveApiVersionFromBaseUrl = (value?: string | null) => {
    const normalized = normalizeConfiguredApiBaseUrl(value);
    const match = normalized.match(/\/api\/(v[^/]+)$/i);
    return match ? normalizeConfiguredApiVersion(match[1]) : '';
};

const joinApiBaseUrl = (origin: string, version: string) => {
    const effectiveVersion = normalizeConfiguredApiVersion(version) || CANONICAL_API_VERSION;
    return origin ? `${origin}/api/${effectiveVersion}` : `/api/${effectiveVersion}`;
};

const ensureLeadingSlash = (value: string) => (value.startsWith('/') ? value : `/${value}`);

export const API_ORIGIN =
    normalizeConfiguredApiOrigin(process.env.NEXT_PUBLIC_API_ORIGIN) ||
    normalizeConfiguredApiOrigin(process.env.INTERNAL_API_ORIGIN) ||
    normalizeConfiguredApiOrigin(process.env.NEXT_PUBLIC_API_BASE_URL) ||
    normalizeConfiguredApiOrigin(process.env.INTERNAL_API_BASE_URL) ||
    CANONICAL_API_ORIGIN;

export const API_VERSION =
    normalizeConfiguredApiVersion(process.env.NEXT_PUBLIC_API_VERSION) ||
    normalizeConfiguredApiVersion(process.env.INTERNAL_API_VERSION) ||
    deriveApiVersionFromBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL) ||
    deriveApiVersionFromBaseUrl(process.env.INTERNAL_API_BASE_URL) ||
    CANONICAL_API_VERSION;

export const API_BASE_URL =
    normalizeConfiguredApiBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL) ||
    normalizeConfiguredApiBaseUrl(process.env.INTERNAL_API_BASE_URL) ||
    joinApiBaseUrl(API_ORIGIN, API_VERSION) ||
    CANONICAL_API_BASE_URL;

export const buildApiBaseUrl = (version?: string) => {
    const normalizedVersion = normalizeConfiguredApiVersion(version);
    if (!normalizedVersion || normalizedVersion === API_VERSION) {
        return API_BASE_URL;
    }
    return joinApiBaseUrl(API_ORIGIN, normalizedVersion);
};

export const buildApiUrl = (path: string, options?: { version?: string }) => {
    const trimmed = path.trim();
    if (/^https?:\/\//i.test(trimmed)) {
        return trimmed;
    }

    const normalizedPath = ensureLeadingSlash(trimmed);
    if (normalizedPath.startsWith('/api/')) {
        return `${API_ORIGIN}${normalizedPath}`;
    }

    return `${buildApiBaseUrl(options?.version)}${normalizedPath}`;
};

// API Endpoints
export const API_ENDPOINTS = {
    // Blog endpoints
    BLOG: {
        BASE: '/blog',
        BLOGS: '/blog/blogs',
        BLOGS_LATEST: '/blog/blogs/latest',
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
        PRODUCTS_NEW: '/product/products/new',
        PRODUCTS_FEATURED: '/product/products/featured',
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

    SEARCH: '/search',

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
