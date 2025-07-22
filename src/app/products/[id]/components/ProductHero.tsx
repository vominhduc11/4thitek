'use client';

import { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CiShuffle } from 'react-icons/ci';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
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
                    console.error('Product image failed to load:', src);
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
    const [, setVideoLoaded] = useState(false);
    const [, setVideoError] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const router = useRouter();

    const handleFindRetailer = () => {
        router.push('/reseller_infomation');
    };

    // Create sticky breadcrumb effect
    useEffect(() => {
        const createStickyBreadcrumb = () => {
            const heroBreadcrumb = document.getElementById('hero-breadcrumb');
            if (!heroBreadcrumb || window.innerWidth < 1024) return; // Only for desktop (lg+)

            let stickyBreadcrumb = document.getElementById('sticky-breadcrumb-clone');

            const handleScroll = () => {
                const heroBreadcrumbRect = heroBreadcrumb.getBoundingClientRect();
                const hasScrolledPast = heroBreadcrumbRect.bottom < 60; // Adjusted for better spacing

                if (hasScrolledPast && !stickyBreadcrumb) {
                    // Remove any existing sticky breadcrumb first
                    const existing = document.getElementById('sticky-breadcrumb-clone');
                    if (existing) existing.remove();
                    
                    // Create simplified sticky breadcrumb
                    stickyBreadcrumb = document.createElement('div');
                    stickyBreadcrumb.id = 'sticky-breadcrumb-clone';
                    stickyBreadcrumb.className = 'hidden lg:block fixed top-20 left-20 right-0 z-[100] py-3 bg-[#0a0f1a]/40 backdrop-blur-md border-b border-gray-700/20 transition-all duration-300 ease-out';
                    
                    // Initial state for animation (hidden)
                    stickyBreadcrumb.style.opacity = '0';
                    stickyBreadcrumb.style.transform = 'translateY(-20px)';
                    
                    // Create clean content structure
                    const containerDiv = document.createElement('div');
                    containerDiv.className = 'container mx-auto max-w-6xl lg:max-w-5xl px-4';
                    
                    const nav = document.createElement('nav');
                    nav.className = 'flex justify-center items-center space-x-6 text-sm relative z-20';
                    
                    // Create breadcrumb items with proper event listeners
                    console.log('📍 Creating sticky breadcrumb with items:', breadcrumbItems);
                    
                    if (!breadcrumbItems || breadcrumbItems.length === 0) {
                        console.warn('⚠️ No breadcrumb items available for sticky breadcrumb');
                        // Add fallback items
                        const fallbackItems = [
                            { label: 'PRODUCT DETAILS', section: 'details' },
                            { label: 'PRODUCT VIDEOS', section: 'videos' },
                            { label: 'SPECIFICATIONS', section: 'specifications' },
                            { label: 'WARRANTY', section: 'warranty' }
                        ];
                        breadcrumbItems = fallbackItems;
                    }
                    
                    breadcrumbItems.forEach((item, index) => {
                        const itemDiv = document.createElement('div');
                        itemDiv.className = 'flex items-center space-x-2';
                        
                        const button = document.createElement('button');
                        button.className = `font-medium transition-colors duration-200 px-3 py-2 text-center whitespace-nowrap ${
                            (activeBreadcrumb || 'PRODUCT DETAILS') === item.label
                                ? 'text-blue-400'
                                : 'text-gray-400 hover:text-white'
                        }`;
                        button.textContent = item.label;
                        
                        // Add independent navigation logic - always works
                        button.addEventListener('click', (e) => {
                            e.preventDefault();
                            console.log('🖱️ Sticky breadcrumb clicked:', item.label);
                            
                            // Direct navigation logic that doesn't depend on onBreadcrumbClick
                            const navigateToSection = (sectionType) => {
                                console.log('📍 Navigating to section:', sectionType);
                                
                                // Trigger the same navigation as the main page
                                // Try to find the main page's handleBreadcrumbClick function and call it
                                const event = new CustomEvent('breadcrumbNavigation', {
                                    detail: { label: item.label, section: item.section }
                                });
                                window.dispatchEvent(event);
                                
                                // Also manually trigger dropdown change for backup
                                const dropdown = document.querySelector('select[aria-label="Select section"]');
                                if (dropdown) {
                                    console.log('📍 Triggering dropdown change to:', item.label);
                                    dropdown.value = item.label;
                                    dropdown.dispatchEvent(new Event('change', { bubbles: true }));
                                }
                                
                                // Update sticky breadcrumb active state immediately
                                const stickyButtons = document.querySelectorAll('#sticky-breadcrumb-clone button');
                                stickyButtons.forEach(btn => {
                                    if (btn.textContent && btn.textContent.trim() === item.label.trim()) {
                                        btn.className = btn.className.replace('text-gray-400', 'text-blue-400');
                                    } else {
                                        btn.className = btn.className.replace('text-blue-400', 'text-gray-400');
                                    }
                                });
                            };
                            
                            navigateToSection(item.section);
                            
                            // Fallback: also try the original method if available
                            if (onBreadcrumbClick) {
                                try {
                                    onBreadcrumbClick(item);
                                } catch (error) {
                                    console.warn('📍 onBreadcrumbClick failed:', error);
                                }
                            }
                        });
                        
                        itemDiv.appendChild(button);
                        
                        // Add simple separator
                        if (index < breadcrumbItems.length - 1) {
                            const separator = document.createElement('span');
                            separator.className = 'text-gray-500 mx-1';
                            separator.textContent = '/';
                            itemDiv.appendChild(separator);
                        }
                        
                        nav.appendChild(itemDiv);
                    });
                    
                    containerDiv.appendChild(nav);
                    stickyBreadcrumb.appendChild(containerDiv);
                    
                    console.log('📍 Appending sticky breadcrumb to DOM:', stickyBreadcrumb);
                    document.body.appendChild(stickyBreadcrumb);
                    
                    // Trigger animation after a small delay
                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => {
                            stickyBreadcrumb!.style.opacity = '1';
                            stickyBreadcrumb!.style.transform = 'translateY(0)';
                        });
                    });
                } else if (!hasScrolledPast && stickyBreadcrumb) {
                    // Animate out before removing
                    stickyBreadcrumb.style.opacity = '0';
                    stickyBreadcrumb.style.transform = 'translateY(-20px)';
                    
                    // Remove after animation completes
                    setTimeout(() => {
                        if (stickyBreadcrumb) {
                            stickyBreadcrumb.remove();
                            stickyBreadcrumb = null;
                        }
                    }, 300);
                }
            };

            window.addEventListener('scroll', handleScroll);
            return () => {
                window.removeEventListener('scroll', handleScroll);
                if (stickyBreadcrumb) stickyBreadcrumb.remove();
            };
        };

        const cleanup = createStickyBreadcrumb();
        return cleanup;
    }, [breadcrumbItems, activeBreadcrumb, onBreadcrumbClick]);

    const handleShuffleProduct = () => {
        console.log('Related products:', relatedProducts);

        if (relatedProducts.length === 0) {
            console.log('No related products available');
            return;
        }

        // Use deterministic approach to avoid hydration mismatch
        // Use current time + product id as seed for better randomness during interaction
        const seed = new Date().getTime() + product.id.charCodeAt(0);
        const randomIndex = seed % relatedProducts.length;
        const randomProduct = relatedProducts[randomIndex];

        console.log('Switching to product:', randomProduct);

        // Navigate to the random product
        router.push(`/products/${randomProduct.id}`);
    };

    return (
        <motion.section
            id="product-videos"
            className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] lg:h-screen xl:min-h-screen flex items-center justify-center overflow-visible"
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
                        console.log('Video loaded successfully');
                        setVideoLoaded(true);
                        if (videoRef.current && videoRef.current.paused) {
                            videoRef.current.play().catch(console.error);
                        }
                    }}
                    onError={(e) => {
                        console.error('Video failed to load:', e);
                        setVideoError(true);
                    }}
                    onCanPlay={() => {
                        console.log('Video can play');
                        if (videoRef.current) {
                            videoRef.current.play().catch(console.error);
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
            <div className="absolute left-2 sm:left-4 md:left-8 lg:left-16 xl:left-20 top-1/2 transform -translate-y-1/2 z-30 hidden sm:block">
                <div 
                    className="text-white font-bold tracking-[0.2em] sm:tracking-[0.25em] md:tracking-[0.3em] text-xs sm:text-sm md:text-base lg:text-lg xl:text-2xl opacity-70 hover:opacity-100 transition-opacity duration-300"
                    style={{
                        writingMode: 'vertical-rl',
                        textOrientation: 'mixed'
                    }}
                >
                    PRODUCT
                </div>
            </div>

            {/* Main Content Area with Product Image */}
            <div className="relative z-10 container mx-auto px-4 text-center -mt-16 sm:-mt-24 md:-mt-28 lg:-mt-32">
                {/* Product Image with Navigation */}
                <div className="flex items-center justify-center h-full px-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3 items-center w-full max-w-5xl lg:max-w-4xl">
                        {/* Left Navigation - Shuffle Button - Hidden on mobile and tablet */}
                        <div className="hidden sm:flex md:hidden lg:flex justify-center lg:justify-end lg:pr-[90px]">
                            <motion.button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('Shuffle button clicked!');
                                    handleShuffleProduct();
                                }}
                                className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-white/10 hover:bg-white rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 hover:scale-110 cursor-pointer z-50 group/shuffle"
                                title={`View other related products`}
                                initial={{ opacity: 0, x: -20, scale: 0.8 }}
                                animate={{ 
                                    opacity: 0, 
                                    x: -20, 
                                    scale: 0.8,
                                    transition: { duration: 0.3, ease: "easeOut" }
                                }}
                                whileHover={{ scale: 1.1 }}
                                variants={{
                                    hidden: { opacity: 0, x: -20, scale: 0.8 },
                                    visible: { 
                                        opacity: 1, 
                                        x: 0, 
                                        scale: 1,
                                        transition: { duration: 0.4, ease: "easeOut", delay: 0.1 }
                                    }
                                }}
                            >
                                <CiShuffle className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white group-hover/shuffle:text-gray-800 pointer-events-none transition-colors duration-300" />
                            </motion.button>
                        </div>

                        {/* Product Image - Centered */}
                        <div className="flex flex-col justify-center items-center relative">
                            {/* Product Title with Animation */}
                            <div className="text-center mb-4 sm:mb-6 md:mb-8">
                                <AnimatePresence mode="wait">
                                    <motion.h1
                                        key={product.id + '-title'}
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 20 }}
                                        transition={{
                                            duration: 0.5,
                                            ease: [0.25, 0.1, 0.25, 1]
                                        }}
                                        className="text-xl sm:text-2xl md:text-2xl lg:text-3xl font-bold text-white max-w-[520px] px-4"
                                    >
                                        {product.name}
                                    </motion.h1>
                                </AnimatePresence>
                            </div>

                            <div className="relative w-full max-w-md h-48 sm:h-56 md:h-72 lg:h-80 xl:h-96 2xl:h-[500px] -mt-4 sm:-mt-8 md:-mt-8 lg:-mt-16 xl:-mt-24">
                                <div className="relative w-full h-full flex items-center justify-center">
                                    {/* Product Image with Animation */}
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={product.id + '-image-container'}
                                            className="w-full h-full flex items-center justify-center"
                                            initial={{
                                                opacity: 0,
                                                scale: 0.8,
                                                rotateY: -90
                                            }}
                                            animate={{
                                                opacity: 1,
                                                scale: 1,
                                                rotateY: 0
                                            }}
                                            exit={{
                                                opacity: 0,
                                                scale: 1.2,
                                                rotateY: 90
                                            }}
                                            transition={{
                                                duration: 0.6,
                                                ease: [0.25, 0.1, 0.25, 1],
                                                rotateY: {
                                                    duration: 0.6,
                                                    ease: 'easeInOut'
                                                }
                                            }}
                                        >
                                            <ProductImageWithFallback
                                                src="/products/product1.png"
                                                alt={product.name}
                                                className="w-full h-full object-contain max-w-[600px] max-h-[600px]"
                                            />
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>

                        {/* Right Navigation - Find Retailer Button - Hidden on mobile and tablet */}
                        <div className="hidden sm:flex md:hidden lg:flex justify-center lg:justify-start lg:pl-[90px]">
                            <motion.button
                                onClick={handleFindRetailer}
                                className="bg-white/10 hover:bg-white hover:text-black text-white px-3 py-2 sm:px-4 sm:py-2 md:px-6 md:py-3 rounded-full font-medium tracking-wide flex items-center gap-1 sm:gap-2 backdrop-blur-sm border border-white/20 text-xs sm:text-sm md:text-base"
                                initial={{ opacity: 0, x: 20, scale: 0.8 }}
                                animate={{ 
                                    opacity: 0, 
                                    x: 20, 
                                    scale: 0.8,
                                    transition: { duration: 0.3, ease: "easeOut" }
                                }}
                                whileHover={{ scale: 1.05 }}
                                variants={{
                                    hidden: { opacity: 0, x: 20, scale: 0.8 },
                                    visible: { 
                                        opacity: 1, 
                                        x: 0, 
                                        scale: 1,
                                        transition: { duration: 0.4, ease: "easeOut", delay: 0.2 }
                                    }
                                }}
                            >
                                <span className="hidden md:inline">FIND RETAILER</span>
                                <span className="md:hidden">RETAILER</span>
                                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 4l8 8-8 8M4 12h16"
                                    />
                                </svg>
                            </motion.button>
                        </div>
                        
                        {/* Mobile & Tablet Action Buttons - Positioned below image */}
                        <motion.div 
                            className="flex justify-center gap-4 mt-6 sm:hidden"
                            variants={{
                                hidden: { opacity: 0, y: 20 },
                                visible: { 
                                    opacity: 1, 
                                    y: 0,
                                    transition: { 
                                        duration: 0.5, 
                                        ease: "easeOut",
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
                                    console.log('Shuffle button clicked!');
                                    handleShuffleProduct();
                                }}
                                className="w-10 h-10 md:w-12 md:h-12 bg-white/10 hover:bg-white rounded-full flex items-center justify-center backdrop-blur-sm border border-white/20 hover:scale-110 cursor-pointer group/shuffle"
                                title="View other related products"
                                variants={{
                                    hidden: { opacity: 0, scale: 0.8, x: -10 },
                                    visible: { 
                                        opacity: 1, 
                                        scale: 1, 
                                        x: 0,
                                        transition: { duration: 0.4, ease: "easeOut" }
                                    }
                                }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <CiShuffle className="w-5 h-5 md:w-6 md:h-6 text-white group-hover/shuffle:text-gray-800 pointer-events-none transition-colors duration-300" />
                            </motion.button>
                            <motion.button
                                onClick={handleFindRetailer}
                                className="bg-white/10 hover:bg-white hover:text-black text-white px-4 py-2 md:px-6 md:py-3 rounded-full font-medium tracking-wide flex items-center gap-2 backdrop-blur-sm border border-white/20 text-sm md:text-base"
                                variants={{
                                    hidden: { opacity: 0, scale: 0.8, x: 10 },
                                    visible: { 
                                        opacity: 1, 
                                        scale: 1, 
                                        x: 0,
                                        transition: { duration: 0.4, ease: "easeOut" }
                                    }
                                }}
                                whileTap={{ scale: 0.95 }}
                            >
                                RETAILER
                                <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

            {/* Desktop Breadcrumb Navigation - Bottom of Hero */}
            {breadcrumbItems.length > 0 && (() => {
                console.log('Desktop breadcrumb rendering, items:', breadcrumbItems);
                return true;
            })() && (
                <motion.div 
                    className="absolute bottom-32 sm:bottom-40 md:bottom-64 lg:bottom-56 left-0 right-0 z-20 hidden md:block" 
                    id="hero-breadcrumb"
                    initial={{ opacity: 0, y: 30, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ 
                        duration: 1.2,
                        ease: "easeOut",
                        delay: 0.8
                    }}
                >
                    <div className="container mx-auto max-w-6xl lg:max-w-5xl px-4 relative">
                        {/* Left line segment with gradient */}
                        <motion.div
                            className="absolute top-1/2 left-4 h-px z-5"
                            initial={{ scaleX: 0, opacity: 0 }}
                            animate={{ scaleX: 1, opacity: 1 }}
                            transition={{ 
                                duration: 1.5,
                                ease: "easeOut",
                                delay: 1.2
                            }}
                            style={{
                                width: 'calc(50% - 300px)',
                                background: 'linear-gradient(to right, transparent, rgba(79, 200, 255, 0.6))',
                                transformOrigin: 'right center'
                            }}
                        ></motion.div>

                        {/* Right line segment with gradient */}
                        <motion.div
                            className="absolute top-1/2 right-4 h-px z-5"
                            initial={{ scaleX: 0, opacity: 0 }}
                            animate={{ scaleX: 1, opacity: 1 }}
                            transition={{ 
                                duration: 1.5,
                                ease: "easeOut",
                                delay: 1.2
                            }}
                            style={{ 
                                width: 'calc(50% - 300px)',
                                background: 'linear-gradient(to left, transparent, rgba(79, 200, 255, 0.6))',
                                transformOrigin: 'left center'
                            }}
                        ></motion.div>
                        <motion.nav 
                            className="flex justify-center items-center space-x-4 text-sm relative z-20"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.8,
                                ease: "easeOut",
                                delay: 1.4,
                                staggerChildren: 0.15
                            }}
                        >
                            {breadcrumbItems.map((item, index) => (
                                <motion.div 
                                    key={item.label} 
                                    className="flex items-center space-x-2"
                                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{
                                        duration: 0.6,
                                        ease: "easeOut",
                                        delay: 1.6 + (index * 0.1)
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
                                        className={`font-medium relative transition-colors duration-300 px-3 py-2 text-center whitespace-nowrap ${
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
                                            className="text-gray-500 relative"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 1.8 + (index * 0.1) }}
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
