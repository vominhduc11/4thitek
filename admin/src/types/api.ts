/**
 * Standardized API Response Types
 * Matches backend BaseResponse structure
 */

export interface BaseResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

/**
 * Comprehensive Error Classes for Admin Portal
 * Inspired by Dealer portal's error handling
 */

export class APIError extends Error {
  public status: number;
  public code: string;
  public originalError?: Error;
  public timestamp: string;

  constructor(message: string, status: number, code: string, originalError?: Error) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.code = code;
    this.originalError = originalError;
    this.timestamp = new Date().toISOString();

    // Maintains proper stack trace for where error was thrown (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class NetworkError extends APIError {
  constructor(message: string = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.', originalError?: Error) {
    super(message, 0, 'NETWORK_ERROR', originalError);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends APIError {
  public errors: unknown[];

  constructor(message: string = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.', errors: unknown[] = []) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export class AuthenticationError extends APIError {
  constructor(message: string = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends APIError {
  constructor(message: string = 'Bạn không có quyền thực hiện thao tác này.') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends APIError {
  constructor(message: string = 'Không tìm thấy tài nguyên yêu cầu.') {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ServerError extends APIError {
  constructor(message: string = 'Lỗi server. Vui lòng thử lại sau.', status: number = 500) {
    super(message, status, 'SERVER_ERROR');
    this.name = 'ServerError';
  }
}

export class TimeoutError extends APIError {
  constructor(message: string = 'Yêu cầu quá thời gian chờ. Vui lòng thử lại.') {
    super(message, 408, 'TIMEOUT_ERROR');
    this.name = 'TimeoutError';
  }
}

/**
 * Error Handler Utility
 * Returns user-friendly error information
 */
export interface ErrorInfo {
  message: string;
  type: string;
  status: number;
  code: string;
  timestamp?: string;
}

export const handleAPIError = (error: unknown, showNotification: boolean = true): ErrorInfo => {
  const defaultMessages: Record<string, string> = {
    NetworkError: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.',
    AuthenticationError: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    AuthorizationError: 'Bạn không có quyền thực hiện thao tác này.',
    ValidationError: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.',
    NotFoundError: 'Không tìm thấy tài nguyên yêu cầu.',
    ServerError: 'Lỗi server. Vui lòng thử lại sau.',
    TimeoutError: 'Yêu cầu quá thời gian chờ. Vui lòng thử lại.',
    APIError: 'Đã xảy ra lỗi. Vui lòng thử lại.',
  };

  if (error instanceof APIError) {
    return {
      message: error.message || defaultMessages[error.name] || defaultMessages.APIError,
      type: error.name,
      status: error.status,
      code: error.code,
      timestamp: error.timestamp,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message || defaultMessages.APIError,
      type: 'Error',
      status: 0,
      code: 'UNKNOWN_ERROR',
    };
  }

  return {
    message: String(error) || defaultMessages.APIError,
    type: 'Unknown',
    status: 0,
    code: 'UNKNOWN_ERROR',
  };
};

/**
 * Map HTTP status codes to error types
 */
export const createErrorFromStatus = (status: number, message: string, errorData?: any): APIError => {
  switch (status) {
    case 400:
      return new ValidationError(message, errorData?.errors || []);
    case 401:
      return new AuthenticationError(message);
    case 403:
      return new AuthorizationError(message);
    case 404:
      return new NotFoundError(message);
    case 408:
      return new TimeoutError(message);
    case 422:
      return new ValidationError(message, errorData?.errors || []);
    case 500:
    case 502:
    case 503:
    case 504:
      return new ServerError(message, status);
    default:
      return new APIError(message, status, 'HTTP_ERROR');
  }
};
