'use client';

import HeroSection from '@/components/ui/Hero';
import { useLanguage } from '@/context/LanguageContext';

export default function BlogDetailHero() {
    const { t } = useLanguage();

    const breadcrumbItems = [
        { label: t('nav.home'), href: '/' },
        { label: t('nav.blog'), href: '/blogs' },
        { label: t('blog.detail.breadcrumbDetail'), active: true }
    ];

    return <HeroSection breadcrumbItems={breadcrumbItems} />;
}
