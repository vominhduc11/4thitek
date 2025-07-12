'use client';

import { HiFilter } from 'react-icons/hi';
import { BsGrid3X3Gap, BsList } from 'react-icons/bs';

interface BlogHeaderProps {
    selectedCategory: string;
    hasActiveFilters: boolean;
    onCategoryClick: (category: string) => void;
    onFilterToggle: () => void;
    totalBlogs: number;
    filteredCount: number;
    viewMode: 'grid' | 'list';
    onViewModeChange: (mode: 'grid' | 'list') => void;
}

const categories = [
    { id: 'ALL', name: 'Tất Cả', color: 'text-[#4FC8FF]' },
    { id: 'TECHNOLOGY', name: 'Công Nghệ', color: 'text-green-400' },
    { id: 'TUTORIAL', name: 'Hướng Dẫn', color: 'text-blue-400' },
    { id: 'NEWS', name: 'Tin Tức', color: 'text-purple-400' },
    { id: 'REVIEW', name: 'Đánh Giá', color: 'text-orange-400' },
    { id: 'TIPS', name: 'Mẹo Hay', color: 'text-pink-400' }
];

export function BlogHeader({
    selectedCategory,
    hasActiveFilters,
    onCategoryClick,
    onFilterToggle,
    totalBlogs,
    filteredCount,
    viewMode,
    onViewModeChange
}: BlogHeaderProps) {
    return (
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#0c131d] to-[#1a2332]">
            <div className="max-w-7xl mx-auto">
                {/* Main Title */}
                <div className="text-center mb-12">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                        Bài Viết Blog
                        {selectedCategory !== 'ALL' && (
                            <span className="block text-2xl sm:text-3xl lg:text-4xl text-[#4FC8FF] mt-2">
                                {categories.find((cat) => cat.id === selectedCategory)?.name}
                            </span>
                        )}
                    </h2>
                    <p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
                        {selectedCategory === 'ALL'
                            ? 'Khám phá tất cả các bài viết về công nghệ, hướng dẫn sử dụng và tin tức mới nhất'
                            : `Tìm hiểu về ${categories.find((cat) => cat.id === selectedCategory)?.name.toLowerCase()}`}
                    </p>
                </div>

                {/* Category Filter Buttons */}
                <div className="flex flex-wrap justify-center gap-3 mb-8">
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            onClick={() => onCategoryClick(category.id)}
                            className={`px-6 py-3 rounded-full font-medium transition-all duration-300 transform hover:scale-105 ${
                                selectedCategory === category.id
                                    ? `bg-gradient-to-r from-[#4FC8FF] to-[#00A8E8] text-white shadow-lg shadow-[#4FC8FF]/25`
                                    : `bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white border border-white/20`
                            }`}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>

                {/* Controls Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/5 rounded-2xl p-6 backdrop-blur-sm border border-white/10">
                    {/* Results Count */}
                    <div className="text-gray-300">
                        {hasActiveFilters ? (
                            <span>
                                Hiển thị <span className="text-[#4FC8FF] font-semibold">{filteredCount}</span> trong
                                tổng số <span className="text-white font-semibold">{totalBlogs}</span> bài viết
                            </span>
                        ) : (
                            <span>
                                Tổng cộng <span className="text-[#4FC8FF] font-semibold">{totalBlogs}</span> bài viết
                            </span>
                        )}
                    </div>

                    {/* View Mode & Filter Controls */}
                    <div className="flex items-center gap-4">
                        {/* View Mode Toggle */}
                        <div className="flex items-center bg-white/10 rounded-lg p-1">
                            <button
                                onClick={() => onViewModeChange('grid')}
                                className={`p-2 rounded transition-all duration-200 ${
                                    viewMode === 'grid' ? 'bg-[#4FC8FF] text-white' : 'text-gray-400 hover:text-white'
                                }`}
                                title="Xem dạng lưới"
                            >
                                <BsGrid3X3Gap size={18} />
                            </button>
                            <button
                                onClick={() => onViewModeChange('list')}
                                className={`p-2 rounded transition-all duration-200 ${
                                    viewMode === 'list' ? 'bg-[#4FC8FF] text-white' : 'text-gray-400 hover:text-white'
                                }`}
                                title="Xem dạng danh sách"
                            >
                                <BsList size={18} />
                            </button>
                        </div>

                        {/* Filter Button */}
                        <button
                            onClick={onFilterToggle}
                            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 border border-white/20 hover:border-[#4FC8FF]/50"
                        >
                            <HiFilter size={18} />
                            <span className="hidden sm:inline">Bộ Lọc</span>
                            {hasActiveFilters && <span className="w-2 h-2 bg-[#4FC8FF] rounded-full"></span>}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
