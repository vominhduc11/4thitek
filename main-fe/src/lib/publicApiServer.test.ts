import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const importPublicApiServer = async () => {
    vi.resetModules();
    return import('./publicApiServer');
};

describe('publicApiServer', () => {
    beforeEach(() => {
        vi.stubEnv('NEXT_PUBLIC_API_BASE_URL', 'https://api.4thitek.vn/api/v1');
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
