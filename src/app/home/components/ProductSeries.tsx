'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowRight, FiStar, FiPackage, FiShield } from 'react-icons/fi';
import Image from 'next/image';
import Link from 'next/link';
import { products } from '@/data/products';
import type { Product } from '@/types/product';

export default function ProductSeries() {
    const [selectedProduct, setSelectedProduct] = useState<Product>(products[0]);
    const featuredProducts = products.slice(0, 6); // Show first 6 products as featured

    return (
        <section className="bg-[#0c131d] text-white py-16 lg:py-24 relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f1a] via-[#0c131d] to-[#1a1f2e] opacity-50"></div>
            <div className="absolute top-20 right-10 w-96 h-96 bg-[#4FC8FF]/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-20 left-10 w-80 h-80 bg-[#00D4FF]/5 rounded-full blur-3xl"></div>

            <div className="ml-16 sm:ml-20 mr-4 sm:mr-12 md:mr-16 lg:mr-20 px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <motion.div
                        className="text-center mb-16"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 font-mono">
                            PRODUCT{' '}
                            <span className="bg-gradient-to-r from-[#4FC8FF] to-[#00D4FF] bg-clip-text text-transparent">
                                SHOWCASE
                            </span>
                        </h2>
                        <div className="w-32 h-1 bg-gradient-to-r from-[#4FC8FF] to-[#00D4FF] mx-auto rounded-full mb-6"></div>
                        <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                            Khám phá bộ sưu tập sản phẩm âm thanh hàng đầu của 4THITEK - từng SKU được thiết kế tỉ mỉ
                            cho trải nghiệm hoàn hảo
                        </p>
                    </motion.div>

                    {/* Product Navigation */}
                    <motion.div
                        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-16"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        viewport={{ once: true }}
                    >
                        {featuredProducts.map((product, index) => {
                            const isSelected = selectedProduct.id === product.id;

                            return (
                                <motion.button
                                    key={product.id}
                                    onClick={() => setSelectedProduct(product)}
                                    className={`relative p-4 rounded-xl border transition-all duration-300 overflow-hidden group ${
                                        isSelected
                                            ? 'border-[#4FC8FF] bg-[#4FC8FF]/10'
                                            : 'border-gray-600 hover:border-[#4FC8FF]/50'
                                    }`}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    {/* Product Image */}
                                    <div className="aspect-square mb-3 flex items-center justify-center">
                                        <Image
                                            src={product.images[0]?.url || '/products/product1.png'}
                                            alt={product.name}
                                            width={80}
                                            height={80}
                                            className="object-contain opacity-70 group-hover:opacity-100 transition-opacity"
                                        />
                                    </div>

                                    {/* Product Info */}
                                    <div className="text-center">
                                        <h4
                                            className={`text-xs font-medium mb-1 line-clamp-2 ${
                                                isSelected ? 'text-[#4FC8FF]' : 'text-gray-300 group-hover:text-white'
                                            }`}
                                        >
                                            {product.name.replace('TUNECORE ', '')}
                                        </h4>
                                        <p className="text-xs text-gray-500 line-clamp-1">{product.sku}</p>
                                    </div>

                                    {/* Selected Indicator */}
                                    {isSelected && (
                                        <motion.div
                                            className="absolute top-2 right-2 w-3 h-3 bg-[#4FC8FF] rounded-full"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    )}
                                </motion.button>
                            );
                        })}
                    </motion.div>

                    {/* Selected Product Content */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedProduct.id}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            transition={{ duration: 0.5 }}
                            className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center"
                        >
                            {/* Product Info */}
                            <div className="space-y-8">
                                <div>
                                    <motion.h3
                                        className="text-3xl sm:text-4xl font-bold mb-4 text-[#4FC8FF]"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        {selectedProduct.name}
                                    </motion.h3>
                                    <motion.p
                                        className="text-lg text-gray-300 leading-relaxed mb-6"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.3 }}
                                    >
                                        {selectedProduct.description}
                                    </motion.p>
                                </div>

                                {/* Product Details */}
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <motion.div
                                            className="flex items-center space-x-3 p-4 bg-gray-800/30 rounded-xl border border-gray-700/30"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.4 }}
                                        >
                                            <FiPackage className="w-5 h-5 text-[#4FC8FF]" />
                                            <div>
                                                <p className="text-xs text-gray-400">SKU</p>
                                                <p className="font-medium text-white">{selectedProduct.sku}</p>
                                            </div>
                                        </motion.div>

                                        <motion.div
                                            className="flex items-center space-x-3 p-4 bg-gray-800/30 rounded-xl border border-gray-700/30"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.5 }}
                                        >
                                            <FiStar className="w-5 h-5 text-[#4FC8FF]" />
                                            <div>
                                                <p className="text-xs text-gray-400">Rating</p>
                                                <p className="font-medium text-white">{selectedProduct.rating}/5.0</p>
                                            </div>
                                        </motion.div>
                                    </div>

                                    <motion.div
                                        className="p-4 bg-gray-800/30 rounded-xl border border-gray-700/30"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.6 }}
                                    >
                                        <div className="flex items-center space-x-3 mb-3">
                                            <FiShield className="w-5 h-5 text-[#4FC8FF]" />
                                            <p className="font-medium text-white">
                                                Warranty: {selectedProduct.warranty.period}
                                            </p>
                                        </div>
                                        <p className="text-sm text-gray-400">{selectedProduct.subtitle}</p>
                                    </motion.div>
                                </div>

                                {/* Product Highlights */}
                                <div className="space-y-3">
                                    <h4 className="text-lg font-semibold text-white">Key Features:</h4>
                                    {selectedProduct.highlights.slice(0, 3).map((highlight, index) => (
                                        <motion.div
                                            key={index}
                                            className="flex items-center space-x-3"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.7 + index * 0.1 }}
                                        >
                                            <div className="w-2 h-2 bg-[#4FC8FF] rounded-full"></div>
                                            <p className="text-gray-300">{highlight}</p>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Action Buttons */}
                                <motion.div
                                    className="flex space-x-4"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.8 }}
                                >
                                    <Link href={`/products/${selectedProduct.id}`}>
                                        <motion.button
                                            className="group flex items-center space-x-3 bg-gradient-to-r from-[#4FC8FF] to-[#00D4FF] text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 hover:shadow-lg hover:shadow-[#4FC8FF]/25"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <span>View Details</span>
                                            <FiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </motion.button>
                                    </Link>

                                    <Link href="/products">
                                        <motion.button
                                            className="px-6 py-3 border border-gray-600 text-gray-300 rounded-xl font-medium hover:border-[#4FC8FF]/50 hover:text-white transition-all duration-300"
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            View All
                                        </motion.button>
                                    </Link>
                                </motion.div>
                            </div>

                            {/* Product Preview */}
                            <motion.div
                                className="relative"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3 }}
                            >
                                <div className="relative bg-gradient-to-br from-gray-800/40 to-gray-900/60 rounded-3xl p-8 lg:p-12 border border-gray-700/30 overflow-hidden">
                                    {/* Background Effect */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-[#4FC8FF]/5 to-[#00D4FF]/5 rounded-3xl"></div>

                                    {/* Product Image */}
                                    <div className="relative z-10 flex justify-center items-center h-80">
                                        <motion.div
                                            key={selectedProduct.id}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.5 }}
                                            className="relative"
                                        >
                                            <Image
                                                src={selectedProduct.images[0]?.url || '/products/product1.png'}
                                                alt={selectedProduct.name}
                                                width={300}
                                                height={300}
                                                className="object-contain drop-shadow-2xl"
                                            />

                                            {/* Floating Elements */}
                                            <motion.div
                                                className="absolute -top-4 -right-4 w-8 h-8 bg-[#4FC8FF]/20 rounded-full"
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            />
                                            <motion.div
                                                className="absolute -bottom-6 -left-6 w-6 h-6 bg-[#00D4FF]/20 rounded-full"
                                                animate={{ scale: [1, 1.3, 1] }}
                                                transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
                                            />
                                        </motion.div>
                                    </div>

                                    {/* Product SKU Badge */}
                                    <motion.div
                                        className="absolute top-6 right-6 bg-[#4FC8FF]/10 backdrop-blur-sm border border-[#4FC8FF]/20 rounded-xl px-4 py-2"
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: 0.5 }}
                                    >
                                        <span className="text-[#4FC8FF] font-semibold text-sm">
                                            {selectedProduct.sku}
                                        </span>
                                    </motion.div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </section>
    );
}
