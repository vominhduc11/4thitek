'use client';

import Image from 'next/image';
import Link from 'next/link';
import BlogDetailHero from '@/app/blogs/[id]/components/BlogDetailHero';
import type { ApiBlogBlock, BlogPost } from '@/types/blog';
import { formatDateSafe } from '@/utils/dateFormatter';
import { useLanguage } from '@/context/LanguageContext';
import { buildBlogPath } from '@/lib/slug';
import { useHydration } from '@/hooks/useHydration';

interface BlogDetailPageClientProps {
    post: BlogPost;
    relatedPosts: BlogPost[];
}

export default function BlogDetailPageClient({ post, relatedPosts }: BlogDetailPageClientProps) {
    const { t, locale } = useLanguage();
    const isHydrated = useHydration();
    const blocks: ApiBlogBlock[] = post.introductionBlocks || [];

    return (
        <div className="min-h-screen bg-[#0c131d] text-white">
            <BlogDetailHero />
            <section className="bg-[#0c131d] w-full -mt-16 pt-16 pb-8">
                <div className="ml-0 sm:ml-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
                    <p className="text-sm text-[#4FC8FF] uppercase tracking-[0.2em]">{post.category.name}</p>
                    <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-white">{post.title}</h1>
                    <p className="mt-3 text-sm text-gray-400">{formatDateSafe(post.publishedAt, isHydrated, locale)}</p>
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
                                            <Link
                                                key={item.id}
                                                href={buildBlogPath(item.id, item.title)}
                                                className="block rounded-2xl border border-white/10 bg-white/5 p-3 transition hover:bg-white/10"
                                            >
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
