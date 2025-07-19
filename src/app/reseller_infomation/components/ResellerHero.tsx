'use client';

import HeroSection from '@/components/ui/Hero';

export default function ResellerHero() {
    const breadcrumbItems = [
        { label: 'Home', href: '/home' },
        { label: 'Find Resellers', active: true }
    ];

    return <HeroSection breadcrumbItems={breadcrumbItems} />;
}
