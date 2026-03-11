'use client';

import HeroSection from '@/components/ui/Hero';
import { useLanguage } from '@/context/LanguageContext';

export default function AboutHero() {
    const { t } = useLanguage();
    const breadcrumbItems = [
        { label: t('nav.home'), href: '/' },
        { label: t('about.breadcrumb'), active: true }
    ];

    return (
        <HeroSection
            breadcrumbItems={breadcrumbItems}
            breadcrumbWrapperClassName="ml-0 sm:ml-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20"
        />
    );
}
