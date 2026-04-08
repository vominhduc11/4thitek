import {
    BlogCategory,
    BlogDetailResponse,
    BlogListResponse,
    ProductDetailResponse,
    ProductListResponse,
    SearchCombinedResponse
} from '@/types/api';
import { WarrantyCheckData } from '@/types/warranty';
import { API_BASE_URL, API_DEFAULTS, API_ENDPOINTS } from '@/constants/api';

type Language = 'en' | 'vi';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH';

type RequestOptions = {
    method?: RequestMethod;
    token?: string;
    body?: unknown;
    params?: Record<string, string | number | boolean | null | undefined>;
    cache?: RequestCache;
    revalidate?: number;
    signal?: AbortSignal;
};

type ProductSummaryPayload = {
    id: number;
    name: string;
    sku: string;
    shortDescription: string;
    image: string;
    price?: number;
    stock?: number;
    warrantyMonths?: number;
};

type ProductDetailPayload = {
    id: number;
    name: string;
    sku: string;
    shortDescription: string;
    description: string;
    image: string;
    price?: number;
    specifications?: string | null;
    videos?: string | null;
    descriptions?: string | null;
    warrantyMonths?: number;
};

type BlogSummaryPayload = {
    id: number;
    title: string;
    description: string;
    image: string;
    category: string;
    createdAt: string;
};

type BlogDetailPayload = {
    id: number;
    title: string;
    description: string;
    image: string;
    category: string;
    createdAt: string;
    updatedAt?: string;
    introduction?: string | null;
    showOnHomepage?: boolean;
};

export type PublicDealerPayload = {
    id: number;
    businessName: string;
    contactName: string;
    address: string;
    city: string;
    district: string;
    phone: string;
    email: string;
};

export type PagedPayload<T> = {
    items: T[];
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
    sortBy: string;
};

export interface ApiResponse<T> {
    data: T | null;
    success: boolean;
    error?: string;
}

class ApiService {
    private language: Language = 'vi';

    setLanguage(lang: Language): void {
        this.language = lang;
    }

    private wrapImage(url?: string | null): string {
        if (!url) return '';
        return JSON.stringify({ imageUrl: url });
    }

