'use client';

import HeroSection from '@/components/ui/Hero';
import { useLanguage } from '@/context/LanguageContext';

export function BlogHero() {
    const { t } = useLanguage();

    const breadcrumbItems = [
        { label: t('nav.home'), href: '/' },
        { label: t('nav.blog'), active: true }
    ];

    return <HeroSection breadcrumbItems={breadcrumbItems} />;
}
