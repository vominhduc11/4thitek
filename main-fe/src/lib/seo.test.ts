import { describe, expect, it } from 'vitest';
import { articleJsonLd, createBaseMetadata, localBusinessJsonLd, organizationJsonLd, productJsonLd, websiteJsonLd } from './seo';

describe('seo helpers', () => {
    it('builds canonical metadata without fake hreflang alternates', () => {
        const metadata = createBaseMetadata({
            locale: 'vi',
            path: '/products/scs-s10',
            title: 'SCS S10',
            description: 'Tai nghe danh gia'
        });

        expect(metadata.alternates?.canonical?.toString()).toBe('https://4thitek.vn/products/scs-s10');
        expect(metadata.alternates?.languages).toBeUndefined();
        expect(metadata.openGraph?.locale).toBe('vi_VN');
    });

    it('generates organization, website, product and article structured data', () => {
        expect(organizationJsonLd()).toMatchObject({
            '@type': 'Organization',
            name: '4T HITEK',
            legalName: 'CÔNG TY TNHH 4T HITEK'
        });
        expect(websiteJsonLd()).toMatchObject({
            '@type': 'WebSite'
        });
        expect(
            productJsonLd({
                id: '42',
                name: 'SCS S10',
                description: 'Mo ta',
                path: '/products/42-scs-s10'
            })
        ).toMatchObject({
            '@type': 'Product',
            url: 'https://4thitek.vn/products/42-scs-s10'
        });
        expect(
            articleJsonLd({
                id: '99',
                title: 'Review',
                description: 'Chi tiet',
                publishedAt: '2026-03-10T00:00:00Z',
                path: '/blogs/99-review'
            })
        ).toMatchObject({
            '@type': 'Article',
            mainEntityOfPage: 'https://4thitek.vn/blogs/99-review'
        });
        expect(localBusinessJsonLd()).toMatchObject({
            description: '4T HITEK la don vi phan phoi va ho tro san pham cong nghe ket noi cho hanh trinh duong dai tai Viet Nam.',
            address: {
                streetAddress: '79/30/52 Âu Cơ, Phương Hoà Bình, TP. Hồ Chí Minh'
            }
        });
    });
});
