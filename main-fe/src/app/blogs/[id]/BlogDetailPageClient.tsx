'use client';

import Image from 'next/image';
import Link from 'next/link';
import BlogDetailHero from '@/app/blogs/[id]/components/BlogDetailHero';
import AvoidSidebar from '@/components/ui/AvoidSidebar';
import { getBlogVideoEmbedUrl } from '@/lib/blogContent';
import type { BlogPost } from '@/types/blog';
import { useHydration } from '@/hooks/useHydration';
import { useLanguage } from '@/context/LanguageContext';
import { buildBlogPath } from '@/lib/slug';
import { formatDateSafe } from '@/utils/dateFormatter';

interface BlogDetailPageClientProps {
    post: BlogPost;
    relatedPosts: BlogPost[];
}

export default function BlogDetailPageClient({ post, relatedPosts }: BlogDetailPageClientProps) {
    const { t, locale } = useLanguage();
    const isHydrated = useHydration();
    const blocks = post.introductionBlocks || [];

    return (
        <div className="brand-section min-h-screen text-white">
            <BlogDetailHero />

            <section className="w-full -mt-16 pb-8 pt-16">
                <AvoidSidebar>
                    <div className="brand-shell">
                        <span className="brand-badge">{post.category.name}</span>
                        <h1 className="mt-4 max-w-4xl font-serif text-3xl font-semibold text-[var(--text-primary)] sm:text-4xl lg:text-5xl">
                            {post.title}
                        </h1>
                        <p className="mt-3 text-sm text-[var(--text-muted)]">
                            {formatDateSafe(post.publishedAt, isHydrated, locale)}
                        </p>
                    </div>
                </AvoidSidebar>
            </section>

            <section className="pb-8">
                <AvoidSidebar>
                    <div className="brand-shell">
                        <div className="relative h-[330px] w-full overflow-hidden rounded-[32px] border border-[var(--brand-border)] bg-[rgba(7,17,27,0.72)] sm:h-[430px] lg:h-[530px]">
                            {post.featuredImage ? (
                                <Image src={post.featuredImage} alt={post.title} fill className="object-cover" />
                            ) : null}
                            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,17,27,0.08),rgba(6,17,27,0.58))]" />
                        </div>
                    </div>
                </AvoidSidebar>
            </section>

            <section className="py-12">
                <AvoidSidebar>
                    <div className="brand-shell">
                        <div className="grid grid-cols-1 gap-8 lg:grid-cols-10">
                            <article className="brand-card lg:col-span-7 rounded-[32px] p-6 prose prose-invert max-w-none sm:p-8">
                                <p className="text-lg text-[var(--text-secondary)]">{post.excerpt}</p>
                                {blocks.length === 0 ? (
                                    <p className="text-[var(--text-muted)]">
                                        {t('blog.detail.contentFallback')}
                                    </p>
                                ) : null}
                                {blocks.map((block, index) => {
                                    if (block.type === 'paragraph') {
                                        return (
                                            <div
                                                key={`paragraph-${index}`}
                                                className="text-[var(--text-primary)] [&_a]:text-[var(--brand-blue)] [&_a]:underline [&_a]:underline-offset-2 [&_blockquote]:border-l-4 [&_blockquote]:border-[var(--brand-blue)] [&_blockquote]:pl-4 [&_h1]:font-serif [&_h1]:text-3xl [&_h1]:font-semibold [&_h2]:font-serif [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:font-serif [&_h3]:text-xl [&_h3]:font-semibold [&_ol]:ml-5 [&_ol]:list-decimal [&_p]:leading-8 [&_p]:text-[var(--text-primary)] [&_ul]:ml-5 [&_ul]:list-disc"
                                                dangerouslySetInnerHTML={{ __html: block.text }}
                                            />
                                        );
                                    }

                                    if (block.type === 'image' && block.url) {
                                        return (
                                            <div
                                                key={`image-${index}`}
                                                className="overflow-hidden rounded-[24px] border border-[var(--brand-border)] bg-[rgba(7,17,27,0.72)] p-3"
                                            >
                                                <div className="relative h-80 w-full">
                                                    <Image
                                                        src={block.url}
                                                        alt={block.caption || post.title}
                                                        fill
                                                        className="object-contain"
                                                    />
                                                </div>
                                                {block.caption ? (
                                                    <p className="mt-3 text-sm text-[var(--text-muted)]">
                                                        {block.caption}
                                                    </p>
                                                ) : null}
                                            </div>
                                        );
                                    }

                                    if (block.type === 'gallery' && block.items.length > 0) {
                                        return (
                                            <div
                                                key={`gallery-${index}`}
                                                className="overflow-hidden rounded-[24px] border border-[var(--brand-border)] bg-[rgba(7,17,27,0.72)] p-4"
                                            >
                                                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                                    {block.items.map((item, itemIndex) => (
                                                        <div
                                                            key={`gallery-${index}-${itemIndex}`}
                                                            className="relative aspect-[4/3] overflow-hidden rounded-[20px] border border-[var(--brand-border)] bg-[rgba(6,17,27,0.72)]"
                                                        >
                                                            <Image
                                                                src={item.url}
                                                                alt={t('blog.detail.mediaImageAltIndexed').replace('{index}', String(itemIndex + 1))}
                                                                fill
                                                                className="object-cover"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                                {block.caption ? (
                                                    <p className="mt-3 text-sm text-[var(--text-muted)]">
                                                        {block.caption}
                                                    </p>
                                                ) : null}
                                            </div>
                                        );
                                    }

                                    if (block.type === 'video' && block.url) {
                                        const embedUrl = getBlogVideoEmbedUrl(block.url);
                                        return (
                                            <div
                                                key={`video-${index}`}
                                                className="overflow-hidden rounded-[24px] border border-[var(--brand-border)] bg-[rgba(7,17,27,0.72)] p-3"
                                            >
                                                <div className="aspect-video w-full overflow-hidden rounded-xl">
                                                    {embedUrl ? (
                                                        <iframe
                                                            src={embedUrl}
                                                            title={block.caption || t('blog.detail.mediaVideoTitle')}
                                                            className="h-full w-full"
                                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                            allowFullScreen
                                                        />
                                                    ) : (
                                                        <video
                                                            src={block.url}
                                                            controls
                                                            preload="metadata"
                                                            className="h-full w-full bg-black object-cover"
                                                        />
                                                    )}
                                                </div>
                                                {block.caption ? (
                                                    <p className="mt-3 text-sm text-[var(--text-muted)]">
                                                        {block.caption}
                                                    </p>
                                                ) : null}
                                            </div>
                                        );
                                    }

                                    return null;
                                })}
                            </article>

                            <aside className="space-y-4 lg:col-span-3">
                                <div className="brand-card-muted rounded-[28px] p-5">
                                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                                        {t('blog.detail.relatedPosts')}
                                    </p>
                                    <div className="mt-4 space-y-4">
                                        {relatedPosts.length === 0 ? (
                                            <p className="text-sm text-[var(--text-secondary)]">
                                                {t('blog.detail.noRelated')}
                                            </p>
                                        ) : (
                                            relatedPosts.map((item) => (
                                                <Link
                                                    key={item.id}
                                                    href={buildBlogPath(item.id, item.title)}
                                                    className="block rounded-[22px] border border-[var(--brand-border)] bg-[rgba(7,17,27,0.72)] p-3 transition hover:border-[var(--brand-border-strong)] hover:bg-[rgba(41,171,226,0.08)]"
                                                >
                                                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                                                        {item.title}
                                                    </p>
                                                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                                                        {item.category.name}
                                                    </p>
                                                </Link>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div className="brand-card rounded-[28px] p-5">
                                    <p className="mb-3 text-sm font-semibold text-[var(--text-primary)]">
                                        {t('blog.detail.viewAllProducts')}
                                    </p>
                                    <Link
                                        href="/products"
                                        className="brand-button-secondary flex items-center justify-between rounded-[22px] px-4 py-3 text-sm font-medium text-[var(--text-primary)] transition hover:border-[var(--brand-blue)] hover:bg-[rgba(41,171,226,0.14)]"
                                    >
                                        <span>{t('blog.detail.viewAllProducts')}</span>
                                        <svg
                                            className="h-4 w-4 text-[var(--brand-blue)]"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 5l7 7-7 7"
                                            />
                                        </svg>
                                    </Link>
                                </div>
                            </aside>
                        </div>
                    </div>
                </AvoidSidebar>
            </section>
        </div>
    );
}
