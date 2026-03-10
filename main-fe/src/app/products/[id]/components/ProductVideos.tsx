'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
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

    if (videos.length === 0) {
        return (
            <section id="product-details" className="relative z-[60] min-h-screen">
                <div className="container mx-auto max-w-[1800px] px-4 relative py-4 pb-2 pt-8 sm:-mt-8 md:-mt-8 z-[70]">
                    <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-4xl 3xl:text-6xl 4xl:text-7xl font-bold mb-6 md:mb-8 text-white">
                        {t('products.videos.title')}
                    </h2>
                    <div className="bg-gray-900/50 rounded-2xl border border-gray-700/50 p-6 text-center">
                        <p className="text-gray-400 text-sm sm:text-base">
                            {productName
                                ? t('products.videos.emptyWithName').replace('{name}', productName)
                                : t('products.videos.empty')}
                        </p>
                        <p className="text-gray-500 text-xs sm:text-sm mt-2">{t('products.videos.emptyHint')}</p>
                    </div>
                </div>
            </section>
        );
    }

    const featuredVideo = videos[0];

    return (
        <section id="product-details" className="relative z-[60] min-h-screen">
            <div className="container mx-auto max-w-[1800px] px-4 relative py-4 pb-2 pt-8 sm:-mt-8 md:-mt-8 z-[70]">
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-4xl 3xl:text-6xl 4xl:text-7xl font-bold mb-6 md:mb-8 text-white">
                    {t('products.videos.title')}
                </h2>

                {featuredVideo && (
                    <div className="mb-8 md:mb-12">
                        <div className="bg-gray-900/50 rounded-2xl overflow-hidden border border-gray-700/50">
                            <div className="aspect-video bg-gray-800 relative group">
                                {featuredVideo.url.trim() ? (
                                    <ResponsiveVideo
                                        url={featuredVideo.url}
                                        title={featuredVideo.title}
                                        className="w-full h-full"
                                        videoClassName="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                        <p className="text-gray-400 text-center">{t('products.videos.noVideo')}</p>
                                    </div>
                                )}
                            </div>
                            <div className="p-4 md:p-6">
                                <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-2xl 2xl:text-2xl 3xl:text-4xl 4xl:text-5xl font-bold text-white mb-2">
                                    {featuredVideo.title || t('products.videos.featuredTitle').replace('{name}', productName || '')}
                                </h3>
                                <p className="text-gray-400 text-sm sm:text-base md:text-lg lg:text-xl xl:text-xl 2xl:text-xl 3xl:text-3xl 4xl:text-4xl">
                                    {featuredVideo.description || t('products.videos.featuredDescription')}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {secondaryVideos.length > 0 && (
                    secondaryVideos.length <= 3 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
                            {secondaryVideos.map((video, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: index * 0.1 }}
                                    className="bg-gray-900/50 rounded-lg overflow-hidden border border-gray-700/30 hover:border-blue-400/50 transition-all duration-300 group cursor-pointer"
                                >
                                    <div className="aspect-video bg-gray-800 relative">
                                        {video.url.trim() ? (
                                            <ResponsiveVideo
                                                url={video.url}
                                                title={video.title}
                                                className="w-full h-full"
                                                videoClassName="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <p className="text-gray-400 text-center text-sm">{t('products.videos.unavailable')}</p>
                                            </div>
                                        )}
                                        {video.duration && (
                                            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs sm:text-sm md:text-base lg:text-lg xl:text-lg 2xl:text-lg 3xl:text-2xl 4xl:text-3xl px-2 py-1 rounded pointer-events-none">
                                                {video.duration}
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h4 className="text-white font-medium mb-2 group-hover:text-blue-400 transition-colors line-clamp-2 text-sm sm:text-base md:text-lg lg:text-xl xl:text-xl 2xl:text-xl 3xl:text-3xl 4xl:text-4xl">
                                            {video.title}
                                        </h4>
                                        <p className="text-gray-400 text-xs sm:text-sm md:text-base lg:text-lg xl:text-lg 2xl:text-lg 3xl:text-2xl 4xl:text-3xl line-clamp-2">
                                            {video.description || t('products.videos.videoAbout').replace('{title}', video.title)}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <div className="relative mb-8 md:mb-12">
                            <Swiper
                                modules={[Navigation, Pagination, A11y]}
                                spaceBetween={16}
                                slidesPerView={1}
                                breakpoints={{
                                    640: { slidesPerView: 2 },
                                    1024: { slidesPerView: 3 }
                                }}
                                navigation
                                pagination={{ clickable: true }}
                            >
                                {secondaryVideos.map((video, index) => (
                                    <SwiperSlide key={index}>
                                        <div className="bg-gray-900/50 rounded-lg overflow-hidden border border-gray-700/30 hover:border-blue-400/50 transition-all duration-300 h-full flex flex-col">
                                            <div className="aspect-video bg-gray-800 relative">
                                                {video.url.trim() ? (
                                                    <ResponsiveVideo
                                                        url={video.url}
                                                        title={video.title}
                                                        className="w-full h-full"
                                                        videoClassName="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <p className="text-gray-400 text-center text-sm">{t('products.videos.unavailable')}</p>
                                                    </div>
                                                )}
                                                {video.duration && (
                                                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs sm:text-sm md:text-base lg:text-lg xl:text-lg 2xl:text-lg 3xl:text-2xl 4xl:text-3xl px-2 py-1 rounded pointer-events-none">
                                                        {video.duration}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-4 flex-1">
                                                <h4 className="text-white font-medium mb-2 group-hover:text-blue-400 transition-colors line-clamp-2 text-sm sm:text-base md:text-lg lg:text-xl xl:text-xl 2xl:text-xl 3xl:text-3xl 4xl:text-4xl">
                                                    {video.title}
                                                </h4>
                                                <p className="text-gray-400 text-xs sm:text-sm md:text-base lg:text-lg xl:text-lg 2xl:text-lg 3xl:text-2xl 4xl:text-3xl line-clamp-2">
                                                    {video.description || t('products.videos.videoAbout').replace('{title}', video.title)}
                                                </p>
                                            </div>
                                        </div>
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                        </div>
                    )
                )}
            </div>
        </section>
    );
}
