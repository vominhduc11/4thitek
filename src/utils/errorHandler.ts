import { ERROR_MESSAGES, ErrorType } from '@/constants/warranty';

interface ErrorInfo {
    message: string;
    type: ErrorType;
}

export const handleApiError = (error: unknown): ErrorInfo => {
    let errorType: ErrorType = 'unknown';
    let errorMessage = ERROR_MESSAGES.GENERIC_ERROR;

    // Handle different error scenarios
    if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status) {
            const status = axiosError.response.status;
            if (status === 404) {
                errorType = 'not_found';
                errorMessage = ERROR_MESSAGES.SERIAL_NOT_FOUND as typeof errorMessage;
            } else if (status >= 500) {
                errorType = 'server';
                errorMessage = ERROR_MESSAGES.SERVER_MAINTENANCE as typeof errorMessage;
            } else if (status === 401 || status === 403) {
                errorType = 'unknown';
                errorMessage = ERROR_MESSAGES.AUTH_EXPIRED as typeof errorMessage;
            }
        }
    } else if (error && typeof error === 'object' && 'code' in error) {
        const networkError = error as { code?: string };
        if (networkError.code === 'ECONNABORTED' || networkError.code === 'NETWORK_ERROR') {
            errorType = 'network';
            errorMessage = ERROR_MESSAGES.NETWORK_ERROR as typeof errorMessage;
        }
    } else if (error && typeof error === 'object' && 'message' in error) {
        const errorWithMessage = error as { message?: string };
        if (typeof errorWithMessage.message === 'string') {
            const message = errorWithMessage.message.toLowerCase();
            if (message.includes('404') || message.includes('not found')) {
                errorType = 'not_found';
                errorMessage = ERROR_MESSAGES.SERIAL_NOT_FOUND as typeof errorMessage;
            } else if (message.includes('network') || message.includes('timeout') || message.includes('fetch')) {
                errorType = 'network';
                errorMessage = ERROR_MESSAGES.NETWORK_ERROR as typeof errorMessage;
            } else if (message.includes('500') || message.includes('503') || message.includes('server')) {
                errorType = 'server';
                errorMessage = ERROR_MESSAGES.SERVER_MAINTENANCE as typeof errorMessage;
            }
        }
    } else {
        // Empty error object or unknown error
        errorType = 'network';
        errorMessage = ERROR_MESSAGES.CONNECTION_FAILED as typeof errorMessage;
    }

    return {
        message: errorMessage,
        type: errorType
    };
};