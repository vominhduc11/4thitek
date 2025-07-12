'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MdChevronRight } from 'react-icons/md';

interface StickyBreadcrumbFilterProps {
    selectedSeries: string;
    hasActiveFilters: boolean;
    onSeriesClick: (series: string) => void;
    onFilterToggle: () => void;
    filteredCount: number;
    totalProducts: number;
}

const StickyBreadcrumbFilter = ({
    selectedSeries,
    hasActiveFilters,
    onSeriesClick,
    onFilterToggle,
    filteredCount,
    totalProducts
}: StickyBreadcrumbFilterProps) => {
    const [isSticky, setIsSticky] = useState(false);
    const [scrollY, setScrollY] = useState(0);

    const seriesList = ['SX SERIES', 'S SERIES', 'G SERIES', 'G+ SERIES'];

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            setScrollY(currentScrollY);

            // Adjust this value based on when you want the sticky behavior to activate
            // This should be roughly where the original breadcrumb section would scroll out of view
            const stickyThreshold = 650; // Adjust this value as needed
            setIsSticky(currentScrollY > stickyThreshold);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Dynamic styles based on scroll position and sticky state
    const stickyStyle = {
        backgroundColor: isSticky ? `rgba(12, 19, 29, ${Math.min((scrollY - 650) / 200, 0.98)})` : 'transparent',
        backdropFilter: isSticky ? 'blur(12px)' : 'none',
        borderBottom: isSticky ? `1px solid rgba(79, 200, 255, ${Math.min((scrollY - 650) / 400, 0.2)})` : 'none',
        boxShadow: isSticky ? '0 4px 24px rgba(0, 0, 0, 0.4)' : 'none'
    };

    return (
        <AnimatePresence>
            {isSticky && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="fixed top-12 sm:top-16 left-16 sm:left-20 right-0 z-40 py-3 sm:py-4"
                    style={stickyStyle}
                >
                    <div className="px-4 sm:px-8 lg:px-16">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-8">
                            {/* Compact Breadcrumb Navigation */}
                            <div className="flex items-center space-x-1 text-xs sm:text-sm font-sans uppercase tracking-wider">
                                <motion.button
                                    className={`font-medium relative pb-1 px-2 py-1 rounded transition-all duration-300 ${
                                        selectedSeries === 'ALL'
                                            ? 'text-[#4FC8FF] bg-[#4FC8FF]/10 scale-105'
                                            : 'text-white/80 hover:text-[#4FC8FF] hover:bg-white/5'
                                    }`}
                                    whileHover={{ scale: selectedSeries === 'ALL' ? 1.05 : 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => onSeriesClick('ALL')}
                                >
                                    ALL
                                    {selectedSeries === 'ALL' && (
                                        <motion.div
                                            className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-4 h-0.5 bg-[#4FC8FF]"
                                            layoutId="stickyActiveIndicator"
                                            initial={false}
                                            transition={{ duration: 0.3 }}
                                        />
                                    )}
                                </motion.button>

                                {seriesList.map((series, index) => (
                                    <div key={index} className="flex items-center">
                                        <span className="text-gray-500 mx-1 sm:mx-2 text-xs">/</span>
                                        <motion.button
                                            className={`transition-all duration-300 relative group px-2 py-1 rounded ${
                                                selectedSeries === series
                                                    ? 'text-[#4FC8FF] bg-[#4FC8FF]/10 scale-105 font-semibold'
                                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                            }`}
                                            whileHover={{ scale: selectedSeries === series ? 1.05 : 1.1 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => onSeriesClick(series)}
                                        >
                                            {series.replace(' SERIES', '')}

                                            {selectedSeries === series && (
                                                <>
                                                    <motion.div
                                                        className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-4 h-0.5 bg-[#4FC8FF]"
                                                        initial={{ scaleX: 0 }}
                                                        animate={{ scaleX: 1 }}
                                                        transition={{ duration: 0.3 }}
                                                    />
                                                    <motion.div
                                                        className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-[#4FC8FF] rounded-full"
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        transition={{ delay: 0.1, type: 'spring', stiffness: 500 }}
                                                    />
                                                </>
                                            )}
                                        </motion.button>
                                    </div>
                                ))}
                            </div>

                            {/* Right side: Product count + Filter button */}
                            <div className="flex items-center gap-3 sm:gap-4">
                                {/* Compact Product Count */}
                                <motion.div
                                    className="text-xs sm:text-sm text-gray-400 hidden sm:block bg-white/5 px-3 py-1.5 rounded-full"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: 0.1 }}
                                >
                                    {selectedSeries === 'ALL' ? (
                                        <span>
                                            <span className="text-[#4FC8FF] font-semibold">{totalProducts}</span>{' '}
                                            products
                                        </span>
                                    ) : (
                                        <span>
                                            <span className="text-[#4FC8FF] font-semibold">{filteredCount}</span> in{' '}
                                            {selectedSeries.replace(' SERIES', '')}
                                        </span>
                                    )}
                                </motion.div>

                                {/* Compact Filter Button */}
                                <motion.button
                                    className={`flex items-center space-x-2 px-3 sm:px-4 py-2 border rounded-lg font-sans uppercase tracking-wider text-xs sm:text-sm transition-all duration-300 group relative ${
                                        hasActiveFilters
                                            ? 'border-[#4FC8FF] text-[#4FC8FF] bg-[#4FC8FF]/10 shadow-lg shadow-[#4FC8FF]/20'
                                            : 'border-gray-600 text-white hover:border-[#4FC8FF] hover:text-[#4FC8FF] hover:bg-[#4FC8FF]/5'
                                    }`}
                                    whileHover={{
                                        scale: 1.02,
                                        boxShadow: hasActiveFilters
                                            ? '0 6px 24px rgba(79, 200, 255, 0.3)'
                                            : '0 4px 16px rgba(79, 200, 255, 0.2)'
                                    }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={onFilterToggle}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: 0.2 }}
                                >
                                    {/* Active Filter Indicator */}
                                    {hasActiveFilters && (
                                        <motion.div
                                            className="absolute -top-1 -right-1 w-2 h-2 bg-[#4FC8FF] rounded-full"
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            transition={{ duration: 0.3 }}
                                        />
                                    )}

                                    {/* Compact Filter Icon */}
                                    <motion.div
                                        className="flex flex-col space-y-0.5"
                                        whileHover={{ rotate: 90 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div className="flex space-x-0.5">
                                            <div className="w-2 h-0.5 bg-current rounded-full"></div>
                                            <div className="w-1.5 h-0.5 bg-current rounded-full opacity-60"></div>
                                        </div>
                                        <div className="flex space-x-0.5">
                                            <div className="w-1.5 h-0.5 bg-current rounded-full opacity-60"></div>
                                            <div className="w-2 h-0.5 bg-current rounded-full"></div>
                                        </div>
                                    </motion.div>

                                    <span className="font-medium hidden sm:inline">FILTER</span>
                                    <span className="font-medium sm:hidden">SORT</span>

                                    {/* Arrow indicator */}
                                    <motion.div
                                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                        animate={{ x: [0, 2, 0] }}
                                        transition={{ duration: 1.5, repeat: Infinity }}
                                    >
                                        <MdChevronRight className="w-3 h-3" />
                                    </motion.div>
                                </motion.button>
                            </div>
                        </div>

                        {/* Mobile Product Count */}
                        <motion.div
                            className="mt-2 text-xs text-gray-400 sm:hidden bg-white/5 px-3 py-1.5 rounded-full inline-block"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.3 }}
                        >
                            {selectedSeries === 'ALL' ? (
                                <span>
                                    Showing all <span className="text-[#4FC8FF] font-semibold">{totalProducts}</span>{' '}
                                    products
                                </span>
                            ) : (
                                <span>
                                    <span className="text-[#4FC8FF] font-semibold">{filteredCount}</span> products in{' '}
                                    <span className="text-white font-semibold">
                                        {selectedSeries.replace(' SERIES', '')}
                                    </span>
                                </span>
                            )}
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default StickyBreadcrumbFilter;
