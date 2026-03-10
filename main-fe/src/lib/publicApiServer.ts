import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api';

type Envelope<T> = {
    success: boolean;
    data: T | null;
    error?: string;
};

async function fetchEnvelope<T>(path: string, revalidate: number): Promise<Envelope<T>> {
    try {
        const response = await fetch(`${API_BASE_URL}${path}`, {
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
    fetchProducts: () =>
        fetchEnvelope<Array<{ id: number | string; name: string }>>(API_ENDPOINTS.PRODUCT.PRODUCTS, 3600),
    fetchProductById: (id: string) =>
        fetchEnvelope<{
            id: number | string;
            name: string;
            shortDescription: string;
            description: string;
            image: string;
        }>(API_ENDPOINTS.PRODUCT.PRODUCT_BY_ID(id), 3600),
    fetchBlogs: () =>
        fetchEnvelope<Array<{ id: number | string; title: string; description: string; createdAt: string }>>(
            API_ENDPOINTS.BLOG.BLOGS,
            1800
        ),
    fetchBlogById: (id: string) =>
        fetchEnvelope<{
            id: number | string;
            title: string;
            description: string;
            image: string;
            createdAt: string;
        }>(API_ENDPOINTS.BLOG.BLOG_BY_ID(id), 1800)
};
