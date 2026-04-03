'use client';

import { motion } from 'framer-motion';
import type { PolicyContentPayload } from '@/types/content';

interface PolicyBreadcrumbProps {
    selectedPolicy?: string;
    onPolicyClick?: (policy: string) => void;
    policyContent: PolicyContentPayload | null;
}

const PolicyBreadcrumb = ({ selectedPolicy = 'warranty', onPolicyClick, policyContent }: PolicyBreadcrumbProps) => {
    const policyList = policyContent?.policies ?? [];
    const description = policyContent?.descriptions[selectedPolicy] || policyContent?.descriptions.default || '';

    return (
        <div className="brand-shell relative z-20 -mt-16 py-6 sm:ml-16 sm:-mt-20 sm:py-8 md:ml-20 lg:-mt-24 lg:py-10">
            <div>
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                >
                    <motion.h1
                        className="mb-2 font-serif text-3xl font-semibold text-[var(--brand-blue)] sm:text-4xl lg:text-5xl"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    >
                        {policyContent?.title || ''}
                    </motion.h1>

                    {/* Policy Description */}
                    <motion.p
                        className="mb-8 max-w-4xl text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base lg:text-lg"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        {description}
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
                            className="absolute left-0 right-0 top-1/2 h-px bg-[rgba(133,170,197,0.36)] z-0"
                            initial={{ scaleX: 0, opacity: 0 }}
                            animate={{ scaleX: 1, opacity: 1 }}
                            transition={{ duration: 1.2, delay: 0.8 }}
                        />

                        {/* Policy Navigation - aligned left */}
                        <div className="flex items-center gap-1 relative z-10 pl-12 sm:pl-16 lg:pl-20">
                            <div className="bg-[#06111B] px-2 flex items-center gap-1">
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
                                            className={`px-2 py-2 text-sm font-medium transition-all duration-300 bg-[#06111B] whitespace-nowrap ${
                                                selectedPolicy === policy.key
                                                    ? 'text-[var(--brand-blue)] font-semibold'
                                                    : 'text-[var(--text-secondary)] hover:text-white'
                                            }`}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            {policy.label}
                                        </motion.button>

                                        {/* Separator */}
                                        {index < policyList.length - 1 && (
                                            <span className="text-[var(--text-muted)] mx-1">/</span>
                                        )}
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
