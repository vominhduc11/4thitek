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

const FilterSidebar = ({
    isOpen,
    selectedSeries,
    sortBy,
    onClose,
    onSeriesClick,
    onSortChange,
    onClearFilters
}: FilterSidebarProps) => {
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
                    {/* Backdrop Overlay */}
                    <motion.div
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Filter Sidebar */}
                    <motion.div
                        className="fixed top-0 right-0 h-full w-80 sm:w-96 bg-[#0c131d] border-l border-gray-700 z-50 overflow-y-auto"
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-700">
                            <h2 className="text-xl font-bold text-white font-mono">FILTER & SORT</h2>
                            <motion.button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                            >
                                <MdClose className="w-5 h-5" />
                            </motion.button>
                        </div>

                        {/* Filter Content */}
                        <div className="p-6 space-y-8">
                            {/* Series Filter */}
                            <div>
                                <h3 className="text-white font-semibold mb-4 uppercase tracking-wider text-sm">
                                    Series
                                </h3>
                                <div className="space-y-3">
                                    {/* All Series Option */}
                                    <motion.label
                                        className="flex items-center space-x-3 cursor-pointer group"
                                        whileHover={{ x: 4 }}
                                    >
                                        <input
                                            type="radio"
                                            name="series"
                                            checked={selectedSeries === 'ALL'}
                                            onChange={() => onSeriesClick('ALL')}
                                            className="w-4 h-4 text-[#4FC8FF] bg-gray-800 border-gray-600 focus:ring-[#4FC8FF] focus:ring-2"
                                        />
                                        <span className="text-gray-300 group-hover:text-white transition-colors text-sm font-medium">
                                            All Series
                                        </span>
                                    </motion.label>
                                    
                                    {/* Individual Series */}
                                    {seriesList.map((series) => (
                                        <motion.label
                                            key={series}
                                            className="flex items-center space-x-3 cursor-pointer group"
                                            whileHover={{ x: 4 }}
                                        >
                                            <input
                                                type="radio"
                                                name="series"
                                                checked={selectedSeries === series}
                                                onChange={() => onSeriesClick(series)}
                                                className="w-4 h-4 text-[#4FC8FF] bg-gray-800 border-gray-600 focus:ring-[#4FC8FF] focus:ring-2"
                                            />
                                            <span className="text-gray-300 group-hover:text-white transition-colors text-sm">
                                                {series}
                                            </span>
                                        </motion.label>
                                    ))}
                                </div>
                            </div>

                            {/* Features */}
                            <div>
                                <h3 className="text-white font-semibold mb-4 uppercase tracking-wider text-sm">
                                    Features
                                </h3>
                                <div className="space-y-3">
                                    {[
                                        'Bluetooth 5.0',
                                        'Waterproof IP67',
                                        'Noise Cancellation',
                                        'Long Battery Life'
                                    ].map((feature) => (
                                        <motion.label
                                            key={feature}
                                            className="flex items-center space-x-3 cursor-pointer group"
                                            whileHover={{ x: 4 }}
                                        >
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 text-[#4FC8FF] bg-gray-800 border-gray-600 rounded focus:ring-[#4FC8FF] focus:ring-2"
                                            />
                                            <span className="text-gray-300 group-hover:text-white transition-colors text-sm">
                                                {feature}
                                            </span>
                                        </motion.label>
                                    ))}
                                </div>
                            </div>

                            {/* Sort By */}
                            <div>
                                <h3 className="text-white font-semibold mb-4 uppercase tracking-wider text-sm">
                                    Sort By
                                </h3>
                                <div className="space-y-3">
                                    {sortOptions.map((option) => (
                                        <motion.label
                                            key={option.value}
                                            className="flex items-center space-x-3 cursor-pointer group"
                                            whileHover={{ x: 4 }}
                                        >
                                            <input
                                                type="radio"
                                                name="sortBy"
                                                value={option.value}
                                                checked={sortBy === option.value}
                                                onChange={() => onSortChange(option.value)}
                                                className="w-4 h-4 text-[#4FC8FF] bg-gray-800 border-gray-600 focus:ring-[#4FC8FF] focus:ring-2"
                                            />
                                            <span className="text-gray-300 group-hover:text-white transition-colors text-sm">
                                                {option.label}
                                            </span>
                                        </motion.label>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="p-6 border-t border-gray-700 flex space-x-4">
                            <motion.button
                                className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium text-sm"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onClearFilters}
                            >
                                Clear All
                            </motion.button>
                            <motion.button
                                className="flex-1 px-4 py-3 bg-[#4FC8FF] text-black font-semibold rounded-lg hover:bg-[#4FC8FF]/90 transition-colors text-sm"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onClose}
                            >
                                Apply Filters
                            </motion.button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default FilterSidebar;
