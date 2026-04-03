'use client';

import AvoidSidebar from '@/components/ui/AvoidSidebar';
import { useLanguage } from '@/context/LanguageContext';

interface ProductsSimpleHeaderProps {
    totalProducts?: number;
}

export default function ProductsSimpleHeader({ totalProducts = 0 }: ProductsSimpleHeaderProps) {
    const { t } = useLanguage();

    return (
        <section className="pb-6 pt-8 text-white">
            <AvoidSidebar>
                <div className="brand-shell flex justify-center sm:ml-16 md:ml-20">
                    <div className="mx-auto w-full max-w-5xl text-center">
                        <span className="brand-badge mb-4">{t('products.featured.product')}</span>
                        <h1 className="font-serif text-3xl font-semibold text-[var(--text-primary)] sm:text-4xl md:text-5xl">
                            {t('products.featured.title').toUpperCase()}
                        </h1>
                        <p className="mx-auto mt-5 max-w-3xl text-sm leading-7 text-[var(--text-secondary)] sm:text-base md:text-lg">
                            {t('products.featured.subtitle')}
                        </p>
                        <div className="mt-6">
                            <span className="brand-badge-muted">
                                <span className="font-semibold text-[var(--brand-blue)]">{totalProducts}</span>
                                <span>{t('products.featured.carouselTitle')}</span>
                            </span>
                        </div>
                    </div>
                </div>
            </AvoidSidebar>
        </section>
    );
}
