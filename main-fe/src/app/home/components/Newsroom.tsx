'use client';

import { motion } from 'framer-motion';
import { FiArrowUpRight } from 'react-icons/fi';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import type { BlogPost } from '@/types/blog';
import { buildBlogPath } from '@/lib/slug';
import { useHydration } from '@/hooks/useHydration';
import { formatDateSafe } from '@/utils/dateFormatter';
import AvoidSidebar from '@/components/ui/AvoidSidebar';

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
                className="relative overflow-hidden bg-gradient-to-b from-[#060d16] to-[#032d4c] py-16 sm:py-20 md:py-24 bg-grain"
                aria-labelledby="newsroom-heading"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true, amount: 0.2 }}
            >
                {/* Subtle dot-grid */}
                <div className="absolute inset-0 bg-dot-grid opacity-20 pointer-events-none" />
                <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
                    <div className="mb-8 text-center text-white sm:mb-10 md:mb-12">
                        <h2 id="newsroom-heading" className="text-2xl font-semibold sm:text-3xl md:text-4xl lg:text-5xl">
                            {t('newsroom.title')}
                        </h2>
                        <p className="mt-3 text-sm uppercase tracking-wider sm:text-base">
                            {t('newsroom.subtitle')}
                        </p>
                        <span className="mt-2 block text-xs text-white/70 sm:text-sm">
                            {t('newsroom.tagline')}
                        </span>
                    </div>

                    {blogs.length === 0 ? (
                        <div className="rounded-2xl border border-white/10 bg-white/4 px-6 py-16 text-center text-gray-400">
                            <FiArrowUpRight className="mx-auto mb-4 h-10 w-10 opacity-40" />
                            <p className="text-base">{t('newsroom.empty') || 'Chưa có bài viết nào.'}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {blogs.map((post, index) => (
                                <motion.div
                                    key={post.id}
                                    initial={{ opacity: 0, y: 48 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, amount: 0.3 }}
                                    transition={{ duration: 0.5, delay: index * 0.08 }}
                                    whileHover={{
                                        y: -8,
                                        scale: 1.01,
                                        boxShadow: '0 18px 36px rgba(0,0,0,0.35)'
                                    }}
                                >
                                    <Link
                                        href={buildBlogPath(post.id, post.title)}
                                        className="group relative block h-72 overflow-hidden rounded-xl bg-black/10 sm:h-80 lg:h-96"
                                        aria-label={t('newsroom.readMoreAria').replace('{title}', post.title)}
                                    >
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
                                            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-800 to-slate-950 text-slate-500">
                                                <FiArrowUpRight className="h-10 w-10" />
                                            </div>
                                        )}

                                        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black via-black/65 to-transparent p-4">
                                            {post.category ? (
                                                <span className="mb-3 inline-flex w-fit rounded-full bg-[#4FC8FF] px-2 py-1 text-xs font-semibold text-white">
                                                    {post.category}
                                                </span>
                                            ) : null}
                                            <h3 className="line-clamp-2 text-base font-semibold text-white sm:text-lg">
                                                {post.title}
                                            </h3>
                                            <div className="mt-3 flex items-center justify-between text-xs text-white/70">
                                                <span>{formatDateSafe(post.createdAt, isHydrated, locale)}</span>
                                                <FiArrowUpRight className="h-4 w-4" />
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    <div className="mt-10 flex justify-center">
                        <Link
                            href="/blogs"
                            className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:border-cyan-300 hover:text-cyan-200"
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