    private buildPath(path: string, params?: RequestOptions['params']): string {
        if (!params) {
            return path;
        }

        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value === undefined || value === null || value === '') {
                return;
            }
            searchParams.set(key, String(value));
        });

        const serialized = searchParams.toString();
        return serialized ? `${path}?${serialized}` : path;
    }

    private async request<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
        const { method = 'GET', token, body, params, cache, revalidate, signal } = options;
        const isPublicGet = method === 'GET' && !token && body === undefined;

        const requestInit: RequestInit & { next?: { revalidate: number } } = {
            method,
            headers: {
                Accept: 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
                ...(body === undefined ? {} : { 'Content-Type': 'application/json' })
            },
            body: body === undefined ? undefined : JSON.stringify(body),
            cache: cache ?? (isPublicGet ? 'force-cache' : 'no-store')
        };
        if (typeof window === 'undefined' && isPublicGet && revalidate !== undefined) {
            requestInit.next = { revalidate };
        }

        // Merge caller's signal with a timeout abort controller
        const timeoutMs = API_DEFAULTS.TIMEOUTS.DEFAULT;
        const timeoutController = new AbortController();
        const timeoutId = setTimeout(() => timeoutController.abort(), timeoutMs);

        if (signal) {
            signal.addEventListener('abort', () => timeoutController.abort());
        }
        requestInit.signal = timeoutController.signal;

        try {
            const response = await fetch(`${API_BASE_URL}${this.buildPath(path, params)}`, requestInit);
            clearTimeout(timeoutId);

            let payload: ApiResponse<T> | null = null;
            try {
                payload = (await response.json()) as ApiResponse<T>;
            } catch {
                payload = null;
            }

            if (!response.ok || payload?.success === false) {
                const statusCode = response.status;
                const errorMsg = payload?.error || `Request failed: ${statusCode}`;
                throw Object.assign(new Error(errorMsg), { statusCode });
            }

            return {
                success: true,
                data: payload?.data ?? null,
                error: payload?.error
            };
        } catch (err) {
            clearTimeout(timeoutId);
            throw err;
        }
    }

    private toProductListItem(product: ProductSummaryPayload) {
        return {
            id: String(product.id),
            name: product.name,
            sku: product.sku,
            shortDescription: product.shortDescription,
            image: this.wrapImage(product.image),
            price: product.price
        };
    }

    private toBlogListItem(post: BlogSummaryPayload) {
        return {
            id: String(post.id),
            title: post.title,
            description: post.description,
            image: this.wrapImage(post.image),
            category: post.category,
            createdAt: post.createdAt
        };
    }

    async fetchNewProducts(): Promise<ApiResponse<ProductListResponse['data']>> {
        const response = await this.request<ProductSummaryPayload[]>(API_ENDPOINTS.PRODUCT.PRODUCTS_NEW, {
            revalidate: 3600
        });
        return {
            success: true,
            data: (response.data ?? []).map((product) => this.toProductListItem(product))
        };
    }

    async fetchProducts(): Promise<ApiResponse<ProductListResponse['data']>> {
        const response = await this.request<ProductSummaryPayload[]>(API_ENDPOINTS.PRODUCT.PRODUCTS, {
            revalidate: 3600
        });
        return {
            success: true,
            data: (response.data ?? []).map((product) => this.toProductListItem(product))
        };
    }

    async fetchProductById(id: string): Promise<ApiResponse<ProductDetailResponse['data']>> {
        const response = await this.request<ProductDetailPayload>(API_ENDPOINTS.PRODUCT.PRODUCT_BY_ID(id), {
            revalidate: 3600
        });
        if (!response.data) {
            return { success: false, data: null, error: 'Product not found' };
        }

        return {
            success: true,
            data: {
                id: String(response.data.id),
                name: response.data.name,
                sku: response.data.sku,
                shortDescription: response.data.shortDescription,
                description: response.data.description,
                image: this.wrapImage(response.data.image),
                price: response.data.price || 0,
                specifications: response.data.specifications || '[]',
                videos: response.data.videos || '[]',
                category: '4thitek',
                descriptions:
                    response.data.descriptions ||
                    JSON.stringify([
                        {
                            type: 'description',
                            text: response.data.description
                        }
                    ])
            }
        };
    }

    async fetchRelatedProducts(productId: string, limit: number = 4): Promise<ApiResponse<ProductListResponse['data']>> {
        const response = await this.request<ProductSummaryPayload[]>(
            API_ENDPOINTS.PRODUCT.PRODUCTS_RELATED(productId),
            {
                revalidate: 3600,
                params: { limit }
            }
        );
        return {
            success: true,
            data: (response.data ?? []).map((product) => this.toProductListItem(product))
        };
    }

    async fetchLatestBlogs(): Promise<ApiResponse<BlogListResponse['data']>> {
        const response = await this.request<BlogSummaryPayload[]>(API_ENDPOINTS.BLOG.BLOGS_LATEST, {
            revalidate: 1800
        });
        return {
            success: true,
            data: (response.data ?? []).map((blog) => this.toBlogListItem(blog))
        };
    }

    async fetchBlogs(fields?: string): Promise<ApiResponse<BlogListResponse['data']>> {
        void fields;
        const response = await this.request<BlogSummaryPayload[]>(API_ENDPOINTS.BLOG.BLOGS, {
            revalidate: 1800
        });
        return {
            success: true,
            data: (response.data ?? []).map((blog) => this.toBlogListItem(blog))
        };
    }

    async fetchBlogCategories(): Promise<ApiResponse<BlogCategory[]>> {
        const response = await this.request<Array<{ id: number; name: string }>>(API_ENDPOINTS.BLOG.CATEGORIES, {
            revalidate: 1800
        });
        return {
            success: true,
            data: (response.data ?? []).map((category) => ({
                id: String(category.id),
                name: category.name
            }))
        };
    }

    async fetchBlogsByCategory(categoryId: string, fields?: string): Promise<ApiResponse<unknown[]>> {
        void fields;
        const response = await this.request<BlogSummaryPayload[]>(
            API_ENDPOINTS.BLOG.CATEGORY_BLOGS(Number(categoryId)),
            { revalidate: 1800 }
        );
        return {
            success: true,
            data: (response.data ?? []).map((blog) => this.toBlogListItem(blog))
        };
    }

    async fetchRelatedBlogs(blogId: string, limit: number = 4, fields?: string): Promise<ApiResponse<unknown[]>> {
        void fields;
        const response = await this.request<BlogSummaryPayload[]>(
            `${API_ENDPOINTS.BLOG.BLOGS_RELATED(blogId)}?limit=${limit}`,
            { revalidate: 1800 }
        );
        return {
            success: true,
            data: (response.data ?? []).map((blog) => this.toBlogListItem(blog))
        };
    }

    async fetchBlogById(id: string): Promise<ApiResponse<BlogDetailResponse['data']>> {
        const response = await this.request<BlogDetailPayload>(API_ENDPOINTS.BLOG.BLOG_BY_ID(id), {
            revalidate: 1800
        });
        if (!response.data) {
            return { success: false, data: null, error: 'Blog not found' };
        }

        return {
            success: true,
            data: {
                id: String(response.data.id),
                title: response.data.title,
                description: response.data.description,
                image: this.wrapImage(response.data.image),
                category: response.data.category,
                createdAt: response.data.createdAt,
                introduction: response.data.introduction || '[]',
                showOnHomepage: Boolean(response.data.showOnHomepage)
            }
        };
    }

    async fetchResellers(): Promise<ApiResponse<{ dealers: PublicDealerPayload[] }>> {
        return this.request<{ dealers: PublicDealerPayload[] }>(API_ENDPOINTS.USER.DEALERS, {
            revalidate: 3600
        });
    }

    async checkWarranty(serialNumber: string): Promise<ApiResponse<WarrantyCheckData>> {
        return this.request<WarrantyCheckData>(API_ENDPOINTS.WARRANTY.CHECK(serialNumber), {
            cache: 'no-store'
        });
    }

    async fetchContentSection<T>(section: string, lang: string = this.language): Promise<ApiResponse<T>> {
        return this.request<T>(API_ENDPOINTS.CONTENT.SECTION(section, lang), {
            revalidate: 86400
        });
    }

    async searchProducts(
        query: string,
        limit: number = 10,
        filters?: { minPrice?: number; maxPrice?: number },
        signal?: AbortSignal
    ) {
        const response = await this.request<ProductSummaryPayload[]>(API_ENDPOINTS.PRODUCT.PRODUCTS_SEARCH, {
            cache: 'no-store',
            params: {
                query: query.trim() || undefined,
                minPrice: filters?.minPrice,
                maxPrice: filters?.maxPrice
            },
            signal
        });
        const results = (response.data ?? [])
            .map((product) => this.toProductListItem(product))
            .slice(0, limit);
        return { success: true, data: results };
    }

    async searchBlogs(query: string, limit: number = 10) {
        const response = await this.request<BlogSummaryPayload[]>(
            `${API_ENDPOINTS.BLOG.BLOGS_SEARCH}?query=${encodeURIComponent(query)}`,
            { cache: 'no-store' }
        );
        return {
            success: true,
            data: (response.data ?? []).slice(0, limit).map((blog) => ({
                id: String(blog.id),
                title: blog.title,
                description: blog.description,
                image: this.wrapImage(blog.image),
                category: blog.category
            }))
        };
    }

    async search(query: string, limit: number = 10): Promise<ApiResponse<SearchCombinedResponse['data']>> {
        const response = await this.request<{
            products?: ProductSummaryPayload[];
            blogs?: BlogSummaryPayload[];
        }>(API_ENDPOINTS.SEARCH, {
            cache: 'no-store',
            params: {
                query: query.trim() || undefined,
                limit
            }
        });

        return {
            success: true,
            data: {
                products: (response.data?.products ?? []).map((product) => this.toProductListItem(product)),
                blogs: (response.data?.blogs ?? []).map((blog) => ({
                    id: String(blog.id),
                    title: blog.title,
                    description: blog.description,
                    image: this.wrapImage(blog.image),
                    category: blog.category
                }))
            }
        };
    }

    async healthCheck(): Promise<boolean> {
        const response = await this.request<{ status: string }>(API_ENDPOINTS.HEALTH);
        return response.data?.status === 'ok';
    }

}

export const apiService = new ApiService();
