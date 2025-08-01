'use client';

import HeroSection from '@/components/ui/Hero';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ProductsHero() {
    const { t } = useLanguage();
    
    const breadcrumbItems = [
        { label: t('nav.home'), href: '/' },
        { label: t('nav.products'), active: true }
    ];

    return <HeroSection breadcrumbItems={breadcrumbItems} />;
}
