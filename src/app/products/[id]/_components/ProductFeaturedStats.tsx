'use client';

import { motion } from 'framer-motion';
import { Product } from '../../_components/types';

interface ProductFeaturedStatsProps {
    product: Product;
}

const ProductFeaturedStats = ({ product }: ProductFeaturedStatsProps) => {
    // Generate stats based on product series
    const getStats = (series: string) => {
        const statsMap: { [key: string]: Array<{ value: string; label: string; description: string }> } = {
            'SX SERIES': [
                { value: '1%', label: 'LATENCY', description: 'Ultra-low audio delay' },
                { value: '15.5', label: 'HOURS', description: 'Extended battery life' },
                { value: 'FREE', label: 'SUPPORT', description: 'Lifetime technical support' }
            ],
            'S SERIES': [
                { value: '2%', label: 'LATENCY', description: 'Professional audio delay' },
                { value: '12.0', label: 'HOURS', description: 'All-day battery life' },
                { value: 'FREE', label: 'SUPPORT', description: '2-year technical support' }
            ],
            'G SERIES': [
                { value: '0.5%', label: 'LATENCY', description: 'Military-grade precision' },
                { value: '18.0', label: 'HOURS', description: 'Extended operation time' },
                { value: 'FREE', label: 'SUPPORT', description: 'Professional support' }
            ],
            'G+ SERIES': [
                { value: '0.1%', label: 'LATENCY', description: 'AI-optimized performance' },
                { value: '24.0', label: 'HOURS', description: 'Maximum battery life' },
                { value: 'FREE', label: 'SUPPORT', description: 'Premium support package' }
            ]
        };

        return statsMap[series] || statsMap['S SERIES'];
    };

    const stats = getStats(product.series);

    return (
        <div className="relative py-16 sm:py-20 bg-gradient-to-b from-[#0a0f1a] to-[#0c131d]">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-[#4FC8FF]/5 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 ml-16 sm:ml-20">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="max-w-6xl mx-auto">
                        {/* Section Title */}
                        <motion.div
                            className="text-center mb-16"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-wider">
                                PRODUCT FEATURED
                            </h2>
                            <div className="w-24 h-1 bg-gradient-to-r from-[#4FC8FF] to-[#00D4FF] mx-auto rounded-full"></div>
                        </motion.div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                            {stats.map((stat, index) => (
                                <motion.div
                                    key={stat.label}
                                    className="relative group"
                                    initial={{ opacity: 0, y: 50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.8, delay: index * 0.2 }}
                                    viewport={{ once: true }}
                                    whileHover={{ y: -10 }}
                                >
                                    {/* Card Background */}
                                    <div className="relative bg-gradient-to-br from-gray-900/50 to-gray-800/30 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/30 group-hover:border-[#4FC8FF]/50 transition-all duration-500">
                                        {/* Glow Effect on Hover */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-[#4FC8FF]/10 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-500"></div>

                                        {/* Content */}
                                        <div className="relative z-10 text-center">
                                            {/* Large Value */}
                                            <motion.div
                                                className="mb-4"
                                                initial={{ scale: 0 }}
                                                whileInView={{ scale: 1 }}
                                                transition={{
                                                    duration: 0.6,
                                                    delay: 0.3 + index * 0.1,
                                                    type: 'spring',
                                                    stiffness: 200
                                                }}
                                                viewport={{ once: true }}
                                            >
                                                <span className="text-5xl sm:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-[#4FC8FF] to-[#00D4FF] bg-clip-text text-transparent">
                                                    {stat.value}
                                                </span>
                                            </motion.div>

                                            {/* Label */}
                                            <motion.h3
                                                className="text-xl sm:text-2xl font-bold text-white mb-3 tracking-widest"
                                                initial={{ opacity: 0 }}
                                                whileInView={{ opacity: 1 }}
                                                transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                                                viewport={{ once: true }}
                                            >
                                                {stat.label}
                                            </motion.h3>

                                            {/* Description */}
                                            <motion.p
                                                className="text-gray-400 text-sm sm:text-base leading-relaxed"
                                                initial={{ opacity: 0 }}
                                                whileInView={{ opacity: 1 }}
                                                transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                                                viewport={{ once: true }}
                                            >
                                                {stat.description}
                                            </motion.p>

                                            {/* Decorative Line */}
                                            <motion.div
                                                className="mt-6 w-16 h-0.5 bg-gradient-to-r from-[#4FC8FF] to-[#00D4FF] mx-auto rounded-full"
                                                initial={{ width: 0 }}
                                                whileInView={{ width: 64 }}
                                                transition={{ duration: 0.8, delay: 0.9 + index * 0.1 }}
                                                viewport={{ once: true }}
                                            />
                                        </div>

                                        {/* Corner Accent */}
                                        <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-[#4FC8FF]/30 group-hover:border-[#4FC8FF]/70 transition-colors duration-500"></div>
                                        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-[#4FC8FF]/30 group-hover:border-[#4FC8FF]/70 transition-colors duration-500"></div>
                                    </div>

                                    {/* Floating Number */}
                                    <motion.div
                                        className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-r from-[#4FC8FF] to-[#00D4FF] rounded-full flex items-center justify-center text-black font-bold text-lg shadow-lg shadow-[#4FC8FF]/30"
                                        initial={{ scale: 0, rotate: -180 }}
                                        whileInView={{ scale: 1, rotate: 0 }}
                                        transition={{
                                            duration: 0.6,
                                            delay: 1 + index * 0.1,
                                            type: 'spring',
                                            stiffness: 200
                                        }}
                                        viewport={{ once: true }}
                                    >
                                        {index + 1}
                                    </motion.div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Bottom Decorative Elements */}
                        <motion.div
                            className="flex justify-center mt-16 space-x-4"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ duration: 1, delay: 1.5 }}
                            viewport={{ once: true }}
                        >
                            {[...Array(5)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="w-2 h-2 bg-[#4FC8FF]/30 rounded-full"
                                    initial={{ scale: 0 }}
                                    whileInView={{ scale: 1 }}
                                    transition={{ duration: 0.3, delay: 1.7 + i * 0.1 }}
                                    viewport={{ once: true }}
                                />
                            ))}
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductFeaturedStats;
