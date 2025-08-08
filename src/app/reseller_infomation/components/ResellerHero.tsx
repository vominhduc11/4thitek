'use client';

import HeroSection from '@/components/ui/Hero';
import { useLanguage } from '@/context/LanguageContext';

export default function ResellerHero() {
    const { t } = useLanguage();
    const breadcrumbItems = [
        { label: t('nav.home'), href: '/home' },
        { label: t('reseller.title'), active: true }
    ];

    return <HeroSection breadcrumbItems={breadcrumbItems} />;
}
