'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiChevronDown } from 'react-icons/fi';
import { BlogCategory as ApiCategory } from '@/types/api';
import { useEffect, useMemo, useRef, useState } from 'react';
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
    apiCategories = []
}: BlogBreadcrumbProps) => {
    const { t } = useLanguage();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const MAX_VISIBLE_CATEGORIES = 5;
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const categoryList = useMemo(
        () => [{ id: 'ALL', name: t('blog.list.all'), slug: 'all', description: '' }, ...apiCategories.map((category) => ({
            id: category.id,
            name: category.name,
            slug: category.name.toLowerCase(),
            description: category.name
        }))],
        [apiCategories, t],
    );

    const visibleCategories = categoryList.slice(0, MAX_VISIBLE_CATEGORIES);
    const dropdownCategories = categoryList.slice(MAX_VISIBLE_CATEGORIES);
    const currentCategory = categoryList.find((category) => category.id === selectedCategory || category.name === selectedCategory);

    const getDisplayTitle = () => {
        if (selectedCategory === 'ALL') {
            return t('blog.list.title');
        }
        return currentCategory?.name || selectedCategory;
    };

    return (
        <div className="ml-0 sm:ml-20 -mt-16 sm:-mt-20 lg:-mt-24 relative z-20 py-6 sm:py-8 lg:py-10">
            <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.3 }}>
                    <motion.h1 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 ${selectedCategory === 'ALL' ? 'text-white' : 'text-[#4FC8FF]'}`} key={selectedCategory} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }}>
                        {getDisplayTitle()}
                    </motion.h1>

                    <motion.div className="mb-6 text-sm sm:text-base text-gray-400" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
                        {selectedCategory === 'ALL' ? (
                            <span>{t('blog.list.showingAll')} <span className="text-[#4FC8FF] font-semibold">{totalBlogs}</span> {t('blog.list.articles')}</span>
                        ) : (
                            <span>{t('blog.list.showingFiltered')} <span className="text-[#4FC8FF] font-semibold">{filteredCount}</span> {t('blog.list.articlesIn')}<span className="text-white font-semibold"> {getDisplayTitle()}</span></span>
                        )}
                    </motion.div>

                    <motion.div className="hidden xl:flex xl:items-center gap-8 mb-8 relative" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.5 }}>
                        <div className="flex items-center justify-between w-full">
                            <div className="flex items-center space-x-1 text-sm font-sans uppercase tracking-wider bg-[#0c131d] px-6 relative z-10">
                                {visibleCategories.map((category, index) => {
                                    const categoryKey = category.id === 'ALL' ? 'ALL' : String(category.id);
                                    const isSelected = selectedCategory === categoryKey || selectedCategory === category.name;
                                    return (
                                        <div key={`${categoryKey}-${index}`} className="flex items-center">
                                            {index > 0 ? <span className="text-gray-500 mx-2">/</span> : null}
                                            <motion.button
                                                className={`transition-all duration-300 relative group ${isSelected ? 'text-[#4FC8FF] scale-105 font-semibold' : 'text-gray-400 hover:text-white'}`}
                                                whileHover={{ scale: isSelected ? 1.05 : 1.1 }}
                                                whileTap={{ scale: 0.95 }}
                                                onClick={() => onCategoryClick(categoryKey)}
                                            >
                                                {category.id === 'ALL' ? t('blog.list.allCategories') : category.name}
                                            </motion.button>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="relative ml-auto" ref={dropdownRef}>
                                {dropdownCategories.length > 0 ? (
                                    <button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white" onClick={() => setIsDropdownOpen((value) => !value)}>
                                        {t('blog.list.moreCategories')}
                                        <FiChevronDown className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                ) : null}
                                <AnimatePresence>
                                    {isDropdownOpen && dropdownCategories.length > 0 ? (
                                        <motion.div className="absolute right-0 mt-2 w-56 rounded-2xl border border-white/10 bg-[#111827] p-2 shadow-2xl" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}>
                                            {dropdownCategories.map((category) => (
                                                <button key={String(category.id)} className="block w-full rounded-xl px-3 py-2 text-left text-sm text-white transition hover:bg-white/10" onClick={() => {
                                                    onCategoryClick(String(category.id));
                                                    setIsDropdownOpen(false);
                                                }}>
                                                    {category.name}
                                                </button>
                                            ))}
                                        </motion.div>
                                    ) : null}
                                </AnimatePresence>
                            </div>
                        </div>
                    </motion.div>

                    <div className="relative max-w-2xl">
                        <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={(event) => onSearchChange(event.target.value)}
                            placeholder={t('blog.list.searchPlaceholder')}
                            className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 pl-12 pr-4 text-sm text-white placeholder:text-gray-500 outline-none transition focus:border-[#4FC8FF]"
                        />
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default BlogBreadcrumb;
