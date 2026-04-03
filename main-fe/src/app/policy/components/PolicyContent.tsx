'use client';

import { motion, AnimatePresence } from 'framer-motion';
import TableOfContents from './TableOfContents';
import PolicySection from './PolicySection';
import SectionContainer from './SectionContainer';
import { useLanguage } from '@/context/LanguageContext';
import type { PolicyContentPayload, PolicyDataEntry, PolicySectionContent } from '@/types/content';

interface PolicyContentProps {
    selectedPolicy: string;
    policyContent: PolicyContentPayload | null;
    loading?: boolean;
    error?: string | null;
}

// Helper function to render content with translations
const renderSectionContent = (contentData: PolicySectionContent) => {
    const baseClass = 'leading-normal text-base 2xl:text-lg 3xl:text-xl';
    const paragraphClass = `mb-4 2xl:mb-6 3xl:mb-8 ${baseClass}`;
    const listClass = `list-disc list-inside mb-4 2xl:mb-6 3xl:mb-8 space-y-2 2xl:space-y-3 3xl:space-y-4 ${baseClass}`;
    const strongClass = 'text-base 2xl:text-lg 3xl:text-xl';

    return (
        <>
            {contentData.intro && <p className={paragraphClass}>{contentData.intro}</p>}
            {contentData.commitment && <p className={paragraphClass}>{contentData.commitment}</p>}
            {contentData.conditions && (
                <p className={paragraphClass}>
                    <strong className={strongClass}>{contentData.conditions}</strong>
                </p>
            )}
            {contentData.conditionsList && (
                <ul className={listClass}>
                    {contentData.conditionsList.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                    ))}
                </ul>
            )}
            {contentData.contact && <p className={paragraphClass}>{contentData.contact}</p>}
            {contentData.processing && <p className={paragraphClass}>{contentData.processing}</p>}
            {contentData.notification && <p className={baseClass}>{contentData.notification}</p>}
            {contentData.shipping && <p className={baseClass}>{contentData.shipping}</p>}
            {contentData.collectTitle && (
                <p className={paragraphClass}>
                    <strong className={strongClass}>{contentData.collectTitle}</strong>
                </p>
            )}
            {contentData.collectList && (
                <ul className={listClass}>
                    {contentData.collectList.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                    ))}
                </ul>
            )}
            {contentData.purposeTitle && (
                <p className={paragraphClass}>
                    <strong className={strongClass}>{contentData.purposeTitle}</strong>
                </p>
            )}
            {contentData.purposeList && (
                <ul className={listClass}>
                    {contentData.purposeList.map((item: string, index: number) => (
                        <li key={index}>{item}</li>
                    ))}
                </ul>
            )}
            {contentData.rights && <p className={baseClass}>{contentData.rights}</p>}
            {contentData.global && <p className={paragraphClass}>{contentData.global}</p>}
            {contentData.application && <p className={paragraphClass}>{contentData.application}</p>}
            {contentData.law && <p className={paragraphClass}>{contentData.law}</p>}
            {contentData.validity && <p className={paragraphClass}>{contentData.validity}</p>}
            {contentData.compliance && <p className={baseClass}>{contentData.compliance}</p>}
            {contentData.recommendation && <p className={paragraphClass}>{contentData.recommendation}</p>}
        </>
    );
};

export default function PolicyContent({
    selectedPolicy,
    policyContent,
    loading = false,
    error = null
}: PolicyContentProps) {
    const { t } = useLanguage();
    const currentPolicyData = policyContent?.content[selectedPolicy] as PolicyDataEntry | undefined;

    if (loading && !policyContent) {
        return (
            <SectionContainer>
                <div className="py-8 text-[var(--text-secondary)]">{t('common.loading')}</div>
            </SectionContainer>
        );
    }

    // Check if we have valid policy data with sections
    if (!currentPolicyData || !currentPolicyData.sections) {
        return (
            <div className="text-white p-8">
                <div className="brand-card rounded-[24px] border border-[rgba(239,95,120,0.28)] p-4">
                    <h3 className="mb-2 font-serif text-xl font-semibold text-[var(--destructive-text)]">
                        {t('policy.errors.title')}
                    </h3>
                    <p>{error || t('policy.errors.message').replace('{policy}', selectedPolicy)}</p>
                    <p className="mt-2 text-sm text-[var(--text-muted)]">{t('policy.errors.hint')}</p>
                </div>
            </div>
        );
    }

    // Create table of contents entries from translation data
    const currentTableOfContents = Object.entries(currentPolicyData.sections || {}).map(
        ([sectionKey, sectionData]) => ({
            label: sectionData.title,
            anchorId: sectionKey
        })
    );

    return (
        <SectionContainer>
            <AnimatePresence mode="wait">
                <motion.div
                    key={selectedPolicy}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{
                        duration: 0.5,
                        ease: 'easeInOut'
                    }}
                >
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <TableOfContents entries={currentTableOfContents} />
                    </motion.div>

                    {Object.entries(currentPolicyData.sections || {}).map(([sectionKey, sectionData], index) => (
                        <motion.div
                            key={sectionKey}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.6,
                                delay: 0.3 + index * 0.1,
                                ease: 'easeOut'
                            }}
                        >
                            <PolicySection
                                id={sectionKey}
                                title={sectionData.title}
                                content={renderSectionContent(sectionData.content)}
                            />
                        </motion.div>
                    ))}
                </motion.div>
            </AnimatePresence>
        </SectionContainer>
    );
}
