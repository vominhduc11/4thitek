'use client';

import { MdClose, MdFilterList, MdRefresh } from 'react-icons/md';

interface BlogFilterSidebarProps {
    isOpen: boolean;
    selectedCategory: string;
    selectedTag: string;
    sortBy: string;
    onClose: () => void;
    onCategoryClick: (category: string) => void;
    onTagClick: (tag: string) => void;
    onSortChange: (sortBy: string) => void;
    onClearFilters: () => void;
    availableTags: string[];
}

const categories = [
    { id: 'ALL', name: 'Tất Cả', color: 'text-[#4FC8FF]' },
    { id: 'TECHNOLOGY', name: 'Công Nghệ', color: 'text-green-400' },
    { id: 'TUTORIAL', name: 'Hướng Dẫn', color: 'text-blue-400' },
    { id: 'NEWS', name: 'Tin Tức', color: 'text-purple-400' },
    { id: 'REVIEW', name: 'Đánh Giá', color: 'text-orange-400' },
    { id: 'TIPS', name: 'Mẹo Hay', color: 'text-pink-400' }
];

const sortOptions = [
    { id: 'newest', name: 'Mới nhất' },
    { id: 'oldest', name: 'Cũ nhất' },
    { id: 'popular', name: 'Phổ biến' },
    { id: 'title-asc', name: 'Tiêu đề A-Z' },
    { id: 'title-desc', name: 'Tiêu đề Z-A' },
    { id: 'read-time', name: 'Thời gian đọc' }
];

export function BlogFilterSidebar({
    isOpen,
    selectedCategory,
    selectedTag,
    sortBy,
    onClose,
    onCategoryClick,
    onTagClick,
    onSortChange,
    onClearFilters,
    availableTags
}: BlogFilterSidebarProps) {
    const hasActiveFilters = selectedCategory !== 'ALL' || selectedTag !== 'ALL' || sortBy !== 'newest';

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${
                    isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={onClose}
            />

            {/* Sidebar */}
            <div
                className={`fixed top-0 right-0 h-full w-80 bg-[#0c131d] border-l border-white/10 z-50 transform transition-transform duration-300 ease-in-out ${
                    isOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <MdFilterList className="text-[#4FC8FF]" size={20} />
                            <h3 className="text-lg font-semibold text-white">Bộ Lọc</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200 text-gray-400 hover:text-white"
                        >
                            <MdClose size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-8">
                        {/* Category Filter */}
                        <div>
                            <h4 className="text-white font-medium mb-4 flex items-center gap-2">Danh Mục</h4>
                            <div className="space-y-2">
                                {categories.map((category) => (
                                    <button
                                        key={category.id}
                                        onClick={() => onCategoryClick(category.id)}
                                        className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                                            selectedCategory === category.id
                                                ? 'bg-gradient-to-r from-[#4FC8FF]/20 to-[#00A8E8]/20 text-[#4FC8FF] border border-[#4FC8FF]/30'
                                                : 'text-gray-300 hover:text-white hover:bg-white/10 border border-transparent'
                                        }`}
                                    >
                                        <span className={category.color}>{category.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Tags Filter */}
                        <div>
                            <h4 className="text-white font-medium mb-4 flex items-center gap-2">Thẻ</h4>
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                <button
                                    onClick={() => onTagClick('ALL')}
                                    className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                                        selectedTag === 'ALL'
                                            ? 'bg-gradient-to-r from-[#4FC8FF]/20 to-[#00A8E8]/20 text-[#4FC8FF] border border-[#4FC8FF]/30'
                                            : 'text-gray-300 hover:text-white hover:bg-white/10 border border-transparent'
                                    }`}
                                >
                                    Tất Cả
                                </button>
                                {availableTags.map((tag) => (
                                    <button
                                        key={tag}
                                        onClick={() => onTagClick(tag)}
                                        className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                                            selectedTag === tag
                                                ? 'bg-gradient-to-r from-[#4FC8FF]/20 to-[#00A8E8]/20 text-[#4FC8FF] border border-[#4FC8FF]/30'
                                                : 'text-gray-300 hover:text-white hover:bg-white/10 border border-transparent'
                                        }`}
                                    >
                                        #{tag}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Sort Options */}
                        <div>
                            <h4 className="text-white font-medium mb-4 flex items-center gap-2">Sắp Xếp</h4>
                            <div className="space-y-2">
                                {sortOptions.map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => onSortChange(option.id)}
                                        className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                                            sortBy === option.id
                                                ? 'bg-gradient-to-r from-[#4FC8FF]/20 to-[#00A8E8]/20 text-[#4FC8FF] border border-[#4FC8FF]/30'
                                                : 'text-gray-300 hover:text-white hover:bg-white/10 border border-transparent'
                                        }`}
                                    >
                                        {option.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-6 border-t border-white/10">
                        {hasActiveFilters && (
                            <button
                                onClick={onClearFilters}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all duration-200 border border-white/20 hover:border-[#4FC8FF]/50"
                            >
                                <MdRefresh size={18} />
                                Xóa Tất Cả Bộ Lọc
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
