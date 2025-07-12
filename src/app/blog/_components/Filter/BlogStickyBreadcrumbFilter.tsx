'use client';

import { useState, useEffect } from 'react';
import { MdChevronRight, MdFilterList, MdHome } from 'react-icons/md';
import { BsGrid3X3Gap, BsList } from 'react-icons/bs';

interface BlogStickyBreadcrumbFilterProps {
    selectedCategory: string;
    selectedTag: string;
    hasActiveFilters: boolean;
    onCategoryClick: (category: string) => void;
    onFilterToggle: () => void;
    filteredCount: number;
    totalBlogs: number;
    viewMode: 'grid' | 'list';
    onViewModeChange: (mode: 'grid' | 'list') => void;
}

const categories = [
    { id: 'ALL', name: 'Tất Cả' },
    { id: 'TECHNOLOGY', name: 'Công Nghệ' },
    { id: 'TUTORIAL', name: 'Hướng Dẫn' },
    { id: 'NEWS', name: 'Tin Tức' },
    { id: 'REVIEW', name: 'Đánh Giá' },
    { id: 'TIPS', name: 'Mẹo Hay' }
];

export function BlogStickyBreadcrumbFilter({
    selectedCategory,
    selectedTag,
    hasActiveFilters,
    onCategoryClick,
    onFilterToggle,
    filteredCount,
    totalBlogs,
    viewMode,
    onViewModeChange
}: BlogStickyBreadcrumbFilterProps) {
    const [isSticky, setIsSticky] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const scrollPosition = window.scrollY;
            setIsSticky(scrollPosition > 400);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const currentCategory = categories.find((cat) => cat.id === selectedCategory);

    return (
        <div
            className={`sticky top-0 z-30 transition-all duration-300 ${
                isSticky ? 'bg-[#0c131d]/95 backdrop-blur-md border-b border-white/10 shadow-lg' : 'bg-transparent'
            }`}
        >
            <div className="px-4 sm:px-6 lg:px-8 py-4">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        {/* Breadcrumb & Category Filter */}
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                            {/* Breadcrumb */}
                            <nav className="flex items-center text-sm text-gray-400">
                                <MdHome size={16} className="mr-2" />
                                <span>Trang chủ</span>
                                <MdChevronRight size={16} className="mx-2" />
                                <span className="text-white">Blog</span>
                                {selectedCategory !== 'ALL' && (
                                    <>
                                        <MdChevronRight size={16} className="mx-2" />
                                        <span className="text-[#4FC8FF]">{currentCategory?.name}</span>
                                    </>
                                )}
                                {selectedTag !== 'ALL' && (
                                    <>
                                        <MdChevronRight size={16} className="mx-2" />
                                        <span className="text-[#4FC8FF]">#{selectedTag}</span>
                                    </>
                                )}
                            </nav>

                            {/* Quick Category Filter */}
                            <div className="flex flex-wrap items-center gap-2">
                                {categories.slice(0, 4).map((category) => (
                                    <button
                                        key={category.id}
                                        onClick={() => onCategoryClick(category.id)}
                                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                                            selectedCategory === category.id
                                                ? 'bg-[#4FC8FF] text-white'
                                                : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                                        }`}
                                    >
                                        {category.name}
                                    </button>
                                ))}
                                {categories.length > 4 && (
                                    <button
                                        onClick={onFilterToggle}
                                        className="px-3 py-1.5 bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white rounded-full text-sm font-medium transition-all duration-200"
                                    >
                                        +{categories.length - 4}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-3">
                            {/* Results Count */}
                            <div className="text-sm text-gray-400 hidden lg:block">
                                {hasActiveFilters ? (
                                    <span>
                                        <span className="text-[#4FC8FF] font-medium">{filteredCount}</span>/{totalBlogs}
                                    </span>
                                ) : (
                                    <span className="text-[#4FC8FF] font-medium">{totalBlogs}</span>
                                )}
                            </div>

                            {/* View Mode Toggle */}
                            <div className="flex items-center bg-white/10 rounded-lg p-1">
                                <button
                                    onClick={() => onViewModeChange('grid')}
                                    className={`p-1.5 rounded transition-all duration-200 ${
                                        viewMode === 'grid'
                                            ? 'bg-[#4FC8FF] text-white'
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                    title="Xem dạng lưới"
                                >
                                    <BsGrid3X3Gap size={16} />
                                </button>
                                <button
                                    onClick={() => onViewModeChange('list')}
                                    className={`p-1.5 rounded transition-all duration-200 ${
                                        viewMode === 'list'
                                            ? 'bg-[#4FC8FF] text-white'
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                    title="Xem dạng danh sách"
                                >
                                    <BsList size={16} />
                                </button>
                            </div>

                            {/* Filter Button */}
                            <button
                                onClick={onFilterToggle}
                                className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 border border-white/20 hover:border-[#4FC8FF]/50"
                            >
                                <MdFilterList size={16} />
                                <span className="hidden sm:inline text-sm">Lọc</span>
                                {hasActiveFilters && <span className="w-2 h-2 bg-[#4FC8FF] rounded-full"></span>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
