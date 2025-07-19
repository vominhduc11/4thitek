'use client';

import HeroSection from '@/components/ui/Hero';

export default function ContactHero() {
    const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: 'Contact', active: true }
    ];

    return <HeroSection breadcrumbItems={breadcrumbItems} />;
}
