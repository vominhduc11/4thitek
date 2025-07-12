'use client';

import { motion } from 'framer-motion';
import { Product } from '../../_components/types';

interface ProductFeaturedCardsProps {
    product: Product;
}

const ProductFeaturedCards = ({ product }: ProductFeaturedCardsProps) => {
    // Stats based on product series
    const getStats = (series: string) => {
        const statsMap: { [key: string]: Array<{ value: string; label: string; unit?: string }> } = {
            'SX SERIES': [
                { value: '1', label: 'LATENCY', unit: '%' },
                { value: '15.5', label: 'HOURS', unit: '' },
                { value: 'FREE', label: 'SHIPPING', unit: '' }
            ],
            'S SERIES': [
                { value: '2', label: 'LATENCY', unit: '%' },
                { value: '12.0', label: 'HOURS', unit: '' },
                { value: 'FREE', label: 'SUPPORT', unit: '' }
            ],
            'G SERIES': [
                { value: '0.5', label: 'LATENCY', unit: '%' },
                { value: '18.0', label: 'HOURS', unit: '' },
                { value: 'FREE', label: 'WARRANTY', unit: '' }
            ],
            'G+ SERIES': [
                { value: '0.1', label: 'LATENCY', unit: '%' },
                { value: '24.0', label: 'HOURS', unit: '' },
                { value: 'FREE', label: 'PREMIUM', unit: '' }
            ]
        };

        return statsMap[series] || statsMap['S SERIES'];
    };

    const stats = getStats(product.series);

    return (
        <div className="relative py-20 bg-[#0a0f1a]">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-[#4FC8FF]/5 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 right-1/4 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            className="relative group"
                            initial={{ opacity: 0, y: 80 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: index * 0.2 }}
                            viewport={{ once: true }}
                            whileHover={{ y: -10 }}
                        >
                            {/* Card Background */}
                            <div className="relative bg-gradient-to-br from-gray-900/80 to-gray-800/40 backdrop-blur-sm rounded-2xl p-8 lg:p-10 border border-gray-700/50 group-hover:border-[#4FC8FF]/50 transition-all duration-500 overflow-hidden">
                                {/* Background Pattern */}
                                <div className="absolute inset-0 opacity-5">
                                    <div className="absolute top-4 right-4 w-16 h-16 border-2 border-[#4FC8FF] rounded-full"></div>
                                    <div className="absolute bottom-4 left-4 w-12 h-12 border border-[#4FC8FF] rounded-full"></div>
                                </div>

                                {/* Glow Effect on Hover */}
                                <div className="absolute inset-0 bg-gradient-to-br from-[#4FC8FF]/10 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-500"></div>

                                {/* Content */}
                                <div className="relative z-10 text-center">
                                    {/* Large Value */}
                                    <motion.div
                                        className="mb-6"
                                        initial={{ scale: 0 }}
                                        whileInView={{ scale: 1 }}
                                        transition={{
                                            duration: 0.8,
                                            delay: 0.3 + index * 0.1,
                                            type: 'spring',
                                            stiffness: 200
                                        }}
                                        viewport={{ once: true }}
                                    >
                                        <div className="flex items-baseline justify-center">
                                            <span className="text-6xl sm:text-7xl lg:text-8xl font-bold bg-gradient-to-r from-[#4FC8FF] to-[#00D4FF] bg-clip-text text-transparent">
                                                {stat.value}
                                            </span>
                                            {stat.unit && (
                                                <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#4FC8FF] ml-2">
                                                    {stat.unit}
                                                </span>
                                            )}
                                        </div>
                                    </motion.div>

                                    {/* Label */}
                                    <motion.h3
                                        className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-[0.2em] uppercase"
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                                        viewport={{ once: true }}
                                    >
                                        {stat.label}
                                    </motion.h3>

                                    {/* Decorative Line */}
                                    <motion.div
                                        className="mt-6 w-20 h-1 bg-gradient-to-r from-[#4FC8FF] to-[#00D4FF] mx-auto rounded-full"
                                        initial={{ width: 0 }}
                                        whileInView={{ width: 80 }}
                                        transition={{ duration: 0.8, delay: 0.7 + index * 0.1 }}
                                        viewport={{ once: true }}
                                    />
                                </div>

                                {/* Corner Accents */}
                                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#4FC8FF]/30 group-hover:border-[#4FC8FF]/70 transition-colors duration-500"></div>
                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#4FC8FF]/30 group-hover:border-[#4FC8FF]/70 transition-colors duration-500"></div>

                                {/* Floating Number Badge */}
                                <motion.div
                                    className="absolute -top-4 -right-4 w-12 h-12 bg-gradient-to-r from-[#4FC8FF] to-[#00D4FF] rounded-full flex items-center justify-center text-black font-bold text-lg shadow-lg shadow-[#4FC8FF]/30"
                                    initial={{ scale: 0, rotate: -180 }}
                                    whileInView={{ scale: 1, rotate: 0 }}
                                    transition={{
                                        duration: 0.6,
                                        delay: 0.9 + index * 0.1,
                                        type: 'spring',
                                        stiffness: 200
                                    }}
                                    viewport={{ once: true }}
                                >
                                    {String(index + 1).padStart(2, '0')}
                                </motion.div>
                            </div>

                            {/* Hover Shadow Effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-[#4FC8FF]/20 to-[#00D4FF]/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 -z-10"></div>
                        </motion.div>
                    ))}
                </div>

                {/* Bottom Decorative Elements */}
                <motion.div
                    className="flex justify-center mt-16 space-x-2"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 1.5 }}
                    viewport={{ once: true }}
                >
                    {[...Array(7)].map((_, i) => (
                        <motion.div
                            key={i}
                            className={`h-1 bg-[#4FC8FF]/30 rounded-full ${i === 3 ? 'w-8 bg-[#4FC8FF]' : 'w-2'}`}
                            initial={{ scaleX: 0 }}
                            whileInView={{ scaleX: 1 }}
                            transition={{ duration: 0.3, delay: 1.7 + i * 0.1 }}
                            viewport={{ once: true }}
                        />
                    ))}
                </motion.div>
            </div>
        </div>
    );
};

export default ProductFeaturedCards;
