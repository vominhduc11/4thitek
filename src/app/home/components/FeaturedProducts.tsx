'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowUpRight } from 'react-icons/fi';
import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
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
                <Link href={`/products/${product.id}`}>
                    <motion.div
                        className="relative bg-gradient-to-b from-gray-900/40 to-gray-800/60 hover:from-gray-800/60 hover:to-gray-700/70 transition-all duration-500 cursor-pointer group overflow-hidden h-[380px] sm:h-[420px] md:h-[460px] lg:h-[480px] xl:h-[500px] 2xl:h-[620px] 3xl:h-[680px] 4xl:h-[720px] grid grid-rows-[auto_1fr_auto] border border-gray-700/30 hover:border-[#4FC8FF]/30 shadow-lg hover:shadow-2xl hover:shadow-[#4FC8FF]/10"
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
                            PRODUCT
                        </div>
                    </motion.div>

                    <motion.div
                        className="flex justify-center items-center py-4 sm:py-5 md:py-6 lg:py-6 xl:py-6 2xl:py-8 3xl:py-10 4xl:py-12 px-4 sm:px-5 md:px-6 lg:px-6 xl:px-6 2xl:px-8 3xl:px-10 4xl:px-12 z-10 relative"
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
                                className="w-[140px] h-[140px] sm:w-[160px] sm:h-[160px] md:w-[180px] md:h-[180px] lg:w-[200px] lg:h-[200px] xl:w-[220px] xl:h-[220px] 2xl:w-[280px] 2xl:h-[280px] 3xl:w-[320px] 3xl:h-[320px] 4xl:w-[360px] 4xl:h-[360px] object-contain transition-opacity duration-200 ease-out"
                            />
                        </motion.div>
                    </motion.div>

                    <motion.div
                        className="px-4 sm:px-5 md:px-6 lg:px-6 xl:px-6 2xl:px-8 3xl:px-10 4xl:px-12 pb-6 sm:pb-7 md:pb-8 lg:pb-8 xl:pb-8 2xl:pb-8 3xl:pb-10 4xl:pb-12 pt-2 sm:pt-3 md:pt-3 lg:pt-3 xl:pt-3 2xl:pt-4 3xl:pt-5 4xl:pt-6 z-10 relative flex flex-col h-full"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 + index * 0.05 }}
                    >
                            <motion.h3
                                className="text-white font-bold text-base sm:text-lg md:text-xl lg:text-xl xl:text-2xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl mb-2 sm:mb-3 md:mb-3 lg:mb-3 xl:mb-3 2xl:mb-4 3xl:mb-5 4xl:mb-6 font-sans h-[2.5rem] sm:h-[3rem] md:h-[3rem] lg:h-[3rem] xl:h-[3rem] 2xl:h-[3.5rem] 3xl:h-[4rem] 4xl:h-[4.5rem] flex items-center cursor-pointer"
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
                                        className={clsx(
                                            'transition-colors w-4 h-4 sm:w-5 sm:h-5 lg:w-4 lg:h-4 xl:w-5 xl:h-5 2xl:w-6 2xl:h-6 3xl:w-7 3xl:h-7 4xl:w-8 4xl:h-8',
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
        <section className="py-16 md:py-24 bg-[#0c131d] relative overflow-hidden">
            <div className="ml-16 sm:ml-20 pl-1 sm:pl-2 md:pl-2 lg:pl-3 xl:pl-4 2xl:pl-6 pr-1 sm:pr-2 md:pr-2 lg:pr-3 xl:pr-4 2xl:pr-6 -mt-32 md:-mt-40 lg:-mt-48 relative z-[100] pt-40 md:pt-48 lg:pt-56">
                {/* Header */}
                <div className="text-center mb-12 md:mb-16">
                    <motion.h2
                        className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4"
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
                        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 divide-x divide-gray-700/30 relative mb-12"
                        layout
                        transition={{ duration: 0.5, ease: 'easeInOut' }}
                    >
                        <AnimatePresence mode="popLayout">
                            {featuredProducts.map((product, index) => renderProductCard(product, index))}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
