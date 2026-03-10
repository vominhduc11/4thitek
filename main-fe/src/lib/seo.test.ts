import { describe, expect, it } from 'vitest';
import { articleJsonLd, createBaseMetadata, organizationJsonLd, productJsonLd, websiteJsonLd } from './seo';

describe('seo helpers', () => {
    it('builds canonical metadata with hreflang alternates', () => {
        const metadata = createBaseMetadata({
            locale: 'vi',
            path: '/products/scs-s10',
            title: 'SCS S10',
            description: 'Tai nghe danh gia'
        });

        expect(metadata.alternates?.canonical?.toString()).toBe('https://4thitek.vn/products/scs-s10');
        expect(metadata.alternates?.languages?.vi?.toString()).toBe('https://4thitek.vn/products/scs-s10');
        expect(metadata.openGraph?.locale).toBe('vi_VN');
    });

    it('generates organization, website, product and article structured data', () => {
        expect(organizationJsonLd()).toMatchObject({
            '@type': 'Organization',
            name: '4ThiTek'
        });
        expect(websiteJsonLd()).toMatchObject({
            '@type': 'WebSite'
        });
        expect(
            productJsonLd({
                id: '42',
                name: 'SCS S10',
                description: 'Mo ta'
            })
        ).toMatchObject({
            '@type': 'Product',
            url: 'https://4thitek.vn/products/42'
        });
        expect(
            articleJsonLd({
                id: '99',
                title: 'Review',
                description: 'Chi tiet',
                publishedAt: '2026-03-10T00:00:00Z'
            })
        ).toMatchObject({
            '@type': 'Article',
            mainEntityOfPage: 'https://4thitek.vn/blogs/99'
        });
    });
});
