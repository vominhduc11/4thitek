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
            title: '4T HITEK | Bai viet',
            description: 'Bai viet tu 4T HITEK.'
        });
    }

    const article = response.data;
    const articleTitle = typeof article.title === 'string' && article.title.trim() ? article.title.trim() : 'Bai viet';
    const articleDescription =
        typeof article.description === 'string' && article.description.trim() ? article.description.trim() : articleTitle;
    const articleCategory = typeof article.category === 'string' ? article.category.trim() : '';
    const articlePath = buildBlogPath(article.id, articleTitle);
    return createBaseMetadata({
        locale: 'vi',
        path: articlePath,
        title: `${articleTitle} | 4T HITEK`,
        description: articleDescription,
        image: parseImageUrl(article.image, '') || undefined,
        keywords: ['4T HITEK', 'tai nghe SCS', articleCategory, articleTitle].filter(Boolean) as string[]
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
    const articleTitle = typeof article?.title === 'string' && article.title.trim() ? article.title.trim() : 'Bai viet';
    const articleDescription =
        typeof article?.description === 'string' && article.description.trim() ? article.description.trim() : articleTitle;

    return (
        <>
            {article ? (
                <JsonLd
                    data={articleJsonLd({
                        id,
                        title: articleTitle,
                        description: articleDescription,
                        image: parseImageUrl(article.image, ''),
                        publishedAt: article.createdAt,
                        path: buildBlogPath(article.id, articleTitle)
                    })}
                />
            ) : null}
            {children}
        </>
    );
}
