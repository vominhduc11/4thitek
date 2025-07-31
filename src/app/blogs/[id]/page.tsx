'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { getPublishedPosts } from '@/data/blogs';
import type { BlogPost } from '@/types/blog';
import BlogDetailHero from '@/app/blogs/[id]/components/BlogDetailHero';
import { useHydration } from '@/hooks/useHydration';
import { formatDateSafe } from '@/utils/dateFormatter';

// Get published blog posts
const publishedBlogPosts: BlogPost[] = getPublishedPosts();

export default function BlogDetailPageImproved() {
    const params = useParams();
    const [post, setPost] = useState<BlogPost | null>(null);
    const [loading, setLoading] = useState(true);
    const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
    const isHydrated = useHydration();

    useEffect(() => {
        if (!params?.id) return;

        const postId = params.id as string;
        const foundPost = publishedBlogPosts.find((p) => p.id === postId);

        if (foundPost) {
            setPost(foundPost);
            // Get related posts (excluding current post, same category preferred)
            const related = publishedBlogPosts
                .filter((p) => p.id !== postId)
                .sort((a, b) => {
                    // Prioritize same category
                    if (a.category.id === foundPost.category.id && b.category.id !== foundPost.category.id) return -1;
                    if (b.category.id === foundPost.category.id && a.category.id !== foundPost.category.id) return 1;
                    // Then by date
                    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
                })
                .slice(0, 3);
            setRelatedPosts(related);
        }
        setLoading(false);
    }, [params?.id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0c131d] text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4FC8FF] mx-auto mb-4"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="min-h-screen bg-[#0c131d] text-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Article Not Found</h1>
                    <Link href="/blogs" className="text-[#4FC8FF] hover:underline">
                        Back to Blog List
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
                <div className="ml-16 sm:ml-20 px-4 sm:px-12 md:px-16 lg:px-20">
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
                        {post.readingTime && (
                            <>
                                <span>•</span>
                                <div className="flex items-center gap-1 sm:gap-2 whitespace-nowrap">
                                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                    <span>{post.readingTime} phút đọc</span>
                                </div>
                            </>
                        )}
                    </motion.div>
                </div>
            </section>

            {/* 2. Hình ảnh minh họa chính (Hero Image nhỏ) */}
            <section className="bg-[#0c131d] pb-8">
                {/* Container có margin cho sidebar */}
                <div className="ml-16 sm:ml-20">
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
                <div className="ml-16 sm:ml-20 px-4 sm:px-12 md:px-16 lg:px-20">
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

                                {/* Nội dung markdown */}
                                <motion.div
                                    className="prose prose-invert prose-lg max-w-none"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: 0.4 }}
                                    viewport={{ once: true }}
                                >
                                    <div
                                        className="text-gray-300 leading-relaxed"
                                        dangerouslySetInnerHTML={{
                                            __html: post.content
                                                .replace(/\n/g, '<br/>')
                                                .replace(
                                                    /##\s/g,
                                                    '<h2 class="text-2xl font-bold text-white mt-8 mb-4">'
                                                )
                                                .replace(
                                                    /###\s/g,
                                                    '<h3 class="text-xl font-bold text-white mt-6 mb-3">'
                                                )
                                        }}
                                    />
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
                                <h3 className="text-lg font-bold text-white mb-6">Bài viết liên quan</h3>

                                {/* Danh sách bài viết liên quan */}
                                <div className="space-y-4">
                                    {relatedPosts.map((relatedPost, index) => (
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
                                    ))}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
