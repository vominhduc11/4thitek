'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import type { ProductVideo } from '@/types/product';
import ResponsiveVideo from '@/components/shared/ResponsiveVideo';

interface ProductVideosProps {
    productName?: string;
    videos?: ProductVideo[];
}

export default function ProductVideos({ productName, videos = [] }: ProductVideosProps) {
    const { t } = useLanguage();
    const secondaryVideos = useMemo(() => videos.slice(1), [videos]);
    const renderVideoCard = (video: ProductVideo, index: number, compact: boolean) => (
        <motion.div
            key={`${video.id || video.url || video.title}-${index}`}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            className={`brand-card-muted overflow-hidden rounded-[24px] border border-[var(--brand-border)] transition-all duration-300 hover:border-[var(--brand-border-strong)] ${
                compact ? 'cursor-pointer group' : 'snap-start min-w-[280px] sm:min-w-[360px] lg:min-w-[420px]'
            }`}
        >
            <div className="relative aspect-video bg-[rgba(7,17,27,0.88)]">
                {video.url.trim() ? (
                    <ResponsiveVideo
                        url={video.url}
                        title={video.title}
                        className="w-full h-full"
                        videoClassName="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <p className="text-center text-sm text-[var(--text-secondary)]">
                            {t('products.videos.unavailable')}
                        </p>
                    </div>
                )}
                {video.duration && (
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs sm:text-sm md:text-base lg:text-lg xl:text-lg 3xl:text-2xl px-2 py-1 rounded pointer-events-none">
                        {video.duration}
                    </div>
                )}
            </div>
            <div className={`${compact ? 'p-4' : 'p-4 flex-1'}`}>
                <h4 className="mb-2 line-clamp-2 text-sm font-medium text-white transition-colors group-hover:text-[var(--brand-blue)] sm:text-base md:text-lg lg:text-xl xl:text-xl 3xl:text-3xl">
                    {video.title}
                </h4>
                <p className="line-clamp-2 text-xs text-[var(--text-secondary)] sm:text-sm md:text-base lg:text-lg xl:text-lg 3xl:text-2xl">
                    {video.description || t('products.videos.videoAbout').replace('{title}', video.title)}
                </p>
            </div>
        </motion.div>
    );

    if (videos.length === 0) {
        return (
            <section id="product-details" className="relative min-h-screen">
                <div className="container mx-auto max-w-[1800px] px-4 relative py-4 pb-2 pt-8 sm:-mt-8 md:-mt-8 z-10">
                    <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 3xl:text-6xl font-bold mb-6 md:mb-8 text-white">
                        {t('products.videos.title')}
                    </h2>
                    <div className="brand-card-muted rounded-[28px] border border-[var(--brand-border)] p-6 text-center">
                        <p className="text-sm text-[var(--text-secondary)] sm:text-base">
                            {productName
                                ? t('products.videos.emptyWithName').replace('{name}', productName)
                                : t('products.videos.empty')}
                        </p>
                        <p className="mt-2 text-xs text-[var(--text-muted)] sm:text-sm">
                            {t('products.videos.emptyHint')}
                        </p>
                    </div>
                </div>
            </section>
        );
    }

    const featuredVideo = videos[0];

    return (
        <section id="product-details" className="relative min-h-screen">
            <div className="container mx-auto max-w-[1800px] px-4 relative py-4 pb-2 pt-8 sm:-mt-8 md:-mt-8 z-10">
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 3xl:text-6xl font-bold mb-6 md:mb-8 text-white">
                    {t('products.videos.title')}
                </h2>

                {featuredVideo && (
                    <div className="mb-8 md:mb-12">
                        <div className="brand-card overflow-hidden rounded-[28px] border border-[var(--brand-border)]">
                            <div className="relative aspect-video bg-[rgba(7,17,27,0.88)] group">
                                {featuredVideo.url.trim() ? (
                                    <ResponsiveVideo
                                        url={featuredVideo.url}
                                        title={featuredVideo.title}
                                        className="w-full h-full"
                                        videoClassName="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <p className="text-center text-[var(--text-secondary)]">
                                            {t('products.videos.noVideo')}
                                        </p>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 md:p-6">
                                <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-2xl 3xl:text-4xl font-bold text-white mb-2">
                                    {featuredVideo.title ||
                                        t('products.videos.featuredTitle').replace('{name}', productName || '')}
                                </h3>
                                <p className="text-sm text-[var(--text-secondary)] sm:text-base md:text-lg lg:text-xl xl:text-xl 3xl:text-3xl">
                                    {featuredVideo.description || t('products.videos.featuredDescription')}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {secondaryVideos.length > 0 &&
                    (secondaryVideos.length <= 3 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
                            {secondaryVideos.map((video, index) => renderVideoCard(video, index, true))}
                        </div>
                    ) : (
                        <div className="relative mb-8 md:mb-12">
                            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 md:gap-6">
                                {secondaryVideos.map((video, index) => renderVideoCard(video, index, false))}
                            </div>
                        </div>
                    ))}
            </div>
        </section>
    );
}
