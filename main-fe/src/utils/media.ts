// Shared helpers for media parsing to avoid duplicated JSON parsing logic across pages

import { API_BASE_URL } from '@/constants/api';

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '');
const trimLeadingSlash = (value: string) => value.replace(/^\/+/, '');
const stripApiSuffix = (value: string) => trimTrailingSlash(value).replace(/\/api(?:\/v1)?$/i, '');
const LEGACY_STORAGE_HOST_PATTERN = /(^|\.)storage\.4thitek\.vn$/i;
const LEGACY_STORAGE_BUCKET_PREFIX = '/4thitek-uploads/';

const isAbsoluteUrl = (value: string) => /^https?:\/\//i.test(value);

const getBackendOrigin = () => {
    const strippedBase = stripApiSuffix(API_BASE_URL);
    if (!strippedBase) {
        return '';
    }
    if (strippedBase.startsWith('/')) {
        return typeof window !== 'undefined' ? window.location.origin : '';
    }
    try {
        return new URL(strippedBase).origin;
    } catch {
        return '';
    }
};

export function resolveMediaUrl(value: string, fallback: string = ''): string {
    const trimmed = value.trim();
    if (!trimmed) return fallback;
    if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
        return trimmed;
    }

    if (isAbsoluteUrl(trimmed)) {
        try {
            const parsed = new URL(trimmed);
            if (LEGACY_STORAGE_HOST_PATTERN.test(parsed.hostname) && parsed.pathname.startsWith(LEGACY_STORAGE_BUCKET_PREFIX)) {
                const origin = getBackendOrigin();
                const key = trimLeadingSlash(parsed.pathname.slice(LEGACY_STORAGE_BUCKET_PREFIX.length));
                const path = `/uploads/${key}`;
                return origin ? `${origin}${path}` : path;
            }
        } catch {
            return fallback;
        }
        return trimmed;
    }

    const origin = getBackendOrigin();
    if (trimmed.startsWith('/uploads/')) {
        return origin ? `${origin}${trimmed}` : trimmed;
    }
    if (trimmed.startsWith('/')) {
        return trimmed;
    }

    const path = `/uploads/${trimLeadingSlash(trimmed)}`;
    return origin ? `${origin}${path}` : path;
}

export function parseImageUrl(imageString: string, fallback: string = ''): string {
    if (!imageString) return fallback;

    try {
        const parsed = JSON.parse(imageString) as { imageUrl?: string };
        if (typeof parsed?.imageUrl === 'string' && parsed.imageUrl.trim()) {
            return resolveMediaUrl(parsed.imageUrl, fallback);
        }
    } catch {
        const trimmed = imageString.trim();
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            return fallback;
        }
        return resolveMediaUrl(imageString, fallback);
    }

    return fallback;
}

export function parseJsonArray<T>(value: string | T[], fallback: T[] = []): T[] {
    if (Array.isArray(value)) return value;
    if (!value) return fallback;

    try {
        return JSON.parse(value) as T[];
    } catch {
        return fallback;
    }
}
