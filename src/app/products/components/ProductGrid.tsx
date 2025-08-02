'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowUpRight } from 'react-icons/fi';
import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import type { Product } from '@/types/product';
import { useLanguage } from '@/contexts/LanguageContext';
import { ANIMATION_SCALE, ANIMATION_DURATION } from '@/constants/animations';

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

interface ProductGridProps {
    products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
    const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);
    const { t } = useLanguage();

    const renderProductCard = (product: Product, index: number) => {
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
                className="relative w-full"
            >
                <Link href={`/products/${product.id}`}>
                    <motion.div
                        className="relative bg-gradient-to-b from-gray-900/40 to-gray-800/60 hover:from-gray-800/60 hover:to-gray-700/70 transition-all duration-500 cursor-pointer group overflow-hidden h-[600px] sm:h-[480px] md:h-[480px] 2xl:h-[650px] 3xl:h-[700px] 4xl:h-[750px] grid grid-rows-[auto_1fr_auto] border border-gray-700/30 hover:border-[#4FC8FF]/30 shadow-lg hover:shadow-2xl hover:shadow-[#4FC8FF]/10"
                        onMouseEnter={() => setHoveredProductId(product.id)}
                        onMouseLeave={() => setHoveredProductId(null)}
                        whileHover={{
                            y: -5,
                            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                            transition: { duration: 0.3 }
                        }}
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
                        className="absolute left-1 xs:left-2 sm:left-3 md:left-4 top-1/2 -translate-y-1/2 font-bold text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl uppercase tracking-wider xs:tracking-widest text-gray-400 z-10 font-sans"
                        style={{
                            writingMode: 'vertical-rl',
                            transform: 'translateY(-50%) translateY(-60px) rotate(180deg)'
                        }}
                        whileHover={{
                            color: '#4FC8FF',
                            scale: 1.05,
                            transition: { duration: 0.3 }
                        }}
                    >
                        {t('products.featured.product')}
                    </motion.div>

                    <motion.div
                        className="flex justify-center items-center py-8 px-8 sm:py-5 sm:px-5 md:py-4 md:px-4 z-10 relative"
                        whileHover={{ scale: ANIMATION_SCALE.hover }}
                        transition={{ duration: ANIMATION_DURATION.normal }}
                    >
                        <motion.div
                            key={`product-${product.id}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, ease: 'easeOut' }}
                            className="relative"
                        >
                            <ProductImageWithFallback
                                src="/products/product1.png"
                                alt={product.name}
                                className="w-[300px] h-[300px] sm:w-[180px] sm:h-[180px] md:w-[200px] md:h-[200px] 2xl:w-[320px] 2xl:h-[320px] 3xl:w-[340px] 3xl:h-[340px] 4xl:w-[360px] 4xl:h-[360px] object-contain transition-opacity duration-200 ease-out"
                            />
                        </motion.div>
                    </motion.div>

                    <motion.div
                        className="px-6 sm:px-8 pb-8 pt-4 z-10 relative flex flex-col h-full"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 + index * 0.05 }}
                    >
                            <motion.h3
                                className="text-white font-bold text-lg sm:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl mb-3 font-sans h-[3rem] 2xl:h-[3.5rem] 3xl:h-[4rem] 4xl:h-[4.5rem] flex items-center cursor-pointer"
                                whileHover={{
                                    color: '#4FC8FF',
                                    scale: 1.02,
                                    transition: { duration: 0.3 }
                                }}
                            >
                                <span className="line-clamp-2">{product.name}</span>
                            </motion.h3>
                        <p className="text-gray-300 text-sm 2xl:text-base 3xl:text-lg 4xl:text-xl leading-relaxed mb-4 font-sans line-clamp-2 h-[2.5rem] 2xl:h-[3rem] 3xl:h-[3.5rem] 4xl:h-[4rem] flex-shrink-0">
                            {product.description}
                        </p>

                        <div className="flex-grow"></div>

                        <div className="flex justify-end">
                                <motion.div
                                    whileHover={{
                                        scale: 1.15,
                                        rotate: 45,
                                        color: '#4FC8FF'
                                    }}
                                    transition={{ duration: 0.3 }}
                                    className="p-3 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                                >
                                    <FiArrowUpRight
                                        size={20}
                                        className={clsx(
                                            'transition-colors w-5 h-5',
                                            hoveredProductId === product.id ? 'text-blue-400' : 'text-gray-500'
                                        )}
                                    />
                                </motion.div>
                        </div>
                    </motion.div>

                        <motion.div
                            className="absolute inset-0 border-2 border-transparent group-hover:border-[#4FC8FF]/40 transition-all duration-500 pointer-events-none"
                            whileHover={{
                                boxShadow: 'inset 0 0 30px rgba(79, 200, 255, 0.15), 0 0 40px rgba(79, 200, 255, 0.1)'
                            }}
                        />
                    </motion.div>
                </Link>
            </motion.div>
        );
    };

    return (
        <div className="w-full">
            <motion.div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-x divide-gray-700/30 relative"
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
