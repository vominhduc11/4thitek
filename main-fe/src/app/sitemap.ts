import type { MetadataRoute } from 'next';
import { stat } from 'node:fs/promises';
import { join } from 'node:path';
import { publicApiServer } from '@/lib/publicApiServer';
import { buildBlogPath } from '@/lib/slug';
import { SITE_URL } from '@/lib/site';

const STATIC_ROUTES = [
    { path: '', source: 'src/app/page.tsx', priority: 1, changeFrequency: 'daily' as const },
    { path: '/products', source: 'src/app/products/page.tsx', priority: 0.9, changeFrequency: 'weekly' as const },
    { path: '/blogs', source: 'src/app/blogs/page.tsx', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/about', source: 'src/app/about/page.tsx', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/contact', source: 'src/app/contact/page.tsx', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/warranty-check', source: 'src/app/warranty-check/page.tsx', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/certification', source: 'src/app/certification/page.tsx', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/become_our_reseller', source: 'src/app/become_our_reseller/page.tsx', priority: 0.6, changeFrequency: 'monthly' as const },
    { path: '/privacy-policy', source: 'src/app/privacy-policy/page.tsx', priority: 0.5, changeFrequency: 'yearly' as const },
    { path: '/policy', source: 'src/app/policy/page.tsx', priority: 0.5, changeFrequency: 'yearly' as const }
] as const;

async function resolveLastModified(relativePath: string) {
    try {
        const file = await stat(join(process.cwd(), relativePath));
        return file.mtime;
    } catch {
        return undefined;
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const [staticRoutes, productsResponse, blogsResponse] = await Promise.all([
        Promise.all(
            STATIC_ROUTES.map(async ({ path, source, priority, changeFrequency }) => ({
                url: `${SITE_URL}${path}`,
                lastModified: await resolveLastModified(source),
                changeFrequency,
                priority
            }))
        ),
        publicApiServer.fetchProducts(),
        publicApiServer.fetchBlogs()
    ]);

    const productRoutes: MetadataRoute.Sitemap = (productsResponse.data ?? []).map((product) => ({
        url: `${SITE_URL}/products/${product.id}`,
        changeFrequency: 'weekly' as const,
        priority: 0.8
    }));

    const blogRoutes: MetadataRoute.Sitemap = (blogsResponse.data ?? []).map((blog) => ({
        url: `${SITE_URL}${buildBlogPath(blog.id, blog.title)}`,
        lastModified: blog.createdAt ? new Date(blog.createdAt) : undefined,
        changeFrequency: 'monthly',
        priority: 0.7
    }));

    return [...staticRoutes, ...productRoutes, ...blogRoutes];
}
