const APP_TIME_ZONE = 'Asia/Ho_Chi_Minh';
const WARRANTY_DATE_FORMAT_OPTIONS: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
};

export const formatWarrantyPurchaseDate = (value: string, locale: string) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
    if (!match) {
        throw new Error(`Invalid warranty purchase date: ${value}`);
    }

    const [, year, month, day] = match;
    const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
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
