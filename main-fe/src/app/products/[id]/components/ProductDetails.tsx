'use client';

import Image from 'next/image';
import ResponsiveVideo from '@/components/shared/ResponsiveVideo';
import { useLanguage } from '@/context/LanguageContext';
import { sanitizeHtml } from '@/utils/sanitize';

interface ContentItem {
    type: 'list_text' | 'image' | 'images' | 'text' | 'video';
    content?: string;
    link?: string;
    images?: Array<{ url: string; public_id: string }>;
    videoUrl?: string;
    videoTitle?: string;
    caption?: string;
}

interface ProductDetailsProps {
    description: string;
    content?: ContentItem[];
    descriptions?: unknown[];
}

const pickString = (...values: unknown[]) => {
    for (const value of values) {
        if (typeof value !== 'string') continue;
        const trimmed = value.trim();
        if (trimmed) return trimmed;
    }
    return '';
};

const normalizeGalleryUrls = (item: Record<string, unknown>) => {
    const source = item.gallery ?? item.images ?? item.urls;
    if (!Array.isArray(source)) return [] as string[];

    return source
        .map((entry) => {
            if (typeof entry === 'string') return entry.trim();
            if (entry && typeof entry === 'object') return pickString((entry as { url?: unknown }).url);
            return '';
        })
        .filter(Boolean);
};

const mediaFrameClass =
    'overflow-hidden rounded-[26px] border border-[var(--brand-border)] bg-[linear-gradient(180deg,rgba(17,30,45,0.9),rgba(7,17,27,0.92))]';

