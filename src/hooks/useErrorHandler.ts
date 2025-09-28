import { useCallback } from 'react';

interface ErrorHandlerOptions {
    showToast?: boolean;
    logToConsole?: boolean;
    reportToService?: boolean;
}

interface UseErrorHandlerReturn {
    handleError: (error: Error | string, context?: string, options?: ErrorHandlerOptions) => void;
    handleAsyncError: <T>(
        asyncFn: () => Promise<T>,
        context?: string,
        options?: ErrorHandlerOptions
    ) => Promise<T | null>;
}

export function useErrorHandler(): UseErrorHandlerReturn {
    const handleError = useCallback((
        error: Error | string,
        context?: string,
        options: ErrorHandlerOptions = {}
    ) => {
        const {
            showToast = true,
            logToConsole = true,
            reportToService = false
        } = options;

        const errorMessage = error instanceof Error ? error.message : error;
        const errorObject = error instanceof Error ? error : new Error(error);

        // Log to console in development
        if (logToConsole && process.env.NODE_ENV === 'development') {
            console.error(`Error${context ? ` in ${context}` : ''}:`, errorObject);
        }

        // Show toast notification (would need to integrate with toast library)
        if (showToast && typeof window !== 'undefined') {
            // Placeholder for toast notification
            console.warn('Toast notification:', errorMessage);
        }

        // Report to error tracking service
        if (reportToService && typeof window !== 'undefined') {
            // Google Analytics error tracking
            if ((window as { gtag?: (...args: unknown[]) => void }).gtag) {
                ((window as unknown) as { gtag: (...args: unknown[]) => void }).gtag('event', 'exception', {
                    description: errorMessage,
                    fatal: false,
                    context: context || 'unknown'
                });
            }

            // You can add other error tracking services here (Sentry, LogRocket, etc.)
        }
    }, []);

    const handleAsyncError = useCallback(async <T>(
        asyncFn: () => Promise<T>,
        context?: string,
        options?: ErrorHandlerOptions
    ): Promise<T | null> => {
        try {
            return await asyncFn();
        } catch (error) {
            handleError(
                error instanceof Error ? error : new Error(String(error)),
                context,
                options
            );
            return null;
        }
    }, [handleError]);

    return {
        handleError,
        handleAsyncError
    };
}

// Utility function for handling API errors specifically
export function getApiErrorMessage(error: { response?: { data?: { message?: string; error?: string } } }): string {
    if (error?.response?.data?.message) {
        return error.response.data.message;
    }

    if (error?.response?.data?.error) {
        return error.response.data.error;
    }

    if ((error as { message?: string })?.message) {
        return (error as { message: string }).message;
    }

    // Handle specific HTTP status codes
    if ((error as { response?: { status?: number } })?.response?.status) {
        switch ((error as { response: { status: number } }).response.status) {
            case 400:
                return 'Dữ liệu không hợp lệ';
            case 401:
                return 'Yêu cầu xác thực';
            case 403:
                return 'Không có quyền truy cập';
            case 404:
                return 'Không tìm thấy tài nguyên';
            case 429:
                return 'Quá nhiều yêu cầu, vui lòng thử lại sau';
            case 500:
                return 'Lỗi máy chủ nội bộ';
            case 502:
                return 'Lỗi gateway';
            case 503:
                return 'Dịch vụ không khả dụng';
            case 504:
                return 'Timeout gateway';
            default:
                return 'Đã xảy ra lỗi không xác định';
        }
    }

    return 'Đã xảy ra lỗi không xác định';
}