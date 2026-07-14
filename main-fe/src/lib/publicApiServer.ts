import { cache } from 'react';
import { API_ENDPOINTS, buildApiUrl } from '@/constants/api';

type Envelope<T> = {
    success: boolean;
    data: T | null;
    error?: string;
};

type PublicApiRequestOptions = {
    version?: string;
};

async function fetchEnvelopeBase<T>(
    path: string,
    revalidate: number,
    tags: string[] | undefined,
    options?: PublicApiRequestOptions
): Promise<Envelope<T>> {
    try {
        const response = await fetch(buildApiUrl(path, { version: options?.version }), {
            cache: 'force-cache',
            // ISR on-demand: revalidate theo tag khi admin đổi dữ liệu (route /api/revalidate).
            // `revalidate` (thời gian) giữ lại làm fallback an toàn nếu webhook bị lỡ.
            next: { revalidate, ...(tags && tags.length > 0 ? { tags } : {}) },
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

// `cache` dedupe theo request; key phải ổn định về identity → truyền tags dưới dạng chuỗi
// đã join (string so khớp theo giá trị) thay vì mảng tạo mới mỗi lần gọi.
const memoizedFetchEnvelope = cache(
    async (path: string, revalidate: number, tagsKey: string, version?: string): Promise<Envelope<unknown>> => {
        const tags = tagsKey ? tagsKey.split(',') : undefined;
        return fetchEnvelopeBase(path, revalidate, tags, { version });
    }
);

async function fetchEnvelope<T>(
    path: string,
    revalidate: number,
    tags: string[],
    options?: PublicApiRequestOptions
): Promise<Envelope<T>> {
    return memoizedFetchEnvelope(path, revalidate, tags.join(','), options?.version) as Promise<Envelope<T>>;
}

// Tag hợp đồng với backend (CacheNames): products / product:{id} / blogs / blog:{id} /
// content / content:{section}. Backend bắn POST /api/revalidate với các tag này khi admin
// create/update/delete tương ứng.
export const publicApiServer = {
    fetchHomepageProducts: (options?: PublicApiRequestOptions) =>
        fetchEnvelope<
            Array<{ id: number | string; name: string; sku?: string; shortDescription: string; image: string; price?: number }>
        >(API_ENDPOINTS.PRODUCT.PRODUCTS_HOMEPAGE, 60, ['products'], options),
    fetchNewProducts: (options?: PublicApiRequestOptions) => publicApiServer.fetchHomepageProducts(options),
    fetchFeaturedProducts: (options?: PublicApiRequestOptions) =>
        fetchEnvelope<
            Array<{ id: number | string; name: string; sku?: string; shortDescription: string; image: string; price?: number }>
        >(API_ENDPOINTS.PRODUCT.PRODUCTS_FEATURED, 60, ['products'], options),
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
        >(API_ENDPOINTS.PRODUCT.PRODUCTS, 60, ['products'], options),
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
        }>(API_ENDPOINTS.PRODUCT.PRODUCT_BY_ID(id), 60, ['products', `product:${id}`], options),
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
        >(`${API_ENDPOINTS.PRODUCT.PRODUCTS_RELATED(id)}?limit=${limit}`, 60, ['products', `product:${id}`], options),
    fetchLatestBlogs: (options?: PublicApiRequestOptions) =>
        fetchEnvelope<
            Array<{ id: number | string; title: string; description: string; image: string; category: string; createdAt: string }>
        >(API_ENDPOINTS.BLOG.BLOGS_LATEST, 1800, ['blogs'], options),
    fetchBlogs: (options?: PublicApiRequestOptions) =>
        fetchEnvelope<Array<{ id: number | string; title: string; description: string; image: string; category: string; createdAt: string }>>(
            API_ENDPOINTS.BLOG.BLOGS,
            1800,
            ['blogs'],
            options
        ),
    fetchBlogCategories: (options?: PublicApiRequestOptions) =>
        fetchEnvelope<Array<{ id: number | string; name: string }>>(API_ENDPOINTS.BLOG.CATEGORIES, 1800, ['blogs'], options),
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
        }>(API_ENDPOINTS.BLOG.BLOG_BY_ID(id), 1800, ['blogs', `blog:${id}`], options),
    fetchRelatedBlogs: (id: string, limit = 4, options?: PublicApiRequestOptions) =>
        fetchEnvelope<
            Array<{ id: number | string; title: string; description: string; image: string; category: string; createdAt: string }>
        >(`${API_ENDPOINTS.BLOG.BLOGS_RELATED(id)}?limit=${limit}`, 1800, ['blogs', `blog:${id}`], options),
    fetchContentSection: <T>(section: string, language: string, options?: PublicApiRequestOptions) =>
        fetchEnvelope<T>(API_ENDPOINTS.CONTENT.SECTION(section, language), 86400, ['content', `content:${section}`], options)
};
