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

    return (
        <HeroSection
            breadcrumbItems={breadcrumbItems}
            breadcrumbWrapperClassName="ml-0 sm:ml-16 md:ml-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20"
        />
    );
}
