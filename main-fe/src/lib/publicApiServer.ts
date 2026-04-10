import { API_ENDPOINTS, buildApiUrl } from '@/constants/api';

type Envelope<T> = {
    success: boolean;
    data: T | null;
    error?: string;
};

type PublicApiRequestOptions = {
    version?: string;
};

async function fetchEnvelope<T>(
    path: string,
    revalidate: number,
    options?: PublicApiRequestOptions
): Promise<Envelope<T>> {
    try {
        const response = await fetch(buildApiUrl(path, { version: options?.version }), {
            cache: 'force-cache',
            next: { revalidate },
            headers: {
                Accept: 'application/json'
            }
        });

        const payload = (await response.json().catch(() => null)) as Envelope<T> | null;
        if (!response.ok || !payload) {
            return {
                success: false,
                data: null,
                error: payload?.error || `Failed to fetch ${path}`
            };
        }
        return payload;
    } catch (error) {
        return {
            success: false,
            data: null,
            error: error instanceof Error ? error.message : `Failed to fetch ${path}`
        };
    }
}

export const publicApiServer = {
    fetchHomepageProducts: (options?: PublicApiRequestOptions) =>
        fetchEnvelope<
            Array<{ id: number | string; name: string; sku?: string; shortDescription: string; image: string; price?: number }>
        >(API_ENDPOINTS.PRODUCT.PRODUCTS_HOMEPAGE, 60, options),
    fetchNewProducts: (options?: PublicApiRequestOptions) => publicApiServer.fetchHomepageProducts(options),
    fetchFeaturedProducts: (options?: PublicApiRequestOptions) =>
        fetchEnvelope<
            Array<{ id: number | string; name: string; sku?: string; shortDescription: string; image: string; price?: number }>
        >(API_ENDPOINTS.PRODUCT.PRODUCTS_FEATURED, 60, options),
    fetchProducts: (options?: PublicApiRequestOptions) =>
        fetchEnvelope<
            Array<{
                id: number | string;
                name: string;
                sku?: string;
                shortDescription: string;
                image: string;
                price?: number;
                stock?: number;
                warrantyMonths?: number;
            }>
        >(API_ENDPOINTS.PRODUCT.PRODUCTS, 60, options),
    fetchProductById: (id: string, options?: PublicApiRequestOptions) =>
        fetchEnvelope<{
            id: number | string;
            name: string;
            sku?: string;
            shortDescription: string;
            description: string;
            image: string;
            specifications: Array<Record<string, unknown>>;
            videos: Array<Record<string, unknown>>;
            descriptions?: Array<Record<string, unknown>>;
            price?: number;
            stock?: number;
            warrantyMonths?: number;
        }>(API_ENDPOINTS.PRODUCT.PRODUCT_BY_ID(id), 60, options),
    fetchRelatedProducts: (id: string, limit = 4, options?: PublicApiRequestOptions) =>
        fetchEnvelope<
            Array<{
                id: number | string;
                name: string;
                sku?: string;
                shortDescription: string;
                image: string;
                price?: number;
                stock?: number;
                warrantyMonths?: number;
            }>
        >(`${API_ENDPOINTS.PRODUCT.PRODUCTS_RELATED(id)}?limit=${limit}`, 60, options),
    fetchLatestBlogs: (options?: PublicApiRequestOptions) =>
        fetchEnvelope<
            Array<{ id: number | string; title: string; description: string; image: string; category: string; createdAt: string }>
        >(API_ENDPOINTS.BLOG.BLOGS_LATEST, 1800, options),
    fetchBlogs: (options?: PublicApiRequestOptions) =>
        fetchEnvelope<Array<{ id: number | string; title: string; description: string; image: string; category: string; createdAt: string }>>(
            API_ENDPOINTS.BLOG.BLOGS,
            1800,
            options
        ),
    fetchBlogCategories: (options?: PublicApiRequestOptions) =>
        fetchEnvelope<Array<{ id: number | string; name: string }>>(API_ENDPOINTS.BLOG.CATEGORIES, 1800, options),
    fetchBlogById: (id: string, options?: PublicApiRequestOptions) =>
        fetchEnvelope<{
            id: number | string;
            title: string;
            description: string;
            image: string;
            category: string;
            createdAt: string;
            updatedAt?: string;
            introduction?: string;
            showOnHomepage?: boolean;
        }>(API_ENDPOINTS.BLOG.BLOG_BY_ID(id), 1800, options),
    fetchRelatedBlogs: (id: string, limit = 4, options?: PublicApiRequestOptions) =>
        fetchEnvelope<
            Array<{ id: number | string; title: string; description: string; image: string; category: string; createdAt: string }>
        >(`${API_ENDPOINTS.BLOG.BLOGS_RELATED(id)}?limit=${limit}`, 1800, options),
    fetchContentSection: <T>(section: string, language: string, options?: PublicApiRequestOptions) =>
        fetchEnvelope<T>(API_ENDPOINTS.CONTENT.SECTION(section, language), 86400, options)
};
