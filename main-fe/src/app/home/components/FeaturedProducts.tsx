'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { apiService } from '@/services/apiService';
import { CardSkeleton } from '@/components/ui/SkeletonLoader';
import { parseImageUrl } from '@/utils/media';
import type { SimpleProduct } from '@/types/product';
import ProductGrid from '@/app/products/components/ProductGrid';

export default function FeaturedProducts() {
    const [products, setProducts] = useState<SimpleProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorKey, setErrorKey] = useState<string | null>(null);
    const { t, language } = useLanguage();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setIsLoading(true);
                const response = await apiService.fetchHomepageProducts();

                if (response.success && response.data) {
                    const processedProducts: SimpleProduct[] = response.data.flatMap((product: { id: string | number; name: string; shortDescription: string; image: string }) => {
                        const productId = product.id?.toString().trim();
                        if (!productId) {
                            return [];
                        }

                        return [{
                            id: productId,
                            name: product.name,
                            shortDescription: product.shortDescription,
                            description: product.shortDescription,
                            image: parseImageUrl(product.image)
                        }];
                    });

                    setProducts(processedProducts);
                } else {
                    setErrorKey('errors.products.loadFailed');
                }
            } catch (err) {
                setErrorKey('errors.products.loadFailed');
                console.error('Error fetching products:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProducts();
    }, [language]);

    return (
        <section className="py-16 md:py-24 bg-[#0c131d] relative overflow-hidden">
            <div className="px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 2xl:px-16 -mt-32 md:-mt-40 lg:-mt-48 relative z-[100] pt-40 md:pt-48 lg:pt-56 ml-0 sm:ml-20">
                {/* Header */}
                <div className="text-center mb-12 md:mb-16">
                    <motion.h2
                        className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        {t('products.featured.title')}
                    </motion.h2>
                    <motion.p
                        className="text-gray-400 text-lg max-w-2xl mx-auto"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        {t('products.featured.subtitle')}
                    </motion.p>
                </div>

                {/* Products Grid */}
                <div className="w-full overflow-visible">
                    {isLoading ? (
                        <motion.div
                            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px relative mb-12 overflow-visible"
                            layout
                            transition={{ duration: 0.5, ease: 'easeInOut' }}
                        >
                            {Array.from({ length: 4 }).map((_, index) => (
                                <motion.div
                                    key={`skeleton-${index}`}
                                    className="relative w-full overflow-hidden border border-gray-700/30 rounded-lg"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: index * 0.1 }}
                                >
                                    <CardSkeleton
                                        height={500}
                                        backgroundColor="#1e293b"
                                        foregroundColor="#334155"
                                    />
                                </motion.div>
                            ))}
                        </motion.div>
                    ) : errorKey ? (
                        <motion.div
                            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px relative mb-12 overflow-visible"
                            layout
                            transition={{ duration: 0.5, ease: 'easeInOut' }}
                        >
                            <motion.div
                                className="col-span-full text-center py-12"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <p className="text-red-400 mb-4">⚠️ {t(errorKey)}</p>
                                <p className="text-gray-500 text-sm">{t('common.tryAgainLater')}</p>
                            </motion.div>
                        </motion.div>
                    ) : (
                        <ProductGrid products={products} />
                    )}
                </div>
            </div>
        </section>
    );
}
