'use client';

import { motion } from 'framer-motion';
import { FiSearch, FiFilter } from 'react-icons/fi';
import { blogCategories } from '@/data/blogs';

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

const BlogBreadcrumb = ({ selectedCategory, onCategoryClick, totalBlogs, filteredCount, searchQuery, onSearchChange, sortBy, onSortChange }: BlogBreadcrumbProps) => {
    const categoryList = blogCategories;

    // Format category title for display
    const getDisplayTitle = () => {
        if (selectedCategory === 'ALL') {
            return 'BLOG LIST';
        }
        // Find category by slug
        const category = blogCategories.find(cat => cat.slug === selectedCategory.toLowerCase());
        return category ? category.name : selectedCategory;
    };

    // Get category-specific description
    const getCategoryDescription = () => {
        if (selectedCategory === 'ALL') {
            return 'Khám phá thế giới công nghệ âm thanh gaming qua các bài viết chuyên sâu và hữu ích. Từ hướng dẫn sử dụng, đánh giá sản phẩm đến những xu hướng công nghệ mới nhất trong ngành.';
        }
        // Find category by slug and return its description
        const category = blogCategories.find(cat => cat.slug === selectedCategory.toLowerCase());
        return category ? category.description : 'Khám phá các bài viết thú vị về công nghệ âm thanh gaming.';
    };

    return (
        <div className="ml-16 sm:ml-20 -mt-16 sm:-mt-20 lg:-mt-24 relative z-20 py-6 sm:py-8 lg:py-10">
            <div className="px-12 sm:px-16 lg:px-20">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                >
                    <motion.h1
                        className={`text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 font-mono ${
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

                    {/* Breadcrumb Section */}
                    <motion.div
                        className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8 mb-8 relative"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                    >
                        {/* Decorative horizontal line */}
                        <motion.div
                            className="absolute -left-12 sm:-left-16 lg:-left-20 -right-12 sm:-right-16 lg:-right-20 top-1/2 h-px bg-gradient-to-r from-gray-500/40 via-gray-500/70 to-gray-500/40 z-0 hidden lg:block"
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
                                        whileHover={{ scale: selectedCategory === category.slug.toUpperCase() ? 1.05 : 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => onCategoryClick(category.slug.toUpperCase())}
                                    >
                                        {category.name.toUpperCase()}
                                        <span
                                            className={`absolute bottom-0 left-0 h-0.5 bg-[#4FC8FF] transition-all duration-300 ${
                                                selectedCategory === category.slug.toUpperCase() ? 'w-full' : 'w-0 group-hover:w-full'
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

                    {/* Mobile Responsive Version */}
                    <motion.div
                        className="block lg:hidden mb-6 space-y-3"
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
                        className="mt-6 flex flex-col sm:flex-row gap-4 justify-between items-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                    >
                        {/* Search Bar */}
                        <div className="relative w-full sm:w-96">
                            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm bài viết..."
                                value={searchQuery}
                                onChange={(e) => onSearchChange(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#4FC8FF] focus:bg-gray-800/70 transition-all duration-300"
                            />
                        </div>

                        {/* Sort Options */}
                        <div className="flex items-center gap-3">
                            <FiFilter className="text-gray-400 w-5 h-5" />
                            <select
                                value={sortBy}
                                onChange={(e) => onSortChange(e.target.value as 'date' | 'popularity' | 'views')}
                                className="bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-[#4FC8FF] transition-all duration-300 cursor-pointer"
                            >
                                <option value="date">Mới nhất</option>
                                <option value="popularity">Phổ biến nhất</option>
                                <option value="views">Xem nhiều nhất</option>
                            </select>
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
