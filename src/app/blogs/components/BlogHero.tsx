'use client';

import HeroSection from '@/components/ui/Hero';

export function BlogHero() {
    const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: 'Blogs', active: true }
    ];

    return <HeroSection breadcrumbItems={breadcrumbItems} />;
}
