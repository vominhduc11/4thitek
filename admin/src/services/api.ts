import { BlogCreateRequest, BlogFormData, BlogIntroductionItem, BlogApiResponse, ApiBlogResponse, BlogResponse, BlogCategory, ApiResponse, ApiProductResponse, BaseResponse, NetworkError, ValidationError, AuthenticationError, AuthorizationError, NotFoundError, ServerError, TimeoutError, createErrorFromStatus } from '../types';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import { ROUTES } from '../config/routes';

// Use API base URL from environment config
const API_BASE_URL = env.apiUrl.replace(/\/$/, '');

const buildUrl = (endpoint: string): string => {
  if (/^https?:\/\//.test(endpoint)) return endpoint;
  return `${API_BASE_URL}/${endpoint.replace(/^\//, '')}`;
};

const safeParseJson = async (response: Response) => {
  try {
    return await response.json();
  } catch (err) {
    logger.debug('Failed to parse JSON response', err);
    return null;
  }
};

// Legacy ApiError - kept for backward compatibility
// New code should use error classes from types/api.ts
export class ApiError extends Error {
  public statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

// Queue-based token refresh management (improved pattern from Dealer portal)
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;
let refreshSubscribers: Array<(success: boolean) => void> = [];

export const getIsRefreshing = () => isRefreshing;
export const getRefreshPromise = () => refreshPromise;

// Helper to set refresh state (for external services)
export const setRefreshState = (refreshing: boolean, promise: Promise<boolean> | null) => {
  isRefreshing = refreshing;
  refreshPromise = promise;
};

// Subscribe to token refresh completion
const subscribeTokenRefresh = (callback: (success: boolean) => void) => {
  refreshSubscribers.push(callback);
};

// Notify all subscribers when token is refreshed
const onTokenRefreshed = (success: boolean) => {
  refreshSubscribers.forEach(callback => callback(success));
  refreshSubscribers = [];
};

const safeStorageGet = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (err) {
    logger.warn('Storage access blocked; proceeding without token', err);
    return null;
  }
};

const safeStorageSet = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
  } catch (err) {
    logger.warn('Storage access blocked; cannot persist token', err);
  }
};

const safeStorageRemove = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    logger.warn('Storage access blocked; cannot remove token', err);
  }
};

const getAuthToken = (): string | null => {
  const auth = safeStorageGet('distributex_auth');
  if (auth) {
    try {
      const authData = JSON.parse(auth);
      return authData.token;
    } catch (error) {
      logger.error('Failed to parse auth data from localStorage', error);
      safeStorageRemove('distributex_auth');
    }
  }

  return null;
};

const getRefreshToken = (): string | null => {
  const auth = safeStorageGet('distributex_auth');
  if (auth) {
    try {
      const authData = JSON.parse(auth);
      return authData.refreshToken || null;
    } catch (error) {
      logger.error('Failed to parse auth data from localStorage', error);
    }
  }
  return null;
};

// Refresh access token using refresh token
export const refreshAccessToken = async (): Promise<boolean> => {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    logger.warn('No refresh token available');
    return false;
  }

  try {
    logger.info('Attempting to refresh access token');

    const response = await fetch(buildUrl('/api/auth/refresh'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: refreshToken
      }),
    });

    if (!response.ok) {
      logger.warn('Refresh token request failed', { status: response.status });
      return false;
    }

    const data = await response.json();

    if (data.success && data.data?.accessToken) {
      const newAccessToken = data.data.accessToken;
      const newExpiresIn = data.data.expiresIn;

      // Update localStorage with new access token
      const savedAuth = safeStorageGet('distributex_auth');
      if (savedAuth) {
        const authData = JSON.parse(savedAuth);
        authData.token = newAccessToken;
        if (newExpiresIn) {
          authData.expiresIn = newExpiresIn;
        }
        safeStorageSet('distributex_auth', JSON.stringify(authData));
        logger.info('Access token refreshed successfully');
      }

      return true;
    }

    return false;
  } catch (error) {
    logger.error('Error refreshing access token', error);
    return false;
  }
};

const createHeaders = (includeContentType: boolean = true): HeadersInit => {
  const headers: HeadersInit = {
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest', // CSRF protection
  };

  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getAuthToken();
  logger.debug('Retrieved auth token from localStorage');

  if (token) {
    // Thử cả 2 format: với và không có "Bearer"
    headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    logger.debug('Added Authorization header to request');
  } else {
    logger.warn('No auth token found in localStorage');
  }

  return headers;
};

