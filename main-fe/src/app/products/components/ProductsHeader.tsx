'use client';

import { motion } from 'framer-motion';
import { MdChevronRight } from 'react-icons/md';
import { useLanguage } from '@/context/LanguageContext';

interface ProductsHeaderProps {
    selectedPosition: string;
    hasActiveFilters: boolean;
    onPositionClick: (position: string) => void;
    onFilterToggle: () => void;
    totalProducts: number;
    filteredCount: number;
}

export default function ProductsHeader({
    selectedPosition,
    hasActiveFilters,
    onPositionClick,
    onFilterToggle,
    totalProducts,
    filteredCount
}: ProductsHeaderProps) {
    const { t } = useLanguage();
    const positionList = ['Entry', 'Mid-range', 'Premium', 'Ultimate'];
    const positionLabels: Record<string, string> = {
        'Entry': t('products.positions.entry.label'),
        'Mid-range': t('products.positions.midRange.label'),
        'Premium': t('products.positions.premium.label'),
        'Ultimate': t('products.positions.ultimate.label')
    };

    const getDisplayTitle = () => {
        if (selectedPosition === 'ALL') {
            return t('products.list.titleAll');
        }
        const positionLabel = positionLabels[selectedPosition] || selectedPosition;
        return t('products.list.titlePosition').replace('{position}', positionLabel);
    };

    const getPositionDescription = () => {
        switch (selectedPosition) {
            case 'Entry':
                return t('products.positions.entry.description');
            case 'Mid-range':
                return t('products.positions.midRange.description');
            case 'Premium':
                return t('products.positions.premium.description');
            case 'Ultimate':
                return t('products.positions.ultimate.description');
            default:
                return t('products.positions.all.description');
        }
    };

    return (
        <div className="ml-0 sm:ml-16 md:ml-20 mr-4 sm:mr-12 md:mr-16 lg:mr-20 -mt-16 sm:-mt-20 lg:-mt-24 relative z-20 py-6 sm:py-8 lg:py-10">
            <div className="px-12 sm:px-16 lg:px-20">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                >
                    <motion.h1
                        className={`text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 ${
                            selectedPosition === 'ALL' ? 'text-white' : 'text-[#4FC8FF]'
                        }`}
                        key={selectedPosition}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    >
                        {getDisplayTitle()}
                    </motion.h1>

                    <motion.div
                        className="mb-6 text-sm sm:text-base text-gray-400"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        {selectedPosition === 'ALL' ? (
                            <span>
                                {t('products.list.showingAll')
                                    .replace('{count}', String(totalProducts))}
                            </span>
                        ) : (
                            <span>
                                {t('products.list.showingFiltered')
                                    .replace('{count}', String(filteredCount))
                                    .replace('{category}', positionLabels[selectedPosition] || selectedPosition)}
                            </span>
                        )}
                    </motion.div>

                    <motion.div
                        id="original-breadcrumb-filter"
                        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-8 mb-8 relative"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                    >
                        <motion.div
                            className="absolute -left-12 sm:-left-16 lg:-left-20 -right-12 sm:-right-16 lg:-right-20 top-1/2 h-px bg-gradient-to-r from-gray-500/40 via-gray-500/70 to-gray-500/40 z-0 hidden lg:block"
                            initial={{ scaleX: 0, opacity: 0 }}
                            animate={{ scaleX: 1, opacity: 1 }}
                            transition={{ duration: 1.2, delay: 0.8 }}
                            style={{ transform: 'translateY(-0.5px)' }}
                        />

                        <div className="flex items-center space-x-1 text-sm font-sans uppercase tracking-wider bg-[#0c131d] pr-4 relative z-10">
                            <motion.button
                                className={`font-medium relative pb-1 border-b-2 transition-all duration-300 ${
                                    selectedPosition === 'ALL'
                                        ? 'border-[#4FC8FF] text-[#4FC8FF] scale-105'
                                        : 'border-transparent text-white hover:text-[#4FC8FF] hover:border-[#4FC8FF]/50'
                                }`}
                                whileHover={{ scale: selectedPosition === 'ALL' ? 1.05 : 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onPositionClick('ALL')}
                            >
                                {t('products.list.allProducts')}
                                {selectedPosition === 'ALL' && (
                                    <motion.div
                                        className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-[#4FC8FF]"
                                        layoutId="activePositionIndicator"
                                        initial={false}
                                        transition={{ duration: 0.3 }}
                                    />
                                )}
                            </motion.button>

                            {positionList.map((position, index) => (
                                <div key={index} className="flex items-center">
                                    <span className="text-gray-500 mx-2">/</span>
                                    <motion.button
                                        className={`transition-all duration-300 relative group ${
                                            selectedPosition === position
                                                ? 'text-[#4FC8FF] scale-105 font-semibold'
                                                : 'text-gray-400 hover:text-white'
                                        }`}
                                        whileHover={{ scale: selectedPosition === position ? 1.05 : 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => onPositionClick(position)}
                                    >
                                        {(positionLabels[position] || position).toUpperCase()}
                                        <span
                                            className={`absolute bottom-0 left-0 h-0.5 bg-[#4FC8FF] transition-all duration-300 ${
                                                selectedPosition === position ? 'w-full' : 'w-0 group-hover:w-full'
                                            }`}
                                        ></span>

                                        {selectedPosition === position && (
                                            <motion.div
                                                className="absolute -top-1 -right-1 w-2 h-2 bg-[#4FC8FF] rounded-full"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: 0.2, type: 'spring', stiffness: 500 }}
                                            />
                                        )}
                                    </motion.button>
                                </div>
                            ))}
                        </div>

                        <motion.button
                            className={`flex items-center space-x-3 px-6 py-3 border rounded-lg font-sans uppercase tracking-wider text-sm transition-all duration-300 group min-w-[180px] justify-center lg:justify-start bg-[#0c131d] relative z-10 ${
                                hasActiveFilters
                                    ? 'border-[#4FC8FF] text-[#4FC8FF] shadow-lg shadow-[#4FC8FF]/20'
                                    : 'border-gray-600 text-white hover:border-[#4FC8FF] hover:text-[#4FC8FF]'
                            }`}
                            whileHover={{
                                scale: 1.02,
                                boxShadow: hasActiveFilters
                                    ? '0 4px 20px rgba(79, 200, 255, 0.3)'
                                    : '0 4px 12px rgba(79, 200, 255, 0.2)'
                            }}
                            whileTap={{ scale: 0.98 }}
                            onClick={onFilterToggle}
                        >
                            {hasActiveFilters && (
                                <motion.div
                                    className="absolute -top-1 -right-1 w-3 h-3 bg-[#4FC8FF] rounded-full"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.3 }}
                                />
                            )}

                            <motion.div
                                className="flex flex-col space-y-1"
                                whileHover={{ rotate: 90 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="flex space-x-1">
                                    <div className="w-3 h-0.5 bg-current rounded-full"></div>
                                    <div className="w-2 h-0.5 bg-current rounded-full opacity-60"></div>
                                </div>
                                <div className="flex space-x-1">
                                    <div className="w-2 h-0.5 bg-current rounded-full opacity-60"></div>
                                    <div className="w-3 h-0.5 bg-current rounded-full"></div>
                                </div>
                                <div className="flex space-x-1">
                                    <div className="w-3 h-0.5 bg-current rounded-full"></div>
                                    <div className="w-1 h-0.5 bg-current rounded-full opacity-40"></div>
                                </div>
                            </motion.div>

                            <span className="font-medium">{t('products.list.filterLabel')}</span>

                            <motion.div
                                className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                animate={{ x: [0, 3, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                <MdChevronRight className="w-4 h-4" />
                            </motion.div>
                        </motion.button>
                    </motion.div>

                    <motion.div
                        className="block lg:hidden mb-6 space-y-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.7 }}
                    >
                        <div className="flex flex-wrap gap-2">
                            <motion.button
                                className={`px-3 py-1.5 rounded text-xs font-sans uppercase tracking-wide transition-all duration-300 ${
                                    selectedPosition === 'ALL'
                                        ? 'bg-[#4FC8FF]/20 border border-[#4FC8FF]/50 text-[#4FC8FF]'
                                        : 'border border-gray-600 text-gray-400 hover:text-white hover:border-gray-500'
                                }`}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onPositionClick('ALL')}
                            >
                                {t('products.list.allShort')}
                            </motion.button>
                            {positionList.map((position) => (
                                <motion.button
                                    key={position}
                                    className={`px-3 py-1.5 rounded text-xs font-sans uppercase tracking-wide transition-all duration-300 ${
                                        selectedPosition === position
                                            ? 'bg-[#4FC8FF]/20 border border-[#4FC8FF]/50 text-[#4FC8FF]'
                                            : 'border border-gray-600 text-gray-400 hover:text-white hover:border-gray-500'
                                    }`}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => onPositionClick(position)}
                                >
                                    {positionLabels[position] || position}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>

                    <motion.p
                        style={{ color: '#8390A5' }}
                        key={`desc-${selectedPosition}`}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        {getPositionDescription()}
                    </motion.p>
                </motion.div>
            </div>
        </div>
    );
}
