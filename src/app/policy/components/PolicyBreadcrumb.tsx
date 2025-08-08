'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';

interface PolicyBreadcrumbProps {
    selectedPolicy?: string;
    onPolicyClick?: (policy: string) => void;
}

const PolicyBreadcrumb = ({ selectedPolicy = 'warranty', onPolicyClick }: PolicyBreadcrumbProps) => {
    const { t } = useLanguage();

    const policyList = [
        { key: 'warranty', label: t('policy.policies.warranty') },
        { key: 'return', label: t('policy.policies.return') },
        { key: 'privacy', label: t('policy.policies.privacy') },
        { key: 'terms', label: t('policy.policies.terms') }
    ];

    // Get policy-specific description
    const getPolicyDescription = () => {
        switch (selectedPolicy) {
            case 'warranty':
                return t('policy.descriptions.warranty');
            case 'return':
                return t('policy.descriptions.return');
            case 'privacy':
                return t('policy.descriptions.privacy');
            case 'terms':
                return t('policy.descriptions.terms');
            default:
                return t('policy.descriptions.default');
        }
    };

    return (
        <div className="ml-16 sm:ml-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 -mt-16 sm:-mt-20 lg:-mt-24 relative z-20 py-6 sm:py-8 lg:py-10">
            <div>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                >
                    <motion.h1
                        className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 font-mono text-[#4FC8FF]"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    >
                        {t('policy.title')}
                    </motion.h1>

                    {/* Policy Description */}
                    <motion.p
                        className="text-gray-300 text-sm sm:text-base lg:text-lg mb-8 leading-relaxed max-w-4xl"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        {getPolicyDescription()}
                    </motion.p>

                    {/* Policy Navigation Breadcrumb */}
                    <motion.div
                        className="mb-8 relative -mx-12 sm:-mx-16 lg:-mx-20"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                    >
                        {/* Continuous horizontal line - full width */}
                        <motion.div
                            className="absolute left-0 right-0 top-1/2 h-px bg-gray-500/60 z-0"
                            initial={{ scaleX: 0, opacity: 0 }}
                            animate={{ scaleX: 1, opacity: 1 }}
                            transition={{ duration: 1.2, delay: 0.8 }}
                        />

                        {/* Policy Navigation - aligned left */}
                        <div className="flex items-center gap-1 relative z-10 pl-12 sm:pl-16 lg:pl-20">
                            <div className="bg-[#0c131d] px-2 flex items-center gap-1">
                                {policyList.map((policy, index) => (
                                    <motion.div
                                        key={policy.key}
                                        className="flex items-center"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                                    >
                                        <motion.button
                                            onClick={() => onPolicyClick?.(policy.key)}
                                            className={`px-2 py-2 text-sm font-medium transition-all duration-300 bg-[#0c131d] whitespace-nowrap ${
                                                selectedPolicy === policy.key
                                                    ? 'text-[#4FC8FF] font-semibold'
                                                    : 'text-gray-300 hover:text-white'
                                            }`}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            {policy.label}
                                        </motion.button>

                                        {/* Separator */}
                                        {index < policyList.length - 1 && <span className="text-gray-500 mx-1">/</span>}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default PolicyBreadcrumb;
