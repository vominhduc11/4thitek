'use client';

import HeroSection from '@/components/ui/Hero';
import { useLanguage } from '@/context/LanguageContext';

export default function WarrantyHero() {
    const { t } = useLanguage();

    const breadcrumbItems = [
        { label: t('nav.home'), href: '/' },
        { label: t('warrantyCheck.breadcrumb'), active: true }
    ];

    return <HeroSection breadcrumbItems={breadcrumbItems} />;
}
