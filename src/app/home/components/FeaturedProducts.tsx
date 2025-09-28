'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowUpRight } from 'react-icons/fi';
import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import { useLanguage } from '@/context/LanguageContext';
import { apiService } from '@/services/apiService';

interface FeaturedProduct {
    id: number;
    name: string;
    shortDescription: string;
    image: string;
}

interface ParsedImage {
    imageUrl: string;
    public_id: string;
}


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
                <div className="text-4xl opacity-70">🎧</div>
            </div>
        );
    }

    return (
        <div className={`${className} relative`}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}
            <Image
                src={src}
                alt={alt}
                width={200}
                height={200}
                sizes="200px"
                priority={true}
                className={`w-full h-full object-contain transition-opacity duration-200 ease-out ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                    setImageError(true);
                    setIsLoading(false);
                }}
            />
        </div>
    );
}

export default function FeaturedProducts() {
    const [hoveredProductId, setHoveredProductId] = useState<number | null>(null);
    const [products, setProducts] = useState<FeaturedProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { t } = useLanguage();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setIsLoading(true);
                const response = await apiService.fetchHomepageProducts();

                if (response.success && response.data) {
                    const processedProducts: FeaturedProduct[] = response.data.map((product: { id: number; name: string; shortDescription: string; image: string; price?: number }) => {
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

    const renderProductCard = (product: FeaturedProduct, index: number) => {
        return (
            <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, scale: 0.9 }}
                transition={{
                    duration: 0.6,
                    delay: index * 0.1,
                    type: 'spring',
                    stiffness: 120,
                    damping: 20
                }}
                className="relative w-full overflow-visible"
                style={{ zIndex: hoveredProductId === product.id ? 50 : 1 }}
            >
                <Link href={`/products/${product.id}`}>
                    <motion.div
                        className="relative bg-gradient-to-b from-gray-900/40 to-gray-800/60 hover:from-gray-800/60 hover:to-gray-700/70 transition-all duration-500 cursor-pointer group overflow-hidden h-[380px] sm:h-[420px] md:h-[460px] lg:h-[480px] xl:h-[500px] 2xl:h-[620px] 3xl:h-[680px] 4xl:h-[720px] 5xl:h-[800px] grid grid-rows-[auto_1fr_auto] border border-gray-700/30 hover:border-[#4FC8FF]/40 shadow-lg hover:shadow-2xl hover:shadow-[#4FC8FF]/20 backdrop-blur-sm"
                        onMouseEnter={() => setHoveredProductId(product.id)}
                        onMouseLeave={() => setHoveredProductId(null)}
                        whileHover={{
                            y: -8,
                            scale: 1.02,
                            boxShadow: '0 20px 40px rgba(79, 200, 255, 0.15), 0 0 30px rgba(79, 200, 255, 0.1)',
                            transition: { duration: 0.3, ease: 'easeOut' }
                        }}
                        whileTap={{ scale: 0.98 }}
                    >
                    {hoveredProductId === product.id && (
                        <motion.video
                            src="/videos/futuristic-background-2022-08-04-19-57-56-utc.mp4"
                            className="absolute inset-0 w-full h-full object-cover -z-10 hidden sm:block"
                            autoPlay
                            loop
                            muted
                            playsInline
                            initial={{ opacity: 0, scale: 1.1 }}
                            animate={{ opacity: 0.4, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                        />
                    )}

                    <motion.div
                        className="absolute left-2 xs:left-3 sm:left-4 md:left-6 top-2 xs:top-3 sm:top-4 z-20"
                        whileHover={{
                            color: '#4FC8FF',
                            scale: 1.05,
                            transition: { duration: 0.3 }
                        }}
                    >
                        <div
                            className="font-bold text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl uppercase tracking-wider xs:tracking-widest text-gray-400 group-hover:text-[#4FC8FF] transition-colors duration-300"
                            style={{
                                writingMode: 'vertical-rl',
                                transform: 'rotate(180deg)'
                            }}
                        >
                            {t('products.featured.product')}
                        </div>
                    </motion.div>

                    <motion.div
                        className="flex justify-center items-center py-4 sm:py-5 md:py-6 lg:py-6 xl:py-6 2xl:py-8 3xl:py-10 4xl:py-12 5xl:py-16 px-4 sm:px-5 md:px-6 lg:px-6 xl:px-6 2xl:px-8 3xl:px-10 4xl:px-12 5xl:px-16 z-10 relative"
                        whileHover={{ scale: 1.03 }}
                        transition={{ duration: 0.3 }}
                    >
                        <motion.div
                            key={`product-${product.id}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="relative"
                        >
                            <ProductImageWithFallback
                                src={product.image}
                                alt={product.name}
                                className="w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] md:w-[180px] md:h-[180px] lg:w-[200px] lg:h-[200px] xl:w-[220px] xl:h-[220px] 2xl:w-[280px] 2xl:h-[280px] 3xl:w-[320px] 3xl:h-[320px] 4xl:w-[360px] 4xl:h-[360px] 5xl:w-[400px] 5xl:h-[400px] object-contain transition-opacity duration-200 ease-out"
                            />
                        </motion.div>
                    </motion.div>

                    <motion.div
                        className="px-4 sm:px-5 md:px-6 lg:px-6 xl:px-6 2xl:px-8 3xl:px-10 4xl:px-12 5xl:px-16 pb-6 sm:pb-7 md:pb-8 lg:pb-8 xl:pb-8 2xl:pb-8 3xl:pb-10 4xl:pb-12 5xl:pb-16 pt-2 sm:pt-3 md:pt-3 lg:pt-3 xl:pt-3 2xl:pt-4 3xl:pt-5 4xl:pt-6 5xl:pt-8 z-10 relative flex flex-col h-full"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 + index * 0.05 }}
                    >
                            <motion.h3
                                className="text-white font-bold text-base sm:text-lg md:text-xl lg:text-xl xl:text-2xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl 5xl:text-5xl mb-2 sm:mb-3 md:mb-3 lg:mb-3 xl:mb-3 2xl:mb-4 3xl:mb-5 4xl:mb-6 5xl:mb-8 font-sans h-[2.5rem] sm:h-[3rem] md:h-[3rem] lg:h-[3rem] xl:h-[3rem] 2xl:h-[3.5rem] 3xl:h-[4rem] 4xl:h-[4.5rem] 5xl:h-[5rem] flex items-center cursor-pointer"
                                whileHover={{
                                    color: '#4FC8FF',
                                    scale: 1.02,
                                    transition: { duration: 0.3 }
                                }}
                            >
                                <span className="line-clamp-2">{product.name}</span>
                            </motion.h3>
                        <p className="text-gray-300 text-xs sm:text-sm md:text-sm lg:text-sm xl:text-base 2xl:text-base 3xl:text-lg 4xl:text-xl leading-relaxed mb-2 sm:mb-3 md:mb-3 lg:mb-3 xl:mb-4 2xl:mb-5 3xl:mb-6 4xl:mb-7 font-sans line-clamp-2">
                            {product.shortDescription}
                        </p>

                        <div className="flex justify-end mt-auto pt-2 sm:pt-3 lg:pt-2 xl:pt-3 3xl:pt-4 4xl:pt-5">
                                <motion.div
                                    whileHover={{
                                        scale: 1.15,
                                        rotate: 45,
                                        color: '#4FC8FF'
                                    }}
                                    transition={{ duration: 0.3 }}
                                    className="p-3 sm:p-3 lg:p-2 xl:p-3 2xl:p-4 3xl:p-5 4xl:p-6 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                                >
                                    <FiArrowUpRight
                                        size={20}
                                        className={clsx(
                                            'transition-colors w-4 h-4 sm:w-5 sm:h-5 lg:w-4 lg:h-4 xl:w-5 xl:h-5 2xl:w-6 2xl:h-6 3xl:w-7 3xl:h-7 4xl:w-8 4xl:h-8',
                                            hoveredProductId === product.id ? 'text-blue-400' : 'text-gray-500'
                                        )}
                                    />
                                </motion.div>
                        </div>
                    </motion.div>

                        <motion.div
                            className="absolute inset-0 border-2 border-transparent group-hover:border-[#4FC8FF]/50 transition-all duration-500 pointer-events-none"
                            whileHover={{
                                boxShadow: 'inset 0 0 40px rgba(79, 200, 255, 0.2), 0 0 50px rgba(79, 200, 255, 0.15)'
                            }}
                        />

                        {/* Glow effect on hover */}
                        <motion.div
                            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                            style={{
                                background: 'radial-gradient(circle at center, rgba(79, 200, 255, 0.1) 0%, transparent 70%)'
                            }}
                        />
                    </motion.div>
                </Link>
            </motion.div>
        );
    };

    return (
        <section className="py-16 md:py-24 bg-[#0c131d] relative overflow-hidden">
            <div className="px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16 -mt-32 md:-mt-40 lg:-mt-48 relative z-[100] pt-40 md:pt-48 lg:pt-56 ml-16 sm:ml-20">
                {/* Header */}
                <div className="text-center mb-12 md:mb-16">
                    <motion.h2
                        className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        {t('products.featured.title')}
                    </motion.h2>
                    <motion.p
                        className="text-gray-400 text-lg max-w-2xl mx-auto"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        {t('products.featured.subtitle')}
                    </motion.p>
                </div>

                {/* Products Grid */}
                <div className="w-full overflow-visible">
                    <motion.div
                        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px relative mb-12 overflow-visible"
                        layout
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                    >
                        <AnimatePresence mode="popLayout">
                            {isLoading ? (
                                // Loading skeleton
                                Array.from({ length: 4 }).map((_, index) => (
                                    <motion.div
                                        key={`skeleton-${index}`}
                                        className="relative w-full h-[380px] sm:h-[420px] md:h-[460px] lg:h-[480px] xl:h-[500px] 2xl:h-[620px] 3xl:h-[680px] 4xl:h-[720px] 5xl:h-[800px] bg-gray-800/40 border border-gray-700/30 animate-pulse"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ duration: 0.6, delay: index * 0.1 }}
                                    >
                                        <div className="p-4 h-full flex flex-col">
                                            <div className="flex-1 flex items-center justify-center">
                                                <div className="w-32 h-32 bg-gray-700/50 rounded"></div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="h-4 bg-gray-700/50 rounded w-3/4"></div>
                                                <div className="h-3 bg-gray-700/50 rounded w-1/2"></div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            ) : error ? (
                                // Error state
                                <motion.div
                                    className="col-span-full text-center py-12"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                >
                                    <p className="text-red-400 mb-4">⚠️ {error}</p>
                                    <p className="text-gray-500 text-sm">Please try again later</p>
                                </motion.div>
                            ) : (
                                products.map((product, index) => renderProductCard(product, index))
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
