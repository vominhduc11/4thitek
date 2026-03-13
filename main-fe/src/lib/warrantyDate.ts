const APP_TIME_ZONE = 'Asia/Ho_Chi_Minh';
const WARRANTY_DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
};

const parseWarrantyDateParts = (value: string) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
    if (!match) {
        throw new Error(`Invalid warranty purchase date: ${value}`);
    }

    const [, year, month, day] = match;
    const parsedYear = Number(year);
    const parsedMonth = Number(month);
    const parsedDay = Number(day);
    const date = new Date(Date.UTC(parsedYear, parsedMonth - 1, parsedDay));

    if (
        Number.isNaN(date.getTime()) ||
        date.getUTCFullYear() !== parsedYear ||
        date.getUTCMonth() !== parsedMonth - 1 ||
        date.getUTCDate() !== parsedDay
    ) {
        throw new Error(`Invalid warranty purchase date: ${value}`);
    }

    return date;
};

export const formatWarrantyPurchaseDate = (value: string, locale: string) => {
    const date = parseWarrantyDateParts(value);
    return new Intl.DateTimeFormat(locale, {
        ...WARRANTY_DATE_FORMAT_OPTIONS,
        timeZone: 'UTC',
    }).format(date);
};

export const formatWarrantyBoundaryDate = (value: string, locale: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        throw new Error(`Invalid warranty boundary date: ${value}`);
    }

    return new Intl.DateTimeFormat(locale, {
        ...WARRANTY_DATE_FORMAT_OPTIONS,
        timeZone: APP_TIME_ZONE,
    }).format(date);
};
