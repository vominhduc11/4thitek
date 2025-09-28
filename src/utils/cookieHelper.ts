import { WARRANTY_CONSTANTS } from '@/constants/warranty';

export const cookieHelper = {
    /**
     * Set authentication cookie
     */
    setAuthCookie(): void {
        if (typeof document !== 'undefined') {
            document.cookie = `${WARRANTY_CONSTANTS.COOKIE_NAME}=${WARRANTY_CONSTANTS.COOKIE_VALUE}; path=/; max-age=${WARRANTY_CONSTANTS.COOKIE_MAX_AGE}`;
        }
    },

    /**
     * Clear authentication cookie
     */
    clearAuthCookie(): void {
        if (typeof document !== 'undefined') {
            document.cookie = `${WARRANTY_CONSTANTS.COOKIE_NAME}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        }
    },

    /**
     * Check if auth cookie exists
     */
    hasAuthCookie(): boolean {
        if (typeof document === 'undefined') return false;
        return document.cookie.includes(`${WARRANTY_CONSTANTS.COOKIE_NAME}=`);
    }
};