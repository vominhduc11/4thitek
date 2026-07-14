import type { Metadata } from 'next';
import { Suspense } from 'react';
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

// KHÔNG đọc `searchParams` ở server (Dynamic API ép route thành SSR). Trang render tĩnh
// (SSG/ISR); bộ lọc category ?category= được đọc ở client trong BlogsPageClient qua
// useSearchParams — bọc trong <Suspense> để build không bail-out CSR toàn trang.
export default async function BlogsPage() {
    const [blogsResponse, categoriesResponse] = await Promise.all([
        publicApiServer.fetchBlogs(),
        publicApiServer.fetchBlogCategories()
    ]);

    const initialPosts = (blogsResponse.data ?? [])
        .map((blog) => mapBlogSummaryToPost(blog))
        .filter((blog): blog is NonNullable<typeof blog> => blog !== null);

    const initialCategories = (categoriesResponse.data ?? []).map((category) => ({
        id: String(category.id),
        name: category.name
    }));

    return (
        <Suspense fallback={null}>
            <BlogsPageClient initialPosts={initialPosts} initialCategories={initialCategories} />
        </Suspense>
    );
}
