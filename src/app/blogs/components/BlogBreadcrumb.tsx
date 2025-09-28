'use client';

import { motion } from 'framer-motion';
import { FiSearch } from 'react-icons/fi';
import { blogCategories } from '@/data/blogs';
import { BlogCategory as ApiCategory } from '@/types/api';
import { useEffect, useRef } from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface BlogBreadcrumbProps {
    selectedCategory: string;
    onCategoryClick: (category: string) => void;
    totalBlogs: number;
    filteredCount: number;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    apiCategories?: ApiCategory[];
}

const BlogBreadcrumb = ({
    selectedCategory,
    onCategoryClick,
    totalBlogs,
    filteredCount,
    searchQuery,
    onSearchChange,
    apiCategories
}: BlogBreadcrumbProps) => {
    const { t } = useLanguage();

    // Use API categories if available, otherwise fallback to static data
    const categoryList = apiCategories
        ? [{ id: 0, name: 'Tất cả' }, ...apiCategories]
        : blogCategories;

    const dropdownRef = useRef<HTMLDivElement>(null);

    // Sort functionality can be added later if needed

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                // Dropdown functionality can be added here if needed
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Format category title for display
    const getDisplayTitle = () => {
        if (selectedCategory === 'ALL') {
            return t('blog.list.title');
        }
        // Find category by slug
        const category = blogCategories.find((cat) => cat.slug === selectedCategory.toLowerCase());
        return category ? category.name : selectedCategory;
    };

    // Get category-specific description
    const getCategoryDescription = () => {
        if (selectedCategory === 'ALL') {
            return '';
        }
        // Find category by slug and return its description
        const category = blogCategories.find((cat) => cat.slug === selectedCategory.toLowerCase());
        return category ? category.description : '';
    };

    return (
        <div className="ml-16 sm:ml-20 -mt-16 sm:-mt-20 lg:-mt-24 relative z-20 py-6 sm:py-8 lg:py-10">
            <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
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
                                {t('blog.list.showingAll')} <span className="text-[#4FC8FF] font-semibold">{totalBlogs}</span> {t('blog.list.articles')}
                            </span>
                        ) : (
                            <span>
                                {t('blog.list.showingFiltered')} <span className="text-[#4FC8FF] font-semibold">{filteredCount}</span> {t('blog.list.articlesIn')}
                                <span className="text-white font-semibold"> {getDisplayTitle()}</span>
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
                            className="absolute top-1/2 h-px bg-gradient-to-r from-gray-500/40 via-gray-500/70 to-gray-500/40 z-0"
                            initial={{ scaleX: 0, opacity: 0 }}
                            animate={{ scaleX: 1, opacity: 1 }}
                            transition={{ duration: 1.2, delay: 0.8 }}
                            style={{
                                transform: 'translateY(-0.5px)',
                                left: '-5rem',
                                right: '0',
                                width: '100vw'
                            }}
                        />

                        {/* Breadcrumb / Category Navigation */}
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center space-x-1 text-sm font-sans uppercase tracking-wider bg-[#0c131d] px-6 relative z-10">
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
                                {t('blog.list.allCategories')}
                                {selectedCategory === 'ALL' && (
                                    <motion.div
                                        className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-[#4FC8FF]"
                                        layoutId="activeCategoryIndicator"
                                        initial={false}
                                        transition={{ duration: 0.3 }}
                                    />
                                )}
                            </motion.button>

                            {categoryList.map((category, index) => {
                                const isApiCategory = !('slug' in category);
                                const categoryKey = isApiCategory ? category.name : category.slug.toUpperCase();
                                const isSelected = selectedCategory === categoryKey ||
                                    (selectedCategory === 'ALL' && category.id === 0);

                                return (
                                <div key={index} className="flex items-center">
                                    <span className="text-gray-500 mx-2">/</span>
                                    <motion.button
                                        className={`transition-all duration-300 relative group ${
                                            isSelected
                                                ? 'text-[#4FC8FF] scale-105 font-semibold'
                                                : 'text-gray-400 hover:text-white'
                                        }`}
                                        whileHover={{
                                            scale: isSelected ? 1.05 : 1.1
                                        }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => onCategoryClick(isApiCategory && category.id === 0 ? 'ALL' : categoryKey)}
                                    >
                                        {category.name.toUpperCase()}
                                        <span
                                            className={`absolute bottom-0 left-0 h-0.5 bg-[#4FC8FF] transition-all duration-300 ${
                                                isSelected
                                                    ? 'w-full'
                                                    : 'w-0 group-hover:w-full'
                                            }`}
                                        ></span>

                                        {/* Active indicator */}
                                        {isSelected && (
                                            <motion.div
                                                className="absolute -top-1 -right-1 w-2 h-2 bg-[#4FC8FF] rounded-full"
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{ delay: 0.2, type: 'spring', stiffness: 500 }}
                                            />
                                        )}
                                    </motion.button>
                                </div>
                                );
                            })}
                            </div>

                            {/* Search Bar Desktop - Same Level as Breadcrumb */}
                            <motion.div
                                className="hidden xl:block bg-[#0c131d] pl-6 relative z-10"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 0.5 }}
                            >
                                <div className="relative w-64 xl:w-80 2xl:w-96">
                                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                    <input
                                        type="text"
                                        placeholder={t('blog.list.searchPlaceholder')}
                                        value={searchQuery}
                                        onChange={(e) => onSearchChange(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#4FC8FF] focus:bg-gray-800/70 transition-all duration-300"
                                    />
                                </div>
                            </motion.div>
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
                                {t('blog.list.all')}
                            </motion.button>
                            {categoryList
                                .filter(cat => cat.id !== 0) // Skip "Tất cả" since we have ALL button
                                .map((category) => {
                                    const isApiCategory = !('slug' in category);
                                    const categoryKey = isApiCategory ? category.name : category.slug.toUpperCase();
                                    const isSelected = selectedCategory === categoryKey;

                                    return (
                                    <motion.button
                                        key={category.id}
                                        className={`px-3 py-1.5 rounded text-xs font-sans uppercase tracking-wide transition-all duration-300 ${
                                            isSelected
                                                ? 'bg-[#4FC8FF]/20 border border-[#4FC8FF]/50 text-[#4FC8FF]'
                                                : 'border border-gray-600 text-gray-400 hover:text-white hover:border-gray-500'
                                        }`}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => onCategoryClick(categoryKey)}
                                >
                                    {category.name.toUpperCase()}
                                </motion.button>
                                    );
                                })}
                        </div>

                    </motion.div>

                    {/* Search Bar for mobile/tablet only */}
                    <motion.div
                        className="block xl:hidden mt-6 md:ml-20"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                    >
                        <div className="flex justify-center sm:justify-center md:justify-end md:pl-8 lg:pl-12">
                            <div className="relative w-full sm:w-full md:w-64 lg:w-80">
                                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder={t('blog.list.searchPlaceholder')}
                                    value={searchQuery}
                                    onChange={(e) => onSearchChange(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#4FC8FF] focus:bg-gray-800/70 transition-all duration-300"
                                />
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