// Function to manually set auth token for development
export const setAuthToken = (token: string) => {
  const authData = { token };
  safeStorageSet('distributex_auth', JSON.stringify(authData));
};

// Check if JWT token is expired
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

// Function to check if user has valid token
export const hasValidToken = (): boolean => {
  const token = getAuthToken();
  if (!token) return false;

  // Check if token is expired
  if (isTokenExpired(token)) {
    logger.warn('Token is expired');
    return false;
  }

  return true;
};

// Request timeout wrapper
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 30000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new TimeoutError('Yêu cầu quá thời gian chờ. Vui lòng thử lại.')), timeoutMs)
    )
  ]);
};

// Retry logic with exponential backoff
const withRetry = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      // Don't retry client errors (4xx) except 401
      if (error.status >= 400 && error.status < 500 && error.status !== 401) {
        throw error;
      }

      // Don't retry authentication errors
      if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
        throw error;
      }

      if (attempt === maxAttempts) {
        throw error;
      }

      // Exponential backoff: 1s, 2s, 4s...
      const delay = delayMs * Math.pow(2, attempt - 1);
      logger.info(`Request failed, retrying in ${delay}ms (attempt ${attempt}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retry attempts reached');
};

export const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {},
  skipAuth: boolean = false,
  _isRetry: boolean = false
): Promise<T> => {
  const url = buildUrl(endpoint);

  // Add timeout support
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  // Kiểm tra nếu là FormData thì không set Content-Type
  const isFormData = options.body instanceof FormData;
  const headers = skipAuth ?
    (isFormData ? {} : { 'Content-Type': 'application/json' }) :
    createHeaders(!isFormData);

  const config: RequestInit = {
    headers,
    ...options,
    signal: controller.signal, // Add abort signal for timeout
  };

  // Merge custom headers if provided in options
  if (options.headers) {
    config.headers = { ...headers, ...options.headers };
  }

  logger.apiRequest(config.method || 'GET', endpoint, {
    isFormData,
    hasAuth: !skipAuth,
    isRetry: _isRetry
  });

  try {
    const response = await fetch(url, config);
    clearTimeout(timeoutId); // Clear timeout on successful response

    if (!response.ok) {
      // Handle 401 Unauthorized - try to refresh token first
      if (response.status === 401) {
        // If this is already a retry, don't try to refresh again
        if (_isRetry) {
          logger.warn('401 Unauthorized after token refresh - redirecting to login');
          safeStorageRemove('distributex_auth');
          window.location.href = ROUTES.LOGIN;
          throw new ApiError(401, 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        }

        // Try to refresh token
        logger.info('401 Unauthorized - attempting to refresh token');

        // If already refreshing, wait for it
        if (isRefreshing && refreshPromise) {
          const success = await refreshPromise;
          if (success) {
            // Retry the request with new token
            return apiRequest<T>(endpoint, options, skipAuth, true);
          } else {
            logger.warn('Token refresh failed - redirecting to login');
            safeStorageRemove('distributex_auth');
            window.location.href = ROUTES.LOGIN;
            throw new ApiError(401, 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          }
        }

        // Start refreshing
        isRefreshing = true;
        refreshPromise = refreshAccessToken();

        try {
          const success = await refreshPromise;

          if (success) {
            logger.info('Token refreshed successfully - retrying request');
            // Retry the request with new token
            return apiRequest<T>(endpoint, options, skipAuth, true);
          } else {
            logger.warn('Token refresh failed - redirecting to login');
            safeStorageRemove('distributex_auth');
            window.location.href = ROUTES.LOGIN;
            throw new ApiError(401, 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          }
        } finally {
          isRefreshing = false;
          refreshPromise = null;
        }
      }

      const parsedError = await safeParseJson(response);
      const errorMessage = (parsedError && (parsedError.message || parsedError.error)) || response.statusText || 'Request failed';
      const mappedError = createErrorFromStatus(response.status, errorMessage);
      throw mappedError;
    }

    const data = await safeParseJson(response);
    if (data === null) {
      throw new ServerError('Invalid JSON response from server');
    }
    return data;
  } catch (error) {
    clearTimeout(timeoutId); // Clear timeout on error

    // Handle timeout errors
    if (error instanceof Error && error.name === 'AbortError') {
      logger.error('Request timeout:', { endpoint, timeout: '10s' });
      throw new ApiError(408, 'Request timeout. Please try again.');
    }

    if (error instanceof ApiError) {
      throw error;
    }
    if (error instanceof NetworkError || error instanceof TimeoutError || error instanceof AuthenticationError || error instanceof AuthorizationError) {
      throw error;
    }

    // Handle network errors that might be 401-related (CORS + 401)
    // When CORS blocks a 401 response, fetch throws "Failed to fetch"
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Check if it's a network error - could be 401 with CORS
    if (errorMessage.includes('Failed to fetch') || errorMessage.includes('ERR_FAILED')) {
      // If this is not a retry, try to refresh token
      if (!_isRetry) {
        logger.info('Network error (possibly 401) - attempting to refresh token');

        // If already refreshing, wait for it
        if (isRefreshing && refreshPromise) {
          const success = await refreshPromise;
          if (success) {
            return apiRequest<T>(endpoint, options, skipAuth, true);
          } else {
            logger.warn('Token refresh failed - redirecting to login');
            safeStorageRemove('distributex_auth');
            window.location.href = ROUTES.LOGIN;
            throw new ApiError(401, 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          }
        }

        // Start refreshing
        isRefreshing = true;
        refreshPromise = refreshAccessToken();

        try {
          const success = await refreshPromise;

          if (success) {
            logger.info('Token refreshed successfully - retrying request');
            return apiRequest<T>(endpoint, options, skipAuth, true);
          } else {
            logger.warn('Token refresh failed - redirecting to login');
            safeStorageRemove('distributex_auth');
            window.location.href = ROUTES.LOGIN;
            throw new ApiError(401, 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          }
        } finally {
          isRefreshing = false;
          refreshPromise = null;
        }
      } else {
        // Already retried, redirect to login
        logger.warn('Network error after retry - redirecting to login');
        safeStorageRemove('distributex_auth');
        window.location.href = ROUTES.LOGIN;
        throw new ApiError(401, 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
    }

    logger.apiError(config.method || 'GET', endpoint, error);
    throw new ApiError(0, 'Network error or invalid response');
  }
};

// Helper function to transform API blog to internal blog format
const transformApiBlogToInternal = (apiBlog: ApiBlogResponse, categories: BlogCategory[] = []): BlogResponse => {
  // Handle descriptions/introduction - parse JSON string if needed
  let introduction: BlogIntroductionItem[] = [];

  // Try to parse introduction from API response
  if (apiBlog.introduction) {
    try {
      if (typeof apiBlog.introduction === 'string') {
        // If it's a JSON string, parse it
        const parsed = JSON.parse(apiBlog.introduction);
        if (Array.isArray(parsed)) {
          introduction = parsed.map((item: any) => ({
            type: item.type || 'description',
            text: item.text || item.content,
            public_id: item.public_id,
            imageUrl: item.imageUrl || item.url,
            images: item.images,
            videoUrl: item.videoUrl,
            caption: item.caption
          }));
        } else {
          introduction = [{ type: 'description', text: apiBlog.introduction }];
        }
      } else if (Array.isArray(apiBlog.introduction)) {
        introduction = apiBlog.introduction.map((item: any) => ({
          type: item.type || 'description',
          text: item.text || item.content,
          public_id: item.public_id,
          imageUrl: item.imageUrl || item.url,
          images: item.images,
          videoUrl: item.videoUrl,
          caption: item.caption
        }));
      } else if (typeof apiBlog.introduction === 'object') {
        // If it's an object, convert to array
        introduction = [{ type: 'description', text: JSON.stringify(apiBlog.introduction) }];
      }
    } catch (error) {
      logger.warn('Failed to parse blog introduction', error);
      introduction = [{ type: 'description', text: String(apiBlog.introduction) }];
    }
  }

  // Debug category mapping - normalize strings for comparison
  const apiCategoryName = apiBlog.category?.trim() || '';
  const matchedCategory = categories.find(cat =>
    cat.name.trim().toLowerCase() === apiCategoryName.toLowerCase()
  );
  const categoryId = matchedCategory?.id || 1;

  // Only log if there's a mismatch for debugging
  if (!matchedCategory && apiCategoryName) {
    logger.warn('=== BLOG CATEGORY MAPPING ISSUE ===');
    logger.warn('Blog title:', apiBlog.title);
    logger.warn('API category (string):', `"${apiBlog.category}"`);
    logger.warn('API category (trimmed):', `"${apiCategoryName}"`);
    logger.warn('Available categories:', categories.map(c => ({ id: c.id, name: `"${c.name}"` })));
    logger.warn('Matched category:', matchedCategory);
    logger.warn('Fallback to categoryId:', categoryId);
    logger.warn('===================================');
  }

  return {
    id: apiBlog.id,
    image: apiBlog.image, // Keep as JSON string from API, will be converted in UI if needed
    title: apiBlog.title, // API uses 'title' field
    description: apiBlog.description, // API provides description field
    introduction,
    showOnHomepage: apiBlog.showOnHomepage,
    categoryId, // Map category name to ID
    createdAt: apiBlog.createdAt,
    updatedAt: apiBlog.updateAt // Note: API uses 'updateAt' not 'updatedAt'
  };
};

// Blog API functions
export const blogApi = {
  create: async (blogData: BlogCreateRequest) => {
    return apiRequest('/api/blog/blogs', {
      method: 'POST',
      body: JSON.stringify(blogData)
    });
  },

  getAll: async (): Promise<{ data: BlogResponse[] }> => {
    // Fetch categories first to ensure accurate mapping
    const categoriesResponse = await apiRequest<{ success: boolean; data: BlogCategory[] }>('/api/blog/categories', {}, true);
    const categories = categoriesResponse.success ? categoriesResponse.data : [];

    const response = await apiRequest<BlogApiResponse>('/api/blog/blogs');

    if (response.success && Array.isArray(response.data)) {
      const transformedBlogs = response.data.map(blog => transformApiBlogToInternal(blog, categories));
      return { data: transformedBlogs };
    }

    return { data: [] };
  },

  getDeleted: async (): Promise<{ data: BlogResponse[] }> => {
    // Fetch categories first to ensure accurate mapping
    const categoriesResponse = await apiRequest<{ success: boolean; data: BlogCategory[] }>('/api/blog/categories', {}, true);
    const categories = categoriesResponse.success ? categoriesResponse.data : [];

    const response = await apiRequest<BlogApiResponse>('/api/blog/blogs/deleted');

    if (response.success && Array.isArray(response.data)) {
      const transformedBlogs = response.data.map(blog => transformApiBlogToInternal(blog, categories));
      return { data: transformedBlogs };
    }

    return { data: [] };
  },

  getById: async (id: number): Promise<{ data: BlogResponse }> => {
    // Fetch categories first to ensure accurate mapping
    const categoriesResponse = await apiRequest<{ success: boolean; data: BlogCategory[] }>('/api/blog/categories', {}, true);
    const categories = categoriesResponse.success ? categoriesResponse.data : [];

    const response = await apiRequest<{ success: boolean; message: string; data: ApiBlogResponse }>(`/api/blog/${id}`);

    if (response.success && response.data) {
      const transformedBlog = transformApiBlogToInternal(response.data, categories);
      return { data: transformedBlog };
    }

    throw new Error(response.message || 'Failed to fetch blog details');
  },

  update: async (id: number, blogData: BlogCreateRequest) => {
    return apiRequest(`/api/blog/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(blogData)
    });
  },

  // Soft delete - moves to trash
  delete: async (id: number) => {
    return apiRequest(`/api/blog/${id}`, {
      method: 'DELETE'
    });
  },

  // Hard delete - permanently removes
  hardDelete: async (id: number) => {
    return apiRequest(`/api/blog/${id}/hard`, {
      method: 'DELETE'
    });
  },

  // Restore from trash
  restore: async (id: number) => {
    return apiRequest(`/api/blog/${id}/restore`, {
      method: 'PATCH'
    });
  },

  // Search blogs by query
  search: async (query: string): Promise<{ data: BlogResponse[] }> => {
    // Fetch categories first to ensure accurate mapping
    const categoriesResponse = await apiRequest<{ success: boolean; data: BlogCategory[] }>('/api/blog/categories', {}, true);
    const categories = categoriesResponse.success ? categoriesResponse.data : [];

    const response = await apiRequest<BlogApiResponse>(`/api/blog/blogs/search?q=${encodeURIComponent(query)}`);

    if (response.success && Array.isArray(response.data)) {
      const transformedBlogs = response.data.map(blog => transformApiBlogToInternal(blog, categories));
      return { data: transformedBlogs };
    }

    return { data: [] };
  },

  // Get blog categories (no auth required)
  getCategories: async (): Promise<{ data: Array<{ id: number; name: string; description?: string }> }> => {
    const response = await apiRequest<{ success: boolean; data: Array<{ id: number; name: string; description?: string }> }>('/api/blog/categories', {}, true);

    if (response.success && Array.isArray(response.data)) {
      return { data: response.data };
    }

    return { data: [] };
  },

  // Create blog category (requires ADMIN token)
  createCategory: async (categoryData: { name: string; description?: string }) => {
    return apiRequest('/api/blog/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData)
    });
  },

  // Delete blog category (requires ADMIN token)
  deleteCategory: async (id: number) => {
    return apiRequest(`/api/blog/categories/${id}`, {
      method: 'DELETE'
    });
  }
};

