import axios, { AxiosResponse, AxiosError } from 'axios';
import { TIMEOUTS } from '@/constants/timeouts';
// import { API_ENDPOINTS, API_DEFAULTS, DEFAULT_HEADERS } from '@/constants/api';
import { BlogPost } from '@/types/blog';
import { WarrantyCheckResponse } from '@/types/warranty';
import {
    // BlogResponse,
    // ProductResponse,
    BlogListResponse,
    ProductListResponse,
    SearchCombinedResponse,
    ProductDetailResponse,
    BlogDetailResponse,
    BlogCategory
} from '@/types/api';

interface ApiRetryConfig {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    backoffFactor: number;
}

interface ApiResponse<T> {
    data: T;
    success: boolean;
    error?: string;
}

class ApiService {
    private readonly defaultRetryConfig: ApiRetryConfig = {
        maxRetries: 3,
        baseDelay: 1000, // 1 second
        maxDelay: 10000, // 10 seconds
        backoffFactor: 2
    };

    private calculateDelay(attempt: number, config: ApiRetryConfig): number {
        const delay = Math.min(
            config.baseDelay * Math.pow(config.backoffFactor, attempt),
            config.maxDelay
        );
        // Add jitter to prevent thundering herd
        return delay + Math.random() * 1000;
    }

    private isRetryableError(error: AxiosError): boolean {
        // Don't retry on client errors (4xx), only on server errors (5xx) and network errors
        if (error.response) {
            const status = error.response.status;
            return status >= 500 || status === 429; // Server errors or rate limiting
        }
        
        // Network errors, timeouts, etc.
        return error.code === 'ECONNABORTED' || 
               error.code === 'ENOTFOUND' || 
               error.code === 'ECONNRESET' ||
               error.message.includes('timeout');
    }

    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async withRetry<T>(
        apiCall: () => Promise<AxiosResponse<T>>,
        customConfig?: Partial<ApiRetryConfig>
    ): Promise<ApiResponse<T>> {
        const config = { ...this.defaultRetryConfig, ...customConfig };
        let lastError: AxiosError | Error | undefined;

        for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
            try {
                const response = await apiCall();
                
                // Handle wrapped API responses with success/data structure
                if (response.data && typeof response.data === 'object' && 'success' in response.data) {
                    const apiResponse = response.data as { success: boolean; data?: unknown; message?: string; error?: string };
                    if (apiResponse.success) {
                        return {
                            data: apiResponse.data as T,
                            success: true
                        };
                    } else {
                        // Include more details from API error response
                        const errorMsg = apiResponse.message || apiResponse.error || 'API returned unsuccessful response';
                        throw new Error(`API Error: ${errorMsg}`);
                    }
                }
                
                // Handle direct data responses
                return {
                    data: response.data,
                    success: true
                };
            } catch (error) {
                lastError = error as AxiosError;
                
                // Don't retry on the last attempt
                if (attempt === config.maxRetries) {
                    break;
                }

                // Check if error is retryable
                if (!(error instanceof Error) || !this.isRetryableError(error as AxiosError)) {
                    break;
                }

                const delayMs = this.calculateDelay(attempt, config);
                console.warn(`API call failed (attempt ${attempt + 1}/${config.maxRetries + 1}). Retrying in ${delayMs}ms...`, {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    status: (error as AxiosError).response?.status
                });

                await this.delay(delayMs);
            }
        }

        // All retries failed
        const errorMessage = lastError instanceof Error
            ? lastError.message
            : 'Unknown API error';

        const errorDetails = {
            error: errorMessage,
            attempts: config.maxRetries + 1,
            status: lastError && 'response' in lastError ? lastError.response?.status : undefined,
            code: lastError && 'code' in lastError ? lastError.code : undefined,
            url: lastError && 'config' in lastError ? lastError.config?.url : undefined,
            responseData: lastError && 'response' in lastError ? lastError.response?.data : undefined,
            originalError: lastError
        };

        console.error('API call failed after all retries:', errorDetails);

        // Provide better error message based on the actual error
        let finalErrorMessage = errorMessage;
        if (lastError && 'response' in lastError) {
            const status = lastError.response?.status;
            if (status === 404) {
                finalErrorMessage = 'Resource not found';
            } else if (status && status >= 500) {
                finalErrorMessage = 'Server error occurred';
            } else if (status === 401 || status === 403) {
                finalErrorMessage = 'Authentication required';
            }
        } else if (!lastError || Object.keys(lastError).length === 0) {
            finalErrorMessage = 'Network connection failed';
        }

