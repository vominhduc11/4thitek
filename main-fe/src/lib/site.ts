export const SITE_URL = 'https://4thitek.vn';
export const SITE_NAME = '4ThiTek';
export const DEFAULT_LOCALE = 'vi';
export const SUPPORTED_LOCALES = ['vi', 'en'] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const buildCanonicalUrl = (path: string = '/') => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return new URL(normalizedPath, SITE_URL);
};
