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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0">
                        {products.map((product, index) => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: index * 0.1, type: 'spring', stiffness: 120, damping: 20 }}
                            whileHover={{
                                y: -5,
                                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                                borderColor: 'rgba(79, 200, 255, 0.3)'
                            }}
                            onMouseEnter={() => setHoveredProductId(product.id)}
                            onMouseLeave={() => setHoveredProductId(null)}
                            onClick={() => handleProductClick(product.id)}
                            className="relative bg-gray-900/30 hover:bg-gray-800/50 transition-all duration-300 cursor-pointer group overflow-hidden h-[450px] sm:h-[500px] lg:h-[480px] xl:h-[650px] 2xl:h-[750px] 3xl:h-[850px] 4xl:h-[950px] 5xl:h-[1050px] flex flex-col border-t border-gray-700/50 sm:border-r sm:border-gray-700/50 lg:border-r lg:border-gray-700/50"
                        >
                            {/* Background Video */}
                            {hoveredProductId === product.id && (
                                <div className="absolute inset-0 z-[1]">
                                    <video
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                        className="w-full h-full object-cover opacity-20"
                                    >
                                        <source
                                            src="/videos/futuristic-background-2022-08-04-19-57-56-utc.mp4"
                                            type="video/mp4"
                                        />
                                    </video>
                                </div>
                            )}

                            {/* Series Label */}
                            <div className="absolute left-2 sm:left-4 lg:left-6 top-2 sm:top-3 lg:top-4 z-20">
                                <div
                                    className="font-bold text-sm xs:text-base sm:text-lg md:text-xl lg:text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl 5xl:text-6xl uppercase tracking-wider xs:tracking-widest text-gray-400 group-hover:text-[#4FC8FF] transition-colors duration-300"
                                    style={{
                                        writingMode: 'vertical-rl',
                                        transform: 'rotate(180deg)'
                                    }}
                                >
                                    PRODUCT
                                </div>
                            </div>

                            {/* Product Image */}
                            <div className="flex justify-center items-center py-4 sm:py-6 lg:py-8 flex-1 relative z-30">
                                <Image
                                    src={product.featuredImage || '/products/product1.png'}
                                    alt={product.name}
                                    width={300}
                                    height={300}
                                    className="w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] lg:w-[200px] lg:h-[200px] xl:w-[250px] xl:h-[250px] 2xl:w-[300px] 2xl:h-[300px] 3xl:w-[350px] 3xl:h-[350px] 4xl:w-[400px] 4xl:h-[400px] 5xl:w-[450px] 5xl:h-[450px] object-contain relative z-30"
                                    sizes="(max-width: 640px) 180px, (max-width: 1024px) 220px, (max-width: 1280px) 200px, (max-width: 1536px) 250px, (max-width: 1792px) 300px, (max-width: 2048px) 350px, (max-width: 3200px) 400px, 450px"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = '/products/product1.png';
                                    }}
                                />
                            </div>

                            {/* Content */}
                            <div className="px-6 sm:px-8 lg:px-12 2xl:px-14 3xl:px-16 4xl:px-20 5xl:px-24 pb-4 sm:pb-6 lg:pb-8 2xl:pb-10 3xl:pb-12 4xl:pb-16 5xl:pb-20">
                                <h3 className="text-white font-bold text-sm sm:text-base lg:text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl 5xl:text-5xl mb-2 sm:mb-3 2xl:mb-4 3xl:mb-5 4xl:mb-6 5xl:mb-8 font-sans group-hover:text-[#4FC8FF] transition-colors duration-300">
                                    {product.name}
                                </h3>
                                <p className="text-gray-300 text-xs sm:text-sm md:text-base lg:text-base xl:text-lg 2xl:text-xl 3xl:text-2xl 4xl:text-3xl 5xl:text-4xl leading-relaxed mb-2 sm:mb-4 2xl:mb-5 3xl:mb-6 4xl:mb-8 5xl:mb-10 font-sans line-clamp-2">
                                    {product.description}
                                </p>

                                <div className="flex justify-end">
                                    <FiArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 xl:w-7 xl:h-7 2xl:w-8 2xl:h-8 3xl:w-10 3xl:h-10 4xl:w-12 4xl:h-12 5xl:w-14 5xl:h-14 text-gray-400 group-hover:text-[#4FC8FF] group-hover:scale-110 group-hover:rotate-45 transition-all duration-300" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
