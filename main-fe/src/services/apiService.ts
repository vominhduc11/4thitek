import {
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

    async fetchProducts(): Promise<ApiResponse<ProductListResponse['data']>> {
        const response = await this.request<ProductSummaryPayload[]>(API_ENDPOINTS.PRODUCT.PRODUCTS, {
            revalidate: 3600
        });
        return {
            success: true,
            data: (response.data ?? []).map((product) => this.toProductListItem(product))
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

    async search(query: string, limit: number = 10): Promise<ApiResponse<SearchCombinedResponse['data']>> {
        const response = await this.request<{
            products?: ProductSummaryPayload[];
            blogs?: unknown[];
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
                blogs: []
            }
        };
    }
}

export const apiService = new ApiService();
