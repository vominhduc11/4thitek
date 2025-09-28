// Warranty-related constants
export const WARRANTY_CONSTANTS = {
    DEFAULT_WARRANTY_PERIOD_MONTHS: 12,
    COOKIE_MAX_AGE: 86400, // 1 day in seconds
    COOKIE_NAME: '4thitek_auth',
    COOKIE_VALUE: 'true',
    STORAGE_KEY: '4thitek_user'
} as const;

export const ERROR_MESSAGES = {
    PURCHASE_DATE_MISSING: 'Purchase date is missing from warranty data',
    SERIAL_MISSING: 'Product serial information is missing from warranty data',
    CUSTOMER_MISSING: 'Customer information is missing from warranty data',
    SERIAL_NOT_FOUND: 'Không tìm thấy thông tin bảo hành cho số serial này. Vui lòng kiểm tra lại số serial hoặc liên hệ bộ phận hỗ trợ.',
    SERVER_MAINTENANCE: 'Hệ thống đang bảo trì. Vui lòng thử lại sau ít phút.',
    NETWORK_ERROR: 'Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet và thử lại.',
    AUTH_EXPIRED: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
    GENERIC_ERROR: 'Có lỗi xảy ra khi kiểm tra bảo hành',
    CONNECTION_FAILED: 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối internet và thử lại.'
} as const;

export type ErrorType = 'not_found' | 'network' | 'server' | 'unknown';