'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getPublishedPosts } from '@/data/blogs';
import { apiService } from '@/services/apiService';
import type { BlogPost, BlogContentBlock, ApiBlogBlock } from '@/types/blog';
import BlogDetailHero from '@/app/blogs/[id]/components/BlogDetailHero';
import { useHydration } from '@/hooks/useHydration';
import { formatDateSafe } from '@/utils/dateFormatter';
import { useLanguage } from '@/context/LanguageContext';
import { sanitizeBlogContent } from '@/utils/sanitize';

// Fallback blog posts
const fallbackBlogPosts: BlogPost[] = getPublishedPosts();

export default function BlogDetailPageImproved() {
    const { t } = useLanguage();
    const params = useParams();
    const [post, setPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
    const [, setError] = useState<string | null>(null);
    const isHydrated = useHydration();

    // Helper function to parse JSON strings from API
    const parseImageUrl = (imageData: string): string => {
        try {
            const parsed = JSON.parse(imageData);
            return parsed.imageUrl || '';
        } catch {
            return '';
        }
    };

    const parseIntroduction = (introData: string): ApiBlogBlock[] => {
        try {
            return JSON.parse(introData);
        } catch {
            return [];
        }
    };

    // Fetch current blog post and all blogs
    useEffect(() => {
        if (!params?.id) return;

        const postId = params.id as string;

        // Try to fetch specific blog post from API first
        const fetchSpecificPost = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await apiService.fetchBlogById(postId);

                if (response.success && response.data) {
                    // Transform API data to match BlogPost interface
                    const blogData = response.data;

                    // Parse image and introduction using helper functions
                    const featuredImage = parseImageUrl(blogData.image) || 'https://thinkzone.vn/uploads/2022_01/blogging-1641375905.jpg';
                    const introductionBlocks = parseIntroduction(blogData.introduction || '[]');

                    const transformedPost: BlogPost = {
                        id: blogData.id?.toString() || postId,
                        title: blogData.title,
                        slug: blogData.title.toLowerCase().replace(/\s+/g, '-'),
                        excerpt: blogData.description,
                        content: blogData.description, // Use description as string content
                        featuredImage: featuredImage,
                        publishedAt: blogData.createdAt,
                        category: {
                            id: blogData.category,
                            name: blogData.category,
                            slug: blogData.category.toLowerCase().replace(/\s+/g, '-'),
                            description: blogData.category
                        },
                        introductionBlocks: introductionBlocks,
                        // Add default fields that might be expected
                        author: {
                            id: 'api-author',
                            name: '4THITEK Team',
                            title: 'Technical Team',
                            avatar: '/authors/tech-team.png',
                            bio: '4THITEK Technical Team'
                        },
                        tags: [],
                        isPublished: true,
                        seo: {
                            metaTitle: blogData.title,
                            metaDescription: blogData.description
                        }
                    };

                    setPost(transformedPost);
                } else {
                    // Fallback to searching in fallbackBlogPosts
                    const foundPost = fallbackBlogPosts.find((p) => p.id === postId);
                    if (foundPost) {
                        setPost(foundPost);
                    } else {
                        setError('Blog post not found');
                    }
                }
            } catch (fetchError) {
                console.error('Error fetching blog post:', fetchError);
                // Fallback to searching in fallbackBlogPosts
                const foundPost = fallbackBlogPosts.find((p) => p.id === postId);
                if (foundPost) {
                    setPost(foundPost);
                } else {
                    setError('Blog post not found');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchSpecificPost();
    }, [params?.id]);

    // Memoize the fetch function to avoid dependency issues
    const fetchRelatedPosts = useCallback(async (currentPost: BlogPost) => {
            try {
                const fields = 'id%2Ctitle%2Cdescription%2Cimage%2Ccategory%2CcreatedAt';
                const response = await apiService.fetchRelatedBlogs(currentPost.id, 4, fields);
                if (response.success && response.data) {
                    // Transform API data to match BlogPost interface
                    const transformedRelated = (response.data as { id: number; title: string; description: string; image: string; category: string; createdAt: string }[]).map((blog) => {
                        const featuredImage = parseImageUrl(blog.image) || 'https://thinkzone.vn/uploads/2022_01/blogging-1641375905.jpg';

                        return {
                            id: blog.id?.toString() || `blog-${Date.now()}`,
                            title: blog.title,
                            slug: blog.title.toLowerCase().replace(/\s+/g, '-'),
                            excerpt: blog.description,
                            content: blog.description,
                            featuredImage: featuredImage,
                            publishedAt: blog.createdAt,
                            readingTime: 5,
                            category: {
                                id: blog.category,
                                name: blog.category,
                                slug: blog.category.toLowerCase().replace(/\s+/g, '-'),
                                description: blog.category
                            },
                            author: {
                                id: 'api-author',
                                name: '4THITEK Team',
                                title: 'Technical Team',
                                avatar: '/authors/tech-team.png',
                                bio: '4THITEK Technical Team'
                            },
                            tags: [],
                            isPublished: true
                        };
                    });
                    setRelatedPosts(transformedRelated);
                } else {
                    // Fallback: use fallbackBlogPosts instead of allPosts to avoid dependency issues
                    const related = fallbackBlogPosts
                        .filter((p) => p.id !== currentPost.id)
                        .sort((a, b) => {
                            // Prioritize same category
                            if (a.category.id === currentPost.category.id && b.category.id !== currentPost.category.id) return -1;
                            if (b.category.id === currentPost.category.id && a.category.id !== currentPost.category.id) return 1;
                            // Then by date
                            return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
                        })
                        .slice(0, 3);
                    setRelatedPosts(related);
                }
            } catch (error) {
                console.error('Error fetching related blogs:', error);
                // Fallback: use fallbackBlogPosts instead of allPosts to avoid dependency issues
                const related = fallbackBlogPosts
                    .filter((p) => p.id !== currentPost.id)
                    .sort((a, b) => {
                        // Prioritize same category
                        if (a.category.id === currentPost.category.id && b.category.id !== currentPost.category.id) return -1;
                        if (b.category.id === currentPost.category.id && a.category.id !== currentPost.category.id) return 1;
                        // Then by date
                        return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
                    })
                    .slice(0, 3);
                setRelatedPosts(related);
            }
    }, []);

    // Set related posts when post changes
    useEffect(() => {
        if (!post) return;
        fetchRelatedPosts(post);
    }, [post, fetchRelatedPosts]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0c131d] text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4FC8FF] mx-auto mb-4"></div>
                    <p>{t('blog.detail.loading')}</p>
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-[#0c131d] text-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">{t('blog.detail.notFound')}</h1>
                    <Link href="/blogs" className="text-[#4FC8FF] hover:underline">
                        {t('blog.detail.backToList')}
                    </Link>
                </div>
            </div>
        );
    }

    // Use safe date formatting to prevent hydration mismatch

    return (
        <div className="min-h-screen bg-[#0c131d] main-content scroll-smooth">
            {/* Simple Hero Section - Consistent with other pages */}
            <BlogDetailHero />
            {/* 1. Thanh tiêu đề bài viết (Post Header) */}
            <section className="bg-[#0c131d] w-full -mt-16 pt-16 pb-8">
                {/* Sử dụng cùng layout như các trang khác */}
                <div className="ml-16 sm:ml-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
                    {/* Tiêu đề */}
                    <motion.h1
                        className="text-white text-2xl sm:text-3xl lg:text-4xl font-bold text-left mb-4"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        viewport={{ once: true, margin: '-50px' }}
                    >
                        {post.title}
                    </motion.h1>

                    {/* Thời gian đăng & Chuyên mục */}
                    <motion.div
                        className="flex flex-wrap items-center gap-2 sm:gap-4 text-gray-400 text-sm"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                        viewport={{ once: true, margin: '-50px' }}
                    >
                        <div className="flex items-center gap-1 sm:gap-2 whitespace-nowrap">
                            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                    fillRule="evenodd"
                                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span className="truncate">{formatDateSafe(post.publishedAt, isHydrated)}</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1 sm:gap-2">
                            <span className="px-2 py-1 bg-[#4FC8FF]/10 text-[#4FC8FF] text-xs uppercase tracking-wide rounded-full font-medium whitespace-nowrap">
                                {post.category.name}
                            </span>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* 2. Hình ảnh minh họa chính (Hero Image nhỏ) */}
            <section className="bg-[#0c131d] pb-8">
                {/* Container có margin cho sidebar */}
                <div className="ml-16 sm:ml-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
                    <motion.div
                        className="relative w-full h-[330px] sm:h-[430px] lg:h-[530px] overflow-hidden"
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        viewport={{ once: true, margin: '-100px' }}
                    >
                        <Image
                            src={post.featuredImage || 'https://thinkzone.vn/uploads/2022_01/blogging-1641375905.jpg'}
                            alt={post.title}
                            fill
                            className="object-cover"
                            priority
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </motion.div>
                </div>
            </section>

            {/* 3. Bố cục chính (Main Layout) */}
            <section className="bg-[#0c131d] py-12">
                <div className="ml-16 sm:ml-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
                    <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
                        {/* 3.1. Cột Nội dung (Left Column, chiếm ~70%) */}
                        <div className="lg:col-span-7">
                            <motion.article
                                className="p-6 sm:p-8 lg:p-12"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, ease: 'easeOut' }}
                                viewport={{ once: true, margin: '-100px' }}
                            >
                                {/* Đoạn mô tả mở đầu */}
                                <motion.p
                                    className="text-gray-300 text-base leading-relaxed mb-8"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
                                    viewport={{ once: true, margin: '-50px' }}
                                >
                                    {post.excerpt}
                                </motion.p>

                                {/* Nội dung theo cấu trúc mới */}
                                <motion.div
                                    className="prose prose-invert prose-lg max-w-none"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: 0.4 }}
                                    viewport={{ once: true }}
                                >
                                    {/* Render introduction blocks from API */}
                                    {post.introductionBlocks && post.introductionBlocks.length > 0 ? (
                                        <div className="space-y-6">
                                            {post.introductionBlocks.map((block: ApiBlogBlock, index: number) => (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    whileInView={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.6, delay: index * 0.1 }}
                                                    viewport={{ once: true }}
                                                >
                                                    {block.type === 'title' && (
                                                        <h2 className="text-2xl font-bold text-white mt-8 mb-4">
                                                            {block.text}
                                                        </h2>
                                                    )}
                                                    {block.type === 'description' && (
                                                        <div
                                                            className="text-gray-300 leading-relaxed mb-4"
                                                            dangerouslySetInnerHTML={{ __html: sanitizeBlogContent(block.text || '') }}
                                                        />
                                                    )}
                                                    {block.type === 'image' && block.imageUrl && (
                                                        <div className="relative w-full h-[300px] sm:h-[400px] my-8 rounded-lg overflow-hidden">
                                                            <Image
                                                                src={block.imageUrl}
                                                                alt={block.text || 'Blog content image'}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : Array.isArray(post.content) ? (
                                        <div className="space-y-6">
                                            {post.content.map((block: BlogContentBlock, index: number) => (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    whileInView={{ opacity: 1, y: 0 }}
                                                    transition={{ duration: 0.6, delay: index * 0.1 }}
                                                    viewport={{ once: true }}
                                                >
                                                    {block.type === 'title' && (
                                                        <h2 className="text-2xl font-bold text-white mt-8 mb-4">
                                                            {block.content}
                                                        </h2>
                                                    )}
                                                    {block.type === 'text' && (
                                                        <p className="text-gray-300 leading-relaxed mb-4">
                                                            {block.content}
                                                        </p>
                                                    )}
                                                    {block.type === 'image' && block.link && (
                                                        <div className="relative w-full h-[300px] sm:h-[400px] my-8 rounded-lg overflow-hidden">
                                                            <Image
                                                                src={block.link}
                                                                alt={block.content || 'Blog image'}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                    )}
                                                </motion.div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div
                                            className="text-gray-300 leading-relaxed"
                                            dangerouslySetInnerHTML={{
                                                __html: sanitizeBlogContent(post.content
                                                    .replace(/\n/g, '<br/>')
                                                    .replace(
                                                        /##\s/g,
                                                        '<h2 class="text-2xl font-bold text-white mt-8 mb-4">'
                                                    )
                                                    .replace(
                                                        /###\s/g,
                                                        '<h3 class="text-xl font-bold text-white mt-6 mb-3">'
                                                    ))
                                            }}
                                        />
                                    )}
                                </motion.div>
                            </motion.article>
                        </div>

                        {/* 3.2. Cột Sidebar (Right Column, chiếm ~30%) */}
                        <div className="lg:col-span-3">
                            <motion.div
                                className="p-6 sticky top-8"
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, ease: 'easeOut' }}
                                viewport={{ once: true, margin: '-100px' }}
                            >
                                {/* Tiêu đề widget */}
                                <h3 className="text-lg font-bold text-white mb-6">{t('blog.detail.relatedArticles')}</h3>

                                {/* Danh sách bài viết liên quan */}
                                <div className="space-y-4">
                                    {relatedPosts.length > 0 ? (
                                        relatedPosts.map((relatedPost, index) => (
                                        <motion.div
                                            key={relatedPost.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.4, delay: index * 0.1, ease: 'easeOut' }}
                                            viewport={{ once: true, margin: '-50px' }}
                                        >
                                            {/* Card Container */}
                                            <div className="w-full bg-[#1a2332] rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 ease-in-out overflow-hidden group border border-gray-800/30">
                                                {/* Post Thumbnail */}
                                                <div className="relative w-full aspect-video overflow-hidden">
                                                    <Image
                                                        src={
                                                            relatedPost.featuredImage ||
                                                            'https://thinkzone.vn/uploads/2022_01/blogging-1641375905.jpg'
                                                        }
                                                        alt={relatedPost.title}
                                                        fill
                                                        className="object-cover transition-transform duration-200 group-hover:scale-105"
                                                    />
                                                </div>

                                                {/* Card Content */}
                                                <div className="p-4 relative">
                                                    {/* Metadata Row */}
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <svg
                                                            width="16"
                                                            height="16"
                                                            viewBox="0 0 24 24"
                                                            fill="none"
                                                            className="text-white opacity-60"
                                                        >
                                                            <path
                                                                d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z"
                                                                fill="currentColor"
                                                            />
                                                        </svg>
                                                        <span className="text-sm text-gray-300">
                                                            {formatDateSafe(relatedPost.publishedAt, isHydrated)}
                                                        </span>
                                                        <span className="text-white opacity-60">/</span>
                                                        <span className="text-sm text-[#4FC8FF] uppercase font-medium">
                                                            {relatedPost.category.name}
                                                        </span>
                                                    </div>

                                                    {/* Title */}
                                                    <h3 className="text-lg font-bold text-white leading-6 mb-2 line-clamp-2">
                                                        {relatedPost.title}
                                                    </h3>

                                                    {/* Excerpt */}
                                                    <p className="text-sm text-gray-300 leading-6 line-clamp-2 mb-4">
                                                        {relatedPost.excerpt}
                                                    </p>

                                                    {/* Action Button */}
                                                    <div className="flex justify-end">
                                                        <Link
                                                            href={`/blogs/${relatedPost.id}`}
                                                            className="w-10 h-10 bg-transparent border border-gray-600/40 rounded-full flex items-center justify-center text-white hover:bg-[#4FC8FF]/10 hover:border-[#4FC8FF]/60 transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#4FC8FF]/50"
                                                        >
                                                            <svg
                                                                width="24"
                                                                height="24"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                className="w-6 h-6"
                                                            >
                                                                <path
                                                                    d="M9 18L15 12L9 6"
                                                                    stroke="currentColor"
                                                                    strokeWidth="2"
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                />
                                                            </svg>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                        ))
                                    ) : (
                                        /* Empty State */
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.6 }}
                                            viewport={{ once: true }}
                                            className="text-center py-8"
                                        >
                                            <div className="bg-[#1a2332] rounded-2xl p-8 border border-gray-800/30">
                                                {/* Icon */}
                                                <div className="w-16 h-16 mx-auto mb-4 bg-gray-800/50 rounded-full flex items-center justify-center">
                                                    <svg
                                                        className="w-8 h-8 text-gray-400"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        viewBox="0 0 24 24"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                                        />
                                                    </svg>
                                                </div>

                                                {/* Text */}
                                                <h4 className="text-lg font-semibold text-white mb-2">
                                                    Chưa có bài viết liên quan
                                                </h4>
                                                <p className="text-gray-400 mb-6">
                                                    Hiện tại chưa có bài viết nào liên quan đến chủ đề này. Hãy khám phá thêm các bài viết khác của chúng tôi.
                                                </p>

                                                {/* CTA Button */}
                                                <Link
                                                    href="/blogs"
                                                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#4FC8FF] to-[#0EA5E9] hover:from-[#0EA5E9] hover:to-[#0284C7] text-white font-medium rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0l-4 4m4-4l-4-4" />
                                                    </svg>
                                                    Xem tất cả bài viết
                                                </Link>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