        return {
            data: null as T,
            success: false,
            error: finalErrorMessage
        };
    }

    // Specific method for fetching resellers with retry logic
    async fetchResellers(): Promise<ApiResponse<unknown[]>> {
        return this.withRetry(
            () => axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/dealer`, {
                timeout: TIMEOUTS.GEOCODING_REQUEST,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }),
            {
                maxRetries: 2, // Less retries for user-facing requests
                baseDelay: 500,
                maxDelay: 5000
            }
        );
    }

    // Generic method for any GET request with retry
    async get<T>(url: string, config?: Partial<ApiRetryConfig>): Promise<ApiResponse<T>> {
        return this.withRetry(
            () => axios.get(url, {
                timeout: TIMEOUTS.GEOCODING_REQUEST,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }),
            config
        );
    }

    // Method for POST requests with retry
    async post<T>(url: string, data?: Record<string, unknown>, config?: Partial<ApiRetryConfig>): Promise<ApiResponse<T>> {
        return this.withRetry(
            () => axios.post(url, data, {
                timeout: TIMEOUTS.GEOCODING_REQUEST,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }),
            config
        );
    }

    // Health check method
    async healthCheck(): Promise<boolean> {
        try {
            const response = await this.withRetry(
                () => axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/health`, {
                    timeout: 5000
                }),
                {
                    maxRetries: 1,
                    baseDelay: 1000,
                    maxDelay: 2000
                }
            );
            return response.success;
        } catch {
            return false;
        }
    }

    // Dealer API methods
    async fetchDealers(): Promise<ApiResponse<unknown[]>> {
        return this.withRetry(
            () => axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/dealer`, {
                timeout: TIMEOUTS.GEOCODING_REQUEST,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }),
            {
                maxRetries: 2,
                baseDelay: 500,
                maxDelay: 5000
            }
        );
    }


    // Blog API methods
    async fetchBlogs(fields?: string): Promise<ApiResponse<BlogPost[]>> {
        const queryParams = fields ? `?fields=${fields}` : '';
        return this.withRetry(
            () => axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/blog/blogs${queryParams}`, {
                timeout: TIMEOUTS.GEOCODING_REQUEST,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }),
            {
                maxRetries: 2,
                baseDelay: 500,
                maxDelay: 5000
            }
        );
    }

    async fetchBlogById(id: string): Promise<ApiResponse<BlogDetailResponse['data']>> {
        return this.withRetry(
            () => axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/blog/${id}`, {
                timeout: TIMEOUTS.GEOCODING_REQUEST,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }),
            {
                maxRetries: 2,
                baseDelay: 500,
                maxDelay: 5000
            }
        );
    }

    // Product API methods
    async fetchHomepageProducts(): Promise<ApiResponse<ProductListResponse['data']>> {
        return this.withRetry(
            () => axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/product/products/homepage?limit=4&fields=id%2Cname%2CshortDescription%2Cimage`, {
                timeout: TIMEOUTS.GEOCODING_REQUEST,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }),
            {
                maxRetries: 2,
                baseDelay: 500,
                maxDelay: 5000
            }
        );
    }

    async fetchProducts(): Promise<ApiResponse<ProductListResponse['data']>> {
        return this.withRetry(
            () => axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/product/products?fields=id%2Cname%2CshortDescription%2Cimage`, {
                timeout: TIMEOUTS.GEOCODING_REQUEST,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }),
            {
                maxRetries: 2,
                baseDelay: 500,
                maxDelay: 5000
            }
        );
    }

    async fetchHomepageBlogs(): Promise<ApiResponse<BlogListResponse['data']>> {
        return this.withRetry(
            () => axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/blog/blogs/homepage?limit=6&fields=id%2Ctitle%2Cdescription%2Cimage%2Ccategory%2CcreatedAt`, {
                timeout: TIMEOUTS.GEOCODING_REQUEST,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }),
            {
                maxRetries: 2,
                baseDelay: 500,
                maxDelay: 5000
            }
        );
    }

    async fetchBlogCategories(): Promise<ApiResponse<BlogCategory[]>> {
        return this.withRetry(
            () => axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/blog/categories`, {
                timeout: TIMEOUTS.GEOCODING_REQUEST,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }),
            {
                maxRetries: 2,
                baseDelay: 500,
                maxDelay: 5000
            }
        );
    }

    async fetchBlogsByCategory(categoryId: number, fields?: string): Promise<ApiResponse<unknown[]>> {
        const queryParams = fields ? `?fields=${fields}` : '';
        return this.withRetry(
            () => axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/blog/categories/${categoryId}/blogs${queryParams}`, {
                timeout: TIMEOUTS.GEOCODING_REQUEST,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }),
            {
                maxRetries: 2,
                baseDelay: 500,
                maxDelay: 5000
            }
        );
    }

    async fetchRelatedBlogs(blogId: string, limit: number = 4, fields?: string): Promise<ApiResponse<unknown[]>> {
        const queryParams = new URLSearchParams();
        queryParams.append('limit', limit.toString());
        if (fields) {
            queryParams.append('fields', fields);
        }

        return this.withRetry(
            () => axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/blog/blogs/related/${blogId}?${queryParams.toString()}`, {
                timeout: TIMEOUTS.GEOCODING_REQUEST,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }),
            {
                maxRetries: 2,
                baseDelay: 500,
                maxDelay: 5000
            }
        );
    }

    async fetchProductById(id: string): Promise<ApiResponse<ProductDetailResponse['data']>> {
        return this.withRetry(
            () => axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/product/${id}`, {
                timeout: TIMEOUTS.GEOCODING_REQUEST,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }),
            {
                maxRetries: 2,
                baseDelay: 500,
                maxDelay: 5000
            }
        );
    }

    async fetchRelatedProducts(productId: string, limit: number = 4): Promise<ApiResponse<unknown[]>> {
        return this.withRetry(
            () => axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/product/products/related/${productId}?limit=${limit}&fields=id%2Cname%2CshortDescription%2Cimage%2Cprice`, {
                timeout: TIMEOUTS.GEOCODING_REQUEST,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }),
            {
                maxRetries: 2,
                baseDelay: 500,
                maxDelay: 5000
            }
        );
    }


    // getAuthHeaders method removed - no longer needed

    // Warranty API methods
    async checkWarranty(serialNumber: string): Promise<ApiResponse<WarrantyCheckResponse>> {
        return this.withRetry(
            () => axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/warranty/check/${serialNumber}`, {
                timeout: TIMEOUTS.GEOCODING_REQUEST,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }),
            {
                maxRetries: 2,
                baseDelay: 500,
                maxDelay: 5000
            }
        );
    }

    // Search API methods
    async searchProducts(query: string, limit: number = 10): Promise<ApiResponse<{ id: number; name: string; shortDescription: string; image: string; }[]>> {
        const encodedQuery = encodeURIComponent(query);
        const fields = encodeURIComponent('id,name,shortDescription,image');

        return this.withRetry(
            () => axios.get<{ id: number; name: string; shortDescription: string; image: string; }[]>(`${process.env.NEXT_PUBLIC_API_BASE_URL}/product/products/search?q=${encodedQuery}&limit=${limit}&fields=${fields}`, {
                timeout: TIMEOUTS.GEOCODING_REQUEST,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }),
            {
                maxRetries: 2,
                baseDelay: 500,
                maxDelay: 5000
            }
        );
    }

    async searchBlogs(query: string, limit: number = 10): Promise<ApiResponse<{ id: number; title: string; description: string; image: string; category: string; }[]>> {
        const encodedQuery = encodeURIComponent(query);
        const fields = encodeURIComponent('id,title,description,image,category');

        return this.withRetry(
            () => axios.get<{ id: number; title: string; description: string; image: string; category: string; }[]>(`${process.env.NEXT_PUBLIC_API_BASE_URL}/blog/blogs/search?q=${encodedQuery}&limit=${limit}&fields=${fields}`, {
                timeout: TIMEOUTS.GEOCODING_REQUEST,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }),
            {
                maxRetries: 2,
                baseDelay: 500,
                maxDelay: 5000
            }
        );
    }

    // Combined search method
    async search(query: string, limit: number = 10): Promise<ApiResponse<SearchCombinedResponse['data']>> {
        try {
            const [productsResponse, blogsResponse] = await Promise.all([
                this.searchProducts(query, limit),
                this.searchBlogs(query, limit)
            ]);

            // Handle partial failures gracefully
            const products = productsResponse.success ? productsResponse.data : [];
            const blogs = blogsResponse.success ? blogsResponse.data : [];

            return {
                data: { products, blogs },
                success: true
            };
        } catch (error) {
            console.error('Search failed:', error);
            return {
                data: { products: [], blogs: [] },
                success: false,
                error: error instanceof Error ? error.message : 'Search failed'
            };
        }
    }


}

// Export singleton instance
export const apiService = new ApiService();
export type { ApiResponse, ApiRetryConfig };