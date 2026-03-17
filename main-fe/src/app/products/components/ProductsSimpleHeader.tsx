'use client';

import { useLanguage } from '@/context/LanguageContext';
import AvoidSidebar from '@/components/ui/AvoidSidebar';

interface ProductsSimpleHeaderProps {
    totalProducts?: number;
}

export default function ProductsSimpleHeader({ totalProducts = 0 }: ProductsSimpleHeaderProps) {
    const { t } = useLanguage();

    return (
        <section className="bg-transparent text-white pb-6 pt-8">
            <AvoidSidebar>
                <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 flex justify-center">
                    <div className="mx-auto max-w-6xl w-full text-center">
                        <h1 className="mb-4 text-2xl font-bold text-white sm:text-3xl md:text-4xl lg:text-5xl">
                            {t('products.featured.title').toUpperCase()}
                        </h1>
                        <div className="mx-auto mb-6 h-1 w-24 rounded-full bg-gradient-to-r from-[#4FC8FF] to-[#00D4FF]" />
                        <p className="mx-auto max-w-3xl text-sm leading-relaxed text-gray-300 sm:text-base md:text-lg">
                            {t('products.featured.subtitle')}
                        </p>
                        <div className="mt-6 text-sm text-gray-400">
                            <span className="font-semibold text-[#4FC8FF]">{totalProducts}</span>{' '}
                            {t('products.featured.carouselTitle')}
                        </div>
                    </div>
                </div>
            </AvoidSidebar>
        </section>
    );
}
