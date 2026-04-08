import type { Metadata } from 'next';
import BlogsPageClient from './BlogsPageClient';
import { mapBlogSummaryToPost } from '@/lib/contentMappers';
import { publicApiServer } from '@/lib/publicApiServer';
import { createBaseMetadata } from '@/lib/seo';

export const metadata: Metadata = createBaseMetadata({
    locale: 'vi',
    path: '/blogs',
    title: 'Tin tuc & Bai viet - 4T HITEK',
    description:
        'Cập nhật tin tức mới nhất về tai nghe SCS, hướng dẫn sử dụng, đánh giá sản phẩm và các bài viết chuyên sâu từ 4T HITEK.',
    keywords: ['tin tức tai nghe SCS', '4T HITEK blog', 'đánh giá tai nghe', 'hướng dẫn tai nghe SCS']
});

interface BlogsPageProps {
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function BlogsPage({ searchParams }: BlogsPageProps) {
    const [blogsResponse, categoriesResponse, resolvedSearchParams] = await Promise.all([
        publicApiServer.fetchBlogs(),
        publicApiServer.fetchBlogCategories(),
        searchParams ?? Promise.resolve({} as Record<string, string | string[] | undefined>)
    ]);

    const initialPosts = (blogsResponse.data ?? [])
        .map((blog) => mapBlogSummaryToPost(blog))
        .filter((blog): blog is NonNullable<typeof blog> => blog !== null);

    const initialCategories = (categoriesResponse.data ?? []).map((category) => ({
        id: String(category.id),
        name: category.name
    }));

    const rawCategory = resolvedSearchParams.category;
    const initialSelectedCategory =
        typeof rawCategory === 'string' && rawCategory.trim().length > 0 ? rawCategory : 'ALL';

    return (
        <BlogsPageClient
            initialPosts={initialPosts}
            initialCategories={initialCategories}
            initialSelectedCategory={initialSelectedCategory}
        />
    );
}
