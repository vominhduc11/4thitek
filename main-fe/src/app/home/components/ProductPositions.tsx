'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiArrowUpRight, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import clsx from 'clsx';
import Image from 'next/image';
import { motion } from 'framer-motion';
import AvoidSidebar from '@/components/layout/AvoidSidebar';
import { useLanguage } from '@/context/LanguageContext';
import { apiService } from '@/services/apiService';
import { parseImageUrl } from '@/utils/media';

// Types
interface PositionItem {
    id: string;
    label: string;
    description: string;
    img: string;
    productId: string;
}

// Main ProductPositions Component
export default function ProductPositions() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [positionItems, setPositionItems] = useState<PositionItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const { t } = useLanguage();

    useEffect(() => {
        const fetchPositionItems = async () => {
            try {
                setIsLoading(true);
                const response = await apiService.fetchHomepageProducts();
                if (!response.success || !response.data) {
                    setPositionItems([]);
                    return;
                }

                const items = response.data.slice(0, 4).map(
                    (product: { id: string | number; name: string; shortDescription: string; image: string }) => ({
                        id: String(product.id),
                        label: product.name,
                        description: product.shortDescription || t('products.detail.noContent'),
                        img: parseImageUrl(product.image, ''),
                        productId: String(product.id)
                    })
                );
                setPositionItems(items);
                setCurrentIndex(0);
            } catch (error) {
                console.error('Error fetching positioned products:', error);
                setPositionItems([]);
            } finally {
                setIsLoading(false);
            }
        };

        void fetchPositionItems();
    }, [t]);

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
        if (!currentPosition) {
            router.push('/products');
            return;
        }
        router.push(`/products/${currentPosition.productId}`);
    };

    if (isLoading) {
        return (
            <AvoidSidebar>
                <section className="relative min-h-[800px] overflow-hidden bg-[#0c131d] py-8 md:min-h-[900px] md:py-16 lg:min-h-[1000px]">
                    <div className="container mx-auto max-w-8xl px-4">
                        <div className="mb-8 text-center md:mb-12">
                            <motion.h2
                                className="mb-4 text-3xl font-bold text-white md:text-4xl lg:text-5xl"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                            >
                                {t('products.title')}
                            </motion.h2>
                        </div>
                        <div className="h-[500px] animate-pulse rounded-3xl border border-white/10 bg-white/5" />
                    </div>
                </section>
            </AvoidSidebar>
        );
    }

    if (!currentPosition) {
        return null;
    }


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
                                            {currentPosition.img ? (
                                                <Image
                                                    src={currentPosition.img}
                                                    alt={currentPosition.label}
                                                    width={400}
                                                    height={300}
                                                    className="w-full h-auto object-contain"
                                                />
                                            ) : (
                                                <div className="flex min-h-[300px] items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/70">
                                                    {t('products.detail.media.imageUnavailable')}
                                                </div>
                                            )}
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
