import axios, { AxiosResponse, AxiosError } from 'axios';
import { TIMEOUTS } from '@/constants/timeouts';

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
            url: lastError && 'config' in lastError ? lastError.config?.url : undefined
        };

        console.error('API call failed after all retries:', errorDetails);

        return {
            data: null as T,
            success: false,
            error: errorMessage
        };
    }

    // Specific method for fetching resellers with retry logic
    async fetchResellers(): Promise<ApiResponse<any[]>> {
        return this.withRetry(
            () => axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/resellers`, {
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
    async post<T>(url: string, data?: any, config?: Partial<ApiRetryConfig>): Promise<ApiResponse<T>> {
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


    // Blog API methods
    async fetchBlogs(): Promise<ApiResponse<any[]>> {
        return this.withRetry(
            () => axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/blogs`, {
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

    async fetchBlogById(id: string): Promise<ApiResponse<any>> {
        return this.withRetry(
            () => axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/blogs/${id}`, {
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
}

// Export singleton instance
export const apiService = new ApiService();
export type { ApiResponse, ApiRetryConfig };