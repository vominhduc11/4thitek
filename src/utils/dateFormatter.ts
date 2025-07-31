/**
 * Safe date formatting utility to prevent hydration mismatches
 * Returns consistent format between server and client
 */

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

        // For SSR compatibility, we can use a simpler format
        if (typeof window === 'undefined') {
            // Server-side: use simple format
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        }

        // Client-side: use localized format
        return date.toLocaleDateString(locale, options);
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString;
    }
}

export function formatDateSafe(dateString: string, isHydrated: boolean = true): string {
    try {
        const date = new Date(dateString);

        if (isNaN(date.getTime())) {
            return dateString;
        }

        // Use simple format until hydrated
        if (!isHydrated) {
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        }

        // After hydration, use localized format
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString;
    }
}
