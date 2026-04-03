'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiArrowUpRight } from 'react-icons/fi';
import AvoidSidebar from '@/components/ui/AvoidSidebar';
import { useLanguage } from '@/context/LanguageContext';
import { useHydration } from '@/hooks/useHydration';
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

    const blogs: BlogItem[] = initialBlogs.map((blog) => ({
        id: blog.id,
        title: blog.title,
        description: blog.excerpt,
        image: blog.featuredImage,
        category: blog.category.name || undefined,
        createdAt: blog.publishedAt
    }));

    return (
        <AvoidSidebar>
            <motion.section
                className="brand-section py-16 sm:py-20 md:py-24"
                aria-labelledby="newsroom-heading"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true, amount: 0.2 }}
            >
                <div className="absolute inset-0 bg-topo opacity-30" />
                <div className="absolute inset-0 bg-dot-grid opacity-15" />

                <div className="brand-shell relative z-10 sm:ml-16 md:ml-20">
                    <div className="mx-auto mb-10 max-w-3xl text-center">
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

                    {blogs.length === 0 ? (
                        <div className="brand-card-muted rounded-[28px] px-6 py-16 text-center text-[var(--text-secondary)]">
                            <FiArrowUpRight className="mx-auto mb-4 h-10 w-10 opacity-40" />
                            <p className="text-base">{t('newsroom.empty') || 'Chua co bai viet nao.'}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {blogs.map((post, index) => (
                                <motion.article
                                    key={post.id}
                                    initial={{ opacity: 0, y: 36 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.25 }}
                                    transition={{ duration: 0.45, delay: index * 0.08 }}
                                >
                                    <Link
                                        href={buildBlogPath(post.id, post.title)}
                                        className="brand-card group flex h-full flex-col overflow-hidden rounded-[28px] p-4 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--brand-border-strong)] hover:shadow-[0_24px_44px_rgba(0,113,188,0.16)]"
                                        aria-label={t('newsroom.readMoreAria').replace('{title}', post.title)}
                                    >
                                        <div className="relative aspect-[16/10] overflow-hidden rounded-[22px] border border-[var(--brand-border)] bg-[rgba(7,17,27,0.75)]">
                                            {post.image ? (
                                                <Image
                                                    src={post.image}
                                                    alt={post.title}
                                                    fill
                                                    className="object-cover transition duration-500 group-hover:scale-105"
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
                                            <h3 className="mt-4 line-clamp-2 text-xl font-semibold leading-tight text-[var(--text-primary)] transition-colors duration-200 group-hover:text-[var(--brand-blue)]">
                                                {post.title}
                                            </h3>
                                            <p className="mt-3 line-clamp-3 text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
                                                {post.description}
                                            </p>
                                            <div className="mt-4 flex items-center justify-between text-sm text-[var(--text-muted)]">
                                                <span>{formatDateSafe(post.createdAt, isHydrated, locale)}</span>
                                                <span className="inline-flex items-center gap-2 font-semibold text-[var(--brand-blue)]">
                                                    Read
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
                            className="brand-button-secondary rounded-full px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--text-primary)] transition hover:-translate-y-0.5 hover:border-[var(--brand-blue)] hover:bg-[rgba(41,171,226,0.14)]"
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
