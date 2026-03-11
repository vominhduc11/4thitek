'use client';

import { motion } from 'framer-motion';
import { useMemo, useCallback, memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MdArrowForward } from 'react-icons/md';

// Import the proper BlogPost type
import type { BlogPost } from '@/types/blog';
import { useHydration } from '@/hooks/useHydration';
import { formatDateSafe } from '@/utils/dateFormatter';
import { useLanguage } from '@/context/LanguageContext';
import { buildBlogPath } from '@/lib/slug';

interface BlogGridProps {
    blogs: BlogPost[];
}

const BlogGrid = memo(function BlogGrid({ blogs }: BlogGridProps) {
    const { locale, t } = useLanguage();
    const isHydrated = useHydration();

    // Memoized category display helper
    const getCategoryDisplay = useCallback((category: BlogPost['category']) => {
        // Handle object category payloads returned by the backend
        if (typeof category === 'object' && category?.name) {
            return category.name.toUpperCase();
        }
        // Handle old string format
        if (typeof category === 'string') {
            const categoryNames: { [key: string]: string } = {
                TECHNOLOGY: t('blog.categories.technology'),
                TUTORIAL: t('blog.categories.tutorial'),
                NEWS: t('blog.categories.news'),
                REVIEW: t('blog.categories.review'),
                TIPS: t('blog.categories.tips')
            };
            return (categoryNames[category] || category).toUpperCase();
        }
        return t('blog.list.categoryFallback').toUpperCase();
    }, [t]);

    // Memoized category color helper
    const getCategoryColor = useCallback((category: BlogPost['category']) => {
        // Handle object category payloads returned by the backend
        if (typeof category === 'object' && category?.color) {
            return category.color;
        }
        // Handle old string format
        if (typeof category === 'string') {
            const categoryColors: { [key: string]: string } = {
                TECHNOLOGY: '#60a5fa',
                TUTORIAL: '#4ade80',
                NEWS: '#f87171',
                REVIEW: '#c084fc',
                TIPS: '#facc15'
            };
            return categoryColors[category] || '#9ca3af';
        }
        return '#9ca3af';
    }, []);

    // Helper function to parse blog image JSON (commented out as unused)
    // const parseImageUrl = (imageData: string): string => {
    //     try {
    //         const parsed = JSON.parse(imageData);
    //         return parsed.imageUrl || '';
    //     } catch {
    //         return '';
    //     }
    // };

    // Memoized processed blogs data
    const processedBlogs = useMemo(() => {
        return blogs.map(blog => ({
            ...blog,
            categoryDisplay: getCategoryDisplay(blog.category),
            categoryColor: getCategoryColor(blog.category),
            formattedDate: formatDateSafe(blog.publishedAt, isHydrated, locale),
            imageUrl: blog.featuredImage || ''
        }));
    }, [blogs, isHydrated, locale, getCategoryDisplay, getCategoryColor]);

    return (
        <div className="ml-0 sm:ml-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 5xl:px-24 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 4xl:grid-cols-6 5xl:grid-cols-8 gap-6 lg:gap-8 2xl:gap-10 3xl:gap-12 4xl:gap-16 5xl:gap-20">
                {processedBlogs.map((blog, index) => (
                    <motion.article
                        key={blog.id}
                        className="group bg-transparent rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer border border-white/10 hover:border-white/20"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        whileHover={{
                            y: -8,
                            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)'
                        }}
                    >
                        <Link href={buildBlogPath(blog.id, blog.title)} className="block">
                            {/* Cover Image - 16:9 Aspect Ratio */}
                            <div className="relative w-full aspect-video overflow-hidden">
                                {blog.imageUrl ? (
                                    <Image
                                        src={blog.imageUrl}
                                        alt={t('blog.grid.coverAlt').replace('{title}', blog.title)}
                                        fill
                                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 3200px) 33vw, 40vw"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 text-gray-500">
                                        <svg
                                            aria-hidden="true"
                                            className="h-10 w-10"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={1.5}
                                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2 1.586-1.586a2 2 0 012.828 0L20 14m-6-8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                            />
                                        </svg>
                                    </div>
                                )}


                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </div>

                            {/* Card Content */}
                            <div className="p-6">
                                {/* Metadata */}
                                <div className="flex items-center justify-between mb-3">
                                    <time
                                        dateTime={blog.publishedAt}
                                        className="text-xs font-medium text-gray-400 uppercase tracking-wide"
                                    >
                                        {blog.formattedDate}
                                    </time>
                                    <span
                                        className="text-xs font-bold uppercase tracking-wide"
                                        style={{ color: blog.categoryColor }}
                                    >
                                        {blog.categoryDisplay}
                                    </span>
                                </div>

                                {/* Title */}
                                <h3 className="text-lg sm:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl font-bold text-white mb-3 2xl:mb-4 3xl:mb-5 4xl:mb-6 line-clamp-2 leading-tight group-hover:text-[#4FC8FF] transition-colors duration-300">
                                    {blog.title}
                                </h3>

                                {/* Description */}
                                <p className="text-sm sm:text-base text-gray-300 mb-4 line-clamp-3 leading-relaxed">
                                    {blog.excerpt}
                                </p>

                                {/* Bottom Section */}
                                <div className="flex items-center justify-end">
                                    {/* CTA Arrow Button */}
                                    <motion.div
                                        className="flex items-center justify-center w-11 h-11 bg-white/10 rounded-full group-hover:bg-[#4FC8FF] transition-all duration-300 backdrop-blur-sm"
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <MdArrowForward
                                            className="w-5 h-5 text-white group-hover:text-white transition-colors duration-300"
                                            aria-label={t('blog.grid.readArticle')}
                                        />
                                    </motion.div>
                                </div>
                            </div>
                        </Link>
                    </motion.article>
                ))}
            </div>

            {/* Empty State */}
            {blogs.length === 0 && (
                <motion.div
                    className="text-center py-16"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="max-w-md mx-auto">
                        <div className="w-24 h-24 mx-auto mb-6 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                            <svg
                                className="w-12 h-12 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                                />
                            </svg>
                        </div>
                        <h3 className="text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl font-bold text-white mb-4 2xl:mb-5 3xl:mb-6 4xl:mb-7">
                            {t('blog.grid.emptyTitle')}
                        </h3>
                        <p className="text-gray-400">
                            {t('blog.grid.emptyBodyLine1')}
                            <br />
                            {t('blog.grid.emptyBodyLine2')}
                        </p>
                    </div>
                </motion.div>
            )}
        </div>
    );
});

export default BlogGrid;
