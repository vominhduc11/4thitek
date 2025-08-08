'use client';

import { useLanguage } from '@/context/LanguageContext';

export default function ProductsSimpleHeader() {
    const { t } = useLanguage();

    return (
        <section className="bg-[#0c131d] text-white pt-8 pb-6">
            <div className="ml-16 sm:ml-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 flex justify-center">
                <div className="w-full max-w-none">
                    <div className="text-center mb-8 max-w-6xl mx-auto">
                        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 font-mono text-white">
                            {t('products.featured.title').toUpperCase()}
                        </h1>
                        <div className="w-24 h-1 bg-gradient-to-r from-[#4FC8FF] to-[#00D4FF] mx-auto rounded-full mb-6"></div>
                        <p className="text-sm sm:text-base md:text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
                            {t('products.featured.subtitle')}
                        </p>
                        <div className="text-sm text-gray-400 mt-6">
                            <span className="text-[#4FC8FF] font-semibold">10</span> {t('products.featured.carouselTitle')}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