export default function ProductDetails({ description, content, descriptions }: ProductDetailsProps) {
    const { t } = useLanguage();

    const renderContent = (item: ContentItem, index: number) => {
        switch (item.type) {
            case 'list_text':
                return (
                    <div key={index} className="text-justify">
                        <ul className="list-inside list-disc space-y-3 text-sm leading-8 text-[var(--text-secondary)] sm:text-base lg:text-lg">
                            {item.content
                                ?.split('\n')
                                .filter((line) => line.trim())
                                .map((line, lineIndex) => (
                                    <li key={lineIndex}>{line.trim()}</li>
                                ))}
                        </ul>
                    </div>
                );
            case 'image':
                return (
                    <div key={index} className="w-full">
                        <div className={`${mediaFrameClass} aspect-[2/1]`}>
                            {item.link ? (
                                <Image
                                    src={item.link}
                                    alt={t('products.detail.media.imageAlt')}
                                    width={1200}
                                    height={400}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-sm text-[var(--text-muted)]">
                                    {t('products.detail.media.imageUnavailable')}
                                </div>
                            )}
                        </div>
                        {item.caption && (
                            <p className="mt-3 text-center text-sm italic text-[var(--text-muted)]">{item.caption}</p>
                        )}
                    </div>
                );
            case 'images':
                return (
                    <div key={index} className="w-full">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {item.images?.map((image, imageIndex) => (
                                <div key={imageIndex} className={`${mediaFrameClass} aspect-square`}>
                                    {image.url ? (
                                        <Image
                                            src={image.url}
                                            alt={t('products.detail.media.imageAltIndexed').replace(
                                                '{index}',
                                                String(imageIndex + 1)
                                            )}
                                            width={420}
                                            height={420}
                                            className="h-full w-full object-cover"
                                            loading="lazy"
                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-sm text-[var(--text-muted)]">
                                            {t('products.detail.media.imageUnavailable')}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        {item.caption && (
                            <p className="mt-3 text-center text-sm italic text-[var(--text-muted)]">{item.caption}</p>
                        )}
                    </div>
                );
            case 'text':
                return (
                    <div key={index} className="text-justify">
                        <p className="text-sm leading-8 text-[var(--text-secondary)] sm:text-base lg:text-lg">
                            {item.content}
                        </p>
                    </div>
                );
            case 'video':
                return (
                    <div key={index} className="w-full">
                        {item.videoUrl ? (
                            <ResponsiveVideo
                                url={item.videoUrl}
                                title={item.videoTitle || item.content || t('products.detail.media.videoTitle')}
                                className={`aspect-video w-full ${mediaFrameClass}`}
                                videoClassName={`aspect-video w-full object-cover ${mediaFrameClass}`}
                            />
                        ) : (
                            <div className={`flex aspect-video w-full items-center justify-center ${mediaFrameClass}`}>
                                <p className="text-center text-[var(--text-muted)]">
                                    {t('products.detail.media.videoUnavailable')}
                                </p>
                            </div>
                        )}
                        {(item.videoTitle || item.content) && (
                            <div className="mt-4">
                                <h4 className="font-serif text-xl font-semibold text-[var(--text-primary)] lg:text-2xl">
                                    {item.videoTitle || item.content}
                                </h4>
                            </div>
                        )}
                        {item.caption && (
                            <p className="mt-3 text-center text-sm italic text-[var(--text-muted)]">{item.caption}</p>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    const renderApiDescription = (item: unknown, index: number) => {
        const typedItem = item as { type: string; text?: string; [key: string]: unknown };
        const mediaUrl = pickString(typedItem.url, typedItem.imageUrl, typedItem.link);
        const videoUrl = pickString(typedItem.url, typedItem.videoUrl);
        const galleryUrls = normalizeGalleryUrls(typedItem);

        switch (typedItem.type) {
            case 'description':
                return (
                    <div key={index} className="text-justify">
                        <div
                            className="description-content text-sm leading-8 text-[var(--text-secondary)] sm:text-base lg:text-lg"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(typedItem.text || '') }}
                        />
                    </div>
                );
            case 'image':
                return (
                    <div key={index} className="w-full">
                        <div className={`${mediaFrameClass} aspect-[2/1]`}>
                            {mediaUrl ? (
                                <Image
                                    src={mediaUrl}
                                    alt={t('products.detail.media.detailImageAlt')}
                                    width={1200}
                                    height={400}
                                    className="h-full w-full object-cover"
                                    loading="lazy"
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-sm text-[var(--text-muted)]">
                                    {t('products.detail.media.imageUnavailable')}
                                </div>
                            )}
                        </div>
                        {(typedItem.caption as string) && (
                            <p className="mt-3 text-center text-sm italic text-[var(--text-muted)]">
                                {typedItem.caption as string}
                            </p>
                        )}
                    </div>
                );
            case 'gallery':
            case 'images':
                return (
                    <div key={index} className="w-full">
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {galleryUrls.map((url, imageIndex) => (
                                <div key={imageIndex} className={`${mediaFrameClass} aspect-square`}>
                                    {url ? (
                                        <Image
                                            src={url}
                                            alt={t('products.detail.media.detailImageAltIndexed').replace(
                                                '{index}',
                                                String(imageIndex + 1)
                                            )}
                                            width={420}
                                            height={420}
                                            className="h-full w-full object-cover"
                                            loading="lazy"
                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-sm text-[var(--text-muted)]">
                                            {t('products.detail.media.imageUnavailable')}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        {(typedItem.caption as string) && (
                            <p className="mt-3 text-center text-sm italic text-[var(--text-muted)]">
                                {typedItem.caption as string}
                            </p>
                        )}
                    </div>
                );
            case 'video':
                return (
                    <div key={index} className="w-full">
                        {videoUrl ? (
                            <ResponsiveVideo
                                url={videoUrl}
                                title={
                                    pickString(typedItem.text, typedItem.title) || t('products.detail.media.videoTitle')
                                }
                                className={`aspect-video w-full ${mediaFrameClass}`}
                                videoClassName={`aspect-video w-full object-cover ${mediaFrameClass}`}
                            />
                        ) : (
                            <div className={`flex aspect-video w-full items-center justify-center ${mediaFrameClass}`}>
                                <p className="text-center text-[var(--text-muted)]">
                                    {t('products.detail.media.videoUnavailable')}
                                </p>
                            </div>
                        )}
                        {pickString(typedItem.text, typedItem.title) && (
                            <div className="mt-4">
                                <h4 className="font-serif text-xl font-semibold text-[var(--text-primary)] lg:text-2xl">
                                    {pickString(typedItem.text, typedItem.title)}
                                </h4>
                            </div>
                        )}
                        {(typedItem.caption as string) && (
                            <p className="mt-3 text-center text-sm italic text-[var(--text-muted)]">
                                {typedItem.caption as string}
                            </p>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    const hasDescriptions = Array.isArray(descriptions) && descriptions.length > 0;
    const hasContent = Array.isArray(content) && content.length > 0;
    const hasDescriptionText = Boolean(description && description.trim());

    return (
        <section className="relative min-h-screen py-10 md:py-14">
            <div className="absolute inset-0 bg-dot-grid opacity-12 pointer-events-none" />
            <div className="brand-shell relative z-10">
                <div className="mb-8 md:mb-10">
                    <h2 className="font-serif text-2xl font-semibold text-[var(--text-primary)] sm:text-[2.15rem] md:text-3xl xl:text-4xl">
                        {t('products.detail.breadcrumbs.productDetails')}
                    </h2>
                </div>

                <div className="brand-card rounded-[30px] p-6 md:p-8">
                    <div className="flex flex-col space-y-8">
                        {hasDescriptions ? (
                            descriptions.map((item, index) => renderApiDescription(item, index))
                        ) : hasContent ? (
                            content.map((item, index) => renderContent(item, index))
                        ) : hasDescriptionText ? (
                            <div className="rounded-[24px] border border-[var(--brand-border)] bg-[rgba(7,17,27,0.72)] p-6">
                                <p className="text-sm leading-8 text-[var(--text-secondary)] sm:text-base lg:text-lg">
                                    {description}
                                </p>
                                <p className="mt-3 text-xs text-[var(--text-muted)]">
                                    {t('products.detail.contentUpdating')}
                                </p>
                            </div>
                        ) : (
                            <div className="rounded-[24px] border border-[var(--brand-border)] bg-[rgba(7,17,27,0.72)] p-6 text-center">
                                <p className="text-sm text-[var(--text-secondary)] sm:text-base">
                                    {t('products.detail.noContent')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
