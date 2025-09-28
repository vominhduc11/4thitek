'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiArrowUpRight } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import type { Product } from '@/types/product';

interface RelatedProductsProps {
    products: Product[];
}

export default function RelatedProducts({ products }: RelatedProductsProps) {
    const { t } = useLanguage();
    const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);
    const router = useRouter();

    const handleProductClick = (productId: string) => {
        router.push(`/products/${productId}`);
    };

    return (
        <section className="py-16 bg-[#0a0f1a]">
            <div className="container mx-auto max-w-[1800px] px-4 relative py-4 pb-2 pt-8 sm:-mt-8 md:-mt-8">
                <h2 className="text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl 3xl:text-6xl 4xl:text-7xl 5xl:text-8xl font-bold text-white mb-12 2xl:mb-16 3xl:mb-20 4xl:mb-24 5xl:mb-28 text-center">{t('products.detail.relatedProducts')}</h2>

                {/* Inner container to match breadcrumb content alignment */}
                <div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px overflow-visible">
                        {products.map((product, index) => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{
                                duration: 0.6,
                                delay: Math.min(index * 0.1, 0.5),
                                ease: 'easeOut'
                            }}
                            style={{ willChange: 'transform, opacity' }}
                            className="relative w-full"
                        >
                            <motion.div
                                className="relative bg-gradient-to-b from-gray-900/40 to-gray-800/60 hover:from-gray-800/60 hover:to-gray-700/70 transition-all duration-500 cursor-pointer group overflow-hidden h-[380px] sm:h-[420px] md:h-[460px] lg:h-[480px] xl:h-[500px] 2xl:h-[620px] 3xl:h-[680px] 4xl:h-[720px] 5xl:h-[800px] grid grid-rows-[auto_1fr_auto] border border-gray-700/30 hover:border-[#4FC8FF]/40 shadow-lg hover:shadow-2xl hover:shadow-[#4FC8FF]/20 backdrop-blur-sm"
                                onMouseEnter={() => setHoveredProductId(product.id)}
                                onMouseLeave={() => setHoveredProductId(null)}
                                onClick={() => handleProductClick(product.id)}
                                whileHover={{
                                    y: -8,
                                    scale: 1.02,
                                    boxShadow: '0 20px 40px rgba(79, 200, 255, 0.15), 0 0 30px rgba(79, 200, 255, 0.1)',
                                    transition: { duration: 0.3, ease: 'easeOut' }
                                }}
                                whileTap={{ scale: 0.98 }}
                            >
                            {/* Video background animation on hover */}
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
                                    <Image
                                        src={product.images?.[0]?.url || '/products/product1.png'}
                                        alt={product.name}
                                        width={200}
                                        height={200}
                                        sizes="200px"
                                        priority={true}
                                        className="w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] md:w-[180px] md:h-[180px] lg:w-[200px] lg:h-[200px] xl:w-[220px] xl:h-[220px] 2xl:w-[280px] 2xl:h-[280px] 3xl:w-[320px] 3xl:h-[320px] 4xl:w-[360px] 4xl:h-[360px] 5xl:w-[400px] 5xl:h-[400px] object-contain transition-opacity duration-200 ease-out"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = '/products/product1.png';
                                        }}
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
                                    {product.description}
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
                                            className="transition-colors w-4 h-4 sm:w-5 sm:h-5 lg:w-4 lg:h-4 xl:w-5 xl:h-5 2xl:w-6 2xl:h-6 3xl:w-7 3xl:h-7 4xl:w-8 4xl:h-8 text-gray-500 group-hover:text-blue-400"
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
                        </motion.div>
                    ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
