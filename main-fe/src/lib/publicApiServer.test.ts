import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const importPublicApiServer = async () => {
    vi.resetModules();
    return import('./publicApiServer');
};

describe('publicApiServer', () => {
    beforeEach(() => {
        vi.stubEnv('NEXT_PUBLIC_API_ORIGIN', '');
        vi.stubEnv('NEXT_PUBLIC_API_VERSION', '');
        vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'https://api.4thitek.vn/api/v1');
        vi.stubEnv('INTERNAL_API_ORIGIN', '');
        vi.stubEnv('INTERNAL_API_VERSION', '');
        vi.stubEnv('INTERNAL_API_BASE_URL', 'https://api.4thitek.vn/api/v1');
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
    });

    it('uses ISR-friendly fetch options for product listings', async () => {
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                data: [{ id: 1, name: 'SCS S10' }]
            })
        });
        vi.stubGlobal('fetch', fetchMock);

        const { publicApiServer } = await importPublicApiServer();
        await publicApiServer.fetchProducts();

        expect(fetchMock).toHaveBeenCalledWith(
            'https://api.4thitek.vn/api/v1/product/products',
            expect.objectContaining({
                cache: 'force-cache',
                next: { revalidate: 60 }
            })
        );
    });

    it('normalizes /api env values to the canonical /api/v1 endpoint', async () => {
        vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'https://api.4thitek.vn/api');
        vi.stubEnv('INTERNAL_API_BASE_URL', 'https://api.4thitek.vn/api');

        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                data: [{ id: 1, name: 'SCS S10' }]
            })
        });
        vi.stubGlobal('fetch', fetchMock);

        const { publicApiServer } = await importPublicApiServer();
        await publicApiServer.fetchProducts();

        expect(fetchMock).toHaveBeenCalledWith(
            'https://api.4thitek.vn/api/v1/product/products',
            expect.any(Object)
        );
    });

    it('builds public requests from origin + version env when provided', async () => {
        vi.stubEnv('NEXT_PUBLIC_API_ORIGIN', 'https://api.4thitek.vn');
        vi.stubEnv('NEXT_PUBLIC_API_VERSION', 'v2');
        vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', '');
        vi.stubEnv('INTERNAL_API_ORIGIN', 'https://api.4thitek.vn');
        vi.stubEnv('INTERNAL_API_VERSION', 'v2');
        vi.stubEnv('INTERNAL_API_BASE_URL', '');

        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                data: [{ id: 1, name: 'SCS S10' }]
            })
        });
        vi.stubGlobal('fetch', fetchMock);

        const { publicApiServer } = await importPublicApiServer();
        await publicApiServer.fetchProducts();

        expect(fetchMock).toHaveBeenCalledWith(
            'https://api.4thitek.vn/api/v2/product/products',
            expect.any(Object)
        );
    });

    it('supports overriding the version for a specific public API request', async () => {
        vi.stubEnv('NEXT_PUBLIC_API_ORIGIN', 'https://api.4thitek.vn');
        vi.stubEnv('NEXT_PUBLIC_API_VERSION', 'v1');
        vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', '');
        vi.stubEnv('INTERNAL_API_ORIGIN', 'https://api.4thitek.vn');
        vi.stubEnv('INTERNAL_API_VERSION', 'v1');
        vi.stubEnv('INTERNAL_API_BASE_URL', '');

        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                data: [{ id: 1, name: 'SCS S10' }]
            })
        });
        vi.stubGlobal('fetch', fetchMock);

        const { publicApiServer } = await importPublicApiServer();
        await publicApiServer.fetchProducts({ version: 'v3' });

        expect(fetchMock).toHaveBeenCalledWith(
            'https://api.4thitek.vn/api/v3/product/products',
            expect.any(Object)
        );
    });

    it('returns a normalized failure envelope when the upstream request fails', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockRejectedValue(new Error('network down'))
        );

        const { publicApiServer } = await importPublicApiServer();
        const response = await publicApiServer.fetchBlogs();

        expect(response).toEqual({
            success: false,
            data: null,
            error: 'network down'
        });
    });
});
