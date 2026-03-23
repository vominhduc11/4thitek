import { describe, expect, it } from 'vitest';
import { buildBlogPath, buildProductPath, extractRouteId, slugify } from './slug';

describe('slug helpers', () => {
    it('builds canonical blog and product paths with stable ids', () => {
        expect(buildBlogPath(99, 'Review SCS S10')).toBe('/blogs/99-review-scs-s10');
        expect(buildProductPath(42, 'SCS S10 Pro')).toBe('/products/42-scs-s10-pro');
    });

    it('extracts entity ids from canonical slug routes', () => {
        expect(extractRouteId('42-scs-s10-pro')).toBe('42');
        expect(extractRouteId('99-review-scs-s10')).toBe('99');
    });

    it('normalizes Vietnamese text into ASCII slugs', () => {
        const source = `Tai nghe ${String.fromCharCode(272)}${String.fromCharCode(7863)}c bi${String.fromCharCode(7879)}t`;
        expect(slugify(source)).toBe('tai-nghe-dac-biet');
    });
});
