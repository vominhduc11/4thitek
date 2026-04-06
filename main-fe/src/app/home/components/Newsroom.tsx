'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiArrowUpRight } from 'react-icons/fi';
import AvoidSidebar from '@/components/ui/AvoidSidebar';
import { useLanguage } from '@/context/LanguageContext';
import { useHydration } from '@/hooks/useHydration';
import { useAnimationConfig } from '@/hooks/useReducedMotion';
import { buildBlogPath } from '@/lib/slug';
import type { BlogPost } from '@/types/blog';
import { formatDateSafe } from '@/utils/dateFormatter';

interface BlogItem {
    id: string;
    title: string;
    description: string;
    image: string;
    category?: string;
    createdAt: string;
}

interface NewsroomProps {
    initialBlogs?: BlogPost[];
}

export default function Newsroom({ initialBlogs = [] }: NewsroomProps) {
    const { t, locale } = useLanguage();
    const isHydrated = useHydration();
    const { enableDecorativeAnimations } = useAnimationConfig();
    const emptyMessage = t('newsroom.empty');
    const emptyFallback = t('blog.grid.emptyBodyLine2');
    const genericFallback = t('common.loadingMessage');
    const resolvedEmptyMessage =
        emptyMessage && emptyMessage !== 'newsroom.empty'
            ? emptyMessage
            : emptyFallback && emptyFallback !== 'blog.grid.emptyBodyLine2'
              ? emptyFallback
              : genericFallback;

    const blogs: BlogItem[] = initialBlogs.map((blog) => ({
        id: blog.id,
        title: blog.title,
        description: blog.excerpt,
        image: blog.featuredImage,
        category: blog.category.name || undefined,
        createdAt: blog.publishedAt
    }));
    const leadPost = blogs[0] ?? null;
    const leadPostHref = leadPost ? buildBlogPath(leadPost.id, leadPost.title) : '/blogs';
    const leadPostMeta = leadPost ? formatDateSafe(leadPost.createdAt, isHydrated, locale) : t('newsroom.tagline');

    return (
        <AvoidSidebar>
            <motion.section
                className="brand-section py-16 sm:py-20 md:py-24"
                aria-labelledby="newsroom-heading"
                initial={enableDecorativeAnimations ? { opacity: 0 } : false}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.45 }}
                viewport={{ once: true, amount: 0.2 }}
            >
                <div className="absolute inset-0 bg-topo opacity-24" />
                <div className="absolute inset-0 bg-dot-grid opacity-10" />

                <div className="brand-shell relative z-10 lg:ml-20">
                    <div className="mb-10 grid gap-8 lg:mb-12 lg:grid-cols-[minmax(0,1fr)_minmax(340px,0.74fr)] lg:items-center xl:gap-10">
                        <div className="mx-auto max-w-3xl text-center lg:mx-0 lg:max-w-2xl lg:text-left">
                            <span className="brand-badge mb-4">{t('newsroom.subtitle')}</span>
                            <h2
                                id="newsroom-heading"
                                className="font-serif text-3xl font-semibold text-[var(--text-primary)] sm:text-4xl lg:text-5xl"
                            >
                                {t('newsroom.title')}
                            </h2>
                            <p className="mt-4 text-base leading-7 text-[var(--text-secondary)] sm:text-lg">
                                {t('newsroom.tagline')}
                            </p>
                        </div>

                        <motion.div
                            className="brand-card-muted relative overflow-hidden rounded-[28px] border border-[rgba(41,171,226,0.16)]"
                            initial={enableDecorativeAnimations ? { opacity: 0, x: 18 } : false}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true, amount: 0.3 }}
                            transition={{ duration: 0.45, ease: 'easeOut' }}
                        >
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(41,171,226,0.14),_transparent_52%)]" />
                            {leadPost?.image ? (
                                <div className="absolute inset-y-0 right-0 hidden w-[46%] overflow-hidden lg:block">
                                    <Image
                                        src={leadPost.image}
                                        alt={leadPost.title}
                                        fill
                                        className="object-cover opacity-25"
                                        sizes="28vw"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,17,27,0.94)_0%,rgba(7,17,27,0.46)_100%)]" />
                                </div>
                            ) : (
                                <div className="absolute inset-0 bg-dot-grid opacity-10" />
                            )}

                            <div className="relative flex h-full min-h-[220px] flex-col justify-between gap-6 p-6 sm:min-h-[240px]">
                                <div>
                                    {leadPost?.category ? <span className="brand-badge-muted">{leadPost.category}</span> : null}
                                    <h3 className="mt-4 max-w-lg text-2xl font-semibold leading-tight text-[var(--text-primary)] sm:text-[1.75rem]">
                                        {leadPost?.title || t('newsroom.title')}
                                    </h3>
                                    <p className="mt-3 max-w-md text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
                                        {leadPost?.description || t('newsroom.tagline')}
                                    </p>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <span className="text-sm text-[var(--text-muted)]">{leadPostMeta}</span>
                                    <Link
                                        href={leadPostHref}
                                        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-blue)] transition-colors duration-200 hover:text-[#7fd7ff]"
                                        aria-label={
                                            leadPost
                                                ? t('newsroom.readMoreAria').replace('{title}', leadPost.title)
                                                : t('newsroom.exploreMoreAria')
                                        }
                                    >
                                        {leadPost ? t('blog.grid.readArticle') : t('newsroom.exploreMore')}
                                        <FiArrowUpRight className="h-4 w-4" />
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {blogs.length === 0 ? (
                        <div className="brand-card-muted rounded-[28px] px-6 py-14 text-center text-[var(--text-secondary)]">
                            <FiArrowUpRight className="mx-auto mb-4 h-10 w-10 opacity-40" />
                            <p className="text-base sm:text-lg">{resolvedEmptyMessage}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {blogs.map((post, index) => (
                                <motion.article
                                    key={post.id}
                                    initial={enableDecorativeAnimations ? { opacity: 0, y: 22 } : false}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.25 }}
                                    transition={{ duration: 0.38, delay: enableDecorativeAnimations ? index * 0.05 : 0 }}
                                >
                                    <Link
                                        href={buildBlogPath(post.id, post.title)}
                                        className="brand-card group flex h-full flex-col overflow-hidden rounded-[28px] p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--brand-border-strong)] hover:shadow-[0_18px_34px_rgba(0,113,188,0.12)]"
                                        aria-label={t('newsroom.readMoreAria').replace('{title}', post.title)}
                                    >
                                        <div className="relative aspect-[16/10] overflow-hidden rounded-[22px] border border-[var(--brand-border)] bg-[rgba(7,17,27,0.75)]">
                                            {post.image ? (
                                                <Image
                                                    src={post.image}
                                                    alt={post.title}
                                                    fill
                                                    className="object-cover transition duration-300 group-hover:scale-[1.02]"
                                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                                    loading={index < 3 ? 'eager' : 'lazy'}
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-[var(--text-muted)]">
                                                    <FiArrowUpRight className="h-10 w-10" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,17,27,0.04),rgba(6,17,27,0.72))]" />
                                        </div>

                                        <div className="mt-5 flex flex-1 flex-col">
                                            {post.category ? (
                                                <span className="brand-badge w-fit">{post.category}</span>
                                            ) : null}
                                            <h3 className="mt-4 line-clamp-2 text-xl font-semibold leading-tight text-[var(--text-primary)]">
                                                {post.title}
                                            </h3>
                                            <p className="mt-3 line-clamp-3 text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
                                                {post.description}
                                            </p>
                                            <div className="mt-4 flex items-center justify-between text-sm text-[var(--text-muted)]">
                                                <span>{formatDateSafe(post.createdAt, isHydrated, locale)}</span>
                                                <span className="inline-flex items-center gap-2 font-semibold text-[var(--brand-blue)]">
                                                    {t('blog.grid.readArticle')}
                                                    <FiArrowUpRight className="h-4 w-4" />
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.article>
                            ))}
                        </div>
                    )}

                    <div className="mt-10 flex justify-center">
                        <Link
                            href="/blogs"
                            className="brand-button-secondary rounded-full px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-primary)] transition duration-200 hover:border-[var(--brand-blue)] hover:bg-[rgba(41,171,226,0.12)]"
                            aria-label={t('newsroom.exploreMoreAria')}
                        >
                            {t('newsroom.exploreMore')}
                        </Link>
                    </div>
                </div>
            </motion.section>
        </AvoidSidebar>
    );
}
