import type { Metadata } from 'next';
import JsonLd from '@/components/seo/JsonLd';
import { articleJsonLd, createBaseMetadata } from '@/lib/seo';
import { publicApiServer } from '@/lib/publicApiServer';

const parseImageUrl = (value: string) => {
    try {
        const parsed = JSON.parse(value) as { imageUrl?: string };
        return parsed.imageUrl || '';
    } catch {
        return value;
    }
};

export async function generateMetadata({
    params
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const { id } = await params;
    const response = await publicApiServer.fetchBlogById(id);
    if (!response.success || !response.data) {
        return createBaseMetadata({
            locale: 'vi',
            path: `/blogs/${id}`,
            title: '4ThiTek | Bài viết',
            description: 'Bài viết từ 4ThiTek.'
        });
    }

    const article = response.data;
    return createBaseMetadata({
        locale: 'vi',
        path: `/blogs/${id}`,
        title: `${article.title} | 4ThiTek`,
        description: article.description || article.title
    });
}

export default async function BlogDetailLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
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
                        image: parseImageUrl(article.image),
                        publishedAt: article.createdAt
                    })}
                />
            ) : null}
            {children}
        </>
    );
}
