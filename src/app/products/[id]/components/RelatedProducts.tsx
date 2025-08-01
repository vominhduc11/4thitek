'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiArrowUpRight } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import type { Product } from '@/types/product';

interface RelatedProductsProps {
    products: Product[];
}

export default function RelatedProducts({ products }: RelatedProductsProps) {
    const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);
    const router = useRouter();

    const handleProductClick = (productId: string) => {
        router.push(`/products/${productId}`);
    };

    return (
        <section className="py-16 px-4 bg-[#0a0f1a]">
            <div className="container mx-auto max-w-[1800px] px-4">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-12 text-center">SẢN PHẨM LIÊN QUAN</h2>

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
                            className="relative bg-gray-900/30 hover:bg-gray-800/50 transition-all duration-300 cursor-pointer group overflow-hidden h-[450px] sm:h-[500px] lg:h-[480px] xl:h-[650px] flex flex-col border-t border-gray-700/50 sm:border-r sm:border-gray-700/50 lg:border-r lg:border-gray-700/50"
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
                                    className="font-bold text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl uppercase tracking-wider xs:tracking-widest text-gray-400 group-hover:text-[#4FC8FF] transition-colors duration-300"
                                    style={{
                                        writingMode: 'vertical-rl',
                                        transform: 'rotate(180deg)'
                                    }}
                                >
                                    PRODUCT
                                </div>
                            </div>

                            {/* Product Image */}
                            <div className="flex justify-center items-center py-4 sm:py-6 lg:py-8 flex-1">
                                <Image
                                    src="/products/product1.png"
                                    alt={product.name}
                                    width={300}
                                    height={300}
                                    className="w-[180px] h-[180px] sm:w-[220px] sm:h-[220px] lg:w-[200px] lg:h-[200px] xl:w-[250px] xl:h-[250px] object-contain"
                                    sizes="(max-width: 640px) 180px, (max-width: 1024px) 220px, (max-width: 1280px) 200px, 250px"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const fallback = document.createElement('div');
                                        fallback.className = 'text-6xl text-gray-500';
                                        fallback.textContent = '🎧';
                                        target.parentNode?.appendChild(fallback);
                                    }}
                                />
                            </div>

                            {/* Content */}
                            <div className="px-6 sm:px-8 lg:px-12 pb-4 sm:pb-6 lg:pb-8">
                                <h3 className="text-white font-bold text-sm sm:text-base lg:text-xl mb-2 sm:mb-3 font-sans group-hover:text-[#4FC8FF] transition-colors duration-300">
                                    {product.name}
                                </h3>
                                <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mb-2 sm:mb-4 font-sans line-clamp-2">
                                    {product.description}
                                </p>

                                <div className="flex justify-end">
                                    <FiArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-[#4FC8FF] group-hover:scale-110 group-hover:rotate-45 transition-all duration-300" />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
