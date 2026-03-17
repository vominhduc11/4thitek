'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CiShuffle } from 'react-icons/ci';
import { FiHeadphones } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import type { Product } from '@/types/product';

interface ProductImageWithFallbackProps {
    src: string;
    alt: string;
    className?: string;
}

function ProductImageWithFallback({ src, alt, className }: ProductImageWithFallbackProps) {
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    if (!src || imageError) {
        return (
            <div className={`${className} flex flex-col items-center justify-center`}>
                <FiHeadphones className="h-20 w-20 text-slate-600 md:h-28 md:w-28" />
            </div>
        );
    }

    return (
        <div className={className}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                </div>
            )}
            <Image
                src={src}
                alt={alt}
                width={400}
                height={400}
                className={`w-full h-full object-contain transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                onLoad={() => setIsLoading(false)}
                onError={() => { setImageError(true); setIsLoading(false); }}
                priority
            />
        </div>
    );
}

interface BreadcrumbItem {
    label: string;
    section: string;
}

interface ProductHeroProps {
    product: Product;
    relatedProducts?: Product[];
    breadcrumbItems?: BreadcrumbItem[];
    activeBreadcrumb?: string;
    onBreadcrumbClick?: (item: BreadcrumbItem) => void;
}

export default function ProductHero({
    product,
    relatedProducts = [],
    breadcrumbItems = [],
    activeBreadcrumb = '',
    onBreadcrumbClick = () => {}
}: ProductHeroProps) {
    const { t } = useLanguage();
    const [isShuffling, setIsShuffling] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const router = useRouter();

    const handleFindRetailer = () => {
        router.push('/become_our_reseller#dealer-network');
    };

    const handleShuffleProduct = () => {
        if (isShuffling || relatedProducts.length === 0) return;
        setIsShuffling(true);
        const seed = Date.now() + product.id.charCodeAt(0);
        const randomProduct = relatedProducts[seed % relatedProducts.length];
        router.push(`/products/${randomProduct.id}`);
    };

    return (
        <motion.section
            className="relative flex h-[60vh] items-center justify-center overflow-visible sm:h-[70vh] md:h-[80vh] lg:h-[90vh] xl:h-[100vh]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
        >
            {/* Video background */}
            <div className="absolute inset-0 z-0">
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="none"
                    className="hidden sm:block w-full h-full object-cover"
                    onCanPlay={() => videoRef.current?.play().catch(() => {})}
                >
                    <source src="/videos/futuristic-background-2022-08-04-19-57-56-utc.mp4" type="video/mp4" />
                </video>

                {/* Mobile gradient background */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,200,255,0.22),_transparent_45%),linear-gradient(180deg,_#0c131d_0%,_#07101a_55%,_#03070d_100%)] sm:hidden" />

                {/* Fallback gradient (desktop) */}
                <div className="absolute inset-0 hidden sm:block bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-black" />

                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/30" />

                {/* Edge gradient vignettes — simplified (2 divs not 10) */}
                <div className="absolute inset-x-0 top-0 z-10 h-40 bg-gradient-to-b from-black to-transparent" />
                <div className="absolute inset-x-0 bottom-0 z-10 h-56 bg-gradient-to-t from-[#0c131d] to-[#0c131d]/0 md:h-80 lg:h-[420px]" />
                <div className="absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-black to-transparent" style={{ clipPath: 'ellipse(100% 70% at 0% 50%)' }} />
                <div className="absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-black to-transparent" style={{ clipPath: 'ellipse(100% 70% at 100% 50%)' }} />
            </div>

            {/* Vertical "PRODUCT" label — left side, desktop only */}
            <div className="absolute left-4 top-1/2 z-30 hidden -translate-y-1/2 sm:block md:left-8">
                <div
                    className="text-xs font-black uppercase tracking-[0.3em] text-white/50 md:text-sm lg:text-base"
                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                >
                    {t('products.detail.productLabel')}
                </div>
            </div>

            {/* Main content */}
            <div className="relative z-10 mx-auto w-full max-w-5xl px-4 text-center">
                <div className="flex flex-col items-center gap-6">
                    {/* Title */}
                    <AnimatePresence mode="wait">
                        <motion.h1
                            key={product.id + '-title'}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                            className="max-w-2xl px-2 text-lg font-bold leading-tight text-white sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl"
                        >
                            {product.name}
                        </motion.h1>
                    </AnimatePresence>

                    {/* Product image */}
                    <div className="relative mx-auto h-40 w-full max-w-xs sm:h-52 sm:max-w-sm md:h-64 md:max-w-md lg:h-72 lg:max-w-lg xl:h-80 xl:max-w-xl">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={product.id + '-image'}
                                className="h-full w-full flex items-center justify-center"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                            >
                                <ProductImageWithFallback
                                    src={product.images?.[0]?.url || ''}
                                    alt={product.name}
                                    className="relative h-full w-full"
                                />
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center justify-center gap-3">
                        <motion.button
                            onClick={handleShuffleProduct}
                            disabled={isShuffling}
                            className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-sm transition hover:bg-white hover:text-black sm:h-12 sm:w-12 ${isShuffling ? 'cursor-not-allowed opacity-60' : ''}`}
                            title={t('products.detail.viewOtherProducts')}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {isShuffling ? (
                                <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                            ) : (
                                <CiShuffle className="h-5 w-5 pointer-events-none" />
                            )}
                        </motion.button>

                        <motion.button
                            onClick={handleFindRetailer}
                            className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-medium backdrop-blur-sm transition hover:bg-white hover:text-black sm:px-6 sm:py-3"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {t('products.detail.findRetailer')}
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4l8 8-8 8M4 12h16" />
                            </svg>
                        </motion.button>
                    </div>
                </div>
            </div>

            {/* Hero breadcrumb — bottom of hero, md+ only */}
            {breadcrumbItems.length > 0 && (
                <motion.div
                    id="hero-breadcrumb"
                    className="absolute bottom-20 left-0 right-0 z-20 hidden md:block md:bottom-28 lg:bottom-36 xl:bottom-44"
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 1.2, ease: 'easeOut', delay: 0.8 }}
                >
                    <div className="relative mx-auto max-w-[1800px] px-4">
                        {/* Left decorative line */}
                        <motion.div
                            className="absolute top-1/2 left-4 h-px"
                            initial={{ scaleX: 0, opacity: 0 }}
                            animate={{ scaleX: 1, opacity: 1 }}
                            transition={{ duration: 1.5, ease: 'easeOut', delay: 1.2 }}
                            style={{
                                width: 'calc(50% - clamp(260px, 32vw, 520px))',
                                background: 'linear-gradient(to right, transparent, rgba(79,200,255,0.6))',
                                transformOrigin: 'right center'
                            }}
                        />
                        {/* Right decorative line */}
                        <motion.div
                            className="absolute top-1/2 right-4 h-px"
                            initial={{ scaleX: 0, opacity: 0 }}
                            animate={{ scaleX: 1, opacity: 1 }}
                            transition={{ duration: 1.5, ease: 'easeOut', delay: 1.2 }}
                            style={{
                                width: 'calc(50% - clamp(260px, 32vw, 520px))',
                                background: 'linear-gradient(to left, transparent, rgba(79,200,255,0.6))',
                                transformOrigin: 'left center'
                            }}
                        />
                        <motion.nav
                            className="relative z-20 flex items-center justify-center gap-1 md:gap-2"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: 'easeOut', delay: 1.4 }}
                        >
                            {breadcrumbItems.map((item, index) => (
                                <motion.div
                                    key={item.label}
                                    className="flex items-center"
                                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ duration: 0.6, ease: 'easeOut', delay: 1.6 + index * 0.1 }}
                                >
                                    <motion.button
                                        onClick={() => onBreadcrumbClick(item)}
                                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-200 md:px-4 md:py-2 md:text-base ${
                                            activeBreadcrumb === item.label
                                                ? 'text-cyan-400'
                                                : 'text-gray-400 hover:text-white'
                                        }`}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        {item.label}
                                    </motion.button>
                                    {index < breadcrumbItems.length - 1 && (
                                        <motion.span
                                            className="text-gray-600 text-xs select-none"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 1.8 + index * 0.1 }}
                                        >
                                            /
                                        </motion.span>
                                    )}
                                </motion.div>
                            ))}
                        </motion.nav>
                    </div>
                </motion.div>
            )}
        </motion.section>
    );
}
