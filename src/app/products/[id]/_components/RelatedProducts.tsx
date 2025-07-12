'use client';

import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '../../_components/types';

interface RelatedProductsProps {
    currentProduct: Product;
    allProducts: Product[];
}

const RelatedProducts = ({ currentProduct, allProducts }: RelatedProductsProps) => {
    // Get related products from the same series, excluding current product
    const relatedProducts = allProducts
        .filter((product) => product.series === currentProduct.series && product.id !== currentProduct.id)
        .slice(0, 3); // Show max 3 related products

    // If no products from same series, show popular products from other series
    const fallbackProducts = allProducts
        .filter((product) => product.id !== currentProduct.id)
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 3);

    const productsToShow = relatedProducts.length > 0 ? relatedProducts : fallbackProducts;

    if (productsToShow.length === 0) return null;

    return (
        <div className="ml-16 sm:ml-20 py-12 sm:py-16 bg-gradient-to-b from-gray-900/30 to-transparent">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    {/* Section Header */}
                    <motion.div
                        className="flex items-center justify-between mb-12"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div>
                            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                                {relatedProducts.length > 0 ? 'More from this Series' : 'You Might Also Like'}
                            </h2>
                            <div className="w-20 h-1 bg-gradient-to-r from-[#4FC8FF] to-[#00D4FF] rounded-full"></div>
                        </div>

                        <Link href="/products">
                            <motion.button
                                className="hidden sm:flex items-center space-x-2 text-[#4FC8FF] hover:text-white transition-colors group"
                                whileHover={{ x: 4 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                            >
                                <span className="font-medium">View All Products</span>
                                <FiArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </motion.button>
                        </Link>
                    </motion.div>

                    {/* Products Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {productsToShow.map((product, index) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.2, duration: 0.6 }}
                            >
                                <Link href={`/products/${product.id}`}>
                                    <motion.div
                                        className="bg-gradient-to-br from-gray-800/50 to-gray-700/30 rounded-2xl overflow-hidden border border-gray-600/30 hover:border-[#4FC8FF]/30 transition-all duration-300 group cursor-pointer"
                                        whileHover={{ scale: 1.03, y: -5 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        {/* Product Image */}
                                        <div className="relative aspect-square bg-gradient-to-br from-gray-900 to-gray-800 p-8">
                                            <Image
                                                src={product.image}
                                                alt={product.name}
                                                fill
                                                className="object-contain transition-transform duration-300 group-hover:scale-110"
                                            />

                                            {/* Series Badge */}
                                            <div className="absolute top-4 left-4 px-3 py-1 bg-[#4FC8FF]/20 border border-[#4FC8FF]/30 rounded-full">
                                                <span className="text-[#4FC8FF] text-xs font-semibold uppercase tracking-wider">
                                                    {product.series.split(' ')[0]}
                                                </span>
                                            </div>

                                            {/* Hover Overlay */}
                                            <motion.div
                                                className="absolute inset-0 bg-[#4FC8FF]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                                initial={false}
                                            />
                                        </div>

                                        {/* Product Info */}
                                        <div className="p-6">
                                            <div className="mb-3">
                                                <span className="text-[#4FC8FF] text-sm font-medium uppercase tracking-wider">
                                                    {product.category}
                                                </span>
                                            </div>

                                            <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#4FC8FF] transition-colors">
                                                {product.name}
                                            </h3>

                                            <p className="text-gray-400 text-sm leading-relaxed mb-4 line-clamp-2">
                                                {product.description}
                                            </p>

                                            {/* View Details Button */}
                                            <motion.div className="flex items-center justify-between" initial={false}>
                                                <span className="text-[#4FC8FF] font-medium text-sm">View Details</span>
                                                <motion.div
                                                    className="p-2 rounded-full bg-[#4FC8FF]/20 group-hover:bg-[#4FC8FF]/30 transition-colors"
                                                    whileHover={{ scale: 1.1, rotate: 45 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <FiArrowRight className="w-4 h-4 text-[#4FC8FF]" />
                                                </motion.div>
                                            </motion.div>
                                        </div>
                                    </motion.div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>

                    {/* Mobile View All Button */}
                    <motion.div
                        className="text-center mt-8 sm:hidden"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                    >
                        <Link href="/products">
                            <motion.button
                                className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#4FC8FF] to-[#00D4FF] text-black font-semibold rounded-lg hover:shadow-lg hover:shadow-[#4FC8FF]/30 transition-all duration-300"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <span>View All Products</span>
                                <FiArrowRight className="w-4 h-4" />
                            </motion.button>
                        </Link>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default RelatedProducts;
