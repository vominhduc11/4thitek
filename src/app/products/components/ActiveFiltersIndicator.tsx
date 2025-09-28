'use client';

import { motion } from 'framer-motion';

interface ActiveFiltersIndicatorProps {
    isVisible: boolean;
}

export default function ActiveFiltersIndicator({ isVisible }: ActiveFiltersIndicatorProps) {
    if (!isVisible) return null;

    return (
        <motion.div
            className="mb-6 2xl:mb-8 3xl:mb-10 4xl:mb-12 p-3 2xl:p-4 3xl:p-5 4xl:p-6 bg-[#4FC8FF]/10 border border-[#4FC8FF]/20 rounded-xl 2xl:rounded-2xl 3xl:rounded-3xl"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
        >
            <div className="flex items-center gap-2 2xl:gap-3 3xl:gap-4 4xl:gap-5 text-[#4FC8FF] text-sm 2xl:text-base 3xl:text-lg 4xl:text-xl">
                <svg className="w-4 h-4 2xl:w-5 2xl:h-5 3xl:w-6 3xl:h-6 4xl:w-7 4xl:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                    />
                </svg>
                Filters applied
            </div>
        </motion.div>
    );
}