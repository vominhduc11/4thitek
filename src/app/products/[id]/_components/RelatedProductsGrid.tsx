'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '../../_components/types';

interface RelatedProductsGridProps {
    currentProduct: Product;
    allProducts: Product[];
}

const RelatedProductsGrid = ({ currentProduct, allProducts }: RelatedProductsGridProps) => {
    // Get 4 related products from different series
    const getRelatedProducts = () => {
        const seriesOrder = ['S SERIES', 'G SERIES', 'G+ SERIES', 'SX SERIES'];
        const relatedProducts: Product[] = [];

        // Get one product from each series (excluding current product)
        seriesOrder.forEach((series) => {
            const product = allProducts.find((p) => p.series === series && p.id !== currentProduct.id);
            if (product) {
                relatedProducts.push(product);
            }
        });

        // Fill remaining slots if needed
        while (relatedProducts.length < 4) {
            const remaining = allProducts.filter(
                (p) => p.id !== currentProduct.id && !relatedProducts.some((rp) => rp.id === p.id)
            );
            if (remaining.length > 0) {
                relatedProducts.push(remaining[0]);
            } else {
                break;
            }
        }

        return relatedProducts.slice(0, 4);
    };

    const relatedProducts = getRelatedProducts();

    return (
        <div className="relative py-20 bg-gradient-to-b from-[#0a0f1a] to-gray-900">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#4FC8FF]/5 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8">
                {/* Section Title */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-wider">
                        RELATED <span className="text-[#4FC8FF]">PRODUCT</span>
                    </h2>
                    <div className="w-24 h-1 bg-gradient-to-r from-[#4FC8FF] to-[#00D4FF] mx-auto rounded-full"></div>
                </motion.div>

                {/* Products Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {relatedProducts.map((product, index) => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 50 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            viewport={{ once: true }}
                        >
                            <Link href={`/products/${product.id}`}>
                                <motion.div
                                    className="group relative bg-gradient-to-br from-gray-900/80 to-gray-800/40 backdrop-blur-sm rounded-2xl overflow-hidden border border-gray-700/50 hover:border-[#4FC8FF]/50 transition-all duration-500 cursor-pointer"
                                    whileHover={{ y: -10, scale: 1.02 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    {/* Product Image */}
                                    <div className="relative aspect-square bg-gradient-to-br from-gray-800 to-gray-900 p-8">
                                        <Image
                                            src={product.image}
                                            alt={product.name}
                                            fill
                                            className="object-contain transition-transform duration-500 group-hover:scale-110"
                                        />

                                        {/* Hover Glow Effect */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-[#4FC8FF]/10 to-[#00D4FF]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                                        {/* Series Badge */}
                                        <div className="absolute top-4 left-4 bg-[#4FC8FF]/20 backdrop-blur-sm px-3 py-1 rounded-full border border-[#4FC8FF]/30">
                                            <span className="text-[#4FC8FF] text-xs font-bold uppercase tracking-wider">
                                                {product.series.split(' ')[0]}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Product Info */}
                                    <div className="p-6">
                                        {/* Category */}
                                        <div className="mb-3">
                                            <span className="text-gray-400 text-sm uppercase tracking-wider">
                                                {product.category}
                                            </span>
                                        </div>

                                        {/* Product Name */}
                                        <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#4FC8FF] transition-colors">
                                            {product.name}
                                        </h3>

                                        {/* Description */}
                                        <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-2">
                                            {product.description}
                                        </p>

                                        {/* Series Label */}
                                        <div className="flex items-center justify-between">
                                            <span className="text-[#4FC8FF] font-semibold text-sm">
                                                {product.series.replace(' SERIES', ' Series')}
                                            </span>

                                            {/* Arrow Icon */}
                                            <motion.div
                                                className="w-8 h-8 bg-[#4FC8FF]/20 rounded-full flex items-center justify-center group-hover:bg-[#4FC8FF]/30 transition-colors"
                                                whileHover={{ scale: 1.1, rotate: 45 }}
                                                transition={{ duration: 0.2 }}
                                            >
                                                <svg
                                                    className="w-4 h-4 text-[#4FC8FF]"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M7 17L17 7M17 7H7M17 7V17"
                                                    />
                                                </svg>
                                            </motion.div>
                                        </div>
                                    </div>

                                    {/* Bottom Accent Line */}
                                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#4FC8FF] to-[#00D4FF] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                                </motion.div>
                            </Link>
                        </motion.div>
                    ))}
                </div>

                {/* View All Products Button */}
                <motion.div
                    className="text-center mt-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    viewport={{ once: true }}
                >
                    <Link href="/products">
                        <motion.button
                            className="bg-gradient-to-r from-[#4FC8FF] to-[#00D4FF] text-black font-bold px-8 py-4 rounded-full text-lg tracking-wider shadow-lg shadow-[#4FC8FF]/30 hover:shadow-xl hover:shadow-[#4FC8FF]/50 transition-all duration-300"
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            VIEW ALL PRODUCTS
                        </motion.button>
                    </Link>
                </motion.div>
            </div>
        </div>
    );
};

export default RelatedProductsGrid;
