'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import HeroSection from '@/components/ui/Hero';
import { PolicyBreadcrumb, PolicyContent } from './components';
import { useLanguage } from '@/context/LanguageContext';
import { usePublicContent } from '@/hooks/usePublicContent';
import type { PolicyContentPayload } from '@/types/content';

function PolicyPageContent() {
    const { t } = useLanguage();
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { data, loading, error } = usePublicContent<PolicyContentPayload>('policy');
    const requestedPolicy = (searchParams.get('tab') || 'warranty').trim().toLowerCase();
    const [selectedPolicy, setSelectedPolicy] = useState(requestedPolicy);

    const breadcrumbItems = [
        { label: t('nav.home'), href: '/' },
        { label: t('policy.breadcrumbLabel'), active: true }
    ];

    useEffect(() => {
        setSelectedPolicy(requestedPolicy);
    }, [requestedPolicy]);

    useEffect(() => {
        const availablePolicies = data?.policies?.map((policy) => policy.key) ?? [];
        if (!availablePolicies.length) {
            return;
        }

        if (!availablePolicies.includes(requestedPolicy)) {
            const fallbackPolicy = availablePolicies[0];
            setSelectedPolicy(fallbackPolicy);
            const params = new URLSearchParams(searchParams.toString());
            params.set('tab', fallbackPolicy);
            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
        }
    }, [data, pathname, requestedPolicy, router, searchParams]);

    const handlePolicyClick = (policyKey: string) => {
        setSelectedPolicy(policyKey);
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', policyKey);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    return (
        <div className="min-h-screen bg-[#0c131d] text-white flex flex-col">
            <HeroSection
                breadcrumbItems={breadcrumbItems}
                breadcrumbWrapperClassName="ml-0 sm:ml-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20"
            />
            <PolicyBreadcrumb
                selectedPolicy={selectedPolicy}
                onPolicyClick={handlePolicyClick}
                policyContent={data}
            />
            <PolicyContent
                selectedPolicy={selectedPolicy}
                policyContent={data}
                loading={loading}
                error={error}
            />
        </div>
    );
}

function PolicyPageFallback() {
    return (
        <div className="min-h-screen bg-[#0c131d] text-white flex items-center justify-center">
            <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-[#4FC8FF]"></div>
                <p className="mt-4 text-sm text-gray-400">Loading policy...</p>
            </div>
        </div>
    );
}

export default function Policy() {
    return (
        <Suspense fallback={<PolicyPageFallback />}>
            <PolicyPageContent />
        </Suspense>
    );
}
