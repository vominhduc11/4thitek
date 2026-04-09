import { describe, expect, it, vi } from 'vitest';

const {
    notFoundMock,
    redirectMock,
    fetchProductByIdMock,
    fetchRelatedProductsMock,
    productPageClientMock
} = vi.hoisted(() => ({
    notFoundMock: vi.fn(() => {
        throw new Error('NEXT_NOT_FOUND');
    }),
    redirectMock: vi.fn((path: string) => {
        throw new Error(`NEXT_REDIRECT:${path}`);
    }),
    fetchProductByIdMock: vi.fn(),
    fetchRelatedProductsMock: vi.fn(),
    productPageClientMock: vi.fn(() => null)
}));

vi.mock('next/navigation', () => ({
    notFound: notFoundMock,
    redirect: redirectMock
}));

vi.mock('@/lib/publicApiServer', () => ({
    publicApiServer: {
        fetchProductById: fetchProductByIdMock,
        fetchRelatedProducts: fetchRelatedProductsMock
    }
}));

vi.mock('./ProductPageClient', () => ({
    default: productPageClientMock
}));

describe('ProductPage', () => {
    it('redirects non-canonical route segments to the slugged product path', async () => {
        fetchProductByIdMock.mockResolvedValueOnce({
            success: true,
            data: {
                id: 42,
                name: 'SCS S10',
                shortDescription: 'Portable headset',
                image: '/product.png'
            }
        });
        fetchRelatedProductsMock.mockResolvedValueOnce({
            success: true,
            data: []
        });

        const { default: ProductPage } = await import('./page');

        await expect(
            ProductPage({
                params: Promise.resolve({ id: '42' })
            })
        ).rejects.toThrowError('NEXT_REDIRECT:/products/42-scs-s10');

        expect(redirectMock).toHaveBeenCalledWith('/products/42-scs-s10');
    });

    it('calls notFound when the product detail request fails', async () => {
        fetchProductByIdMock.mockResolvedValueOnce({
            success: false,
            data: null
        });
        fetchRelatedProductsMock.mockResolvedValueOnce({
            success: true,
            data: []
        });

        const { default: ProductPage } = await import('./page');

        await expect(
            ProductPage({
                params: Promise.resolve({ id: '404-missing' })
            })
        ).rejects.toThrowError('NEXT_NOT_FOUND');

        expect(notFoundMock).toHaveBeenCalled();
    });

    it('passes the fetched product and related products to the client page on the canonical route', async () => {
        fetchProductByIdMock.mockResolvedValueOnce({
            success: true,
            data: {
                id: 42,
                name: 'SCS S10',
                shortDescription: 'Portable headset',
                description: 'Full detail',
                image: '/product.png',
                videos: [],
                specifications: []
            }
        });
        fetchRelatedProductsMock.mockResolvedValueOnce({
            success: true,
            data: [
                {
                    id: 7,
                    name: 'SCS S20',
                    shortDescription: 'Related product',
                    image: '/related.png'
                }
            ]
        });

        const { default: ProductPage } = await import('./page');
        const element = await ProductPage({
            params: Promise.resolve({ id: '42-scs-s10' })
        });

        expect(fetchProductByIdMock).toHaveBeenCalledWith('42');
        expect(fetchRelatedProductsMock).toHaveBeenCalledWith('42', 4);
        expect(element.props).toMatchObject({
            initialProductData: expect.objectContaining({
                id: 42,
                name: 'SCS S10'
            }),
            initialRelatedProducts: [
                expect.objectContaining({
                    id: 7,
                    name: 'SCS S20'
                })
            ]
        });
    });
});
