'use client';

import HeroSection from '@/components/ui/Hero';
import { useLanguage } from '@/context/LanguageContext';

export default function WarrantyHero() {
    const { t } = useLanguage();

    const breadcrumbItems = [
        { label: t('nav.home'), href: '/' },
        { label: t('warrantyCheck.breadcrumb'), active: true }
    ];

    return (
        <HeroSection
            breadcrumbItems={breadcrumbItems}
            breadcrumbWrapperClassName="ml-0 sm:ml-20 px-1 sm:px-2 md:px-2 lg:px-3 xl:px-4 2xl:px-6"
        />
    );
}
