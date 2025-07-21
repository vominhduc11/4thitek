'use client';

import { motion } from 'framer-motion';
import { MdSearch } from 'react-icons/md';

interface EmptyStateProps {
    onClearFilters: () => void;
}

export default function EmptyState({ onClearFilters }: EmptyStateProps) {
    return (
        <motion.div
            className="flex flex-col items-center justify-center py-20 text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
        >
            <motion.div
                className="w-24 h-24 mb-6 rounded-full bg-gray-800/50 flex items-center justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                <MdSearch className="w-12 h-12 text-gray-500" />
            </motion.div>

            <motion.h3
                className="text-2xl font-bold text-white mb-3 font-mono"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.4 }}
            >
                NO PRODUCTS FOUND
            </motion.h3>

            <motion.p
                className="text-gray-400 mb-6 max-w-md"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
            >
                No products match your current filters. Try adjusting your search criteria.
            </motion.p>

            <motion.button
                className="px-6 py-3 bg-[#4FC8FF] text-black font-semibold rounded-lg hover:bg-[#4FC8FF]/90 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClearFilters}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
            >
                Clear All Filters
            </motion.button>
        </motion.div>
    );
}
