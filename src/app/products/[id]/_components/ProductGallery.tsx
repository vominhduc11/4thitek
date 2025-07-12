'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft, FiChevronRight, FiMaximize2 } from 'react-icons/fi';
import Image from 'next/image';
import { Product } from '../../_components/types';

interface ProductGalleryProps {
    product: Product;
}

const ProductGallery = ({ product }: ProductGalleryProps) => {
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Gallery images - using actual product detail images
    const galleryImages = [
        product.image, // Main product image
        '/productDetails/image1.png', // Actual detail image
        '/products/product2.png', // Fallback images
        '/products/product3.png'
    ];

    const nextImage = () => {
        setActiveImageIndex((prev) => (prev + 1) % galleryImages.length);
    };

    const prevImage = () => {
        setActiveImageIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
    };

    return (
        <div className="ml-16 sm:ml-20 py-12 sm:py-16">
            <div className="px-4 sm:px-6 lg:px-8">
                <motion.div
                    className="max-w-6xl mx-auto"
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    {/* Section Title */}
                    <motion.div
                        className="text-center mb-12"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Product Gallery</h2>
                        <div className="w-20 h-1 bg-gradient-to-r from-[#4FC8FF] to-[#00D4FF] mx-auto rounded-full"></div>
                    </motion.div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Image */}
                        <div className="lg:col-span-2">
                            <motion.div
                                className="relative aspect-square bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl overflow-hidden group"
                                whileHover={{ scale: 1.02 }}
                                transition={{ duration: 0.3 }}
                            >
                                <Image
                                    src={galleryImages[activeImageIndex]}
                                    alt={`${product.name} - Image ${activeImageIndex + 1}`}
                                    fill
                                    className="object-contain p-8 transition-transform duration-500"
                                    priority
                                />

                                {/* Navigation Arrows */}
                                <button
                                    onClick={prevImage}
                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-300"
                                >
                                    <FiChevronLeft className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={nextImage}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-300"
                                >
                                    <FiChevronRight className="w-6 h-6" />
                                </button>

                                {/* Fullscreen Button */}
                                <button
                                    onClick={() => setIsFullscreen(true)}
                                    className="absolute top-4 right-4 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all duration-300"
                                >
                                    <FiMaximize2 className="w-5 h-5" />
                                </button>

                                {/* Image Counter */}
                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-black/70 rounded-full text-white text-sm">
                                    {activeImageIndex + 1} / {galleryImages.length}
                                </div>
                            </motion.div>
                        </div>

                        {/* Thumbnail Grid */}
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold text-white mb-4">All Views</h3>
                            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                                {galleryImages.map((image, index) => (
                                    <motion.button
                                        key={index}
                                        onClick={() => setActiveImageIndex(index)}
                                        className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-300 ${
                                            index === activeImageIndex
                                                ? 'border-[#4FC8FF] shadow-lg shadow-[#4FC8FF]/30'
                                                : 'border-gray-600 hover:border-gray-400'
                                        }`}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <Image
                                            src={image}
                                            alt={`${product.name} - Thumbnail ${index + 1}`}
                                            fill
                                            className="object-contain p-4 bg-gradient-to-br from-gray-800 to-gray-700"
                                        />
                                        {index === activeImageIndex && (
                                            <motion.div
                                                className="absolute inset-0 bg-[#4FC8FF]/20"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ duration: 0.3 }}
                                            />
                                        )}
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Fullscreen Modal */}
            <AnimatePresence>
                {isFullscreen && (
                    <motion.div
                        className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsFullscreen(false)}
                    >
                        <motion.div
                            className="relative max-w-4xl max-h-full"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.8 }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Image
                                src={galleryImages[activeImageIndex]}
                                alt={`${product.name} - Fullscreen`}
                                width={800}
                                height={800}
                                className="object-contain max-h-[90vh]"
                            />
                            <button
                                onClick={() => setIsFullscreen(false)}
                                className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white"
                            >
                                ✕
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProductGallery;
