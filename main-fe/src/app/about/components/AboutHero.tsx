'use client';

import AboutHeroAccent3D from '@/components/3d/about/AboutHeroAccent3D';
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
            accent={<AboutHeroAccent3D />}
            breadcrumbItems={breadcrumbItems}
            breadcrumbWrapperClassName="ml-0 sm:ml-16 md:ml-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20"
        />
    );
}
