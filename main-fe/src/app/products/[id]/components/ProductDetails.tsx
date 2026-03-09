'use client';

import Image from 'next/image';
import { sanitizeHtml } from '@/utils/sanitize';
import LazyIframe from '@/components/shared/LazyIframe';
import { useLanguage } from '@/context/LanguageContext';

// Unused interface - commented out to fix linting
// interface Feature {
//     title: string;
//     subtitle?: string;
//     description: string;
//     value?: string;
// }

interface ContentItem {
    type: 'title' | 'list_text' | 'image' | 'images' | 'text' | 'video';
    content?: string;
    link?: string;
    images?: Array<{ url: string; public_id: string }>;
    videoUrl?: string;
    videoTitle?: string;
    caption?: string; // Caption for image, images, and video types
}

interface ProductDetailsProps {
    description: string;
    content?: ContentItem[];
    descriptions?: unknown[];
}

export default function ProductDetails({ description, content, descriptions }: ProductDetailsProps) {
    const { t } = useLanguage();
    const renderContent = (item: ContentItem, index: number) => {
        switch (item.type) {
            case 'title':
                return (
                    <div key={index} className="w-full">
                        <h3 className="text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-3xl 3xl:text-5xl 4xl:text-6xl 5xl:text-7xl font-bold text-white mb-4 2xl:mb-6 3xl:mb-8 4xl:mb-10 5xl:mb-12">{item.content}</h3>
                    </div>
                );
            case 'list_text':
                return (
                    <div key={index} className="text-justify">
                        <ul className="space-y-3 2xl:space-y-4 3xl:space-y-5 4xl:space-y-6 5xl:space-y-8 list-disc list-inside text-gray-300 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-xl 3xl:text-3xl 4xl:text-4xl 5xl:text-5xl leading-relaxed">
                            {item.content
                                ?.split('\n')
                                .filter((line) => line.trim())
                                .map((line, lineIndex) => (
                                    <li key={lineIndex} className="pl-2 2xl:pl-3 3xl:pl-4 4xl:pl-5 5xl:pl-6 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-xl 3xl:text-3xl 4xl:text-4xl 5xl:text-5xl">
                                        {line.trim()}
                                    </li>
                                ))}
                        </ul>
                    </div>
                );
            case 'image':
                return (
                    <div key={index} className="w-full">
                        <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl border border-gray-700/50 aspect-[2/1] overflow-hidden">
                            {item.link ? (
                                <Image
                                    src={item.link}
                                    alt={t('products.detail.media.imageAlt')}
                                    width={1200}
                                    height={400}
                                    className="w-full h-full object-cover rounded-lg"
                                    loading="lazy"
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, (max-width: 3200px) 1200px, 1500px"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                                    {t('products.detail.media.imageUnavailable')}
                                </div>
                            )}
                        </div>
                        {item.caption && (
                            <p className="text-sm text-gray-400 italic text-center mt-3">
                                {item.caption}
                            </p>
                        )}
                    </div>
                );
            case 'images':
                return (
                    <div key={index} className="w-full">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {item.images?.map((img, imgIndex) => (
                                <div key={imgIndex} className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl border border-gray-700/50 aspect-square overflow-hidden">
                                    {img.url ? (
                                        <Image
                                            src={img.url}
                                            alt={t('products.detail.media.imageAltIndexed').replace('{index}', String(imgIndex + 1))}
                                            width={400}
                                            height={400}
                                            className="w-full h-full object-cover rounded-lg"
                                            loading="lazy"
                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                                            {t('products.detail.media.imageUnavailable')}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        {item.caption && (
                            <p className="text-sm text-gray-400 italic text-center mt-3">
                                {item.caption}
                            </p>
                        )}
                    </div>
                );
            case 'text':
                return (
                    <div key={index} className="text-justify">
                        <p className="text-gray-300 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-xl 3xl:text-3xl 4xl:text-4xl leading-relaxed">{item.content}</p>
                    </div>
                );
            case 'video':
                return (
                    <div key={index} className="w-full">
                        {item.videoUrl ? (
                            <LazyIframe
                                src={item.videoUrl.includes('youtube.com') || item.videoUrl.includes('youtu.be')
                                    ? `https://www.youtube.com/embed/${item.videoUrl.includes('watch?v=')
                                        ? item.videoUrl.split('watch?v=')[1].split('&')[0]
                                        : item.videoUrl.split('/').pop()}`
                                    : item.videoUrl}
                                title={item.videoTitle || item.content || t('products.detail.media.videoTitle')}
                                className="w-full aspect-video bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl border border-gray-700/50"
                            />
                        ) : (
                            <div className="w-full aspect-video bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl border border-gray-700/50 flex items-center justify-center bg-gray-800">
                                <p className="text-gray-400 text-center">{t('products.detail.media.videoUnavailable')}</p>
                            </div>
                        )}
                        {(item.videoTitle || item.content) && (
                            <div className="mt-4">
                                <h4 className="text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-3xl 3xl:text-5xl 4xl:text-6xl font-semibold text-white mb-2">
                                    {item.videoTitle || item.content}
                                </h4>
                            </div>
                        )}
                        {item.caption && (
                            <p className="text-sm text-gray-400 italic text-center mt-3">
                                {item.caption}
                            </p>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    // Render descriptions from API
    const renderApiDescription = (item: unknown, index: number) => {
        const typedItem = item as { type: string; text?: string; [key: string]: unknown };
        switch (typedItem.type) {
            case 'title':
                return (
                    <div key={index} className="w-full">
                        <h3 className="text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-3xl 3xl:text-5xl 4xl:text-6xl 5xl:text-7xl font-bold text-white mb-4 2xl:mb-6 3xl:mb-8 4xl:mb-10 5xl:mb-12">{typedItem.text}</h3>
                    </div>
                );
            case 'description':
                return (
                    <div key={index} className="text-justify">
                        <div
                            className="description-content text-gray-300 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-xl 3xl:text-3xl 4xl:text-4xl leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(typedItem.text || '') }}
                        />
                    </div>
                );
            case 'image':
                return (
                    <div key={index} className="w-full">
                        <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl border border-gray-700/50 aspect-[2/1] overflow-hidden">
                            {(typedItem.imageUrl as string) || (typedItem.link as string) ? (
                                <Image
                                    src={(typedItem.imageUrl as string) || (typedItem.link as string)}
                                    alt={t('products.detail.media.detailImageAlt')}
                                    width={1200}
                                    height={400}
                                    className="w-full h-full object-cover rounded-lg"
                                    loading="lazy"
                                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, (max-width: 3200px) 1200px, 1500px"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                                    {t('products.detail.media.imageUnavailable')}
                                </div>
                            )}
                        </div>
                        {(typedItem.caption as string) && (
                            <p className="text-sm text-gray-400 italic text-center mt-3">
                                {typedItem.caption as string}
                            </p>
                        )}
                    </div>
                );
            case 'images':
                return (
                    <div key={index} className="w-full">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {(typedItem.images as Array<{ url: string; public_id: string }>)?.map((img, imgIndex) => (
                                <div key={imgIndex} className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl border border-gray-700/50 aspect-square overflow-hidden">
                                    {img.url ? (
                                        <Image
                                            src={img.url}
                                            alt={t('products.detail.media.detailImageAltIndexed').replace('{index}', String(imgIndex + 1))}
                                            width={400}
                                            height={400}
                                            className="w-full h-full object-cover rounded-lg"
                                            loading="lazy"
                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
                                            {t('products.detail.media.imageUnavailable')}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        {(typedItem.caption as string) && (
                            <p className="text-sm text-gray-400 italic text-center mt-3">
                                {typedItem.caption as string}
                            </p>
                        )}
                    </div>
                );
            case 'video':
                return (
                    <div key={index} className="w-full">
                        {(typedItem.videoUrl as string) ? (
                            <LazyIframe
                                src={(typedItem.videoUrl as string).includes('youtube.com') || (typedItem.videoUrl as string).includes('youtu.be')
                                    ? `https://www.youtube.com/embed/${(typedItem.videoUrl as string).includes('watch?v=')
                                        ? (typedItem.videoUrl as string).split('watch?v=')[1].split('&')[0]
                                        : (typedItem.videoUrl as string).split('/').pop()}`
                                    : (typedItem.videoUrl as string)}
                                title={typedItem.text || t('products.detail.media.videoTitle')}
                                className="w-full aspect-video bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl border border-gray-700/50"
                            />
                        ) : (
                            <div className="w-full aspect-video bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl border border-gray-700/50 flex items-center justify-center bg-gray-800">
                                <p className="text-gray-400 text-center">{t('products.detail.media.videoUnavailable')}</p>
                            </div>
                        )}
                        {typedItem.text && (
                            <div className="mt-4">
                                <h4 className="text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-3xl 3xl:text-5xl 4xl:text-6xl font-semibold text-white mb-2">
                                    {typedItem.text}
                                </h4>
                            </div>
                        )}
                        {(typedItem.caption as string) && (
                            <p className="text-sm text-gray-400 italic text-center mt-3">
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
        <section className="relative z-[150] min-h-screen">
            <div className="container mx-auto max-w-[1800px] px-4 relative py-4 pb-2 pt-8 sm:-mt-8 md:-mt-8 z-[200]">


                {/* Product Description */}
                <div className="mb-12 md:mb-16">
                    <div className="flex flex-col space-y-6">
                        {hasDescriptions ? (
                            descriptions.map((item, index) => renderApiDescription(item, index))
                        ) : hasContent ? (
                            content.map((item, index) => renderContent(item, index))
                        ) : hasDescriptionText ? (
                            <div className="w-full bg-gray-900/50 rounded-2xl border border-gray-700/50 p-6">
                                <p className="text-gray-300 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-xl 3xl:text-3xl 4xl:text-4xl leading-relaxed text-justify">
                                    {description}
                                </p>
                                <p className="text-gray-500 text-xs sm:text-sm mt-3">
                                    {t('products.detail.contentUpdating')}
                                </p>
                            </div>
                        ) : (
                            <div className="w-full bg-gray-900/50 rounded-2xl border border-gray-700/50 p-6 text-center">
                                <p className="text-gray-400 text-sm sm:text-base">
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
