'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { FiChevronDown } from 'react-icons/fi';

interface SeriesQuickSwitchProps {
    selectedSeries: string;
    onSeriesClick: (series: string) => void;
}

const SeriesQuickSwitch = ({ selectedSeries, onSeriesClick }: SeriesQuickSwitchProps) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const seriesList = [
        { value: 'ALL', label: 'All Series', color: '#ffffff' },
        { value: 'SX SERIES', label: 'SX Series', color: '#4FC8FF' },
        { value: 'S SERIES', label: 'S Series', color: '#10B981' },
        { value: 'G SERIES', label: 'G Series', color: '#F59E0B' },
        { value: 'G+ SERIES', label: 'G+ Series', color: '#EF4444' }
    ];

    const currentSeries = seriesList.find(s => s.value === selectedSeries) || seriesList[0];

    const handleSeriesSelect = (series: string) => {
        onSeriesClick(series);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            {/* Current Series Display */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-3 px-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg hover:border-[#4FC8FF] transition-all duration-300 min-w-[160px]"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <div className="flex items-center space-x-2 flex-1">
                    <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: currentSeries.color }}
                    />
                    <span className="text-white text-sm font-medium">
                        {currentSeries.label}
                    </span>
                </div>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <FiChevronDown className="text-gray-400" size={16} />
                </motion.div>
            </motion.button>

            {/* Dropdown Menu */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    
                    {/* Dropdown */}
                    <motion.div
                        className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-20 overflow-hidden"
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                    >
                        {seriesList.map((series, index) => (
                            <motion.button
                                key={series.value}
                                onClick={() => handleSeriesSelect(series.value)}
                                className={`w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-700 transition-colors ${
                                    series.value === selectedSeries ? 'bg-gray-700/50' : ''
                                }`}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                whileHover={{ x: 4 }}
                            >
                                <div 
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: series.color }}
                                />
                                <span className={`text-sm font-medium ${
                                    series.value === selectedSeries ? 'text-[#4FC8FF]' : 'text-white'
                                }`}>
                                    {series.label}
                                </span>
                                {series.value === selectedSeries && (
                                    <motion.div
                                        className="ml-auto w-2 h-2 bg-[#4FC8FF] rounded-full"
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.1 }}
                                    />
                                )}
                            </motion.button>
                        ))}
                    </motion.div>
                </>
            )}
        </div>
    );
};

export default SeriesQuickSwitch;
