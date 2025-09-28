'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CiShuffle } from 'react-icons/ci';
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

    if (imageError) {
        return (
            <div className={`${className} flex flex-col items-center justify-center`}>
                <div className="text-6xl md:text-8xl opacity-70">🎧</div>
            </div>
        );
    }

    return (
        <div className={className}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}
            <Image
                src={src}
                alt={alt}
                width={400}
                height={400}
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
    relatedProducts?: Product[]; // Related products
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
    const [, setVideoLoaded] = useState(false);
    const [, setVideoError] = useState(false);
    const [isShuffling, setIsShuffling] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const router = useRouter();

    const handleFindRetailer = () => {
        router.push('/reseller_infomation');
    };

    // Create smooth sticky breadcrumb for md+ breakpoints
    useEffect(() => {
        const initStickyBreadcrumb = () => {

            const heroBreadcrumb = document.getElementById('hero-breadcrumb');
            if (!heroBreadcrumb) {
                return;
            }
            if (!breadcrumbItems?.length) {
                // Fallback breadcrumb items are handled in createStickyElement
                return;
            }

            let stickyBreadcrumb: HTMLElement | null = null;
            let isVisible = false;

            const createStickyElement = () => {

                // Remove existing sticky breadcrumb
                const existing = document.getElementById('sticky-breadcrumb-clone');
                if (existing) existing.remove();

                // Create new sticky breadcrumb
                stickyBreadcrumb = document.createElement('div');
                stickyBreadcrumb.id = 'sticky-breadcrumb-clone';
                // Use explicit classes for better compatibility
                const baseClasses = [
                    'fixed', 'top-16', 'right-0', 'z-[300]', 'py-4',
                    'bg-black/90', 'backdrop-blur-md', 'border-b', 'border-gray-700/30',
                    'transition-all', 'duration-300', 'ease-out'
                ];

                // Add responsive left positioning based on current window width
                if (window.innerWidth >= 768) { // md and above
                    baseClasses.push('left-20'); // Use left-20 for all md+ breakpoints
                } else {
                    baseClasses.push('left-16'); // Use left-16 for smaller screens
                }

                stickyBreadcrumb.className = baseClasses.join(' ');


                // Set initial state using style properties
                stickyBreadcrumb.style.opacity = '0';
                stickyBreadcrumb.style.transform = 'translateY(-10px)';

                // Create content container
                const container = document.createElement('div');
                container.className = 'container mx-auto max-w-8xl px-4';

                const nav = document.createElement('nav');
                nav.className = 'flex justify-center items-center space-x-4 md:space-x-6 lg:space-x-8 xl:space-x-10 2xl:space-x-12 3xl:space-x-14 4xl:space-x-16 text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-xl 3xl:text-3xl 4xl:text-4xl';

                // Use breadcrumbItems or fallback
                const itemsToUse = breadcrumbItems?.length ? breadcrumbItems : [
                    { label: 'PRODUCT DETAILS', section: 'details' },
                    { label: 'PRODUCT VIDEOS', section: 'videos' },
                    { label: 'SPECIFICATIONS', section: 'specifications' },
                    { label: 'WARRANTY', section: 'warranty' }
                ];


                // Create breadcrumb buttons
                itemsToUse.forEach((item, index) => {
                    const buttonWrapper = document.createElement('div');
                    buttonWrapper.className = 'flex items-center space-x-1 md:space-x-2 lg:space-x-3 xl:space-x-4 2xl:space-x-5 3xl:space-x-6 4xl:space-x-7';

                    const button = document.createElement('button');
                    const isActive = (activeBreadcrumb || 'PRODUCT DETAILS') === item.label;

                    button.className = `font-medium transition-all duration-200 px-2 py-1 md:px-3 md:py-1.5 lg:px-4 lg:py-2 xl:px-5 xl:py-2.5 2xl:px-6 2xl:py-3 3xl:px-7 3xl:py-3.5 4xl:px-8 4xl:py-4 rounded-lg text-xs md:text-sm lg:text-base xl:text-lg 2xl:text-lg 3xl:text-2xl 4xl:text-3xl hover:bg-white/10 ${
                        isActive
                            ? 'text-blue-400 bg-blue-400/10'
                            : 'text-gray-300 hover:text-white'
                    }`;
                    button.textContent = item.label;
                    button.setAttribute('data-label', item.label);

                    // Add click handler
                    button.addEventListener('click', () => {
                        if (onBreadcrumbClick) {
                            onBreadcrumbClick(item);
                        }
                        updateStickyActiveState(item.label);

                        // Dispatch custom event as fallback
                        window.dispatchEvent(new CustomEvent('breadcrumbNavigation', {
                            detail: { label: item.label, section: item.section }
                        }));
                    });

                    buttonWrapper.appendChild(button);

                    // Add separator
                    if (index < itemsToUse.length - 1) {
                        const separator = document.createElement('span');
                        separator.className = 'text-gray-500 text-sm';
                        separator.textContent = '/';
                        buttonWrapper.appendChild(separator);
                    }

                    nav.appendChild(buttonWrapper);
                });

                container.appendChild(nav);
                stickyBreadcrumb.appendChild(container);
                document.body.appendChild(stickyBreadcrumb);
            };

            const updateStickyActiveState = (activeLabel: string) => {
                if (!stickyBreadcrumb) return;

                const buttons = stickyBreadcrumb.querySelectorAll('button');
                buttons.forEach(btn => {
                    const label = btn.getAttribute('data-label');
                    const isActive = label === activeLabel;

                    btn.className = `font-medium transition-all duration-200 px-2 py-1 md:px-3 md:py-1.5 lg:px-4 lg:py-2 xl:px-5 xl:py-2.5 2xl:px-6 2xl:py-3 3xl:px-7 3xl:py-3.5 4xl:px-8 4xl:py-4 rounded-lg text-xs md:text-sm lg:text-base xl:text-lg 2xl:text-lg 3xl:text-2xl 4xl:text-3xl hover:bg-white/10 ${
                        isActive
                            ? 'text-blue-400 bg-blue-400/10'
                            : 'text-gray-300 hover:text-white'
                    }`;
                });
            };

            const handleScroll = () => {
                // Only run on md and lg breakpoints (768px - 1279px)
                if (window.innerWidth < 768 || window.innerWidth >= 1280) {
                    return;
                }

                const heroBreadcrumbRect = heroBreadcrumb.getBoundingClientRect();
                const shouldShow = heroBreadcrumbRect.bottom < 0;

                if (shouldShow && !isVisible) {
                    // Show sticky breadcrumb
                    if (!stickyBreadcrumb) createStickyElement();

                    requestAnimationFrame(() => {
                        if (stickyBreadcrumb) {
                            stickyBreadcrumb.style.opacity = '1';
                            stickyBreadcrumb.style.transform = 'translateY(0px)';
                            isVisible = true;
                        }
                    });
                } else if (!shouldShow && isVisible) {
                    // Hide sticky breadcrumb
                    if (stickyBreadcrumb) {
                        stickyBreadcrumb.style.opacity = '0';
                        stickyBreadcrumb.style.transform = 'translateY(-10px)';
                        isVisible = false;
                    }
                }
            };

            const handleResize = () => {
                if (window.innerWidth < 768 || window.innerWidth >= 1280) {
                    // Remove sticky breadcrumb on mobile and xl+ breakpoints
                    if (stickyBreadcrumb) {
                        stickyBreadcrumb.remove();
                        stickyBreadcrumb = null;
                        isVisible = false;
                    }
                }
            };

            // Add event listeners
            window.addEventListener('scroll', handleScroll, { passive: true });
            window.addEventListener('resize', handleResize, { passive: true });

            // Initial check
            handleScroll();

            // Store update functions for external access
            Object.assign(window, {
                updateStickyBreadcrumb: updateStickyActiveState,
                recreateStickyBreadcrumb: createStickyElement
            });

            return () => {
                window.removeEventListener('scroll', handleScroll);
                window.removeEventListener('resize', handleResize);
                if (stickyBreadcrumb) {
                    stickyBreadcrumb.remove();
                }
                delete (window as unknown as Record<string, unknown>)['updateStickyBreadcrumb'];
                delete (window as unknown as Record<string, unknown>)['recreateStickyBreadcrumb'];
            };
        };

        return initStickyBreadcrumb();
    }, [breadcrumbItems, activeBreadcrumb, onBreadcrumbClick]);

    // Update sticky breadcrumb when activeBreadcrumb changes
    useEffect(() => {
        const updateFn = (window as unknown as Record<string, unknown>)['updateStickyBreadcrumb'];
        if (updateFn && typeof updateFn === 'function' && activeBreadcrumb) {
            (updateFn as (label: string) => void)(activeBreadcrumb);
        }
    }, [activeBreadcrumb]);

    // Recreate sticky breadcrumb when critical props change
    useEffect(() => {
        const recreateFn = (window as unknown as Record<string, unknown>)['recreateStickyBreadcrumb'];
        if (recreateFn && typeof recreateFn === 'function') {
            (recreateFn as () => void)();
        }
    }, [breadcrumbItems, onBreadcrumbClick]);


    const handleShuffleProduct = async () => {
        if (isShuffling) return;

        if (relatedProducts.length === 0) {
            return;
        }

        setIsShuffling(true);

        // Use deterministic approach to avoid hydration mismatch
        // Use current time + product id as seed for better randomness during interaction
        const seed = new Date().getTime() + product.id.charCodeAt(0);
        const randomIndex = seed % relatedProducts.length;
        const randomProduct = relatedProducts[randomIndex];

        // Small delay to show loading state and smooth transition
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Navigate to the random product
        router.push(`/products/${randomProduct.id}`);
    };

    return (
        <motion.section
            id="product-videos"
            className="relative h-[60vh] sm:h-[70vh] md:h-[80vh] lg:h-[90vh] xl:h-[110vh] 2xl:h-[120vh] 3xl:h-[130vh] 4xl:h-[140vh] flex items-center justify-center overflow-visible"
            initial="hidden"
            animate="hidden"
            whileHover="visible"
            transition={{ staggerChildren: 0.1 }}
        >
            {/* Video Background */}
            <div className="absolute inset-0 z-0">
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover"
                    onLoadedData={() => {
                        setVideoLoaded(true);
                        if (videoRef.current && videoRef.current.paused) {
                            videoRef.current.play().catch(() => {});
                        }
                    }}
                    onError={() => {
                        setVideoError(true);
                    }}
                    onCanPlay={() => {
                        if (videoRef.current) {
                            videoRef.current.play().catch(() => {});
                        }
                    }}
                >
                    <source src="/videos/futuristic-background-2022-08-04-19-57-56-utc.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>

                {/* Fallback background image */}
                <div
                    className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-black"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)'
                    }}
                ></div>

                {/* Dark overlay for better text readability */}
                <div className="absolute inset-0 bg-black/30"></div>

                {/* Top gradient overlay */}
                <div className="absolute top-0 left-0 right-0 h-32 sm:h-48 md:h-64 lg:h-96 bg-gradient-to-b from-black via-black/95 via-black/85 via-black/75 via-black/65 via-black/55 via-black/45 via-black/35 via-black/25 via-black/15 to-transparent z-10"></div>

                {/* Bottom gradient overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-48 sm:h-64 md:h-80 lg:h-[600px] bg-gradient-to-t from-black via-black/95 via-black/85 via-black/75 via-black/65 via-black/55 via-black/45 via-black/35 via-black/25 via-black/15 to-transparent z-10"></div>

                {/* Left gradient overlay */}
                <div
                    className="absolute top-0 bottom-0 left-0 w-16 sm:w-20 md:w-24 lg:w-32 bg-gradient-to-r from-black via-black/95 via-black/85 via-black/75 via-black/65 via-black/55 via-black/45 via-black/35 via-black/25 via-black/15 to-transparent z-10"
                    style={{ clipPath: 'ellipse(100% 70% at 0% 50%)' }}
                ></div>

                {/* Right gradient overlay */}
                <div
                    className="absolute top-0 bottom-0 right-0 w-16 sm:w-20 md:w-24 lg:w-32 bg-gradient-to-l from-black via-black/95 via-black/85 via-black/75 via-black/65 via-black/55 via-black/45 via-black/35 via-black/25 via-black/15 to-transparent z-10"
                    style={{ clipPath: 'ellipse(100% 70% at 100% 50%)' }}
                ></div>
            </div>

            {/* Side Navigation - Responsive Vertical Text */}
            <div className="absolute left-2 sm:left-4 md:left-8 lg:left-16 xl:left-20 top-1/2 sm:top-2/5 md:top-2/5 lg:top-2/5 xl:top-2/5 transform -translate-y-1/2 z-30 hidden sm:block">
                <div
                    className="text-white font-bold tracking-[0.2em] sm:tracking-[0.25em] md:tracking-[0.3em] text-xs sm:text-base sm:font-black md:text-2xl md:font-black lg:text-3xl lg:font-black xl:text-4xl xl:font-black opacity-70 hover:opacity-100 transition-opacity duration-300"
                    style={{
                        writingMode: 'vertical-rl',
                        textOrientation: 'mixed'
                    }}
                >
                    PRODUCT
                </div>
            </div>

            {/* Main Content Area with Product Image */}
            <div className="relative z-10 container mx-auto max-w-8xl px-4 text-center -mt-16 sm:-mt-24 md:-mt-28 lg:-mt-56">
                {/* Product Image with Navigation */}
                <div className="flex items-center justify-center h-full px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 items-center w-full max-w-3xl xl:max-w-5xl lg:gap-1 xl:gap-8">
                        {/* Left Navigation - Desktop only */}
                        <div className="hidden lg:flex items-center justify-center">
                            <motion.button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleShuffleProduct();
                                }}
                                className={`bg-white/10 hover:bg-white hover:text-black text-white px-4 py-2 lg:px-6 lg:py-3 xl:px-6 xl:py-3 rounded-full font-medium tracking-wide flex items-center gap-2 backdrop-blur-sm border border-white/20 text-xs xl:text-sm group/shuffle transition-all duration-200 ${isShuffling ? 'opacity-70 cursor-not-allowed' : ''}`}
                                title={isShuffling ? t('common.loading') : t('products.detail.viewOtherProducts')}
                                disabled={isShuffling}
                                initial={{ opacity: 0, x: -20, scale: 0.8 }}
                                animate={{
                                    opacity: 1,
                                    x: 0,
                                    scale: 1,
                                    transition: { duration: 0.3, ease: 'easeOut' }
                                }}
                                whileHover={{ scale: 1.1 }}
                                variants={{
                                    hidden: { opacity: 0, x: -20, scale: 0.8 },
                                    visible: {
                                        opacity: 1,
                                        x: 0,
                                        scale: 1,
                                        transition: { duration: 0.15, ease: 'easeOut', delay: 0.02 }
                                    }
                                }}
                            >
                                {isShuffling ? (
                                    <div className="w-4 h-4 xl:w-5 xl:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <CiShuffle className="w-4 h-4 xl:w-5 xl:h-5 text-white group-hover/shuffle:text-gray-800 pointer-events-none transition-colors duration-300" />
                                )}
                                {isShuffling ? 'LOADING...' : 'SHUFFLE'}
                            </motion.button>
                        </div>

                        {/* Product Image - Centered */}
                        <div className="flex flex-col justify-center items-center relative w-full">
                            {/* Product Title with Animation */}
                            <div className="text-center mb-4 sm:mb-6 md:mb-8 lg:mb-16">
                                <AnimatePresence mode="wait">
                                    <motion.h1
                                        key={product.id + '-title'}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{
                                            duration: 0.25,
                                            ease: [0.4, 0, 0.2, 1]
                                        }}
                                        className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl font-bold text-white leading-tight xs:leading-tight sm:leading-tight md:leading-tight lg:leading-tight xl:leading-tight max-w-[280px] xs:max-w-[320px] sm:max-w-[400px] md:max-w-[480px] lg:max-w-[560px] xl:max-w-[640px] 2xl:max-w-[720px] px-2 xs:px-3 sm:px-4 text-center line-clamp-3"
                                    >
                                        {product.name}
                                    </motion.h1>
                                </AnimatePresence>
                            </div>

                            <div className="relative w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl 2xl:max-w-3xl 3xl:max-w-4xl 4xl:max-w-5xl mx-auto h-40 sm:h-48 md:h-64 lg:h-72 xl:h-80 2xl:h-[500px] 3xl:h-[600px] 4xl:h-[700px] -mt-4 sm:-mt-8 md:-mt-8 lg:-mt-16 xl:-mt-24 2xl:-mt-32 3xl:-mt-40 4xl:-mt-48">
                                <div className="relative w-full h-full flex items-center justify-center">
                                    {/* Product Image with Animation */}
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={product.id + '-image-container'}
                                            className="w-full h-full flex items-center justify-center"
                                            initial={{
                                                opacity: 0,
                                                scale: 0.9
                                            }}
                                            animate={{
                                                opacity: 1,
                                                scale: 1
                                            }}
                                            exit={{
                                                opacity: 0,
                                                scale: 1.05
                                            }}
                                            transition={{
                                                duration: 0.3,
                                                ease: [0.4, 0, 0.2, 1]
                                            }}
                                        >
                                            <ProductImageWithFallback
                                                src={product.images?.[0]?.url || "/products/product1.png"}
                                                alt={product.name}
                                                className="w-full h-full object-contain max-w-[240px] sm:max-w-[320px] md:max-w-[400px] lg:max-w-[480px] xl:max-w-[560px] 2xl:max-w-[720px] 3xl:max-w-[850px] 4xl:max-w-[1000px] max-h-[240px] sm:max-h-[320px] md:max-h-[400px] lg:max-h-[480px] xl:max-h-[560px] 2xl:max-h-[720px] 3xl:max-h-[850px] 4xl:max-h-[1000px]"
                                            />
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>

                        {/* Right Navigation - Desktop only */}
                        <div className="hidden lg:flex items-center justify-center">
                            <motion.button
                                onClick={handleFindRetailer}
                                className="bg-white/10 hover:bg-white hover:text-black text-white px-4 py-2 lg:px-6 lg:py-3 xl:px-6 xl:py-3 rounded-full font-medium tracking-wide flex items-center gap-2 backdrop-blur-sm border border-white/20 text-xs xl:text-sm"
                                initial={{ opacity: 0, x: 20, scale: 0.8 }}
                                animate={{
                                    opacity: 1,
                                    x: 0,
                                    scale: 1,
                                    transition: { duration: 0.3, ease: 'easeOut' }
                                }}
                                whileHover={{ scale: 1.05 }}
                                variants={{
                                    hidden: { opacity: 0, x: 20, scale: 0.8 },
                                    visible: {
                                        opacity: 1,
                                        x: 0,
                                        scale: 1,
                                        transition: { duration: 0.15, ease: 'easeOut', delay: 0.05 }
                                    }
                                }}
                            >
                                FIND RETAILER
                                <svg
                                    className="w-4 h-4 xl:w-5 xl:h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 4l8 8-8 8M4 12h16"
                                    />
                                </svg>
                            </motion.button>
                        </div>

                        {/* Action Buttons - Mobile and Tablet only */}
                        <motion.div
                            className="flex justify-center gap-4 -mt-2 md:-mt-3 lg:hidden landscape:-mt-6 landscape:md:-mt-10"
                            variants={{
                                hidden: { opacity: 0, y: 20 },
                                visible: {
                                    opacity: 1,
                                    y: 0,
                                    transition: {
                                        duration: 0.5,
                                        ease: 'easeOut',
                                        staggerChildren: 0.1,
                                        delayChildren: 0.3
                                    }
                                }
                            }}
                        >
                            <motion.button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    handleShuffleProduct();
                                }}
                                className={`w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-white/10 hover:bg-white rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 hover:scale-110 cursor-pointer group/shuffle transition-all duration-200 ${isShuffling ? 'opacity-70 cursor-not-allowed' : ''}`}
                                title={isShuffling ? t('common.loading') : t('products.detail.viewOtherProducts')}
                                disabled={isShuffling}
                                variants={{
                                    hidden: { opacity: 0, scale: 0.9 },
                                    visible: {
                                        opacity: 1,
                                        scale: 1,
                                        transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] }
                                    }
                                }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {isShuffling ? (
                                    <div className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <CiShuffle className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white group-hover/shuffle:text-gray-800 pointer-events-none transition-colors duration-300" />
                                )}
                            </motion.button>
                            <motion.button
                                onClick={handleFindRetailer}
                                className="bg-white/10 hover:bg-white hover:text-black text-white px-4 py-2 sm:px-6 sm:py-3 lg:px-8 lg:py-4 rounded-full font-medium tracking-wide flex items-center gap-2 backdrop-blur-sm border border-white/20 text-sm sm:text-base lg:text-lg"
                                variants={{
                                    hidden: { opacity: 0, scale: 0.9 },
                                    visible: {
                                        opacity: 1,
                                        scale: 1,
                                        transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] }
                                    }
                                }}
                                whileTap={{ scale: 0.95 }}
                            >
                                RETAILER
                                <svg
                                    className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 4l8 8-8 8M4 12h16"
                                    />
                                </svg>
                            </motion.button>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* Tablet & Desktop Breadcrumb Navigation - Bottom of Hero */}
            {breadcrumbItems && breadcrumbItems.length > 0 && (
                    <motion.div
                        className="absolute bottom-32 sm:bottom-56 md:bottom-40 lg:bottom-72 desktop:bottom-56 xl:bottom-[268px] 2xl:bottom-[350px] 3xl:bottom-[400px] 4xl:bottom-[450px] left-0 right-0 z-20 hidden md:block"
                        id="hero-breadcrumb"
                        initial={{ opacity: 0, y: 30, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                            duration: 1.2,
                            ease: 'easeOut',
                            delay: 0.8
                        }}
                    >
                        <div className="container mx-auto max-w-[1800px] px-4 relative">
                            {/* Left line segment with gradient - Single responsive line */}
                            <motion.div
                                className="absolute top-1/2 left-4 h-px z-5 hidden md:block"
                                initial={{ scaleX: 0, opacity: 0 }}
                                animate={{ scaleX: 1, opacity: 1 }}
                                transition={{
                                    duration: 1.5,
                                    ease: 'easeOut',
                                    delay: 1.2
                                }}
                                style={{
                                    width: 'calc(50% - clamp(300px, 35vw, 600px))',
                                    background: 'linear-gradient(to right, transparent, rgba(79, 200, 255, 0.6))',
                                    transformOrigin: 'right center'
                                }}
                            ></motion.div>

                            {/* Right line segment with gradient - Single responsive line */}
                            <motion.div
                                className="absolute top-1/2 right-4 h-px z-5 hidden md:block"
                                initial={{ scaleX: 0, opacity: 0 }}
                                animate={{ scaleX: 1, opacity: 1 }}
                                transition={{
                                    duration: 1.5,
                                    ease: 'easeOut',
                                    delay: 1.2
                                }}
                                style={{
                                    width: 'calc(50% - clamp(300px, 35vw, 600px))',
                                    background: 'linear-gradient(to left, transparent, rgba(79, 200, 255, 0.6))',
                                    transformOrigin: 'left center'
                                }}
                            ></motion.div>
                            <motion.nav
                                className="flex justify-center items-center space-x-2 sm:space-x-3 md:space-x-4 lg:space-x-6 xl:space-x-8 2xl:space-x-10 3xl:space-x-12 4xl:space-x-14 text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-xl 3xl:text-3xl 4xl:text-4xl relative z-20"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{
                                    duration: 0.8,
                                    ease: 'easeOut',
                                    delay: 1.4,
                                    staggerChildren: 0.15
                                }}
                            >
                                {breadcrumbItems.map((item, index) => (
                                    <motion.div
                                        key={item.label}
                                        className="flex items-center space-x-1 sm:space-x-1 md:space-x-2 lg:space-x-2 xl:space-x-3 2xl:space-x-4 3xl:space-x-5 4xl:space-x-6"
                                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        transition={{
                                            duration: 0.6,
                                            ease: 'easeOut',
                                            delay: 1.6 + index * 0.1
                                        }}
                                    >
                                        <motion.button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                if (onBreadcrumbClick) {
                                                    onBreadcrumbClick(item);
                                                }
                                            }}
                                            className={`font-medium relative transition-colors duration-300 px-2 py-1 md:px-3 md:py-2 lg:px-4 lg:py-2.5 xl:px-5 xl:py-3 2xl:px-6 2xl:py-3.5 3xl:px-7 3xl:py-4 4xl:px-8 4xl:py-4.5 text-center whitespace-nowrap text-xs md:text-sm lg:text-base xl:text-lg 2xl:text-lg 3xl:text-2xl 4xl:text-3xl ${
                                                activeBreadcrumb === item.label
                                                    ? 'text-blue-400'
                                                    : 'text-gray-400 hover:text-white'
                                            }`}
                                            whileHover={{
                                                scale: 1.05,
                                                transition: { duration: 0.2 }
                                            }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            {item.label}
                                        </motion.button>
                                        {index < breadcrumbItems.length - 1 && (
                                            <motion.span
                                                className="text-gray-500 relative text-xs md:text-sm lg:text-base xl:text-lg 2xl:text-lg 3xl:text-2xl 4xl:text-3xl"
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
