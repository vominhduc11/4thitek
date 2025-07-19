'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MdClose } from 'react-icons/md';

interface FilterSidebarProps {
    isOpen: boolean;
    selectedSeries: string;
    sortBy: string;
    onClose: () => void;
    onSeriesClick: (series: string) => void;
    onSortChange: (sortBy: string) => void;
    onClearFilters: () => void;
}

export default function FilterSidebar({
    isOpen,
    selectedSeries,
    sortBy,
    onClose,
    onSeriesClick,
    onSortChange,
    onClearFilters
}: FilterSidebarProps) {
    const seriesList = ['SX SERIES', 'S SERIES', 'G SERIES', 'G+ SERIES'];
    const sortOptions = [
        { value: 'popularity', label: 'Popularity' },
        { value: 'name-asc', label: 'Name: A to Z' },
        { value: 'name-desc', label: 'Name: Z to A' },
        { value: 'category', label: 'Category' }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    <motion.div
                        className="fixed top-0 right-0 h-full w-80 sm:w-96 bg-[#0c131d] border-l border-gray-700 z-50 overflow-y-auto"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    >
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-8">
                                <motion.h2
                                    className="text-xl font-bold text-white font-mono"
                                    initial={{ opacity: 0, y: -20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                >
                                    FILTER & SORT
                                </motion.h2>
                                <motion.button
                                    onClick={onClose}
                                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                >
                                    <MdClose className="w-5 h-5" />
                                </motion.button>
                            </div>

                            <motion.div
                                className="space-y-8"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-4 font-sans">Product Series</h3>
                                    <div className="space-y-2">
                                        <motion.button
                                            onClick={() => onSeriesClick('ALL')}
                                            className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-300 ${
                                                selectedSeries === 'ALL'
                                                    ? 'bg-[#4FC8FF]/20 border border-[#4FC8FF]/50 text-[#4FC8FF]'
                                                    : 'bg-gray-800/50 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600'
                                            }`}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="font-medium">All Series</span>
                                                {selectedSeries === 'ALL' && (
                                                    <motion.div
                                                        className="w-2 h-2 bg-[#4FC8FF] rounded-full"
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{ delay: 0.1 }}
                                                    />
                                                )}
                                            </div>
                                        </motion.button>

                                        {seriesList.map((series, index) => (
                                            <motion.button
                                                key={series}
                                                onClick={() => onSeriesClick(series)}
                                                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-300 ${
                                                    selectedSeries === series
                                                        ? 'bg-[#4FC8FF]/20 border border-[#4FC8FF]/50 text-[#4FC8FF]'
                                                        : 'bg-gray-800/50 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600'
                                                }`}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.4 + index * 0.1 }}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium">{series}</span>
                                                    {selectedSeries === series && (
                                                        <motion.div
                                                            className="w-2 h-2 bg-[#4FC8FF] rounded-full"
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            transition={{ delay: 0.1 }}
                                                        />
                                                    )}
                                                </div>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-4 font-sans">Sort By</h3>
                                    <div className="space-y-2">
                                        {sortOptions.map((option, index) => (
                                            <motion.button
                                                key={option.value}
                                                onClick={() => onSortChange(option.value)}
                                                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-300 ${
                                                    sortBy === option.value
                                                        ? 'bg-[#4FC8FF]/20 border border-[#4FC8FF]/50 text-[#4FC8FF]'
                                                        : 'bg-gray-800/50 border border-gray-700 text-gray-300 hover:text-white hover:border-gray-600'
                                                }`}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.6 + index * 0.1 }}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium">{option.label}</span>
                                                    {sortBy === option.value && (
                                                        <motion.div
                                                            className="w-2 h-2 bg-[#4FC8FF] rounded-full"
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            transition={{ delay: 0.1 }}
                                                        />
                                                    )}
                                                </div>
                                            </motion.button>
                                        ))}
                                    </div>
                                </div>

                                <motion.div
                                    className="pt-6 border-t border-gray-700"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.8 }}
                                >
                                    <motion.button
                                        onClick={onClearFilters}
                                        className="w-full px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors border border-gray-600 hover:border-gray-500"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        Clear All Filters
                                    </motion.button>
                                </motion.div>
                            </motion.div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
