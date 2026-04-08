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

    const blogs: BlogItem[] = initialBlogs.map((blog) => ({
        id: blog.id,
        title: blog.title,
        description: blog.excerpt,
        image: blog.featuredImage,
        category: blog.category.name || undefined,
        createdAt: blog.publishedAt
    }));

    const leadPost = blogs[0] ?? null;
    const secondaryPosts = blogs.slice(1);
    const leadPostHref = leadPost ? buildBlogPath(leadPost.id, leadPost.title) : '/blogs';
    const leadPostMeta = leadPost ? formatDateSafe(leadPost.createdAt, isHydrated, locale) : '';
    const emptyTitle = t('blog.grid.emptyTitle');
    const emptyBody =
        `${t('blog.grid.emptyBodyLine1')} ${t('blog.grid.emptyBodyLine2')}`.trim() || t('newsroom.tagline');

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

                <div className="brand-shell relative z-10">
                    <div className="mb-10 flex flex-col gap-6 lg:mb-12 lg:flex-row lg:items-end lg:justify-between">
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

                        <Link
                            href="/blogs"
                            className="brand-button-secondary inline-flex items-center justify-center gap-2 self-center rounded-full px-5 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-primary)] transition duration-200 hover:border-[var(--brand-blue)] hover:bg-[rgba(41,171,226,0.12)] lg:self-auto"
                            aria-label={t('newsroom.exploreMoreAria')}
                        >
                            {t('newsroom.exploreMore')}
                            <FiArrowUpRight className="h-4 w-4" />
                        </Link>
                    </div>

                    {leadPost ? (
                        <>
                            <motion.article
                                className="brand-card-muted relative overflow-hidden rounded-[30px] border border-[rgba(41,171,226,0.16)]"
                                initial={enableDecorativeAnimations ? { opacity: 0, y: 20 } : false}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.25 }}
                                transition={{ duration: 0.45, ease: 'easeOut' }}
                            >
                                <div className="grid gap-0 lg:grid-cols-[minmax(0,1.02fr)_minmax(300px,0.98fr)]">
                                    <div className="relative flex flex-col justify-between gap-6 p-6 sm:p-8">
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(41,171,226,0.16),_transparent_46%)]" />
                                        <div className="relative">
                                            {leadPost.category ? (
                                                <span className="brand-badge-muted">{leadPost.category}</span>
                                            ) : null}
                                            <h3 className="mt-4 max-w-2xl text-2xl font-semibold leading-tight text-[var(--text-primary)] sm:text-[1.9rem]">
                                                {leadPost.title}
                                            </h3>
                                            <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
                                                {leadPost.description}
                                            </p>
                                        </div>

                                        <div className="relative flex flex-wrap items-center justify-between gap-4">
                                            <span className="text-sm text-[var(--text-muted)]">{leadPostMeta}</span>
                                            <Link
                                                href={leadPostHref}
                                                className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-blue)] transition-colors duration-200 hover:text-[#7fd7ff]"
                                                aria-label={t('newsroom.readMoreAria').replace('{title}', leadPost.title)}
                                            >
                                                {t('blog.grid.readArticle')}
                                                <FiArrowUpRight className="h-4 w-4" />
                                            </Link>
                                        </div>
                                    </div>

                                    <Link
                                        href={leadPostHref}
                                        className="group relative min-h-[18rem] overflow-hidden border-t border-[rgba(133,170,197,0.12)] lg:min-h-full lg:border-l lg:border-t-0"
                                        aria-label={t('newsroom.readMoreAria').replace('{title}', leadPost.title)}
                                    >
                                        {leadPost.image ? (
                                            <Image
                                                src={leadPost.image}
                                                alt={leadPost.title}
                                                fill
                                                className="object-cover transition duration-300 group-hover:scale-[1.02]"
                                                sizes="(max-width: 1023px) 100vw, 42vw"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center bg-[rgba(7,17,27,0.78)] text-[var(--text-muted)]">
                                                <FiArrowUpRight className="h-12 w-12" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,17,27,0.06),rgba(6,17,27,0.74))]" />
                                    </Link>
                                </div>
                            </motion.article>

                            {secondaryPosts.length > 0 ? (
                                <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                    {secondaryPosts.map((post, index) => (
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
                                                            loading={index < 2 ? 'eager' : 'lazy'}
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-[var(--text-muted)]">
                                                            <FiArrowUpRight className="h-10 w-10" />
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,17,27,0.04),rgba(6,17,27,0.72))]" />
                                                </div>

                                                <div className="mt-5 flex flex-1 flex-col">
                                                    {post.category ? <span className="brand-badge w-fit">{post.category}</span> : null}
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
                            ) : null}
                        </>
                    ) : (
                        <div className="brand-card-muted mx-auto max-w-3xl rounded-[30px] px-6 py-14 text-center text-[var(--text-secondary)]">
                            <FiArrowUpRight className="mx-auto mb-4 h-10 w-10 opacity-40" />
                            <p className="text-lg font-semibold text-[var(--text-primary)]">{emptyTitle}</p>
                            <p className="mt-3 text-sm leading-7 sm:text-base">{emptyBody}</p>
                        </div>
                    )}
                </div>
            </motion.section>
        </AvoidSidebar>
    );
}
