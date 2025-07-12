'use client';

import { motion } from 'framer-motion';

interface BlogBreadcrumbProps {
    selectedCategory: string;
    onCategoryClick: (category: string) => void;
    totalBlogs: number;
    filteredCount: number;
}

const BlogBreadcrumb = ({ selectedCategory, onCategoryClick, totalBlogs, filteredCount }: BlogBreadcrumbProps) => {
    const categoryList = ['TECHNOLOGY', 'TUTORIAL', 'NEWS', 'REVIEW', 'TIPS'];

    // Format category title for display
    const getDisplayTitle = () => {
        if (selectedCategory === 'ALL') {
            return 'BLOG LIST';
        }
        // Convert category to proper display format
        const categoryNames: { [key: string]: string } = {
            TECHNOLOGY: 'Technology',
            TUTORIAL: 'Tutorial',
            NEWS: 'News',
            REVIEW: 'Review',
            TIPS: 'Tips'
        };
        return categoryNames[selectedCategory] || selectedCategory;
    };

    // Get category-specific description
    const getCategoryDescription = () => {
        switch (selectedCategory) {
            case 'TECHNOLOGY':
                return 'Khám phá những công nghệ tiên tiến nhất trong lĩnh vực truyền thông không dây. Tìm hiểu về các xu hướng công nghệ mới, đột phá kỹ thuật và ứng dụng thực tế trong các sản phẩm SCS hiện đại.';
            case 'TUTORIAL':
                return 'Hướng dẫn chi tiết cách sử dụng và tối ưu hóa các sản phẩm SCS. Từ thiết lập ban đầu đến các mẹo nâng cao, giúp bạn khai thác tối đa hiệu suất thiết bị truyền thông của mình.';
            case 'NEWS':
                return 'Cập nhật những tin tức mới nhất về SCS và ngành công nghiệp truyền thông. Thông tin về sản phẩm mới, sự kiện quan trọng và các phát triển đáng chú ý trong lĩnh vực này.';
            case 'REVIEW':
                return 'Đánh giá chuyên sâu và khách quan về các sản phẩm SCS. Phân tích chi tiết về tính năng, hiệu suất và trải nghiệm thực tế để giúp bạn đưa ra quyết định mua hàng phù hợp.';
            case 'TIPS':
                return 'Những mẹo hay và kinh nghiệm thực tế từ các chuyên gia và người dùng lâu năm. Tối ưu hóa việc sử dụng thiết bị, bảo dưỡng đúng cách và nâng cao trải nghiệm truyền thông.';
            default:
                return 'Khám phá thế giới công nghệ truyền thông qua các bài viết chuyên sâu và hữu ích. Từ hướng dẫn sử dụng, đánh giá sản phẩm đến những xu hướng công nghệ mới nhất trong ngành.';
        }
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
                                            selectedCategory === category
                                                ? 'text-[#4FC8FF] scale-105 font-semibold'
                                                : 'text-gray-400 hover:text-white'
                                        }`}
                                        whileHover={{ scale: selectedCategory === category ? 1.05 : 1.1 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => onCategoryClick(category)}
                                    >
                                        {category}
                                        <span
                                            className={`absolute bottom-0 left-0 h-0.5 bg-[#4FC8FF] transition-all duration-300 ${
                                                selectedCategory === category ? 'w-full' : 'w-0 group-hover:w-full'
                                            }`}
                                        ></span>

                                        {/* Active indicator */}
                                        {selectedCategory === category && (
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
                                    key={category}
                                    className={`px-3 py-1.5 rounded text-xs font-sans uppercase tracking-wide transition-all duration-300 ${
                                        selectedCategory === category
                                            ? 'bg-[#4FC8FF]/20 border border-[#4FC8FF]/50 text-[#4FC8FF]'
                                            : 'border border-gray-600 text-gray-400 hover:text-white hover:border-gray-500'
                                    }`}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => onCategoryClick(category)}
                                >
                                    {category}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>

                    <motion.p
                        style={{ color: '#8390A5' }}
                        key={`desc-${selectedCategory}`}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        {getCategoryDescription()}
                    </motion.p>
                </motion.div>
            </div>
        </div>
    );
};

export default BlogBreadcrumb;
