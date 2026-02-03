import { logger } from './logger';

export interface ErrorInfo {
  context: string;
  operation: string;
  error: unknown;
  userId?: string;
}

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public isOperational = true
  ) {
    super(message);
    this.name = 'AppError';

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, AppError);
  }
}

export const ErrorCodes = {
  // Authentication & Authorization
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',

  // Business Logic
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  DUPLICATE_RESOURCE: 'DUPLICATE_RESOURCE',
  OPERATION_FAILED: 'OPERATION_FAILED',

  // Network & API
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',

  // File & Upload
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',

  // Generic
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

export const errorHandler = {
  /**
   * Handle and log errors consistently
   */
  handle(errorInfo: ErrorInfo): AppError {
    const { context, operation, error } = errorInfo;

    logger.error(`Error in ${context}.${operation}`, error);

    // Convert known error types
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      // Network/Fetch errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return new AppError(
          'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.',
          ErrorCodes.NETWORK_ERROR,
          0
        );
      }

      // Validation errors
      if (error.message.includes('required') || error.message.includes('validation')) {
        return new AppError(
          error.message,
          ErrorCodes.VALIDATION_ERROR,
          400
        );
      }

      return new AppError(
        error.message,
        ErrorCodes.UNKNOWN_ERROR,
        500
      );
    }

    // Handle non-Error objects
    return new AppError(
      'Đã xảy ra lỗi không xác định',
      ErrorCodes.UNKNOWN_ERROR,
      500
    );
  },

  /**
   * Create API error from response
   */
  fromApiResponse(status: number, message: string): AppError {
    switch (status) {
      case 401:
        return new AppError(
          'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
          ErrorCodes.UNAUTHORIZED,
          401
        );
      case 403:
        return new AppError(
          'Bạn không có quyền thực hiện thao tác này.',
          ErrorCodes.FORBIDDEN,
          403
        );
      case 404:
        return new AppError(
          'Không tìm thấy tài nguyên yêu cầu.',
          ErrorCodes.RESOURCE_NOT_FOUND,
          404
        );
      case 409:
        return new AppError(
          'Tài nguyên đã tồn tại.',
          ErrorCodes.DUPLICATE_RESOURCE,
          409
        );
      case 422:
        return new AppError(
          message || 'Dữ liệu không hợp lệ.',
          ErrorCodes.VALIDATION_ERROR,
          422
        );
      default:
        return new AppError(
          message || 'Lỗi server không xác định.',
          ErrorCodes.API_ERROR,
          status
        );
    }
  },

  /**
   * Get user-friendly error message
   */
  getUserMessage(error: unknown): string {
    if (error instanceof AppError) {
      return error.message;
    }

    if (error instanceof Error) {
      // Return generic message for unknown errors
      return 'Đã xảy ra lỗi. Vui lòng thử lại sau.';
    }

    return 'Đã xảy ra lỗi không xác định.';
  },

  /**
   * Check if error is operational (expected) vs programming error
   */
  isOperational(error: unknown): boolean {
    if (error instanceof AppError) {
      return error.isOperational;
    }
    return false;
  },

  /**
   * Retry wrapper for operations that might fail temporarily
   */
  async withRetry<T>(
    operation: () => Promise<T>,
    context: string,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // Don't retry on operational errors (user errors, auth, etc.)
        if (this.isOperational(error)) {
          throw error;
        }

        if (attempt === maxRetries) {
          break;
        }

        logger.warn(`Retry attempt ${attempt}/${maxRetries} for ${context}`, error);

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }

    throw this.handle({
      context,
      operation: 'withRetry',
      error: lastError
    });
  }
};

// Convenience functions for common error types
export const createValidationError = (message: string) =>
  new AppError(message, ErrorCodes.VALIDATION_ERROR, 400);

export const createNotFoundError = (resource: string) =>
  new AppError(`${resource} không tìm thấy`, ErrorCodes.RESOURCE_NOT_FOUND, 404);

export const createUnauthorizedError = () =>
  new AppError('Không có quyền truy cập', ErrorCodes.UNAUTHORIZED, 401);

export const createNetworkError = () =>
  new AppError('Lỗi kết nối mạng', ErrorCodes.NETWORK_ERROR, 0);