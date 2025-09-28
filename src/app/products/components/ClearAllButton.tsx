'use client';

import { motion } from 'framer-motion';

interface ClearAllButtonProps {
    isVisible: boolean;
    onClearAll: () => void;
}

export default function ClearAllButton({ isVisible, onClearAll }: ClearAllButtonProps) {
    if (!isVisible) return null;

    return (
        <motion.button
            onClick={onClearAll}
            className="w-full bg-gradient-to-r from-red-600/20 to-red-500/10 hover:from-red-600/30 hover:to-red-500/20 border border-red-500/30 text-red-400 font-semibold py-3 px-4 2xl:py-4 2xl:px-6 3xl:py-5 3xl:px-8 4xl:py-6 4xl:px-10 rounded-xl 2xl:rounded-2xl 3xl:rounded-3xl text-base 2xl:text-lg 3xl:text-xl 4xl:text-2xl transition-all duration-300 flex items-center justify-center gap-2 2xl:gap-3 3xl:gap-4 4xl:gap-5"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
        >
            <svg className="w-4 h-4 2xl:w-5 2xl:h-5 3xl:w-6 3xl:h-6 4xl:w-7 4xl:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
            </svg>
            Clear All Filters
        </motion.button>
    );
}