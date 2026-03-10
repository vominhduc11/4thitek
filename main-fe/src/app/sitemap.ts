import type { MetadataRoute } from 'next';
import { publicApiServer } from '@/lib/publicApiServer';
import { SITE_URL } from '@/lib/site';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticRoutes: MetadataRoute.Sitemap = [
        '',
        '/home',
        '/products',
        '/blogs',
        '/about',
        '/contact',
        '/warranty-check',
        '/privacy-policy',
        '/policy',
        '/certification',
        '/become_our_reseller',
        '/reseller_infomation'
    ].map((path) => ({
        url: `${SITE_URL}${path}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: path === '' || path === '/home' ? 1 : 0.7
    }));

    const [productsResponse, blogsResponse] = await Promise.all([
        publicApiServer.fetchProducts(),
        publicApiServer.fetchBlogs()
    ]);

    const productRoutes: MetadataRoute.Sitemap = (productsResponse.data ?? []).map((product) => ({
        url: `${SITE_URL}/products/${product.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8
    }));

    const blogRoutes: MetadataRoute.Sitemap = (blogsResponse.data ?? []).map((blog) => ({
        url: `${SITE_URL}/blogs/${blog.id}`,
        lastModified: blog.createdAt ? new Date(blog.createdAt) : new Date(),
        changeFrequency: 'monthly',
        priority: 0.7
    }));

    return [...staticRoutes, ...productRoutes, ...blogRoutes];
}
