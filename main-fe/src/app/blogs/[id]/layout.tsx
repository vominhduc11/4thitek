import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { articleJsonLd, createBaseMetadata } from '@/lib/seo';
import { publicApiServer } from '@/lib/publicApiServer';
import { buildBlogPath, extractRouteId, slugify } from '@/lib/slug';
import { parseImageUrl } from '@/utils/media';

export async function generateStaticParams() {
    const response = await publicApiServer.fetchBlogs();
    return (response.data ?? []).flatMap((blog) => {
        const id = String(blog.id).trim();
        if (!id) return [];
        const slug = slugify(blog.title);
        return [
            {
                id: slug ? `${id}-${slug}` : id
            }
        ];
    });
}


export async function generateMetadata({
    params
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const { id: rawId } = await params;
    const id = extractRouteId(rawId);
    const response = await publicApiServer.fetchBlogById(id);
    if (!response.success || !response.data) {
        return createBaseMetadata({
            locale: 'vi',
            path: `/blogs/${id}`,
            title: '4ThiTek | Bai viet',
            description: 'Bai viet tu 4ThiTek.'
        });
    }

    const article = response.data;
    return createBaseMetadata({
        locale: 'vi',
        path: buildBlogPath(article.id, article.title),
        title: `${article.title} | 4ThiTek`,
        description: article.description || article.title,
        image: parseImageUrl(article.image, '') || undefined,
        keywords: ['4ThiTek', 'tai nghe SCS', article.category, article.title].filter(Boolean) as string[]
    });
}

export default async function BlogDetailLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}) {
    const { id: rawId } = await params;
    const id = extractRouteId(rawId);
    const response = await publicApiServer.fetchBlogById(id);
    const article = response.success ? response.data : null;

    return (
        <>
            {article ? (
                <JsonLd
                    data={articleJsonLd({
                        id,
                        title: article.title,
                        description: article.description || article.title,
                        image: parseImageUrl(article.image, ''),
                        publishedAt: article.createdAt,
                        path: buildBlogPath(article.id, article.title)
                    })}
                />
            ) : null}
            {children}
        </>
    );
}
