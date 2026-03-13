import { afterEach, describe, expect, it, vi } from 'vitest';

const importMedia = async () => {
    vi.resetModules();
    return import('./media');
};

describe('media helpers', () => {
    afterEach(() => {
        vi.unstubAllEnvs();
        delete (globalThis as { window?: unknown }).window;
    });

    it('rewrites legacy storage host image URLs through the backend uploads path', async () => {
        vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'https://api.4thitek.vn/api/v1');

        const media = await importMedia();

        expect(
            media.parseImageUrl(
                JSON.stringify({
                    imageUrl: 'https://storage.4thitek.vn/4thitek-uploads/products/example.png'
                })
            )
        ).toBe('https://api.4thitek.vn/uploads/products/example.png');
    });

    it('normalizes bare object keys to backend upload URLs', async () => {
        vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'https://api.4thitek.vn/api/v1');

        const media = await importMedia();

        expect(media.parseImageUrl('products/example.png')).toBe(
            'https://api.4thitek.vn/uploads/products/example.png'
        );
    });
});
