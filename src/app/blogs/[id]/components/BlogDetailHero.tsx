'use client';

import HeroSection from '@/components/ui/Hero';

export default function BlogDetailHero() {
    const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: 'Blogs', href: '/blogs' },
        { label: 'Blog Detail', active: true }
    ];

    return <HeroSection breadcrumbItems={breadcrumbItems} />;
}
