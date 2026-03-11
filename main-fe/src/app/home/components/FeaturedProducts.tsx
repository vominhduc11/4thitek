'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import type { SimpleProduct } from '@/types/product';
import ProductGrid from '@/app/products/components/ProductGrid';

interface FeaturedProductsProps {
    initialProducts?: SimpleProduct[];
}

export default function FeaturedProducts({ initialProducts = [] }: FeaturedProductsProps) {
    const { t } = useLanguage();

    return (
        <section className="relative overflow-hidden bg-[#0c131d] py-16 md:py-24">
            <div className="relative z-[100] ml-0 px-4 pt-40 sm:ml-20 sm:px-6 md:-mt-40 md:px-8 md:pt-48 lg:-mt-48 lg:px-10 lg:pt-56 xl:px-12 2xl:px-16">
                <div className="mb-12 text-center md:mb-16">
                    <motion.h2
                        className="mb-4 text-2xl font-bold text-white sm:text-3xl md:text-4xl lg:text-5xl"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        {t('products.featured.title')}
                    </motion.h2>
                    <motion.p
                        className="mx-auto max-w-2xl text-lg text-gray-400"
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.15 }}
                    >
                        {t('products.featured.subtitle')}
                    </motion.p>
                </div>

                <div className="w-full overflow-visible">
                    <ProductGrid products={initialProducts} />
                </div>
            </div>
        </section>
    );
}
