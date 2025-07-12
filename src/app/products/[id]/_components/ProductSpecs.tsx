'use client';

import { motion } from 'framer-motion';
import { FiCpu, FiBluetooth, FiBattery, FiShield } from 'react-icons/fi';
import { Product } from '../../_components/types';

interface ProductSpecsProps {
    product: Product;
}

const ProductSpecs = ({ product }: ProductSpecsProps) => {
    // Mock specifications based on series
    const getSpecs = (series: string) => {
        const baseSpecs = {
            Connectivity: 'Bluetooth 5.0',
            Range: 'Up to 1000m',
            'Battery Life': '12-15 hours',
            'Charging Time': '2-3 hours',
            Weight: '85g',
            Dimensions: '110 x 55 x 25mm',
            'Operating Temperature': '-20°C to +60°C',
            Warranty: '2 Years'
        };

        const seriesSpecs: { [key: string]: { [key: string]: string } } = {
            'SX SERIES': {
                ...baseSpecs,
                Connectivity: 'Bluetooth 5.0 + NFC',
                Range: 'Up to 1500m',
                'Battery Life': '18-20 hours',
                'Water Resistance': 'IP67',
                'Noise Cancellation': 'Advanced ANC',
                'Audio Codec': 'aptX HD'
            },
            'S SERIES': {
                ...baseSpecs,
                Range: 'Up to 800m',
                'Battery Life': '10-12 hours',
                'Water Resistance': 'IP54',
                'Audio Codec': 'SBC/AAC'
            },
            'G SERIES': {
                ...baseSpecs,
                Range: 'Up to 2000m',
                'Battery Life': '15-18 hours',
                'Water Resistance': 'IP68',
                'Military Standard': 'MIL-STD-810G',
                GPS: 'Built-in GPS',
                'Emergency Features': 'SOS Alert'
            },
            'G+ SERIES': {
                ...baseSpecs,
                Connectivity: 'Bluetooth 5.2 + Wi-Fi 6',
                Range: 'Up to 3000m',
                'Battery Life': '24-30 hours',
                'Water Resistance': 'IP68',
                'AI Features': 'Smart Noise Reduction',
                'Audio Codec': 'LDAC/aptX Adaptive',
                'Smart Features': 'Auto-pairing, Voice Assistant'
            }
        };

        return seriesSpecs[series] || baseSpecs;
    };

    const specs = getSpecs(product.series);

    const specCategories = [
        {
            title: 'Connectivity & Range',
            icon: FiBluetooth,
            color: 'from-blue-500 to-cyan-500',
            specs: {
                Connectivity: specs['Connectivity'],
                Range: specs['Range'],
                'Audio Codec': specs['Audio Codec']
            }
        },
        {
            title: 'Power & Performance',
            icon: FiBattery,
            color: 'from-green-500 to-emerald-500',
            specs: {
                'Battery Life': specs['Battery Life'],
                'Charging Time': specs['Charging Time'],
                'Operating Temperature': specs['Operating Temperature']
            }
        },
        {
            title: 'Build & Protection',
            icon: FiShield,
            color: 'from-orange-500 to-red-500',
            specs: {
                Weight: specs['Weight'],
                Dimensions: specs['Dimensions'],
                'Water Resistance': specs['Water Resistance'],
                'Military Standard': specs['Military Standard']
            }
        },
        {
            title: 'Advanced Features',
            icon: FiCpu,
            color: 'from-purple-500 to-pink-500',
            specs: {
                'Noise Cancellation': specs['Noise Cancellation'],
                'AI Features': specs['AI Features'],
                GPS: specs['GPS'],
                'Smart Features': specs['Smart Features'],
                'Emergency Features': specs['Emergency Features']
            }
        }
    ];

    return (
        <div className="ml-16 sm:ml-20 py-12 sm:py-16 bg-gradient-to-b from-gray-900/20 to-transparent">
            <div className="px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto">
                    {/* Section Header */}
                    <motion.div
                        className="text-center mb-12"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Technical Specifications</h2>
                        <div className="w-20 h-1 bg-gradient-to-r from-[#4FC8FF] to-[#00D4FF] mx-auto rounded-full mb-6"></div>
                        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                            Detailed technical information and specifications for {product.name}
                        </p>
                    </motion.div>

                    {/* Specifications Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {specCategories.map((category, categoryIndex) => {
                            // Filter out undefined specs
                            const validSpecs = Object.entries(category.specs).filter(
                                ([, value]) => value !== undefined
                            );

                            if (validSpecs.length === 0) return null;

                            return (
                                <motion.div
                                    key={category.title}
                                    className="bg-gradient-to-br from-gray-800/50 to-gray-700/30 rounded-2xl p-6 border border-gray-600/30 hover:border-gray-500/50 transition-all duration-300"
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: categoryIndex * 0.2, duration: 0.6 }}
                                    whileHover={{ scale: 1.02 }}
                                >
                                    {/* Category Header */}
                                    <div className="flex items-center mb-6">
                                        <div
                                            className={`p-3 rounded-xl bg-gradient-to-r ${category.color} bg-opacity-20 mr-4`}
                                        >
                                            <category.icon className="w-6 h-6 text-white" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-white">{category.title}</h3>
                                    </div>

                                    {/* Specifications List */}
                                    <div className="space-y-4">
                                        {validSpecs.map(([key, value], specIndex) => (
                                            <motion.div
                                                key={key}
                                                className="flex justify-between items-center py-3 border-b border-gray-600/30 last:border-b-0"
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: categoryIndex * 0.2 + specIndex * 0.1 }}
                                            >
                                                <span className="text-gray-400 font-medium">{key}</span>
                                                <span className="text-white font-semibold text-right max-w-[60%]">
                                                    {value}
                                                </span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    {/* Warranty Information */}
                    <motion.div
                        className="mt-12 bg-gradient-to-r from-[#4FC8FF]/10 to-[#00D4FF]/5 rounded-2xl p-8 border border-[#4FC8FF]/20 text-center"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1, duration: 0.6 }}
                    >
                        <h3 className="text-2xl font-bold text-white mb-4">Comprehensive Warranty Coverage</h3>
                        <p className="text-gray-300 text-lg mb-4">
                            {specs['Warranty']} manufacturer warranty with full technical support
                        </p>
                        <div className="flex flex-wrap justify-center gap-4 text-sm text-[#4FC8FF]">
                            <span>• Manufacturing Defects</span>
                            <span>• Technical Support</span>
                            <span>• Replacement Parts</span>
                            <span>• Professional Installation Guidance</span>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ProductSpecs;
