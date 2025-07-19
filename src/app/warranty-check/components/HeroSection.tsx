'use client';

import HeroSection from '@/components/ui/Hero';

export default function WarrantyHero() {
    const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: 'Warranty Check', active: true }
    ];

    return <HeroSection breadcrumbItems={breadcrumbItems} />;
}
