'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { getAvailableCategories } from '@/data/products';
import FilterHeader from './FilterHeader';
import ActiveFiltersIndicator from './ActiveFiltersIndicator';
import CategoryFilter from './CategoryFilter';
import FeatureFilter from './FeatureFilter';
import ClearAllButton from './ClearAllButton';

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
    const features = ['Wireless', 'Noise Cancelling', 'Gaming', 'Professional'];

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
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] lg:hidden"
                        style={{
                            overscrollBehavior: 'contain',
                            touchAction: 'none'
                        }}
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
                        ? 'fixed lg:static inset-y-0 right-0 w-80 2xl:w-96 3xl:w-[28rem] 4xl:w-[32rem] lg:w-full bg-[#0c131d]/95 lg:bg-transparent backdrop-blur-sm lg:backdrop-blur-none border-l lg:border-l-0 border-gray-700/50 z-50 lg:z-auto overflow-y-auto lg:overflow-visible'
                        : 'hidden lg:block'
                }`}
                initial={false}
                animate={{
                    x: isOpen ? 0 : '100%',
                    opacity: isOpen ? 1 : 0
                }}
                transition={{ type: 'tween', duration: 0.3 }}
            >
                <div className="bg-gradient-to-b from-gray-900/50 to-gray-800/30 backdrop-blur-sm rounded-2xl 3xl:rounded-3xl border border-gray-700/30 lg:border-gray-700/50 p-6 2xl:p-8 3xl:p-10 4xl:p-12 h-fit">
                    <FilterHeader
                        filteredCount={filteredCount}
                        totalCount={totalCount}
                        onClose={onClose}
                    />

                    <ActiveFiltersIndicator isVisible={hasActiveFilters()} />

                    <CategoryFilter
                        categories={categories}
                        selectedCategories={currentFilters.categories}
                        onToggleCategory={(categoryId) => handleFilterToggle('categories', categoryId)}
                    />

                    <FeatureFilter
                        features={features}
                        selectedFeatures={currentFilters.features}
                        onToggleFeature={(feature) => handleFilterToggle('features', feature)}
                    />

                    <ClearAllButton
                        isVisible={hasActiveFilters()}
                        onClearAll={onClearAll}
                    />
                </div>
            </motion.div>
        </>
    );
}
