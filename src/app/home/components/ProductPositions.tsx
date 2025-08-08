'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowUpRight, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import clsx from 'clsx';
import Image from 'next/image';
import { motion } from 'framer-motion';
import AvoidSidebar from '@/components/layout/AvoidSidebar';
import { useLanguage } from '@/context/LanguageContext';

// Types
interface PositionItem {
    id: string;
    label: string;
    description: string;
    img: string;
    position: string;
}

// Position Data - replacing series concept
const positionItems: PositionItem[] = [
    {
        id: '1',
        label: 'ENTRY LEVEL',
        description: 'Sản phẩm nhập môn với chất lượng tốt, giá cả phải chăng',
        img: '/products/product1.png',
        position: 'Entry'
    },
    {
        id: '2',
        label: 'MID-RANGE',
        description: 'Cân bằng hoàn hảo giữa hiệu suất và giá trị',
        img: '/products/product2.png',
        position: 'Mid-range'
    },
    {
        id: '3',
        label: 'PREMIUM',
        description: 'Công nghệ cao cấp với chất lượng vượt trội',
        img: '/products/product3.png',
        position: 'Premium'
    },
    {
        id: '4',
        label: 'ULTIMATE',
        description: 'Đỉnh cao công nghệ với AI-powered features',
        img: '/products/product4.png',
        position: 'Ultimate'
    }
];

// Main ProductPositions Component
export default function ProductPositions() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const router = useRouter();
    const { t } = useLanguage();

    const currentPosition = positionItems[currentIndex];

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % positionItems.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + positionItems.length) % positionItems.length);
    };

    const handlePositionClick = (index: number) => {
        setCurrentIndex(index);
    };

    const handleViewProducts = () => {
        router.push(`/products?position=${currentPosition.position}`);
    };


    return (
        <AvoidSidebar>
            <section className="py-8 md:py-16 bg-[#0c131d] relative overflow-hidden min-h-[800px] md:min-h-[900px] lg:min-h-[1000px]">
                <div className="container mx-auto px-4 max-w-8xl">
                    {/* Header */}
                    <div className="text-center mb-8 md:mb-12">
                        <motion.h2
                            className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            {t('products.title')}
                        </motion.h2>
                        <motion.p
                            className="text-gray-400 text-lg max-w-2xl mx-auto"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            {t('products.subtitle')}
                        </motion.p>
                    </div>

                    <div className="flex flex-col xl:flex-row gap-8 xl:gap-16 items-center">
                        {/* Position Navigation */}
                        <div className="xl:w-1/3 w-full">
                            <div className="space-y-4">
                                {positionItems.map((item, index) => (
                                    <motion.button
                                        key={item.id}
                                        onClick={() => handlePositionClick(index)}
                                        className={clsx(
                                            'w-full text-left p-4 rounded-xl transition-all duration-300',
                                            'hover:bg-gray-800/50 group',
                                            {
                                                'bg-blue-600/20 border border-blue-500/30': index === currentIndex,
                                                'bg-gray-800/30 border border-gray-700/30': index !== currentIndex
                                            }
                                        )}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3
                                                    className={clsx('font-bold text-lg mb-1', {
                                                        'text-blue-400': index === currentIndex,
                                                        'text-white group-hover:text-blue-400': index !== currentIndex
                                                    })}
                                                >
                                                    {item.label}
                                                </h3>
                                                <p className="text-gray-400 text-sm">{item.description}</p>
                                            </div>
                                            <FiArrowUpRight
                                                className={clsx('w-5 h-5 transition-colors', {
                                                    'text-blue-400': index === currentIndex,
                                                    'text-gray-400 group-hover:text-blue-400': index !== currentIndex
                                                })}
                                            />
                                        </div>
                                    </motion.button>
                                ))}
                            </div>
                        </div>

                        {/* Product Display */}
                        <div className="xl:w-2/3 w-full">
                            <div className="relative">
                                {/* Main Product Image */}
                                <motion.div
                                    className="relative bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-2xl p-8 md:p-12 backdrop-blur-sm border border-gray-700/30 min-h-[450px] md:min-h-[500px]"
                                    key={currentIndex}
                                    initial={{ opacity: 0, x: 50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <div className="flex flex-col lg:flex-row items-center gap-8">
                                        <div className="lg:w-1/2 text-center lg:text-left">
                                            <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                                                {currentPosition.label}
                                            </h3>
                                            <p className="text-gray-300 mb-6 text-lg">{currentPosition.description}</p>
                                            <button
                                                onClick={handleViewProducts}
                                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-flex items-center gap-2"
                                            >
                                                {t('products.viewDetails')}
                                                <FiArrowUpRight className="w-5 h-5" />
                                            </button>
                                        </div>
                                        <div className="lg:w-1/2">
                                            <Image
                                                src={currentPosition.img}
                                                alt={currentPosition.label}
                                                width={400}
                                                height={300}
                                                className="w-full h-auto object-contain"
                                            />
                                        </div>
                                    </div>
                                </motion.div>


                                {/* Navigation Arrows */}
                                <button
                                    onClick={handlePrev}
                                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-300 backdrop-blur-sm"
                                >
                                    <FiChevronLeft className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all duration-300 backdrop-blur-sm"
                                >
                                    <FiChevronRight className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </AvoidSidebar>
    );
}
