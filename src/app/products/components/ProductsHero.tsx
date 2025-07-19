'use client';

import HeroSection from '@/components/ui/Hero';

export default function ProductsHero() {
    const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: 'Products', active: true }
    ];

    return <HeroSection breadcrumbItems={breadcrumbItems} />;
}
