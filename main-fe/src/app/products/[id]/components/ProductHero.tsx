'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CiShuffle } from 'react-icons/ci';
import { FiHeadphones } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import { buildProductPath } from '@/lib/slug';
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
                <FiHeadphones className="h-20 w-20 text-[var(--text-muted)] md:h-28 md:w-28 xl:h-36 xl:w-36" />
            </div>
        );
    }

    return (
        <div className={className}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--brand-blue)] border-t-transparent" />
                </div>
            )}
            <Image
                src={src}
                alt={alt}
                width={800}
                height={800}
                className={`w-full h-full object-contain transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                    setImageError(true);
                    setIsLoading(false);
                }}
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
        router.push(buildProductPath(randomProduct.id, randomProduct.name));
    };

    return (
        <motion.section
            className="relative flex min-h-[65vh] items-start justify-center overflow-visible sm:min-h-[75vh] md:min-h-[85vh] md:items-start lg:min-h-screen lg:items-center xl:min-h-screen"
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
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(41,171,226,0.24),_transparent_45%),linear-gradient(180deg,_#07111A_0%,_#08131D_55%,_#03070d_100%)] sm:hidden" />

                {/* Fallback gradient (desktop) */}
                <div className="absolute inset-0 hidden sm:block bg-[linear-gradient(135deg,rgba(41,171,226,0.18),rgba(0,113,188,0.14),rgba(3,7,13,0.96))]" />

                {/* Dark overlay */}
                <div className="absolute inset-0 bg-black/30" />

                {/* Edge gradient vignettes — simplified (2 divs not 10) */}
                <div className="absolute inset-x-0 top-0 z-10 h-40 bg-gradient-to-b from-black to-transparent" />
                <div className="absolute inset-x-0 bottom-0 z-10 h-56 bg-gradient-to-t from-[#07111A] to-[#07111A]/0 md:h-80 lg:h-[420px] xl:h-[500px] 3xl:h-[600px]" />
                <div
                    className="absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-black to-transparent"
                    style={{ clipPath: 'ellipse(100% 70% at 0% 50%)' }}
                />
                <div
                    className="absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-black to-transparent"
                    style={{ clipPath: 'ellipse(100% 70% at 100% 50%)' }}
                />
            </div>

            {/* Vertical "PRODUCT" label — left side, desktop only */}
            <div className="absolute left-4 top-1/2 z-30 hidden -translate-y-1/2 sm:block md:left-8 xl:left-12 3xl:left-32">
                <div
                    className="text-xs font-black uppercase tracking-[0.3em] text-white/50 md:text-sm lg:text-base 3xl:text-xl"
                    style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
                >
                    {t('products.detail.productLabel')}
                </div>
            </div>

            {/* Main content */}
            <div className="relative z-10 mx-auto w-full max-w-5xl min-[1400px]:max-w-6xl 2xl:max-w-[1300px] 3xl:max-w-[1600px] px-4 text-center pt-40 pb-8 sm:pb-32 md:pt-56 md:pb-64 lg:pt-0 lg:pb-0 xl:pb-52 2xl:pb-60 3xl:pb-64">
                <div className="flex flex-col items-center gap-6 md:gap-10 3xl:gap-16">
                    {/* Title */}
                    <AnimatePresence mode="wait">
                        <motion.h1
                            key={product.id + '-title'}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                            className="max-w-2xl 2xl:max-w-3xl 3xl:max-w-6xl px-4 text-2xl font-extrabold leading-tight text-white sm:text-3xl md:text-3xl lg:text-3xl xl:text-4xl 2xl:text-[2.75rem] 3xl:text-6xl tracking-tight"
                        >
                            {product.name}
                        </motion.h1>
                    </AnimatePresence>

                    {/* Product image + Action buttons side by side on lg+ */}
                    <div className="flex flex-col lg:flex-row items-center justify-center gap-6 lg:gap-16 xl:gap-24 min-[1400px]:gap-28 3xl:gap-40 w-full">
                        {/* Shuffle button - Left side on lg+ */}
                        <div className="hidden lg:block w-40 xl:w-48 flex-shrink-0 text-right">
                            <motion.button
                                onClick={handleShuffleProduct}
                                disabled={isShuffling}
                                className={`inline-flex h-14 w-14 items-center justify-center rounded-full border border-[var(--brand-border)] bg-[rgba(7,17,27,0.62)] backdrop-blur-md transition-all duration-300 hover:border-[var(--brand-border-strong)] hover:bg-[rgba(41,171,226,0.12)] hover:shadow-[0_0_30px_rgba(0,113,188,0.2)] 3xl:h-20 3xl:w-20 ${isShuffling ? 'cursor-not-allowed opacity-40' : ''}`}
                                title={t('products.detail.viewOtherProducts')}
                                whileHover={{ scale: 1.1, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {isShuffling ? (
                                    <div className="h-5 w-5 rounded-full border-2 border-[var(--brand-blue)] border-t-transparent animate-spin 3xl:h-8 3xl:w-8 3xl:border-4" />
                                ) : (
                                    <CiShuffle className="pointer-events-none h-6 w-6 text-white/80 transition-colors group-hover:text-[var(--brand-blue)] 3xl:h-10 3xl:w-10" />
                                )}
                            </motion.button>
                        </div>

                        {/* Product image */}
                        <div className="relative mx-auto lg:mx-0 h-48 w-full max-w-[280px] sm:h-64 sm:max-w-sm md:h-72 md:max-w-md lg:h-80 lg:max-w-lg xl:h-96 xl:max-w-xl min-[1400px]:h-[440px] min-[1400px]:max-w-[580px] 3xl:h-[600px] 3xl:max-w-3xl flex-shrink-0">
                            {/* Mobile decorative glow behind image */}
                            <div className="absolute inset-0 rounded-full bg-[rgba(41,171,226,0.12)] blur-[80px] lg:hidden" />

                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={product.id + '-image'}
                                    className="h-full w-full flex items-center justify-center"
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 1.05, y: -20 }}
                                    transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
                                >
                                    <ProductImageWithFallback
                                        src={product.images?.[0]?.url || ''}
                                        alt={product.name}
                                        className="relative h-full w-full drop-shadow-[0_20px_60px_rgba(0,0,0,0.6)] 3xl:drop-shadow-[0_40px_100px_rgba(0,0,0,0.7)]"
                                    />
                                </motion.div>
                            </AnimatePresence>
                        </div>

                        {/* Find retailer button - Right side on lg+ */}
                        <div className="hidden lg:block w-40 xl:w-48 flex-shrink-0 text-left">
                            <motion.button
                                onClick={handleFindRetailer}
                                className="inline-flex items-center gap-3 rounded-full border border-[var(--brand-border-strong)] bg-[rgba(41,171,226,0.08)] px-8 py-4 text-sm font-bold uppercase tracking-widest text-white backdrop-blur-md transition-all duration-300 hover:border-[var(--brand-blue)] hover:bg-[rgba(41,171,226,0.14)] hover:shadow-[0_0_40px_rgba(0,113,188,0.22)] 3xl:gap-5 3xl:px-12 3xl:py-6 3xl:text-xl"
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <span className="whitespace-nowrap">{t('products.detail.findRetailer')}</span>
                                <svg
                                    className="h-4 w-4 text-[var(--brand-blue)] 3xl:h-6 3xl:w-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                                    />
                                </svg>
                            </motion.button>
                        </div>

                        {/* Mobile Action buttons (shown only on < lg) */}
                        <div className="flex lg:hidden items-center justify-center w-full max-w-xs sm:max-w-sm gap-3">
                            <motion.button
                                onClick={handleShuffleProduct}
                                disabled={isShuffling}
                                className={`flex h-12 w-12 items-center justify-center rounded-full border border-[var(--brand-border)] bg-[rgba(7,17,27,0.62)] backdrop-blur-sm shadow-lg ${isShuffling ? 'cursor-not-allowed opacity-60' : ''}`}
                                whileTap={{ scale: 0.9 }}
                            >
                                {isShuffling ? (
                                    <div className="h-4 w-4 rounded-full border-2 border-[var(--brand-blue)] border-t-transparent animate-spin" />
                                ) : (
                                    <CiShuffle className="h-5 w-5 text-white/90" />
                                )}
                            </motion.button>

                            <motion.button
                                onClick={handleFindRetailer}
                                className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[var(--brand-border-strong)] bg-[rgba(41,171,226,0.1)] px-6 py-3.5 text-xs font-bold uppercase tracking-[0.15em] text-white shadow-lg active:bg-[rgba(41,171,226,0.18)]"
                                whileTap={{ scale: 0.98 }}
                            >
                                <span className="whitespace-nowrap">{t('products.detail.findRetailer')}</span>
                                <svg
                                    className="h-3.5 w-3.5 text-[var(--brand-blue)]"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                                    />
                                </svg>
                            </motion.button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hero breadcrumb — bottom of hero, md+ only */}
            {breadcrumbItems.length > 0 && (
                <div className="hidden md:block">
                    <motion.div
                        id="hero-breadcrumb"
                        className="absolute bottom-36 left-0 right-0 z-20 lg:bottom-56 xl:bottom-44 2xl:bottom-52 3xl:bottom-56"
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.8 }}
                    >
                        <div className="relative mx-auto max-w-[1800px] 3xl:max-w-[2400px] px-4">
                            {/* Left decorative line */}
                            <motion.div
                                className="absolute top-1/2 left-4 h-px"
                                initial={{ scaleX: 0, opacity: 0 }}
                                animate={{ scaleX: 1, opacity: 1 }}
                                transition={{ duration: 1.5, ease: 'easeOut', delay: 1.2 }}
                                style={{
                                    width: 'calc(50% - clamp(200px, 30vw, 1200px))',
                                    background: 'linear-gradient(to right, transparent, rgba(41,171,226,0.6))',
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
                                    width: 'calc(50% - clamp(200px, 30vw, 1200px))',
                                    background: 'linear-gradient(to left, transparent, rgba(41,171,226,0.6))',
                                    transformOrigin: 'left center'
                                }}
                            />
                            <motion.nav
                                className="relative z-20 flex items-center justify-center gap-1 md:gap-2 3xl:gap-6"
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
                                            className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-200 md:px-4 md:py-2 md:text-base 3xl:text-2xl ${
                                                activeBreadcrumb === item.label
                                                    ? 'text-[var(--brand-blue)]'
                                                    : 'text-[var(--text-secondary)] hover:text-white'
                                            }`}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            {item.label}
                                        </motion.button>
                                        {index < breadcrumbItems.length - 1 && (
                                            <motion.span
                                                className="select-none text-xs text-[var(--text-muted)] 3xl:text-xl"
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
                </div>
            )}
        </motion.section>
    );
}
