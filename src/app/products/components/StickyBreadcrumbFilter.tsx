'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdFilterList, MdChevronRight } from 'react-icons/md';

interface StickyBreadcrumbFilterProps {
    selectedPosition: string;
    hasActiveFilters: boolean;
    onPositionClick: (position: string) => void;
    onFilterToggle: () => void;
    showFilters: boolean;
}

export default function StickyBreadcrumbFilter({
    selectedPosition,
    hasActiveFilters,
    onPositionClick,
    onFilterToggle,
    showFilters // eslint-disable-line @typescript-eslint/no-unused-vars
}: StickyBreadcrumbFilterProps) {
    const [isVisible, setIsVisible] = useState(false);
    const positionList = ['Entry', 'Mid-range', 'Premium', 'Ultimate'];

    useEffect(() => {
        const handleScroll = () => {
            // Tìm element gốc của breadcrumb
            const originalElement = document.getElementById('original-breadcrumb-filter');
            if (originalElement) {
                const rect = originalElement.getBoundingClientRect();
                const scrollPosition = window.scrollY;
                const elementTop = rect.top + scrollPosition;

                // Hiển thị sticky khi cuộn qua vị trí của element gốc
                setIsVisible(scrollPosition > elementTop + rect.height);
            }
        };

        window.addEventListener('scroll', handleScroll);
        // Gọi một lần để check vị trí ban đầu
        handleScroll();

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    className="fixed top-16 left-0 right-0 z-40 bg-[#0c131d]/95 backdrop-blur-md border-b border-gray-700/50 shadow-lg"
                    initial={{ opacity: 0, y: -100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -100 }}
                    transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                    <div className="ml-16 sm:ml-20 mr-4 sm:mr-12 md:mr-16 lg:mr-20 py-3">
                        <div className="px-4 sm:px-6 lg:px-8">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                <div className="flex items-center space-x-3 overflow-x-auto">
                                    <motion.button
                                        onClick={() => onPositionClick('ALL')}
                                        className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                                            selectedPosition === 'ALL'
                                                ? 'bg-[#4FC8FF]/20 text-[#4FC8FF] border border-[#4FC8FF]/50'
                                                : 'bg-gray-800/50 text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600'
                                        }`}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                    >
                                        <span>All</span>
                                        {selectedPosition === 'ALL' && (
                                            <motion.div
                                                className="w-1.5 h-1.5 bg-[#4FC8FF] rounded-full"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: 0.1 }}
                                            />
                                        )}
                                    </motion.button>

                                    {positionList.map((position, index) => (
                                        <motion.button
                                            key={position}
                                            onClick={() => onPositionClick(position)}
                                            className={`flex items-center space-x-2 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                                                selectedPosition === position
                                                    ? 'bg-[#4FC8FF]/20 text-[#4FC8FF] border border-[#4FC8FF]/50'
                                                    : 'bg-gray-800/50 text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600'
                                            }`}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                        >
                                            <span>{position}</span>
                                            {selectedPosition === position && (
                                                <motion.div
                                                    className="w-1.5 h-1.5 bg-[#4FC8FF] rounded-full"
                                                    initial={{ scale: 0 }}
                                                    animate={{ scale: 1 }}
                                                    transition={{ delay: 0.1 }}
                                                />
                                            )}
                                        </motion.button>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between sm:justify-end space-x-4">
                                    <motion.div
                                        className="text-sm text-gray-400"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                    >
                                        <span className="text-[#4FC8FF] font-medium">Products</span>
                                    </motion.div>

                                    <motion.button
                                        onClick={onFilterToggle}
                                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 relative ${
                                            hasActiveFilters
                                                ? 'bg-[#4FC8FF]/20 text-[#4FC8FF] border border-[#4FC8FF]/50'
                                                : 'bg-gray-800/50 text-gray-400 hover:text-white border border-gray-700 hover:border-gray-600'
                                        }`}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.1 }}
                                    >
                                        {hasActiveFilters && (
                                            <motion.div
                                                className="absolute -top-1 -right-1 w-2 h-2 bg-[#4FC8FF] rounded-full"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: 0.2 }}
                                            />
                                        )}
                                        <MdFilterList className="w-4 h-4" />
                                        <span>Filter</span>
                                        <MdChevronRight className="w-3 h-3 opacity-60" />
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
