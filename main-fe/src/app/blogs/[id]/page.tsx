import { notFound, redirect } from 'next/navigation';
import BlogDetailPageClient from './BlogDetailPageClient';
import { mapBlogSummaryToPost } from '@/lib/contentMappers';
import { publicApiServer } from '@/lib/publicApiServer';
import { buildBlogPath, extractRouteId } from '@/lib/slug';

interface BlogDetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
    const { id: rawId } = await params;
    const blogId = extractRouteId(rawId);
    const response = await publicApiServer.fetchBlogById(blogId);

    if (!response.success || !response.data) {
        notFound();
    }

    const post = mapBlogSummaryToPost(response.data);
    if (!post) {
        notFound();
    }

    const canonicalPath = buildBlogPath(post.id, post.title);
    const canonicalSegment = canonicalPath.replace('/blogs/', '');
    if (rawId !== canonicalSegment) {
        redirect(canonicalPath);
    }

    const relatedResponse = await publicApiServer.fetchRelatedBlogs(blogId, 4);
    const relatedPosts = (relatedResponse.data ?? [])
        .map((blog) => mapBlogSummaryToPost(blog))
        .filter((blog): blog is NonNullable<typeof blog> => blog !== null && blog.id !== post.id);

    return <BlogDetailPageClient post={post} relatedPosts={relatedPosts} />;
}
