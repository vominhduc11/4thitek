'use client';

import HeroSection from '@/components/ui/Hero';

export default function AboutHero() {
    const breadcrumbItems = [
        { label: 'Home', href: '/home' },
        { label: 'About', active: true }
    ];

    return <HeroSection breadcrumbItems={breadcrumbItems} />;
}
