'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowUpRight } from 'react-icons/fi';
import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import { Product } from '../types';

interface ProductGridProps {
    products: Product[];
}

const ProductGrid = ({ products }: ProductGridProps) => {
    const [hoveredProductId, setHoveredProductId] = useState<number | null>(null);

    const renderProductCard = (product: Product, index: number) => {
        const isLastInRow = (index + 1) % 4 === 0;

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
                {/* Vertical Divider - only show if not last in row */}
                {!isLastInRow && (
                    <motion.div
                        className="absolute top-0 right-0 h-full border-r border-gray-700/50 z-10 hidden lg:block"
                        initial={{ scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.8, delay: 0.8 + (index % 4) * 0.1 }}
                    />
                )}

                <motion.div
                    className="relative bg-gray-900/30 hover:bg-gray-800/50 transition-all duration-300 cursor-pointer group overflow-hidden min-h-[320px] xs:min-h-[360px] sm:min-h-[400px] md:min-h-[450px] lg:min-h-[500px] xl:min-h-[600px] flex flex-col rounded-lg lg:rounded-none border-t border-gray-700/50"
                    onMouseEnter={() => setHoveredProductId(product.id)}
                    onMouseLeave={() => setHoveredProductId(null)}
                    whileHover={{
                        y: -5,
                        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                        transition: { duration: 0.3 }
                    }}
                >
                    {/* Video background on hover - Only show on desktop */}
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

                    {/* Vertical Series Label - Responsive positioning */}
                    <motion.div
                        className="absolute left-1 xs:left-2 sm:left-3 md:left-4 top-1/2 -translate-y-1/2 font-bold text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl uppercase tracking-wider xs:tracking-widest text-gray-400 z-10 font-sans"
                        style={{
                            writingMode: 'vertical-rl',
                            transform: 'translateY(-50%) rotate(180deg)'
                        }}
                        whileHover={{
                            color: '#4FC8FF',
                            scale: 1.05,
                            transition: { duration: 0.3 }
                        }}
                    >
                        {product.series}
                    </motion.div>

                    {/* Product Image - Centered - Responsive sizing */}
                    <motion.div
                        className="flex justify-center items-center py-4 xs:py-6 sm:py-8 md:py-10 lg:py-12 flex-1 z-10 relative"
                        whileHover={{ scale: 1.03 }}
                        transition={{ duration: 0.3 }}
                    >
                        <motion.div
                            key={`product-${product.id}`}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{
                                duration: 0.3,
                                ease: 'easeOut'
                            }}
                            className="relative"
                        >
                            <Image
                                src={product.image}
                                alt={product.name}
                                width={0}
                                height={0}
                                sizes="(max-width: 475px) 120px, (max-width: 640px) 150px, (max-width: 768px) 180px, (max-width: 1024px) 200px, 250px"
                                priority={true}
                                className="w-[120px] xs:w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px] xl:w-[250px] h-[120px] xs:h-[140px] sm:h-[160px] md:h-[180px] lg:h-[200px] xl:h-[250px] object-contain transition-opacity duration-200 ease-out"
                            />
                        </motion.div>
                    </motion.div>

                    {/* Content - Responsive typography and spacing */}
                    <motion.div
                        className="px-2 xs:px-3 sm:px-4 md:px-6 pb-3 xs:pb-4 sm:pb-6 md:pb-8 pl-6 xs:pl-8 sm:pl-10 md:pl-12 lg:pl-16 z-10 relative"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 + index * 0.05 }}
                    >
                        <motion.h3
                            className="text-white font-bold text-base xs:text-lg sm:text-xl md:text-2xl mb-1.5 xs:mb-2 md:mb-3 font-sans"
                            whileHover={{
                                color: '#4FC8FF',
                                scale: 1.02,
                                transition: { duration: 0.3 }
                            }}
                        >
                            {product.name}
                        </motion.h3>
                        <p className="text-gray-300 text-xs xs:text-sm sm:text-base leading-relaxed mb-2 xs:mb-3 md:mb-4 font-sans line-clamp-3 sm:line-clamp-none">
                            {product.description}
                        </p>

                        {/* Contact for Information */}
                        <div className="flex justify-between items-center mb-2 xs:mb-3">
                            <div className="flex flex-col">
                                <span className="text-[#4FC8FF] font-semibold text-sm xs:text-base">
                                    Contact for Information
                                </span>
                                <span className="text-gray-400 text-xs">Distributor Product</span>
                            </div>

                            {/* Category Badge */}
                            <motion.span
                                className="bg-gradient-to-r from-gray-700 to-gray-600 text-white text-xs font-medium px-2 py-1 rounded-full uppercase tracking-wide"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.5 + index * 0.1, type: 'spring', stiffness: 500 }}
                            >
                                {product.category}
                            </motion.span>
                        </div>

                        <div className="flex justify-end">
                            <Link href={`/products/${product.id}`}>
                                <motion.div
                                    whileHover={{
                                        scale: 1.15,
                                        rotate: 45,
                                        color: '#4FC8FF'
                                    }}
                                    transition={{ duration: 0.3 }}
                                    className="p-1 xs:p-1.5 sm:p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                                >
                                    <FiArrowUpRight
                                        size={16}
                                        className={clsx(
                                            'transition-colors w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6',
                                            hoveredProductId === product.id ? 'text-blue-400' : 'text-gray-500'
                                        )}
                                    />
                                </motion.div>
                            </Link>
                        </div>
                    </motion.div>

                    {/* Hover border effect */}
                    <motion.div
                        className="absolute inset-0 border-2 border-transparent group-hover:border-[#4FC8FF]/30 rounded-lg lg:rounded-none transition-all duration-500 pointer-events-none"
                        whileHover={{
                            boxShadow: 'inset 0 0 20px rgba(79, 200, 255, 0.1)'
                        }}
                    />
                </motion.div>
            </motion.div>
        );
    };

    return (
        <div className="ml-16 sm:ml-20 mb-16">
            <div className="px-4 sm:px-6 lg:px-8">
                {/* Grid Container with consistent layout */}
                <motion.div
                    className="grid grid-cols-1 lg:grid-cols-4 gap-0 relative"
                    layout
                    transition={{ duration: 0.5, ease: 'easeInOut' }}
                >
                    <AnimatePresence mode="popLayout">
                        {products.map((product, index) => renderProductCard(product, index))}
                    </AnimatePresence>
                </motion.div>
            </div>
        </div>
    );
};

export default ProductGrid;
