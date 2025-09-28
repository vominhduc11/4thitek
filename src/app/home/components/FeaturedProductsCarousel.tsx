'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import AvoidSidebar from '@/components/layout/AvoidSidebar';
import { useLanguage } from '@/context/LanguageContext';
import { apiService } from '@/services/apiService';

interface Product {
    id: number;
    name: string;
    shortDescription: string;
    image: string;
}

interface ParsedImage {
    imageUrl: string;
    public_id: string;
}

interface FeaturedProductsCarouselProps {
    products?: Product[];
    initialIndex?: number;
}


const FeaturedProductsCarousel: React.FC<FeaturedProductsCarouselProps> = ({
    initialIndex = 0
}) => {
    const { t } = useLanguage();
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setIsLoading(true);
                const response = await apiService.fetchHomepageProducts();

                if (response.success && response.data) {
                    const processedProducts: Product[] = response.data.map((product: { id: number; name: string; shortDescription: string; image: string; price?: number }) => {
                        // Parse image JSON string
                        let imageUrl = '/products/product1.png'; // fallback
                        try {
                            const parsedImage: ParsedImage = JSON.parse(product.image);
                            imageUrl = parsedImage.imageUrl;
                        } catch (e) {
                            console.warn('Failed to parse product image JSON:', e);
                        }

                        return {
                            id: product.id,
                            name: product.name,
                            shortDescription: product.shortDescription,
                            image: imageUrl
                        };
                    });

                    setProducts(processedProducts);
                } else {
                    setError('Failed to load products');
                }
            } catch (err) {
                setError('Failed to load products');
                console.error('Error fetching products:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProducts();
    }, []);

    const nextProduct = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % products.length);
    }, [products.length]);

    const prevProduct = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
    }, [products.length]);

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = () => {
        if (!touchStart || !touchEnd) return;

        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe) {
            nextProduct();
        } else if (isRightSwipe) {
            prevProduct();
        }
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                prevProduct();
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                nextProduct();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nextProduct, prevProduct]);

    const currentProduct = products[currentIndex];

    // Handle empty products or loading
    if (isLoading || products.length === 0) {
        return (
            <AvoidSidebar>
                <section className="py-16 md:py-24 bg-gradient-to-b from-[#013A5E] to-[#032B4A] relative overflow-hidden">
                    <div className="container mx-auto px-4 max-w-[1400px] relative z-10">
                        <div className="text-center mb-16">
                            <h2 className="text-[2rem] font-semibold text-[#E1F0FF] mb-4">
                                {t('products.featured.carouselTitle')}
                            </h2>
                        </div>
                        <div className="flex items-center justify-center h-96">
                            {isLoading ? (
                                <div className="text-white text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#48C7FF] mx-auto mb-4"></div>
                                    <p>Loading products...</p>
                                </div>
                            ) : error ? (
                                <div className="text-center">
                                    <p className="text-red-400 mb-4">⚠️ {error}</p>
                                    <p className="text-gray-500 text-sm">Please try again later</p>
                                </div>
                            ) : (
                                <p className="text-gray-400">No products available</p>
                            )}
                        </div>
                    </div>
                </section>
            </AvoidSidebar>
        );
    }

    const containerVariants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 300 : -300,
            opacity: 0,
            scale: 0.9,
            rotateY: direction > 0 ? 15 : -15,
            z: -100
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1,
            scale: 1,
            rotateY: 0,
            z: 0
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 300 : -300,
            opacity: 0,
            scale: 0.9,
            rotateY: direction < 0 ? 15 : -15,
            z: -100
        })
    };

    const imageVariants = {
        enter: {
            scale: 0.7,
            opacity: 0,
            rotateX: -10,
            y: 50,
            filter: 'blur(10px)'
        },
        center: {
            scale: 1,
            opacity: 1,
            rotateX: 0,
            y: 0,
            filter: 'blur(0px)'
        },
        exit: {
            scale: 0.7,
            opacity: 0,
            rotateX: 10,
            y: -50,
            filter: 'blur(10px)'
        }
    };

    return (
        <AvoidSidebar>
            <section className="py-16 md:py-24 bg-gradient-to-b from-[#013A5E] to-[#032B4A] relative overflow-hidden">
                {/* Background Decorative Elements */}
                <div className="absolute inset-0 opacity-10">
                    {/* Grid Pattern */}
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundImage: `
                            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                        `,
                            backgroundSize: '50px 50px'
                        }}
                    ></div>

                    {/* Circuit Pattern */}
                    <div className="absolute top-10 left-10 w-32 h-32 opacity-20">
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            <circle cx="20" cy="20" r="2" fill="#48C7FF" />
                            <circle cx="80" cy="20" r="2" fill="#48C7FF" />
                            <circle cx="20" cy="80" r="2" fill="#48C7FF" />
                            <circle cx="80" cy="80" r="2" fill="#48C7FF" />
                            <line x1="20" y1="20" x2="80" y2="20" stroke="#48C7FF" strokeWidth="0.5" />
                            <line x1="80" y1="20" x2="80" y2="80" stroke="#48C7FF" strokeWidth="0.5" />
                            <line x1="80" y1="80" x2="20" y2="80" stroke="#48C7FF" strokeWidth="0.5" />
                            <line x1="20" y1="80" x2="20" y2="20" stroke="#48C7FF" strokeWidth="0.5" />
                            <line
                                x1="20"
                                y1="20"
                                x2="80"
                                y2="80"
                                stroke="#48C7FF"
                                strokeWidth="0.3"
                                strokeDasharray="2,2"
                            />
                            <line
                                x1="80"
                                y1="20"
                                x2="20"
                                y2="80"
                                stroke="#48C7FF"
                                strokeWidth="0.3"
                                strokeDasharray="2,2"
                            />
                        </svg>
                    </div>

                    {/* Floating Geometric Shapes */}
                    <div className="absolute top-20 right-20 w-24 h-24 opacity-15">
                        <svg viewBox="0 0 100 100" className="w-full h-full">
                            <polygon
                                points="50,5 90,35 75,85 25,85 10,35"
                                fill="none"
                                stroke="#E1F0FF"
                                strokeWidth="1"
                            />
                            <circle cx="50" cy="50" r="15" fill="none" stroke="#48C7FF" strokeWidth="0.8" />
                        </svg>
                    </div>

                    {/* Bottom Pattern */}
                    <div className="absolute bottom-10 left-1/4 w-40 h-20 opacity-10">
                        <svg viewBox="0 0 160 80" className="w-full h-full">
                            <path d="M0,40 Q40,0 80,40 T160,40" fill="none" stroke="#48C7FF" strokeWidth="1" />
                            <path d="M0,50 Q40,10 80,50 T160,50" fill="none" stroke="#E1F0FF" strokeWidth="0.5" />
                            <circle cx="40" cy="30" r="1.5" fill="#48C7FF" />
                            <circle cx="120" cy="30" r="1.5" fill="#48C7FF" />
                        </svg>
                    </div>
                </div>

                {/* Optimized Floating Particles - CSS Animations */}
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-[#48C7FF] rounded-full opacity-30 animate-float-slow" />
                    <div className="absolute top-2/3 right-1/4 w-1.5 h-1.5 bg-[#E1F0FF] rounded-full opacity-40 animate-float-medium" />
                    <div className="absolute top-1/2 left-1/5 w-1 h-1 bg-[#48C7FF] rounded-full opacity-50 animate-float-fast" />
                </div>

                <div className="container mx-auto px-4 max-w-[1400px] relative z-10">
                    {/* Title with Decorative Elements */}
                    <div className="text-center mb-16 relative">
                        {/* Title Decoration Lines */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl">
                            <div className="flex items-center justify-center">
                                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#48C7FF]/30 to-[#48C7FF]/60"></div>
                                <div className="px-8">
                                    <div className="w-3 h-3 bg-[#48C7FF] rounded-full"></div>
                                </div>
                                <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[#48C7FF]/30 to-[#48C7FF]/60"></div>
                            </div>
                        </div>

                        <motion.h2
                            className="relative text-[2rem] font-semibold text-[#E1F0FF] bg-gradient-to-b from-[#013A5E] to-[#032B4A] px-8 inline-block"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            {t('products.featured.carouselTitle')}
                        </motion.h2>

                        {/* Decorative Corner Elements for Title */}
                        <motion.div
                            className="absolute -top-4 -left-4 w-8 h-8 opacity-40"
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                        >
                            <svg viewBox="0 0 32 32" className="w-full h-full">
                                <polygon points="16,2 20,12 30,16 20,20 16,30 12,20 2,16 12,12" fill="#48C7FF" />
                            </svg>
                        </motion.div>
                        <motion.div
                            className="absolute -top-4 -right-4 w-8 h-8 opacity-40"
                            animate={{ rotate: [360, 0] }}
                            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                        >
                            <svg viewBox="0 0 32 32" className="w-full h-full">
                                <polygon points="16,2 20,12 30,16 20,20 16,30 12,20 2,16 12,12" fill="#E1F0FF" />
                            </svg>
                        </motion.div>
                    </div>

                    {/* Carousel Container */}
                    <div
                        className="relative flex items-center justify-center"
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        {/* Previous Button - Desktop only */}
                        <motion.button
                            onClick={prevProduct}
                            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 p-2 text-white hover:text-[#48C7FF] focus:text-[#48C7FF] focus:outline-none focus:ring-2 focus:ring-[#48C7FF] rounded-full transition-colors duration-300 hidden md:block"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            aria-label="Previous product"
                            tabIndex={0}
                        >
                            <ChevronLeftIcon className="w-8 h-8" />
                        </motion.button>

                        {/* Product Content */}
                        <div className="flex flex-col lg:flex-row items-center justify-center max-w-6xl mx-auto px-8 lg:px-16">
                            {/* Product Image with Decorative Elements */}
                            <div className="relative w-full lg:w-1/2 flex justify-center mb-8 lg:mb-0">
                                {/* Decorative Ring around Product */}
                                <motion.div
                                    className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                                >
                                    <div className="w-[500px] h-[500px] rounded-full border border-[#48C7FF]/20 border-dashed"></div>
                                </motion.div>

                                {/* Decorative Corner Elements */}
                                <div className="absolute top-0 left-0 w-20 h-20 opacity-30">
                                    <svg viewBox="0 0 80 80" className="w-full h-full">
                                        <path
                                            d="M0,20 L20,0 L60,0 L80,20 L80,60 L60,80"
                                            fill="none"
                                            stroke="#E1F0FF"
                                            strokeWidth="1"
                                        />
                                        <circle cx="20" cy="20" r="2" fill="#48C7FF" />
                                    </svg>
                                </div>
                                <div className="absolute top-0 right-0 w-20 h-20 opacity-30 rotate-90">
                                    <svg viewBox="0 0 80 80" className="w-full h-full">
                                        <path
                                            d="M0,20 L20,0 L60,0 L80,20 L80,60 L60,80"
                                            fill="none"
                                            stroke="#E1F0FF"
                                            strokeWidth="1"
                                        />
                                        <circle cx="20" cy="20" r="2" fill="#48C7FF" />
                                    </svg>
                                </div>
                                <div className="absolute bottom-0 left-0 w-20 h-20 opacity-30 -rotate-90">
                                    <svg viewBox="0 0 80 80" className="w-full h-full">
                                        <path
                                            d="M0,20 L20,0 L60,0 L80,20 L80,60 L60,80"
                                            fill="none"
                                            stroke="#E1F0FF"
                                            strokeWidth="1"
                                        />
                                        <circle cx="20" cy="20" r="2" fill="#48C7FF" />
                                    </svg>
                                </div>
                                <div className="absolute bottom-0 right-0 w-20 h-20 opacity-30 rotate-180">
                                    <svg viewBox="0 0 80 80" className="w-full h-full">
                                        <path
                                            d="M0,20 L20,0 L60,0 L80,20 L80,60 L60,80"
                                            fill="none"
                                            stroke="#E1F0FF"
                                            strokeWidth="1"
                                        />
                                        <circle cx="20" cy="20" r="2" fill="#48C7FF" />
                                    </svg>
                                </div>

                                {/* Glow Effect Behind Product */}
                                <motion.div
                                    className="absolute inset-0 flex items-center justify-center"
                                    animate={{
                                        scale: [1, 1.1, 1],
                                        opacity: [0.1, 0.3, 0.1]
                                    }}
                                    transition={{
                                        duration: 4,
                                        repeat: Infinity,
                                        ease: 'easeInOut'
                                    }}
                                >
                                    <div className="w-80 h-80 bg-[#48C7FF] rounded-full blur-3xl"></div>
                                </motion.div>

                                <AnimatePresence mode="wait" custom={1}>
                                    <motion.div
                                        key={currentProduct.id}
                                        variants={imageVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        transition={{
                                            duration: 0.8,
                                            ease: [0.25, 0.1, 0.25, 1.0],
                                            type: 'tween'
                                        }}
                                        className="relative w-full max-w-[600px] lg:max-w-[400px] xl:max-w-[600px] h-[300px] lg:h-[400px] z-10"
                                        style={{ perspective: '1000px' }}
                                    >
                                        <Image
                                            src={
                                                currentProduct.image ||
                                                '/products/product1.png'
                                            }
                                            alt={currentProduct.name}
                                            fill
                                            className="object-contain drop-shadow-2xl"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 400px, (max-width: 3200px) 600px, 800px"
                                            priority
                                        />
                                    </motion.div>
                                </AnimatePresence>
                            </div>

                            {/* Product Info with Decorative Elements */}
                            <div className="relative w-full lg:w-1/2 text-center lg:text-left lg:pl-12">
                                {/* Decorative Side Pattern */}
                                <div className="absolute -left-8 top-1/2 transform -translate-y-1/2 w-1 h-40 bg-gradient-to-b from-transparent via-[#48C7FF]/50 to-transparent hidden lg:block"></div>

                                {/* Quote-like Decoration */}
                                <div className="absolute -top-4 left-0 lg:left-12 w-6 h-6 opacity-30">
                                    <svg viewBox="0 0 24 24" className="w-full h-full">
                                        <path
                                            d="M8 5v6c0 3.31-2.69 6-6 6v2c5.51 0 10-4.49 10-10V5H8zm12 0v6c0 3.31-2.69 6-6 6v2c5.51 0 10-4.49 10-10V5h-4z"
                                            fill="#48C7FF"
                                        />
                                    </svg>
                                </div>

                                <AnimatePresence mode="wait" custom={1}>
                                    <motion.div
                                        key={currentProduct.id}
                                        custom={1}
                                        variants={containerVariants}
                                        initial="enter"
                                        animate="center"
                                        exit="exit"
                                        transition={{
                                            duration: 0.8,
                                            ease: [0.25, 0.1, 0.25, 1.0],
                                            type: 'tween',
                                            staggerChildren: 0.1
                                        }}
                                        className="relative"
                                        style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
                                    >
                                        {/* Product Name with Underline Decoration */}
                                        <motion.div
                                            className="relative mb-6"
                                            variants={{
                                                enter: { y: 30, opacity: 0 },
                                                center: { y: 0, opacity: 1 },
                                                exit: { y: -30, opacity: 0 }
                                            }}
                                        >
                                            <motion.h3
                                                className="font-black text-[1.75rem] lg:text-[2rem] xl:text-[2.25rem] text-[#48C7FF] relative z-10"
                                                style={{
                                                    fontFamily: 'Montserrat, sans-serif',
                                                    letterSpacing: '0.1rem'
                                                }}
                                                variants={{
                                                    enter: { scale: 0.9, opacity: 0 },
                                                    center: { scale: 1, opacity: 1 },
                                                    exit: { scale: 0.9, opacity: 0 }
                                                }}
                                            >
                                                {currentProduct.name}
                                            </motion.h3>
                                            {/* Animated Underline */}
                                            <motion.div
                                                className="absolute bottom-0 left-0 lg:left-0 h-0.5 bg-gradient-to-r from-[#48C7FF] to-[#E1F0FF]"
                                                initial={{ width: 0, opacity: 0 }}
                                                animate={{ width: '100%', opacity: 1 }}
                                                transition={{ duration: 1.2, delay: 0.4, ease: [0.25, 0.1, 0.25, 1.0] }}
                                            />
                                            {/* Small decorative elements */}
                                            <motion.div
                                                className="absolute -right-4 -top-2 w-2 h-2 bg-[#48C7FF] rounded-full opacity-60"
                                                initial={{ scale: 0, rotate: -180 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{ duration: 0.6, delay: 0.6 }}
                                            />
                                            <motion.div
                                                className="absolute -right-2 -top-4 w-1 h-1 bg-[#E1F0FF] rounded-full opacity-80"
                                                initial={{ scale: 0, rotate: 180 }}
                                                animate={{ scale: 1, rotate: 0 }}
                                                transition={{ duration: 0.4, delay: 0.8 }}
                                            />
                                        </motion.div>

                                        {/* Product Description with Side Border */}
                                        <motion.div
                                            className="relative mb-8"
                                            variants={{
                                                enter: { x: -20, opacity: 0 },
                                                center: { x: 0, opacity: 1 },
                                                exit: { x: 20, opacity: 0 }
                                            }}
                                        >
                                            <motion.div
                                                className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-[#48C7FF]/50 to-[#48C7FF]/10 rounded-full hidden lg:block"
                                                initial={{ height: 0 }}
                                                animate={{ height: '100%' }}
                                                transition={{ duration: 0.8, delay: 0.2 }}
                                            />
                                            <motion.p
                                                className="text-white text-[0.875rem] lg:text-base leading-[1.5] max-w-md mx-auto lg:mx-0 lg:pl-4 relative"
                                                variants={{
                                                    enter: { opacity: 0, y: 20 },
                                                    center: { opacity: 1, y: 0 },
                                                    exit: { opacity: 0, y: -20 }
                                                }}
                                            >
                                                {currentProduct.shortDescription}
                                            </motion.p>
                                        </motion.div>

                                        {/* Action Button with Decorative Elements */}
                                        <motion.div
                                            className="relative inline-block"
                                            variants={{
                                                enter: { scale: 0.8, opacity: 0, y: 30 },
                                                center: { scale: 1, opacity: 1, y: 0 },
                                                exit: { scale: 0.8, opacity: 0, y: -30 }
                                            }}
                                        >
                                            {/* Button Glow Effect */}
                                            <motion.div
                                                className="absolute inset-0 bg-[#48C7FF]/20 rounded-full blur-lg"
                                                animate={{
                                                    scale: [1, 1.2, 1],
                                                    opacity: [0.2, 0.4, 0.2]
                                                }}
                                                transition={{
                                                    duration: 3,
                                                    repeat: Infinity,
                                                    ease: 'easeInOut'
                                                }}
                                            />
                                            <Link href={`/products/${currentProduct.id}`}>
                                                <motion.button
                                                    className="relative border border-white rounded-full px-6 py-2 text-[0.875rem] text-white hover:bg-[rgba(72,199,255,0.2)] hover:border-[#48C7FF] focus:outline-none focus:ring-2 focus:ring-[#48C7FF] focus:bg-[rgba(72,199,255,0.2)] focus:border-[#48C7FF] transition-all duration-300 overflow-hidden"
                                                    whileHover={{
                                                        scale: 1.05,
                                                        boxShadow: '0 0 30px rgba(72, 199, 255, 0.4)'
                                                    }}
                                                    whileTap={{ scale: 0.98 }}
                                                    aria-label={`Discover ${currentProduct.name}`}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: 0.5, duration: 0.6 }}
                                                >
                                                    {/* Button shimmer effect */}
                                                    <motion.div
                                                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                                                        animate={{ x: ['-100%', '100%'] }}
                                                        transition={{
                                                            duration: 2,
                                                            repeat: Infinity,
                                                            ease: 'linear',
                                                            delay: 1
                                                        }}
                                                    />
                                                    <motion.span
                                                        className="relative z-10"
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        transition={{ delay: 0.7 }}
                                                    >
                                                        {t('products.featured.discoveryNow')}
                                                    </motion.span>
                                                </motion.button>
                                            </Link>
                                        </motion.div>
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Next Button - Desktop only */}
                        <motion.button
                            onClick={nextProduct}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 p-2 text-white hover:text-[#48C7FF] focus:text-[#48C7FF] focus:outline-none focus:ring-2 focus:ring-[#48C7FF] rounded-full transition-colors duration-300 hidden md:block"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            aria-label="Next product"
                            tabIndex={0}
                        >
                            <ChevronRightIcon className="w-8 h-8" />
                        </motion.button>
                    </div>

                    {/* Mobile Navigation Dots with Decorative Elements */}
                    <div className="flex justify-center items-center mt-8 space-x-2 md:hidden relative">
                        {/* Decorative Line Behind Dots */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-24 h-px bg-gradient-to-r from-transparent via-[#48C7FF]/30 to-transparent"></div>
                        </div>

                        {products.map((_, index) => (
                            <div key={index} className="relative">
                                {/* Active Dot Glow Effect */}
                                {index === currentIndex && (
                                    <motion.div
                                        className="absolute inset-0 bg-[#48C7FF]/40 rounded-full blur-sm"
                                        animate={{
                                            scale: [1, 1.5, 1],
                                            opacity: [0.4, 0.8, 0.4]
                                        }}
                                        transition={{
                                            duration: 2,
                                            repeat: Infinity,
                                            ease: 'easeInOut'
                                        }}
                                    />
                                )}
                                <motion.button
                                    onClick={() => setCurrentIndex(index)}
                                    className={`relative w-3 h-3 rounded-full transition-all duration-300 ${
                                        index === currentIndex
                                            ? 'bg-[#48C7FF] scale-125'
                                            : 'bg-white/30 hover:bg-white/50'
                                    }`}
                                    whileHover={{ scale: 1.2 }}
                                    whileTap={{ scale: 0.9 }}
                                    aria-label={`Go to product ${index + 1}`}
                                />
                            </div>
                        ))}

                        {/* Small Decorative Stars */}
                        <motion.div
                            className="absolute -left-8 w-2 h-2 opacity-40"
                            animate={{ rotate: [0, 360] }}
                            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                        >
                            <svg viewBox="0 0 8 8" className="w-full h-full">
                                <polygon points="4,1 5,3 7,3 5.5,4.5 6,7 4,5.5 2,7 2.5,4.5 1,3 3,3" fill="#48C7FF" />
                            </svg>
                        </motion.div>
                        <motion.div
                            className="absolute -right-8 w-2 h-2 opacity-40"
                            animate={{ rotate: [360, 0] }}
                            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                        >
                            <svg viewBox="0 0 8 8" className="w-full h-full">
                                <polygon points="4,1 5,3 7,3 5.5,4.5 6,7 4,5.5 2,7 2.5,4.5 1,3 3,3" fill="#E1F0FF" />
                            </svg>
                        </motion.div>
                    </div>
                </div>
            </section>
        </AvoidSidebar>
    );
};

export default FeaturedProductsCarousel;
