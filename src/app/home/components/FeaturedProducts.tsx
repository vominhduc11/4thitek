'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowUpRight } from 'react-icons/fi';
import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import AvoidSidebar from '@/components/layout/AvoidSidebar';
// import { useLanguage } from '@/contexts/LanguageContext';

interface FeaturedProduct {
    id: string;
    name: string;
    category: string;
    description: string;
    image: string;
}

const featuredProducts: FeaturedProduct[] = [
    {
        id: 'sx-pro-elite',
        name: 'TUNECORE SX Pro Elite',
        category: 'Gaming Headsets',
        description: 'Professional Gaming Headset với driver 50mm và công nghệ noise cancelling tiên tiến',
        image: '/products/product1.png'
    },
    {
        id: 'gx-wireless-pro',
        name: 'TUNECORE GX Wireless Pro',
        category: 'Wireless Headsets',
        description: 'Wireless Gaming Headset với kết nối 2.4GHz và thời lượng pin 30 giờ',
        image: '/products/product1.png'
    },
    {
        id: 'hx-studio-master',
        name: 'TUNECORE HX Studio Master',
        category: 'Professional Audio',
        description: 'Professional Studio Headphones với driver planar magnetic chất lượng cao',
        image: '/products/product1.png'
    },
    {
        id: 'mx-sport-elite',
        name: 'TUNECORE MX Sport Elite',
        category: 'Wireless Headsets',
        description: 'Sport Wireless Earbuds với khả năng chống nước IPX7 và sạc nhanh',
        image: '/products/product1.png'
    }
];

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
                    console.error('Product image failed to load:', src);
                    setImageError(true);
                    setIsLoading(false);
                }}
            />
        </div>
    );
}

export default function FeaturedProducts() {
    const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);
    // const { language } = useLanguage();

    const handleViewAllProducts = () => {
        window.location.href = '/products';
    };

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
                className="relative w-full"
            >
                <motion.div
                    className="relative bg-gradient-to-b from-gray-900/40 to-gray-800/60 hover:from-gray-800/60 hover:to-gray-700/70 transition-all duration-500 cursor-pointer group overflow-hidden h-[600px] grid grid-rows-[auto_1fr_auto] border border-gray-700/30 hover:border-[#4FC8FF]/30 shadow-lg hover:shadow-2xl hover:shadow-[#4FC8FF]/10"
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
                        PRODUCT
                    </motion.div>

                    <motion.div
                        className="flex justify-center items-center py-8 px-8 z-10 relative"
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
                                className="w-[300px] h-[300px] object-contain transition-opacity duration-200 ease-out"
                            />
                        </motion.div>
                    </motion.div>

                    <motion.div
                        className="px-6 sm:px-8 pb-8 pt-4 z-10 relative flex flex-col h-full"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 + index * 0.05 }}
                    >
                        <Link href={`/products/${product.id}`}>
                            <motion.h3
                                className="text-white font-bold text-lg sm:text-xl mb-3 font-sans h-[3rem] flex items-center cursor-pointer"
                                whileHover={{
                                    color: '#4FC8FF',
                                    scale: 1.02,
                                    transition: { duration: 0.3 }
                                }}
                            >
                                <span className="line-clamp-2">{product.name}</span>
                            </motion.h3>
                        </Link>
                        <p className="text-gray-300 text-sm leading-relaxed mb-4 font-sans line-clamp-2 h-[2.5rem] flex-shrink-0">
                            {product.description}
                        </p>

                        <div className="flex-grow"></div>

                        <div className="flex justify-end">
                            <Link href={`/products/${product.id}`}>
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
                            </Link>
                        </div>
                    </motion.div>

                    <motion.div
                        className="absolute inset-0 border-2 border-transparent group-hover:border-[#4FC8FF]/40 transition-all duration-500 pointer-events-none"
                        whileHover={{
                            boxShadow: 'inset 0 0 30px rgba(79, 200, 255, 0.15), 0 0 40px rgba(79, 200, 255, 0.1)'
                        }}
                    />
                </motion.div>
            </motion.div>
        );
    };

    return (
        <AvoidSidebar>
            <section className="py-16 md:py-24 bg-[#0c131d] relative overflow-hidden">
                <div className="container mx-auto px-4 max-w-[1800px]">
                    {/* Header */}
                    <div className="text-center mb-12 md:mb-16">
                        <motion.h2
                            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            Sản phẩm tiêu biểu
                        </motion.h2>
                        <motion.p
                            className="text-gray-400 text-lg max-w-2xl mx-auto"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            Khám phá những sản phẩm âm thanh hàng đầu được lựa chọn đặc biệt
                        </motion.p>
                    </div>

                    {/* Products Grid */}
                    <div className="w-full">
                        <motion.div
                            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-x divide-gray-700/30 relative mb-12"
                            layout
                            transition={{ duration: 0.5, ease: 'easeInOut' }}
                        >
                            <AnimatePresence mode="popLayout">
                                {featuredProducts.map((product, index) => renderProductCard(product, index))}
                            </AnimatePresence>
                        </motion.div>
                    </div>

                    {/* View All Button */}
                    <motion.div
                        className="text-center"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                    >
                        <motion.button
                            onClick={handleViewAllProducts}
                            className="group relative bg-transparent hover:bg-gradient-to-r hover:from-[#4FC8FF] hover:to-[#3BA5CC] text-white px-10 py-4 rounded-lg font-medium transition-all duration-300 inline-flex items-center gap-3 shadow-lg hover:shadow-xl overflow-hidden border border-[#4FC8FF]/50 hover:border-[#4FC8FF]"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-[#4FC8FF] to-[#3BA5CC] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <span className="relative z-10 text-base">Xem tất cả sản phẩm</span>
                            <motion.div
                                className="relative z-10"
                                whileHover={{ rotate: 45 }}
                                transition={{ duration: 0.3 }}
                            >
                                <FiArrowUpRight className="w-5 h-5" />
                            </motion.div>
                        </motion.button>
                    </motion.div>
                </div>
            </section>
        </AvoidSidebar>
    );
}