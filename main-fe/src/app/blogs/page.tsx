import BlogsPageClient from './BlogsPageClient';
import { mapBlogSummaryToPost } from '@/lib/contentMappers';
import { publicApiServer } from '@/lib/publicApiServer';

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