// Product API functions
export const productApi = {
  // Get all active products (requires token)
  getAll: async (): Promise<ApiResponse<ApiProductResponse[]>> => {
    const response = await apiRequest<ApiResponse<ApiProductResponse[]>>('/api/product/products');
    return response;
  },

  // Get deleted products (trash view - requires token)
  getDeleted: async (): Promise<ApiResponse<ApiProductResponse[]>> => {
    const response = await apiRequest<ApiResponse<ApiProductResponse[]>>('/api/product/products/deleted');
    return response;
  },

  // Get product by ID (requires token)
  getById: async (id: number): Promise<ApiResponse<ApiProductResponse>> => {
    const response = await apiRequest<ApiResponse<ApiProductResponse>>(`/api/product/${id}`);
    return response;
  },

  // Create new product (requires token)
  create: async (productData: any) => {
    return apiRequest('/api/product/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });
  },

  // Update product (requires token)
  update: async (id: number, productData: any) => {
    return apiRequest(`/api/product/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(productData)
    });
  },

  // Soft delete - moves to trash (requires token)
  delete: async (id: number) => {
    return apiRequest(`/api/product/${id}`, {
      method: 'DELETE'
    });
  },

  // Hard delete - permanently removes (requires token)
  hardDelete: async (id: number) => {
    return apiRequest(`/api/product/${id}/hard`, {
      method: 'DELETE'
    });
  },

  // Restore from trash (requires token)
  restore: async (id: number) => {
    return apiRequest(`/api/product/${id}/restore`, {
      method: 'PATCH'
    });
  },

  // Search products by query (requires token)
  search: async (query: string): Promise<ApiResponse<ApiProductResponse[]>> => {
    const response = await apiRequest<ApiResponse<ApiProductResponse[]>>(`/api/product/products/search?q=${encodeURIComponent(query)}`);
    return response;
  }
};

// Dealer API endpoints
export const dealerApi = {
  // Get all dealers with pagination
  getAll: async (page: number = 0, size: number = 10) => {
    const response = await apiRequest<BaseResponse<any>>(`/api/user/dealer?page=${page}&size=${size}`);
    const content = Array.isArray((response as any).data?.content)
      ? (response as any).data.content
      : Array.isArray(response.data)
        ? response.data
        : [];

    return {
      success: response.success,
      message: response.message,
      data: content,
      totalElements: (response as any).data?.totalElements ?? content.length,
      totalPages: (response as any).data?.totalPages ?? 1,
      page: (response as any).data?.number ?? page,
      size: (response as any).data?.size ?? size,
    };
  },

  // Search dealers by query
  search: async (query: string) => {
    return apiRequest(`/api/user/dealer/search?q=${encodeURIComponent(query)}`);
  },

  // Get dealer by ID
  getById: async (id: number) => {
    return apiRequest(`/api/user/dealer/${id}`);
  },

  // Create new dealer
  create: async (dealerData: any) => {
    return apiRequest('/api/user/dealer', {
      method: 'POST',
      body: JSON.stringify(dealerData)
    });
  },

  // Update dealer
  update: async (id: number, dealerData: any) => {
    return apiRequest(`/api/user/admin/dealers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dealerData)
    });
  },

  // Delete dealer
  delete: async (id: number) => {
    return apiRequest(`/api/user/admin/dealers/${id}`, {
      method: 'DELETE'
    });
  }
};
