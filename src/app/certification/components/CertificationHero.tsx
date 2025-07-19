'use client';

import HeroSection from '@/components/ui/Hero';

export default function CertificationHero() {
    const breadcrumbItems = [
        { label: 'Home', href: '/home' },
        { label: 'Certification', active: true }
    ];

    return <HeroSection breadcrumbItems={breadcrumbItems} />;
}
