'use client';

import { motion } from 'framer-motion';
import { FiSearch, FiFilter, FiClock, FiTrendingUp, FiEye, FiChevronDown } from 'react-icons/fi';
import { blogCategories } from '@/data/blogs';
import { useState, useEffect, useRef } from 'react';

interface BlogBreadcrumbProps {
    selectedCategory: string;
    onCategoryClick: (category: string) => void;
    totalBlogs: number;
    filteredCount: number;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    sortBy: 'date' | 'popularity' | 'views';
    onSortChange: (sort: 'date' | 'popularity' | 'views') => void;
}

const BlogBreadcrumb = ({
    selectedCategory,
    onCategoryClick,
    totalBlogs,
    filteredCount,
    searchQuery,
    onSearchChange,
    sortBy,
    onSortChange
}: BlogBreadcrumbProps) => {
    const categoryList = blogCategories;
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const sortOptions = [
        { value: 'date', label: 'Mới nhất', icon: FiClock },
        { value: 'popularity', label: 'Phổ biến nhất', icon: FiTrendingUp },
        { value: 'views', label: 'Xem nhiều nhất', icon: FiEye }
    ];

    const currentSort = sortOptions.find((option) => option.value === sortBy) || sortOptions[0];
    const CurrentIcon = currentSort.icon;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Format category title for display
    const getDisplayTitle = () => {
        if (selectedCategory === 'ALL') {
            return 'BLOG LIST';
        }
        // Find category by slug
        const category = blogCategories.find((cat) => cat.slug === selectedCategory.toLowerCase());
        return category ? category.name : selectedCategory;
    };

    // Get category-specific description
    const getCategoryDescription = () => {
        if (selectedCategory === 'ALL') {
            return 'Khám phá thế giới công nghệ âm thanh gaming qua các bài viết chuyên sâu và hữu ích. Từ hướng dẫn sử dụng, đánh giá sản phẩm đến những xu hướng công nghệ mới nhất trong ngành.';
        }
        // Find category by slug and return its description
        const category = blogCategories.find((cat) => cat.slug === selectedCategory.toLowerCase());
        return category ? category.description : 'Khám phá các bài viết thú vị về công nghệ âm thanh gaming.';
    };

    return (
        <div className="ml-16 sm:ml-20 -mt-16 sm:-mt-20 lg:-mt-24 relative z-20 py-6 sm:py-8 lg:py-10">
            <div className="px-4 sm:px-12 md:px-16 lg:px-20">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                >
                    <motion.h1
                        className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 font-mono ${
                            selectedCategory === 'ALL' ? 'text-white' : 'text-[#4FC8FF]'
                        }`}
                        key={selectedCategory} // This will trigger re-animation when category changes
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    >
                        {getDisplayTitle()}
                    </motion.h1>

                    {/* Blog Count Display */}
                    <motion.div
                        className="mb-6 text-sm sm:text-base text-gray-400"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        {selectedCategory === 'ALL' ? (
                            <span>
                                Showing all <span className="text-[#4FC8FF] font-semibold">{totalBlogs}</span> articles
                            </span>
                        ) : (
                            <span>
                                Showing <span className="text-[#4FC8FF] font-semibold">{filteredCount}</span> articles
                                in <span className="text-white font-semibold">{getDisplayTitle()}</span>
                            </span>
                        )}
                    </motion.div>

                    {/* Breadcrumb Section - Hidden on mobile/tablet, visible on desktop */}
                    <motion.div
                        className="hidden xl:flex xl:items-center gap-8 mb-8 relative"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                    >
                        {/* Decorative horizontal line */}
                        <motion.div
                            className="absolute -left-20 -right-20 top-1/2 h-px bg-gradient-to-r from-gray-500/40 via-gray-500/70 to-gray-500/40 z-0"
                            initial={{ scaleX: 0, opacity: 0 }}
                            animate={{ scaleX: 1, opacity: 1 }}
                            transition={{ duration: 1.2, delay: 0.8 }}
                            style={{ transform: 'translateY(-0.5px)' }}
                        />

                        {/* Breadcrumb / Category Navigation */}
                        <div className="flex items-center space-x-1 text-sm font-sans uppercase tracking-wider bg-[#0c131d] pr-4 relative z-10">
                            <motion.button
                                className={`font-medium relative pb-1 border-b-2 transition-all duration-300 ${
                                    selectedCategory === 'ALL'
                                        ? 'border-[#4FC8FF] text-[#4FC8FF] scale-105'
                                        : 'border-transparent text-white hover:text-[#4FC8FF] hover:border-[#4FC8FF]/50'
                                }`}
                                whileHover={{ scale: selectedCategory === 'ALL' ? 1.05 : 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onCategoryClick('ALL')}
                            >
                                ALL CATEGORIES
                                {selectedCategory === 'ALL' && (
                                    <motion.div
                                        className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-[#4FC8FF]"
                                        layoutId="activeCategoryIndicator"
                                        initial={false}
                                        transition={{ duration: 0.3 }}
                                    />
                                )}
                            </motion.button>

                            {categoryList.map((category, index) => (
                                <div key={index} className="flex items-center">
                                    <span className="text-gray-500 mx-2">/</span>
                                    <motion.button
                                        className={`transition-all duration-300 relative group ${
                                            selectedCategory === category.slug.toUpperCase()
                                                ? 'text-[#4FC8FF] scale-105 font-semibold'
                                                : 'text-gray-400 hover:text-white'
                                        }`}
                                        whileHover={{
                                            scale: selectedCategory === category.slug.toUpperCase() ? 1.05 : 1.1
                                        }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => onCategoryClick(category.slug.toUpperCase())}
                                    >
                                        {category.name.toUpperCase()}
                                        <span
                                            className={`absolute bottom-0 left-0 h-0.5 bg-[#4FC8FF] transition-all duration-300 ${
                                                selectedCategory === category.slug.toUpperCase()
                                                    ? 'w-full'
                                                    : 'w-0 group-hover:w-full'
                                            }`}
                                        ></span>

                                        {/* Active indicator */}
                                        {selectedCategory === category.slug.toUpperCase() && (
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
                    </motion.div>

                    {/* Mobile/Tablet Categories - Simple button layout */}
                    <motion.div
                        className="block xl:hidden mb-6 space-y-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.7 }}
                    >
                        {/* Mobile Categories */}
                        <div className="flex flex-wrap gap-2">
                            <motion.button
                                className={`px-3 py-1.5 rounded text-xs font-sans uppercase tracking-wide transition-all duration-300 ${
                                    selectedCategory === 'ALL'
                                        ? 'bg-[#4FC8FF]/20 border border-[#4FC8FF]/50 text-[#4FC8FF]'
                                        : 'border border-gray-600 text-gray-400 hover:text-white hover:border-gray-500'
                                }`}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => onCategoryClick('ALL')}
                            >
                                ALL
                            </motion.button>
                            {categoryList.map((category) => (
                                <motion.button
                                    key={category.id}
                                    className={`px-3 py-1.5 rounded text-xs font-sans uppercase tracking-wide transition-all duration-300 ${
                                        selectedCategory === category.slug.toUpperCase()
                                            ? 'bg-[#4FC8FF]/20 border border-[#4FC8FF]/50 text-[#4FC8FF]'
                                            : 'border border-gray-600 text-gray-400 hover:text-white hover:border-gray-500'
                                    }`}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => onCategoryClick(category.slug.toUpperCase())}
                                >
                                    {category.name.toUpperCase()}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>

                    {/* Search and Sort Controls */}
                    <motion.div
                        className="mt-6 space-y-3 sm:space-y-0 sm:flex sm:justify-between sm:items-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                    >
                        {/* Search Bar - Full width on mobile */}
                        <div className="relative w-full sm:max-w-md">
                            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm bài viết..."
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#4FC8FF] focus:bg-gray-800/70 transition-all duration-300"
                            />
                        </div>

                        {/* Mobile: Icon + Sort in one row */}
                        <div className="flex items-center gap-3 sm:gap-3">
                            <div className="flex items-center justify-center w-10 h-10 bg-gray-800/50 border border-gray-700 rounded-lg sm:bg-transparent sm:border-0 sm:w-auto sm:h-auto">
                                <FiFilter className="text-gray-400 w-5 h-5" />
                            </div>
                            {/* Custom Dropdown */}
                            <div ref={dropdownRef} className="relative flex-1 sm:flex-none sm:min-w-[140px]">
                                <button
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="w-full flex items-center justify-between gap-2 bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#4FC8FF] hover:bg-gray-800/70 transition-all duration-300 cursor-pointer"
                                >
                                    <div className="flex items-center gap-2">
                                        <CurrentIcon className="w-4 h-4 text-gray-400" />
                                        <span>{currentSort.label}</span>
                                    </div>
                                    <FiChevronDown
                                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                {/* Dropdown Menu */}
                                {isDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-50 overflow-hidden"
                                    >
                                        {sortOptions.map((option) => {
                                            const OptionIcon = option.icon;
                                            const isSelected = sortBy === option.value;
                                            return (
                                                <button
                                                    key={option.value}
                                                    onClick={() => {
                                                        onSortChange(option.value as 'date' | 'popularity' | 'views');
                                                        setIsDropdownOpen(false);
                                                    }}
                                                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200 ${
                                                        isSelected
                                                            ? 'bg-[#4FC8FF]/20 text-[#4FC8FF] border-l-2 border-[#4FC8FF]'
                                                            : 'text-white hover:bg-gray-700/50 hover:text-[#4FC8FF]'
                                                    }`}
                                                >
                                                    <OptionIcon
                                                        className={`w-4 h-4 ${
                                                            isSelected ? 'text-[#4FC8FF]' : 'text-gray-400'
                                                        }`}
                                                    />
                                                    <span>{option.label}</span>
                                                    {isSelected && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="ml-auto w-2 h-2 bg-[#4FC8FF] rounded-full"
                                                        />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    <motion.p
                        style={{ color: '#8390A5' }}
                        key={`desc-${selectedCategory}`}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="mt-4"
                    >
                        {getCategoryDescription()}
                    </motion.p>
                </motion.div>
            </div>
        </div>
    );
};

export default BlogBreadcrumb;
