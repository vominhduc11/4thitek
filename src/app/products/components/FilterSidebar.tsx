'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MdClose } from 'react-icons/md';
import { getAvailableCategories } from '@/data/products';

interface FilterSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onSearch: (query: string) => void;
    onSort: (sortBy: string) => void;
    onFilterChange: (filters: { categories: string[]; features: string[]; targetAudience: string[] }) => void;
    onClearAll: () => void;
    currentFilters: {
        categories: string[];
        features: string[];
        targetAudience: string[];
    };
    searchQuery: string;
    sortBy: string;
    filteredCount: number;
    totalCount: number;
}

export default function FilterSidebar({
    isOpen,
    onClose,
    onFilterChange,
    onClearAll,
    currentFilters,
    filteredCount,
    totalCount
}: FilterSidebarProps) {
    const categories = getAvailableCategories();

    const handleFilterToggle = (filterType: keyof typeof currentFilters, value: string) => {
        const newFilters = { ...currentFilters };
        const currentValues = newFilters[filterType];

        if (currentValues.includes(value)) {
            newFilters[filterType] = currentValues.filter((v) => v !== value);
        } else {
            newFilters[filterType] = [...currentValues, value];
        }

        onFilterChange(newFilters);
    };

    const hasActiveFilters = () => {
        return (
            currentFilters.categories.length > 0 ||
            currentFilters.features.length > 0 ||
            currentFilters.targetAudience.length > 0
        );
    };

    return (
        <>
            {/* Mobile Backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />
                )}
            </AnimatePresence>

            {/* Filter Panel */}
            <motion.div
                className={`${
                    isOpen
                        ? 'fixed lg:static inset-y-0 right-0 w-80 lg:w-full bg-[#0c131d]/95 lg:bg-transparent backdrop-blur-sm lg:backdrop-blur-none border-l lg:border-l-0 border-gray-700/50 z-50 lg:z-auto overflow-y-auto lg:overflow-visible'
                        : 'hidden lg:block'
                }`}
                initial={false}
                animate={{
                    x: isOpen ? 0 : '100%',
                    opacity: isOpen ? 1 : 0
                }}
                transition={{ type: 'tween', duration: 0.3 }}
            >
                <div className="bg-gradient-to-b from-gray-900/50 to-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/30 lg:border-gray-700/50 p-6 h-fit">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                                <svg
                                    className="w-5 h-5 text-[#4FC8FF]"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                                    />
                                </svg>
                                Filters
                            </h2>
                            <p className="text-sm text-gray-400">
                                {filteredCount} of {totalCount} products
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="lg:hidden p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                        >
                            <MdClose className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    {/* Active Filters Indicator */}
                    {hasActiveFilters() && (
                        <motion.div
                            className="mb-6 p-3 bg-[#4FC8FF]/10 border border-[#4FC8FF]/20 rounded-xl"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 }}
                        >
                            <div className="flex items-center gap-2 text-[#4FC8FF] text-sm">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    )}

                    {/* Category Filter */}
                    <motion.div
                        className="mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <svg
                                className="w-5 h-5 text-[#4FC8FF]"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                                />
                            </svg>
                            Categories
                        </h3>
                        <div className="space-y-2">
                            {categories.map((category) => (
                                <motion.button
                                    key={category.id}
                                    onClick={() => handleFilterToggle('categories', category.id)}
                                    className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 group ${
                                        currentFilters.categories.includes(category.id)
                                            ? 'bg-gradient-to-r from-[#4FC8FF]/20 to-[#00D4FF]/10 border border-[#4FC8FF]/30 text-[#4FC8FF]'
                                            : 'bg-gray-800/30 border border-gray-700/50 text-gray-300 hover:text-white hover:border-[#4FC8FF]/30 hover:bg-gray-700/30'
                                    }`}
                                    whileHover={{ scale: 1.02, x: 4 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <span className="font-medium">{category.name}</span>
                                            <p className="text-xs text-gray-400 mt-0.5">{category.description}</p>
                                        </div>
                                        {currentFilters.categories.includes(category.id) && (
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
                    </motion.div>

                    {/* Features Filter */}
                    <motion.div
                        className="mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <svg
                                className="w-5 h-5 text-[#4FC8FF]"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                                />
                            </svg>
                            Features
                        </h3>
                        <div className="grid grid-cols-1 gap-2">
                            {['Wireless', 'Noise Cancelling', 'Gaming', 'Professional'].map((feature) => (
                                <motion.button
                                    key={feature}
                                    onClick={() => handleFilterToggle('features', feature)}
                                    className={`text-left px-4 py-2 rounded-lg transition-all duration-300 ${
                                        currentFilters.features.includes(feature)
                                            ? 'bg-[#4FC8FF]/20 border border-[#4FC8FF]/30 text-[#4FC8FF]'
                                            : 'bg-gray-800/30 border border-gray-700/50 text-gray-300 hover:text-white hover:border-[#4FC8FF]/30'
                                    }`}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">{feature}</span>
                                        {currentFilters.features.includes(feature) && (
                                            <motion.div
                                                className="w-1.5 h-1.5 bg-[#4FC8FF] rounded-full"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: 0.1 }}
                                            />
                                        )}
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>

                    {/* Clear All Button */}
                    {hasActiveFilters() && (
                        <motion.button
                            onClick={onClearAll}
                            className="w-full bg-gradient-to-r from-red-600/20 to-red-500/10 hover:from-red-600/30 hover:to-red-500/20 border border-red-500/30 text-red-400 font-semibold py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                            </svg>
                            Clear All Filters
                        </motion.button>
                    )}
                </div>
            </motion.div>
        </>
    );
}
