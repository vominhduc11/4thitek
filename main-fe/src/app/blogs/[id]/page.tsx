'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { apiService } from '@/services/apiService';
import type { BlogPost, ApiBlogBlock } from '@/types/blog';
import BlogDetailHero from '@/app/blogs/[id]/components/BlogDetailHero';
import { useHydration } from '@/hooks/useHydration';
import { formatDateSafe } from '@/utils/dateFormatter';
import { useLanguage } from '@/context/LanguageContext';
import { CardSkeleton } from '@/components/ui/SkeletonLoader';
import { useRetry } from '@/hooks/useRetry';
import { parseImageUrl } from '@/utils/media';

function mapApiBlogToPost(
    blogData: { id: string | number; title: string; description: string; image: string; category: string; createdAt: string; introduction?: string },
): BlogPost {
    const blogId = blogData.id?.toString().trim();
    if (!blogId) {
        throw new Error('Missing blog id');
    }

    const introductionBlocks = (() => {
        try {
            return JSON.parse(blogData.introduction || '[]') as ApiBlogBlock[];
        } catch {
            return [] as ApiBlogBlock[];
        }
    })();

    return {
        id: blogId,
        title: blogData.title,
        slug: blogData.title.toLowerCase().replace(/\s+/g, '-'),
        excerpt: blogData.description,
        content: blogData.description,
        featuredImage: parseImageUrl(blogData.image),
        publishedAt: blogData.createdAt,
        category: {
            id: blogData.category,
            name: blogData.category,
            slug: blogData.category.toLowerCase().replace(/\s+/g, '-'),
            description: blogData.category
        },
        introductionBlocks,
        tags: [],
        isPublished: true,
        seo: {
            metaTitle: blogData.title,
            metaDescription: blogData.description
        }
    };
}

