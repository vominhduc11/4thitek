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
    section: 'details' | 'videos' | 'specifications' | 'warranty';
}

interface ProductHeroProps {
    product: Product;
    relatedProducts?: Product[];
    breadcrumbItems?: BreadcrumbItem[];
    activeBreadcrumb?: string;
    onBreadcrumbClick?: (item: BreadcrumbItem) => void;
}

const PRODUCT_HERO_VIDEO = '/videos/hero-product-tech-road-loop.mp4';

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
            className="relative flex min-h-[58vh] items-start justify-center overflow-visible sm:min-h-[75vh] md:min-h-[85vh] md:items-start lg:min-h-screen lg:items-start xl:min-h-screen"
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
                    <source src={PRODUCT_HERO_VIDEO} type="video/mp4" />
                </video>

                {/* Mobile gradient background */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(41,171,226,0.24),_transparent_45%),linear-gradient(180deg,_#07111A_0%,_#08131D_55%,_#03070d_100%)] sm:hidden" />

                {/* Fallback gradient (desktop) */}
                <div className="absolute inset-0 hidden sm:block bg-[linear-gradient(135deg,rgba(41,171,226,0.14),rgba(0,113,188,0.1),rgba(3,7,13,0.97))]" />

                {/* Dark overlay */}
                <div className="absolute inset-0 bg-[rgba(3,10,18,0.46)]" />

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

            {/* Main content */}
            <div className="relative z-10 mx-auto w-full max-w-5xl min-[1400px]:max-w-6xl 2xl:max-w-[1300px] 3xl:max-w-[1600px] px-4 text-center pt-32 pb-14 xs:pt-36 sm:pb-32 md:pt-56 md:pb-64 lg:pt-28 lg:pb-28 xl:pt-24 xl:pb-48 2xl:pt-28 2xl:pb-56 3xl:pt-36 3xl:pb-64">
                <div className="flex flex-col items-center gap-6 md:gap-10 3xl:gap-16">
                    {/* Title */}
                    <div className="flex flex-col items-center gap-3 md:gap-4">
                        <span className="brand-eyebrow rounded-full border border-[rgba(41,171,226,0.22)] bg-[rgba(7,17,27,0.58)] px-4 py-2 text-[11px] tracking-[0.22em] text-[rgba(223,245,252,0.74)] shadow-[0_10px_26px_rgba(1,8,15,0.18)] backdrop-blur-md">
                            {t('products.detail.productLabel')}
                        </span>
                        <AnimatePresence mode="wait">
                            <motion.h1
                                key={product.id + '-title'}
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{ duration: 0.4, ease: 'easeOut' }}
                                className="max-w-2xl px-4 text-[1.95rem] font-extrabold leading-[1.05] text-white [text-shadow:0_10px_24px_rgba(1,8,15,0.45)] sm:text-3xl md:max-w-3xl md:text-4xl lg:max-w-4xl lg:text-[3.15rem] xl:text-[3.55rem] 2xl:max-w-5xl 2xl:text-[4rem] 3xl:max-w-6xl 3xl:text-[5rem] tracking-tight"
                            >
                                {product.name}
                            </motion.h1>
                        </AnimatePresence>
                    </div>

                    {/* Product image + Action buttons side by side on lg+ */}
                    <div className="flex w-full flex-col items-center justify-center gap-5 lg:flex-row lg:items-center lg:gap-16 xl:gap-24 min-[1400px]:gap-28 3xl:gap-40">
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
                        <div className="relative mx-auto h-48 w-full max-w-[260px] flex-shrink-0 xs:h-52 xs:max-w-[280px] sm:h-64 sm:max-w-sm md:h-72 md:max-w-md lg:mx-0 lg:h-80 lg:max-w-lg xl:h-96 xl:max-w-xl min-[1400px]:h-[440px] min-[1400px]:max-w-[580px] 3xl:h-[600px] 3xl:max-w-3xl">
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
                        <div className="flex w-full max-w-[340px] items-center justify-center gap-3 lg:hidden sm:max-w-sm">
                            <motion.button
                                onClick={handleShuffleProduct}
                                disabled={isShuffling}
                                className={`flex h-11 w-11 items-center justify-center rounded-full border border-[var(--brand-border)] bg-[rgba(7,17,27,0.62)] backdrop-blur-sm shadow-lg ${isShuffling ? 'cursor-not-allowed opacity-60' : ''}`}
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
                                className="flex flex-1 items-center justify-center gap-2 rounded-full border border-[rgba(41,171,226,0.3)] bg-[rgba(41,171,226,0.16)] px-5 py-3 text-[11px] font-bold uppercase tracking-[0.12em] text-white shadow-[0_14px_24px_rgba(1,8,15,0.28)] active:bg-[rgba(41,171,226,0.24)] xs:text-xs"
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
            <div id="hero-nav-sentinel" className="pointer-events-none absolute inset-x-0 bottom-12 h-px md:bottom-28 lg:bottom-36" />

            {breadcrumbItems.length > 0 && (
                <div className="hidden md:block">
                    <motion.div
                        id="hero-breadcrumb"
                        className="absolute bottom-36 left-0 right-0 z-40 lg:bottom-56 xl:bottom-44 2xl:bottom-52 3xl:bottom-56"
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.8 }}
                    >
                        <div className="relative mx-auto max-w-[1800px] 3xl:max-w-[2400px] px-4">
                            <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 -translate-y-1/2">
                                <motion.div
                                    className="absolute left-6 h-px"
                                    initial={{ scaleX: 0, opacity: 0 }}
                                    animate={{ scaleX: 1, opacity: 1 }}
                                    transition={{ duration: 1.1, ease: 'easeOut', delay: 1.15 }}
                                    style={{
                                        width: 'calc(50% - clamp(180px, 16vw, 320px))',
                                        background:
                                            'linear-gradient(90deg, rgba(41,171,226,0), rgba(41,171,226,0.12), rgba(143,219,255,0.34))',
                                        boxShadow: '0 0 18px rgba(41, 171, 226, 0.16)',
                                        transformOrigin: 'right center'
                                    }}
                                />
                                <motion.div
                                    className="absolute right-6 h-px"
                                    initial={{ scaleX: 0, opacity: 0 }}
                                    animate={{ scaleX: 1, opacity: 1 }}
                                    transition={{ duration: 1.1, ease: 'easeOut', delay: 1.15 }}
                                    style={{
                                        width: 'calc(50% - clamp(180px, 16vw, 320px))',
                                        background:
                                            'linear-gradient(90deg, rgba(143,219,255,0.34), rgba(41,171,226,0.12), rgba(41,171,226,0))',
                                        boxShadow: '0 0 18px rgba(41, 171, 226, 0.16)',
                                        transformOrigin: 'left center'
                                    }}
                                />
                            </div>
                            <motion.nav
                                className="relative z-20 flex items-center justify-center gap-1 md:gap-2 3xl:gap-6 [text-shadow:0_0_18px_rgba(4,10,18,0.85)]"
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
                                                    : 'text-[rgba(223,245,252,0.86)] hover:text-white'
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
