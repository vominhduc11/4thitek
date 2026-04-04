export const SITE_URL = 'https://4thitek.vn';
export const SITE_NAME = '4T HITEK';
export const LEGAL_COMPANY_NAME = 'CÔNG TY TNHH 4T HITEK';
export const TAX_CODE = '0317535798';
export const CONTACT_EMAIL = 'info@4thitek.vn';
export const AUTOMATED_SENDER_EMAIL = 'info@4thitek.vn';
export const CONTACT_PHONE = '0879689900';
export const REGISTERED_ADDRESS = '79/30/52 Âu Cơ, Phường Hòa Bình, TP. Hồ Chí Minh';
export const REGISTERED_ADDRESS_LINES = ['79/30/52 Âu Cơ, Phường Hòa Bình', 'TP. Hồ Chí Minh'] as const;
export const SOCIAL_PROFILE_LABEL = 'SCS Vietnam';
export const SUPPORTED_LOCALES = ['vi', 'en'] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: SupportedLocale = 'vi';
export const LANGUAGE_COOKIE = 'language';

export const isSupportedLocale = (value: string | null | undefined): value is SupportedLocale =>
    SUPPORTED_LOCALES.includes((value ?? '') as SupportedLocale);

export const resolveSupportedLocale = (value: string | null | undefined): SupportedLocale =>
    isSupportedLocale(value) ? value : DEFAULT_LOCALE;

export const buildCanonicalUrl = (path: string = '/') => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return new URL(normalizedPath, SITE_URL);
};
