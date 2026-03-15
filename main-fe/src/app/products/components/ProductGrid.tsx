'use client';

import { useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowUpRight } from 'react-icons/fi';
import Image from 'next/image';
import Link from 'next/link';
import type { SimpleProduct } from '@/types/product';
import { useLanguage } from '@/context/LanguageContext';
import { useAnimationConfig } from '@/hooks/useReducedMotion';

interface ProductImageWithFallbackProps {
    src: string;
    alt: string;
    className?: string;
}

const ProductImageWithFallback = memo(function ProductImageWithFallback({ src, alt, className }: ProductImageWithFallbackProps) {
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    if (!src || imageError) {
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
                className={`w-full h-full object-contain transition-opacity duration-200 ease-out ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                    setImageError(true);
                    setIsLoading(false);
                }}
            />
        </div>
    );
});

interface ProductGridProps {
    products: SimpleProduct[];
}

export default function ProductGrid({ products }: ProductGridProps) {
    const { t } = useLanguage();
    const animationConfig = useAnimationConfig();

    const renderProductCard = useCallback((product: SimpleProduct, index: number) => {
        return (
            <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{
                    duration: animationConfig.duration,
                    delay: animationConfig.enableComplexAnimations ? Math.min(index * animationConfig.stagger, 0.5) : 0,
                    ease: animationConfig.ease
                }}
                style={{ willChange: 'transform, opacity' }}
                className="relative w-full"
            >
                <Link href={`/products/${product.id}`}>
                    <motion.div
                        className="relative bg-gradient-to-b from-gray-900/40 to-gray-800/60 hover:from-gray-800/60 hover:to-gray-700/70 transition-colors duration-300 cursor-pointer group overflow-hidden h-[380px] sm:h-[420px] md:h-[460px] lg:h-[480px] xl:h-[500px] 2xl:h-[620px] 3xl:h-[680px] 4xl:h-[720px] 5xl:h-[800px] grid grid-rows-[auto_1fr_auto] border border-gray-700/30 hover:border-[#4FC8FF]/40 shadow-lg backdrop-blur-sm"
                        whileHover={
                            animationConfig.enableComplexAnimations
                                ? {
                                      y: -6,
                                      boxShadow: '0 16px 32px rgba(79, 200, 255, 0.15)',
                                      transition: { duration: 0.25, ease: 'easeOut' }
                                  }
                                : undefined
                        }
                        whileTap={{ scale: 0.99 }}
                    >
                    <div
                        className="absolute left-2 xs:left-3 sm:left-4 md:left-6 top-2 xs:top-3 sm:top-4 z-20"
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
                    </div>

                    <div className="flex justify-center items-center py-4 sm:py-5 md:py-6 lg:py-6 xl:py-6 2xl:py-8 3xl:py-10 4xl:py-12 5xl:py-16 px-4 sm:px-5 md:px-6 lg:px-6 xl:px-6 2xl:px-8 3xl:px-10 4xl:px-12 5xl:px-16 z-10 relative">
                        <motion.div
                            key={`product-${product.id}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="relative"
                        >
                            <ProductImageWithFallback
                                src={product.image || ''}
                                alt={product.name}
                                className="w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] md:w-[180px] md:h-[180px] lg:w-[200px] lg:h-[200px] xl:w-[220px] xl:h-[220px] 2xl:w-[280px] 2xl:h-[280px] 3xl:w-[320px] 3xl:h-[320px] 4xl:w-[360px] 4xl:h-[360px] 5xl:w-[400px] 5xl:h-[400px] object-contain"
                            />
                        </motion.div>
                    </div>

                    <div className="px-4 sm:px-5 md:px-6 lg:px-6 xl:px-6 2xl:px-8 3xl:px-10 4xl:px-12 5xl:px-16 pb-6 sm:pb-7 md:pb-8 2xl:pb-8 3xl:pb-10 4xl:pb-12 5xl:pb-16 pt-2 sm:pt-3 2xl:pt-4 3xl:pt-5 4xl:pt-6 5xl:pt-8 z-10 relative flex flex-col h-full">
                        <h3 className="text-white font-bold text-base sm:text-lg md:text-xl lg:text-xl xl:text-2xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl 5xl:text-5xl mb-2 sm:mb-3 2xl:mb-4 3xl:mb-5 4xl:mb-6 5xl:mb-8 font-sans min-h-[2.5rem] sm:min-h-[3rem] 2xl:min-h-[3.5rem] flex items-center cursor-pointer group-hover:text-[#4FC8FF] transition-colors duration-300">
                            <span className="line-clamp-2">{product.name}</span>
                        </h3>
                        <p className="text-gray-300 text-xs sm:text-sm xl:text-base 3xl:text-lg 4xl:text-xl leading-relaxed mb-2 sm:mb-3 xl:mb-4 2xl:mb-5 3xl:mb-6 4xl:mb-7 font-sans line-clamp-2">
                            {product.description}
                        </p>

                        <div className="flex justify-end mt-auto pt-2 sm:pt-3">
                            <div className="p-2 sm:p-3 rounded-full group-hover:bg-white/10 transition-colors cursor-pointer">
                                <FiArrowUpRight
                                    size={20}
                                    className="w-4 h-4 sm:w-5 sm:h-5 2xl:w-6 2xl:h-6 3xl:w-7 3xl:h-7 text-gray-500 group-hover:text-blue-400 transition-colors duration-300"
                                />
                            </div>
                        </div>
                    </div>

                        {/* Glow overlay on hover - CSS only, no JS animation */}
                        <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(circle_at_center,_rgba(79,200,255,0.08),_transparent_65%)]" />
                        <div className="absolute inset-0 border-2 border-transparent group-hover:border-[#4FC8FF]/40 transition-colors duration-300 pointer-events-none" />
                    </motion.div>
                </Link>
            </motion.div>
        );
    }, [t, animationConfig]);

    return (
        <div className="w-full overflow-visible">
            <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px relative mb-12 overflow-visible"
                layout
                transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
                <AnimatePresence mode="popLayout">
                    {products.map((product, index) => renderProductCard(product, index))}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
