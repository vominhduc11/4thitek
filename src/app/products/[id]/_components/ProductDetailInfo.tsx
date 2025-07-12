'use client';

import { motion } from 'framer-motion';
import { FiCheck, FiStar, FiShield, FiBluetooth } from 'react-icons/fi';
import { Product } from '../../_components/types';

interface ProductDetailInfoProps {
    product: Product;
}

const ProductDetailInfo = ({ product }: ProductDetailInfoProps) => {
    // Mock features based on series
    const getFeatures = (series: string) => {
        const baseFeatures = [
            'Crystal Clear Audio Quality',
            'Professional Grade Durability',
            'Easy Installation Process',
            'Comprehensive Warranty Coverage'
        ];

        const seriesFeatures: { [key: string]: string[] } = {
            'SX SERIES': [
                ...baseFeatures,
                'Bluetooth 5.0 Technology',
                'Waterproof IP67 Rating',
                'Advanced Noise Cancellation',
                'Extended Battery Life'
            ],
            'S SERIES': [...baseFeatures, 'Reliable Daily Performance', 'Ergonomic Design', 'Cost-Effective Solution'],
            'G SERIES': [
                ...baseFeatures,
                'Military-Standard Durability',
                'GPS Integration Ready',
                'Emergency Alert Systems',
                'Tactical Grade Construction'
            ],
            'G+ SERIES': [
                ...baseFeatures,
                'AI-Powered Noise Reduction',
                'Ultra-Long Range Connectivity',
                'Premium Materials',
                'Cutting-Edge Technology',
                'Smart Auto-Pairing'
            ]
        };

        return seriesFeatures[series] || baseFeatures;
    };

    const features = getFeatures(product.series);

    const highlights = [
        {
            icon: FiBluetooth,
            title: 'Advanced Connectivity',
            description: 'Latest wireless technology for seamless communication'
        },
        {
            icon: FiShield,
            title: 'Built to Last',
            description: 'Professional-grade materials and construction'
        },
        {
            icon: FiStar,
            title: 'Premium Quality',
            description: 'Engineered for professional riders and enthusiasts'
        }
    ];

    return (
        <div className="ml-16 sm:ml-20 py-12 sm:py-16 bg-gradient-to-b from-transparent to-gray-900/20">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    <motion.div
                        className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16"
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        {/* Product Information */}
                        <div>
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">Product Overview</h2>
                                <div className="w-20 h-1 bg-gradient-to-r from-[#4FC8FF] to-[#00D4FF] mb-8 rounded-full"></div>
                            </motion.div>

                            <motion.div
                                className="space-y-6"
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <div className="bg-gradient-to-r from-gray-800/50 to-gray-700/30 rounded-2xl p-6 border border-gray-600/30">
                                    <h3 className="text-xl font-semibold text-white mb-4">Description</h3>
                                    <p className="text-gray-300 leading-relaxed text-lg">{product.description}</p>
                                </div>

                                <div className="bg-gradient-to-r from-[#4FC8FF]/10 to-[#4FC8FF]/5 rounded-2xl p-6 border border-[#4FC8FF]/20">
                                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                                        <FiCheck className="w-6 h-6 text-[#4FC8FF] mr-3" />
                                        Key Features
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {features.map((feature, index) => (
                                            <motion.div
                                                key={feature}
                                                className="flex items-center space-x-3 text-gray-300"
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.6 + index * 0.1 }}
                                            >
                                                <div className="w-2 h-2 bg-[#4FC8FF] rounded-full flex-shrink-0"></div>
                                                <span className="text-sm">{feature}</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Highlights */}
                        <div>
                            <motion.div
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
                                    Why Choose This Product?
                                </h2>
                                <div className="w-20 h-1 bg-gradient-to-r from-[#4FC8FF] to-[#00D4FF] mb-8 rounded-full"></div>
                            </motion.div>

                            <div className="space-y-6">
                                {highlights.map((highlight, index) => (
                                    <motion.div
                                        key={highlight.title}
                                        className="bg-gradient-to-r from-gray-800/50 to-gray-700/30 rounded-2xl p-6 border border-gray-600/30 hover:border-[#4FC8FF]/30 transition-all duration-300 group"
                                        initial={{ opacity: 0, x: 30 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.5 + index * 0.2 }}
                                        whileHover={{ scale: 1.02 }}
                                    >
                                        <div className="flex items-start space-x-4">
                                            <div className="p-3 bg-[#4FC8FF]/20 rounded-xl group-hover:bg-[#4FC8FF]/30 transition-colors">
                                                <highlight.icon className="w-6 h-6 text-[#4FC8FF]" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-semibold text-white mb-2">
                                                    {highlight.title}
                                                </h3>
                                                <p className="text-gray-300 leading-relaxed">{highlight.description}</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Series Badge */}
                            <motion.div
                                className="mt-8 p-6 bg-gradient-to-r from-[#4FC8FF]/20 to-[#00D4FF]/10 rounded-2xl border border-[#4FC8FF]/30"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 1.2 }}
                            >
                                <div className="text-center">
                                    <h3 className="text-2xl font-bold text-white mb-2">
                                        {product.series.replace(' SERIES', ' Series')}
                                    </h3>
                                    <p className="text-[#4FC8FF] font-semibold">
                                        {product.category} Grade Communication Device
                                    </p>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailInfo;
