/**
 * Safe date formatting utility to prevent hydration mismatches
 * Returns consistent format between server and client
 */

const DISPLAY_TIME_ZONE = 'Asia/Ho_Chi_Minh';

const formatWithDisplayTimeZone = (
    date: Date,
    locale: string,
    options: Intl.DateTimeFormatOptions
) =>
    date.toLocaleDateString(locale, {
        ...options,
        timeZone: DISPLAY_TIME_ZONE
    });

export function formatDate(
    dateString: string,
    locale: string = 'vi-VN',
    options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }
): string {
    try {
        const date = new Date(dateString);

        // Check if date is valid
        if (isNaN(date.getTime())) {
            return dateString; // Return original string if invalid
        }

        return formatWithDisplayTimeZone(date, locale, options);
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString;
    }
}

export function formatDateSafe(dateString: string, isHydrated: boolean = true, locale: string = 'vi-VN'): string {
    try {
        const date = new Date(dateString);

        if (isNaN(date.getTime())) {
            return dateString;
        }

        const formatOptions: Intl.DateTimeFormatOptions = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        };

        if (!isHydrated) {
            return formatWithDisplayTimeZone(date, locale, formatOptions);
        }

        return formatWithDisplayTimeZone(date, locale, formatOptions);
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString;
    }
}
