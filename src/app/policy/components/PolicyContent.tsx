'use client';

import { motion, AnimatePresence } from 'framer-motion';
import TableOfContents from './TableOfContents';
import PolicySection from './PolicySection';
import SectionContainer from './SectionContainer';
import { useLanguage } from '@/context/LanguageContext';

interface PolicyContentProps {
    selectedPolicy: string;
}

interface ContentData {
    intro?: string;
    commitment?: string;
    conditions?: string;
    conditionsList?: string[];
    contact?: string;
    processing?: string;
    notification?: string;
    shipping?: string;
    collectTitle?: string;
    collectList?: string[];
    purposeTitle?: string;
    purposeList?: string[];
    rights?: string;
    global?: string;
    application?: string;
    law?: string;
    validity?: string;
    compliance?: string;
    recommendation?: string;
    [key: string]: string | string[] | undefined;
}

// Helper function to render content with translations
const renderSectionContent = (sectionKey: string, contentData: ContentData) => {
    const baseClass = "leading-normal text-base 2xl:text-lg 3xl:text-xl 4xl:text-2xl";
    const paragraphClass = `mb-4 2xl:mb-6 3xl:mb-8 4xl:mb-10 ${baseClass}`;
    const listClass = `list-disc list-inside mb-4 2xl:mb-6 3xl:mb-8 4xl:mb-10 space-y-2 2xl:space-y-3 3xl:space-y-4 4xl:space-y-5 ${baseClass}`;
    const strongClass = "text-base 2xl:text-lg 3xl:text-xl 4xl:text-2xl";

    return (
        <>
            {contentData.intro && (
                <p className={paragraphClass}>
                    {contentData.intro}
                </p>
            )}
            {contentData.commitment && (
                <p className={paragraphClass}>
                    {contentData.commitment}
                </p>
            )}
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
            {contentData.contact && (
                <p className={paragraphClass}>
                    {contentData.contact}
                </p>
            )}
            {contentData.processing && (
                <p className={paragraphClass}>
                    {contentData.processing}
                </p>
            )}
            {contentData.notification && (
                <p className={baseClass}>
                    {contentData.notification}
                </p>
            )}
            {contentData.shipping && (
                <p className={baseClass}>
                    {contentData.shipping}
                </p>
            )}
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
            {contentData.rights && (
                <p className={baseClass}>
                    {contentData.rights}
                </p>
            )}
            {contentData.global && (
                <p className={paragraphClass}>
                    {contentData.global}
                </p>
            )}
            {contentData.application && (
                <p className={paragraphClass}>
                    {contentData.application}
                </p>
            )}
            {contentData.law && (
                <p className={paragraphClass}>
                    {contentData.law}
                </p>
            )}
            {contentData.validity && (
                <p className={paragraphClass}>
                    {contentData.validity}
                </p>
            )}
            {contentData.compliance && (
                <p className={baseClass}>
                    {contentData.compliance}
                </p>
            )}
            {contentData.recommendation && (
                <p className={paragraphClass}>
                    {contentData.recommendation}
                </p>
            )}
        </>
    );
};

interface PolicyData {
    title: string;
    sections: Record<string, {
        title: string;
        content: ContentData;
    }>;
}

export default function PolicyContent({ selectedPolicy }: PolicyContentProps) {
    const { getTranslation } = useLanguage();

    // Get policy data from translations using the new getTranslation function
    const currentPolicyData = getTranslation(`policy.content.${selectedPolicy}`) as unknown as PolicyData;

    // Check if we have valid policy data with sections
    if (!currentPolicyData || !currentPolicyData.sections) {
        return (
            <div className="text-white p-8">
                <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
                    <h3 className="text-xl font-bold mb-2">Policy Content Not Found</h3>
                    <p>Unable to load content for policy: <strong>{selectedPolicy}</strong></p>
                    <p className="text-sm mt-2">Please check if the translation data exists for this policy type.</p>
                </div>
            </div>
        );
    }

    // Create table of contents entries from translation data
    const currentTableOfContents = Object.entries(currentPolicyData.sections || {}).map(([sectionKey, sectionData]) => ({
        label: sectionData.title,
        anchorId: sectionKey
    }));

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
                                content={renderSectionContent(sectionKey, sectionData.content)}
                            />
                        </motion.div>
                    ))}
                </motion.div>
            </AnimatePresence>
        </SectionContainer>
    );
}
