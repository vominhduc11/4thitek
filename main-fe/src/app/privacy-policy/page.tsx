'use client';

import HeroSection from '@/components/ui/Hero';
import { PolicyContent, SectionContainer } from '@/app/policy/components';
import { useLanguage } from '@/context/LanguageContext';
import { usePublicContent } from '@/hooks/usePublicContent';
import type { PolicyContentPayload } from '@/types/content';

const PRIVACY_POLICY_KEY = 'privacy';

export default function PrivacyPolicyPage() {
    const { t } = useLanguage();
    const { data, loading, error } = usePublicContent<PolicyContentPayload>('policy');

    const privacyPolicyLabel =
        data?.policies.find((policy) => policy.key === PRIVACY_POLICY_KEY)?.label ||
        t('policy.policies.privacy');
    const privacyDescription =
        data?.descriptions[PRIVACY_POLICY_KEY] ||
        t('policy.descriptions.privacy');

    const breadcrumbItems = [
        { label: t('nav.home'), href: '/' },
        { label: privacyPolicyLabel, active: true }
    ];

    return (
        <div
            className="min-h-screen bg-[#0c131d] text-white flex flex-col"
            style={{ animation: 'fadeIn 0.5s ease-in' }}
        >
            <HeroSection
                breadcrumbItems={breadcrumbItems}
                breadcrumbWrapperClassName="ml-0 sm:ml-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20"
            />
            <SectionContainer className="pb-8">
                <div className="max-w-4xl">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-[#4FC8FF]">
                        {privacyPolicyLabel}
                    </h1>
                    <p className="text-gray-300 text-sm sm:text-base lg:text-lg leading-relaxed">
                        {privacyDescription}
                    </p>
                </div>
            </SectionContainer>
            <PolicyContent
                selectedPolicy={PRIVACY_POLICY_KEY}
                policyContent={data}
                loading={loading}
                error={error}
            />
        </div>
    );
}
