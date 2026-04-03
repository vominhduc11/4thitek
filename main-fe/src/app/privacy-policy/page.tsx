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
        data?.policies.find((policy) => policy.key === PRIVACY_POLICY_KEY)?.label || t('policy.policies.privacy');
    const privacyDescription = data?.descriptions[PRIVACY_POLICY_KEY] || t('policy.descriptions.privacy');

    const breadcrumbItems = [
        { label: t('nav.home'), href: '/' },
        { label: privacyPolicyLabel, active: true }
    ];

    return (
        <div className="brand-section min-h-screen text-white flex flex-col">
            <HeroSection
                breadcrumbItems={breadcrumbItems}
                breadcrumbWrapperClassName="ml-0 sm:ml-16 md:ml-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20"
            />
            <SectionContainer className="pb-8">
                <div className="max-w-4xl">
                    <h1 className="mb-4 font-serif text-3xl font-semibold text-[var(--brand-blue)] sm:text-4xl lg:text-5xl">
                        {privacyPolicyLabel}
                    </h1>
                    <p className="text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base lg:text-lg">
                        {privacyDescription}
                    </p>
                </div>
            </SectionContainer>
            <PolicyContent selectedPolicy={PRIVACY_POLICY_KEY} policyContent={data} loading={loading} error={error} />
        </div>
    );
}
