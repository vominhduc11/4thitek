'use client';

import { useState } from 'react';
import HeroSection from '@/components/ui/Hero';
import { PolicyBreadcrumb, PolicyContent } from './components';
import { useLanguage } from '@/context/LanguageContext';

export default function Policy() {
    const { t } = useLanguage();
    const [selectedPolicy, setSelectedPolicy] = useState('warranty');

    const breadcrumbItems = [
        { label: t('nav.home'), href: '/' },
        { label: t('policy.breadcrumbLabel'), active: true }
    ];

    const handlePolicyClick = (policyKey: string) => {
        setSelectedPolicy(policyKey);
    };

    return (
        <div className="min-h-screen bg-[#0c131d] text-white flex flex-col">
            <HeroSection breadcrumbItems={breadcrumbItems} />
            <PolicyBreadcrumb selectedPolicy={selectedPolicy} onPolicyClick={handlePolicyClick} />
            <PolicyContent selectedPolicy={selectedPolicy} />
        </div>
    );
}
