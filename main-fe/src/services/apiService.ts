import {
    BlogCategory,
    BlogDetailResponse,
    BlogListResponse,
    ProductDetailResponse,
    ProductListResponse,
    SearchCombinedResponse
} from '@/types/api';
import { WarrantyCheckData } from '@/types/warranty';
import { API_BASE_URL, API_ENDPOINTS } from '@/constants/api';

type Language = 'en' | 'vi';

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

    private async request<T>(path: string): Promise<ApiResponse<T>> {
        const response = await fetch(`${API_BASE_URL}${path}`, {
            method: 'GET',
            headers: {
                Accept: 'application/json'
            },
            cache: 'no-store'
        });

        let payload: ApiResponse<T> | null = null;
        try {
            payload = (await response.json()) as ApiResponse<T>;
        } catch {
            payload = null;
        }

        if (!response.ok || payload?.success === false) {
            throw new Error(payload?.error || `Request failed: ${response.status}`);
        }

        return {
            success: true,
            data: payload?.data ?? null,
            error: payload?.error
        };
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

    async fetchHomepageProducts(): Promise<ApiResponse<ProductListResponse['data']>> {
        const response = await this.request<ProductSummaryPayload[]>(API_ENDPOINTS.PRODUCT.PRODUCTS_HOMEPAGE);
        return {
            success: true,
            data: (response.data ?? []).map((product) => this.toProductListItem(product))
        };
    }

    async fetchProducts(): Promise<ApiResponse<ProductListResponse['data']>> {
        const response = await this.request<ProductSummaryPayload[]>(API_ENDPOINTS.PRODUCT.PRODUCTS);
        return {
            success: true,
            data: (response.data ?? []).map((product) => this.toProductListItem(product))
        };
    }

    async fetchProductById(id: string): Promise<ApiResponse<ProductDetailResponse['data']>> {
        const response = await this.request<ProductDetailPayload>(API_ENDPOINTS.PRODUCT.PRODUCT_BY_ID(id));
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
        const response = await this.fetchProducts();
        const related = (response.data ?? [])
            .filter((product) => product.id !== productId)
            .slice(0, limit);
        return { success: true, data: related };
    }

    async fetchHomepageBlogs(): Promise<ApiResponse<BlogListResponse['data']>> {
        const response = await this.request<BlogSummaryPayload[]>(API_ENDPOINTS.BLOG.BLOGS_HOMEPAGE);
        return {
            success: true,
            data: (response.data ?? []).map((blog) => this.toBlogListItem(blog))
        };
    }

    async fetchBlogs(fields?: string): Promise<ApiResponse<BlogListResponse['data']>> {
        void fields;
        const response = await this.request<BlogSummaryPayload[]>(API_ENDPOINTS.BLOG.BLOGS);
        return {
            success: true,
            data: (response.data ?? []).map((blog) => this.toBlogListItem(blog))
        };
    }

    async fetchBlogCategories(): Promise<ApiResponse<BlogCategory[]>> {
        const response = await this.request<Array<{ id: number; name: string }>>(API_ENDPOINTS.BLOG.CATEGORIES);
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
        const response = await this.request<BlogSummaryPayload[]>(API_ENDPOINTS.BLOG.CATEGORY_BLOGS(Number(categoryId)));
        return {
            success: true,
            data: (response.data ?? []).map((blog) => this.toBlogListItem(blog))
        };
    }

    async fetchRelatedBlogs(blogId: string, limit: number = 4, fields?: string): Promise<ApiResponse<unknown[]>> {
        void fields;
        const response = await this.request<BlogSummaryPayload[]>(`${API_ENDPOINTS.BLOG.BLOGS_RELATED(blogId)}?limit=${limit}`);
        return {
            success: true,
            data: (response.data ?? []).map((blog) => this.toBlogListItem(blog))
        };
    }

    async fetchBlogById(id: string): Promise<ApiResponse<BlogDetailResponse['data']>> {
        const response = await this.request<BlogDetailPayload>(API_ENDPOINTS.BLOG.BLOG_BY_ID(id));
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

    async fetchResellers(): Promise<ApiResponse<unknown>> {
        return this.request<{ dealers: Array<{
            id: number;
            businessName: string;
            contactName: string;
            address: string;
            city: string;
            district: string;
            phone: string;
            email: string;
        }> }>(API_ENDPOINTS.USER.DEALERS);
    }

    async fetchDealers(): Promise<ApiResponse<unknown>> {
        return this.fetchResellers();
    }

    async checkWarranty(serialNumber: string): Promise<ApiResponse<WarrantyCheckData>> {
        const response = await this.request<WarrantyCheckData>(API_ENDPOINTS.WARRANTY.CHECK(serialNumber));
        if (!response.data?.productSerial) {
            return response;
        }

        return {
            success: true,
            data: {
                ...response.data,
                productSerial: {
                    ...response.data.productSerial,
                    image: this.wrapImage(response.data.productSerial.image)
                }
            }
        };
    }

    async fetchContentSection<T>(section: string, lang: string = this.language): Promise<ApiResponse<T>> {
        return this.request<T>(API_ENDPOINTS.CONTENT.SECTION(section, lang));
    }

    async searchProducts(query: string, limit: number = 10) {
        const normalized = query.trim().toLowerCase();
        if (!normalized) {
            return { success: true, data: [] };
        }
        const response = await this.fetchProducts();
        const results = (response.data ?? [])
            .filter((product) =>
                product.name.toLowerCase().includes(normalized) ||
                (product.sku || '').toLowerCase().includes(normalized) ||
                product.shortDescription.toLowerCase().includes(normalized)
            )
            .slice(0, limit);
        return { success: true, data: results };
    }

    async searchBlogs(query: string, limit: number = 10) {
        const response = await this.request<BlogSummaryPayload[]>(`${API_ENDPOINTS.BLOG.BLOGS_SEARCH}?query=${encodeURIComponent(query)}`);
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
        const [productsResult, blogsResult] = await Promise.all([
            this.searchProducts(query, limit),
            this.searchBlogs(query, limit)
        ]);

        return {
            success: true,
            data: {
                products: productsResult.data || [],
                blogs: blogsResult.data || []
            }
        };
    }

    async healthCheck(): Promise<boolean> {
        const response = await this.request<{ status: string }>(API_ENDPOINTS.HEALTH);
        return response.data?.status === 'ok';
    }
}

export const apiService = new ApiService();
