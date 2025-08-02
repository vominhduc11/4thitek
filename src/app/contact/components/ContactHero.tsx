'use client';

import HeroSection from '@/components/ui/Hero';
import { useLanguage } from '@/contexts/LanguageContext';

export default function ContactHero() {
    const { t } = useLanguage();

    const breadcrumbItems = [
        { label: t('nav.home'), href: '/' },
        { label: t('nav.contact'), active: true }
    ];

    return <HeroSection breadcrumbItems={breadcrumbItems} />;
}
