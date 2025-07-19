'use client';

import { useState } from 'react';
import HeroSection from '@/components/ui/Hero';
import { PolicyBreadcrumb, PolicyContent } from './components';

export default function Policy() {
    const [selectedPolicy, setSelectedPolicy] = useState('warranty');

    const breadcrumbItems = [
        { label: 'Home', href: '/' },
        { label: 'Policy', active: true }
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