export default function BlogDetailPageImproved() {
    const { t, locale } = useLanguage();
    const params = useParams();
    const [post, setPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
    const [error, setError] = useState<string | null>(null);
    useHydration();
    const { retry, retryCount, isRetrying, canRetry } = useRetry({
        maxAttempts: 3,
        delayMs: 1500,
        exponentialBackoff: true,
    });

    useEffect(() => {
        if (!params?.id) return;
        const postId = params.id as string;

        const fetchSpecificPost = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await apiService.fetchBlogById(postId);
                if (!response.success || !response.data) {
                    throw new Error(t('blog.detail.notFound'));
                }
                setPost(mapApiBlogToPost(response.data));
            } catch (fetchError) {
                console.error('Error fetching blog post:', fetchError);
                setPost(null);
                setError(t('blog.detail.notFound'));
            } finally {
                setLoading(false);
            }
        };

        void fetchSpecificPost();
    }, [params?.id, t]);

    const fetchRelatedPosts = useCallback(async (currentPost: BlogPost) => {
        try {
            const response = await apiService.fetchRelatedBlogs(currentPost.id, 4);
            if (!response.success || !response.data) {
                setRelatedPosts([]);
                return;
            }
            const transformed = (response.data as Array<{ id: string | number; title: string; description: string; image: string; category: string; createdAt: string }>)
                .map((blog) => mapApiBlogToPost(blog))
                .filter((item) => item.id !== currentPost.id);
            setRelatedPosts(transformed);
        } catch (fetchError) {
            console.error('Error fetching related blogs:', fetchError);
            setRelatedPosts([]);
        }
    }, []);

    useEffect(() => {
        if (!post) return;
        void fetchRelatedPosts(post);
    }, [post, fetchRelatedPosts]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0c131d] text-white">
                <BlogDetailHero />
                <section className="bg-[#0c131d] w-full -mt-16 pt-16 pb-8">
                    <div className="ml-0 sm:ml-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
                        <div className="h-10 bg-gray-700 rounded w-3/4 mb-4 animate-pulse"></div>
                        <div className="flex gap-4 mb-4">
                            <div className="h-5 bg-gray-700 rounded w-32 animate-pulse"></div>
                            <div className="h-5 bg-gray-700 rounded w-24 animate-pulse"></div>
                        </div>
                    </div>
                </section>
                <section className="bg-[#0c131d] pb-8">
                    <div className="ml-0 sm:ml-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
                        <div className="relative w-full h-[330px] sm:h-[430px] lg:h-[530px] bg-gray-800 rounded animate-pulse"></div>
                    </div>
                </section>
                <section className="bg-[#0c131d] py-12">
                    <div className="ml-0 sm:ml-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
                        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
                            <div className="lg:col-span-7">
                                <CardSkeleton height={600} backgroundColor="#1e293b" foregroundColor="#334155" />
                            </div>
                            <div className="lg:col-span-3 space-y-4">
                                <CardSkeleton height={200} backgroundColor="#1e293b" foregroundColor="#334155" />
                                <CardSkeleton height={200} backgroundColor="#1e293b" foregroundColor="#334155" />
                                <CardSkeleton height={200} backgroundColor="#1e293b" foregroundColor="#334155" />
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        );
    }

    if (error || !post) {
        const handleRetry = async () => {
            if (!params?.id) return;
            const postId = params.id as string;
            try {
                await retry(async () => {
                    setLoading(true);
                    const response = await apiService.fetchBlogById(postId);
                    if (!response.success || !response.data) {
                        throw new Error(t('errors.blogs.loadFailed'));
                    }
                    setPost(mapApiBlogToPost(response.data));
                    setError(null);
                });
            } catch (retryError) {
                console.error('Retry failed:', retryError);
            } finally {
                setLoading(false);
            }
        };

        return (
            <motion.div className="min-h-screen bg-[#0c131d] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <motion.div className="bg-[#1e293b] rounded-lg border border-red-500/30 p-8 max-w-md w-full text-center" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}>
                    <h3 className="text-lg font-semibold text-red-400 mb-2">{t('errors.blogs.loadFailed')}</h3>
                    <p className="text-gray-300 mb-6">{error || t('blog.detail.notFound')}</p>
                    <div className="flex gap-3">
                        <motion.button onClick={handleRetry} disabled={isRetrying || !canRetry} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded transition-colors" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            {isRetrying ? t('errors.products.retrying').replace('{count}', String(retryCount)) : t('common.retry')}
                        </motion.button>
                        <Link href="/blogs" className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded text-center transition-colors">
                            {t('blog.detail.backToList')}
                        </Link>
                    </div>
                </motion.div>
            </motion.div>
        );
    }

    const blocks: ApiBlogBlock[] = post.introductionBlocks || [];

    return (
        <div className="min-h-screen bg-[#0c131d] text-white">
            <BlogDetailHero />
            <section className="bg-[#0c131d] w-full -mt-16 pt-16 pb-8">
                <div className="ml-0 sm:ml-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
                    <p className="text-sm text-[#4FC8FF] uppercase tracking-[0.2em]">{post.category.name}</p>
                    <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-white">{post.title}</h1>
                    <p className="mt-3 text-sm text-gray-400">{formatDateSafe(post.publishedAt, true, locale)}</p>
                </div>
            </section>

            <section className="bg-[#0c131d] pb-8">
                <div className="ml-0 sm:ml-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
                    <div className="relative w-full h-[330px] sm:h-[430px] lg:h-[530px] overflow-hidden rounded-3xl border border-white/10 bg-[#101827]">
                        {post.featuredImage ? (
                            <Image src={post.featuredImage} alt={post.title} fill className="object-cover" />
                        ) : null}
                    </div>
                </div>
            </section>

            <section className="bg-[#0c131d] py-12">
                <div className="ml-0 sm:ml-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
                    <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
                        <article className="lg:col-span-7 rounded-3xl border border-white/10 bg-[#111827] p-6 prose prose-invert max-w-none">
                            <p className="text-lg text-gray-300">{post.excerpt}</p>
                            {blocks.map((block, index) => {
                                if (block.type === 'title') {
                                    return <h2 key={`title-${index}`}>{block.text}</h2>;
                                }
                                if (block.type === 'image' && block.imageUrl) {
                                    return (
                                        <div
                                            key={`image-${index}`}
                                            className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-3"
                                        >
                                            <div className="relative h-80 w-full">
                                                <Image
                                                    src={block.imageUrl}
                                                    alt={block.caption || post.title}
                                                    fill
                                                    className="object-contain"
                                                />
                                            </div>
                                            {block.caption ? (
                                                <p className="mt-3 text-sm text-gray-400">{block.caption}</p>
                                            ) : null}
                                        </div>
                                    );
                                }
                                if (block.type === 'video' && block.videoUrl) {
                                    return (
                                        <div
                                            key={`video-${index}`}
                                            className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-3"
                                        >
                                            <div className="aspect-video w-full overflow-hidden rounded-xl">
                                                <iframe
                                                    src={block.videoUrl}
                                                    title={block.caption || post.title}
                                                    className="h-full w-full"
                                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                    allowFullScreen
                                                />
                                            </div>
                                            {block.caption ? (
                                                <p className="mt-3 text-sm text-gray-400">{block.caption}</p>
                                            ) : null}
                                        </div>
                                    );
                                }
                                return <p key={`paragraph-${index}`}>{block.text}</p>;
                            })}
                        </article>

                        <aside className="lg:col-span-3 space-y-4">
                            <div className="rounded-3xl border border-white/10 bg-[#111827] p-5">
                                <p className="text-sm font-semibold text-white">{t('blog.detail.relatedPosts')}</p>
                                <div className="mt-4 space-y-4">
                                    {relatedPosts.length === 0 ? (
                                        <p className="text-sm text-gray-400">{t('blog.detail.noRelated')}</p>
                                    ) : (
                                        relatedPosts.map((item) => (
                                            <Link key={item.id} href={`/blogs/${item.id}`} className="block rounded-2xl border border-white/10 bg-white/5 p-3 transition hover:bg-white/10">
                                                <p className="text-sm font-semibold text-white">{item.title}</p>
                                                <p className="mt-1 text-xs text-gray-400">{item.category.name}</p>
                                            </Link>
                                        ))
                                    )}
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>
            </section>
        </div>
    );
}
