'use client';

import { memo, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { MdArrowForward } from 'react-icons/md';
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

    const getCategoryDisplay = useCallback(
        (category: BlogPost['category']) => {
            if (typeof category === 'object' && category?.name) {
                return category.name.toUpperCase();
            }
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
        },
        [t]
    );

    const processedBlogs = useMemo(
        () =>
            blogs.map((blog) => ({
                ...blog,
                categoryDisplay: getCategoryDisplay(blog.category),
                formattedDate: formatDateSafe(blog.publishedAt, isHydrated, locale),
                imageUrl: blog.featuredImage || ''
            })),
        [blogs, getCategoryDisplay, isHydrated, locale]
    );

    return (
        <div className="brand-shell py-8 sm:ml-16 md:ml-20">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                {processedBlogs.map((blog, index) => (
                    <motion.article
                        key={blog.id}
                        className="group"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.06 }}
                    >
                        <Link
                            href={buildBlogPath(blog.id, blog.title)}
                            className="brand-card flex h-full flex-col overflow-hidden rounded-[28px] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--brand-border-strong)] hover:shadow-[0_24px_44px_rgba(0,113,188,0.16)]"
                        >
                            <div className="relative aspect-[16/10] overflow-hidden rounded-[22px] border border-[var(--brand-border)] bg-[rgba(7,17,27,0.75)]">
                                {blog.imageUrl ? (
                                    <Image
                                        src={blog.imageUrl}
                                        alt={t('blog.grid.coverAlt').replace('{title}', blog.title)}
                                        fill
                                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        loading="lazy"
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-[var(--text-muted)]">
                                        <MdArrowForward className="h-10 w-10" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,17,27,0.04),rgba(6,17,27,0.72))]" />
                            </div>

                            <div className="mt-5 flex flex-1 flex-col">
                                <div className="flex items-center justify-between gap-3">
                                    <time
                                        dateTime={blog.publishedAt}
                                        className="text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]"
                                    >
                                        {blog.formattedDate}
                                    </time>
                                    <span className="brand-badge text-[10px]">{blog.categoryDisplay}</span>
                                </div>

                                <h3 className="mt-4 line-clamp-2 text-xl font-semibold leading-tight text-[var(--text-primary)] transition-colors duration-200 group-hover:text-[var(--brand-blue)]">
                                    {blog.title}
                                </h3>

                                <p className="mt-3 line-clamp-3 text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
                                    {blog.excerpt}
                                </p>

                                <div className="mt-4 flex items-center justify-end">
                                    <motion.div
                                        className="flex h-11 w-11 items-center justify-center rounded-full border border-[var(--brand-border)] bg-[rgba(41,171,226,0.08)] text-[var(--brand-blue)] transition-all duration-200 group-hover:border-[var(--brand-border-strong)] group-hover:bg-[rgba(41,171,226,0.18)]"
                                        whileHover={{ scale: 1.06 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <MdArrowForward className="h-5 w-5" aria-label={t('blog.grid.readArticle')} />
                                    </motion.div>
                                </div>
                            </div>
                        </Link>
                    </motion.article>
                ))}
            </div>

            {blogs.length === 0 && (
                <motion.div
                    className="py-16 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4 }}
                >
                    <div className="brand-card-muted mx-auto max-w-md rounded-[30px] p-8">
                        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border border-[var(--brand-border)] bg-[rgba(41,171,226,0.08)]">
                            <svg
                                className="h-12 w-12 text-[var(--text-muted)]"
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
                        <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                            {t('blog.grid.emptyTitle')}
                        </h3>
                        <p className="mt-4 text-[var(--text-secondary)]">
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
