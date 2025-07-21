'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiChevronDown } from 'react-icons/fi';

interface PositionQuickSwitchProps {
    selectedPosition: string;
    onPositionClick: (position: string) => void;
}

export default function PositionQuickSwitch({ selectedPosition, onPositionClick }: PositionQuickSwitchProps) {
    const [isOpen, setIsOpen] = useState(false);

    const positionList = [
        { value: 'ALL', label: 'All Products', color: '#ffffff' },
        { value: 'Entry', label: 'Entry Level', color: '#10B981' },
        { value: 'Mid-range', label: 'Mid-range', color: '#F59E0B' },
        { value: 'Premium', label: 'Premium', color: '#4FC8FF' },
        { value: 'Ultimate', label: 'Ultimate', color: '#EF4444' }
    ];

    const currentPosition = positionList.find((p) => p.value === selectedPosition) || positionList[0];

    const handlePositionSelect = (position: string) => {
        onPositionClick(position);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 bg-[#0c131d] border border-gray-600 rounded-lg px-4 py-2 text-white hover:border-gray-500 transition-colors min-w-[180px]"
                whileTap={{ scale: 0.95 }}
            >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: currentPosition.color }}></div>
                <span className="flex-1 text-left">{currentPosition.label}</span>
                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <FiChevronDown className="w-4 h-4" />
                </motion.div>
            </motion.button>

            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{
                    opacity: isOpen ? 1 : 0,
                    y: isOpen ? 0 : -10,
                    visibility: isOpen ? 'visible' : 'hidden'
                }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 right-0 mt-2 bg-[#0c131d] border border-gray-600 rounded-lg shadow-xl z-50"
            >
                {positionList.map((position) => (
                    <motion.button
                        key={position.value}
                        onClick={() => handlePositionSelect(position.value)}
                        className="flex items-center space-x-3 w-full px-4 py-3 text-left hover:bg-[#243447] transition-colors first:rounded-t-lg last:rounded-b-lg"
                        whileHover={{ x: 4 }}
                    >
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: position.color }}></div>
                        <span className="text-white">{position.label}</span>
                        {selectedPosition === position.value && (
                            <motion.div
                                className="ml-auto w-2 h-2 bg-blue-400 rounded-full"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.2 }}
                            />
                        )}
                    </motion.button>
                ))}
            </motion.div>

            {/* Backdrop */}
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
}
