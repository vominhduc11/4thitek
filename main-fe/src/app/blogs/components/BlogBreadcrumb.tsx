'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FiChevronDown, FiSearch } from 'react-icons/fi';
import { BlogCategory as ApiCategory } from '@/types/api';
import AvoidSidebar from '@/components/ui/AvoidSidebar';
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
    const maxVisibleCategories = 5;
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
        () => [
            { id: 'ALL', name: t('blog.list.all'), slug: 'all', description: '' },
            ...apiCategories.map((category) => ({
                id: category.id,
                name: category.name,
                slug: category.name.toLowerCase(),
                description: category.name
            }))
        ],
        [apiCategories, t]
    );

    const visibleCategories = categoryList.slice(0, maxVisibleCategories);
    const dropdownCategories = categoryList.slice(maxVisibleCategories);
    const currentCategory = categoryList.find(
        (category) => category.id === selectedCategory || category.name === selectedCategory
    );

    const getDisplayTitle = () => {
        if (selectedCategory === 'ALL') return t('blog.list.title');
        return currentCategory?.name || selectedCategory;
    };

    return (
        <div className="relative z-20 -mt-16 py-6 sm:-mt-20 sm:py-8 lg:-mt-24 lg:py-10">
            <AvoidSidebar>
                <div className="brand-shell">
                    <motion.div
                        className="brand-card rounded-[30px] p-6 sm:p-8"
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        <motion.h1
                            className={`font-serif text-3xl font-semibold sm:text-4xl lg:text-5xl ${
                                selectedCategory === 'ALL' ? 'text-[var(--text-primary)]' : 'text-[var(--brand-blue)]'
                            }`}
                            key={selectedCategory}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35 }}
                        >
                            {getDisplayTitle()}
                        </motion.h1>

                        <div className="mt-3 text-sm text-[var(--text-secondary)] sm:text-base">
                            {selectedCategory === 'ALL' ? (
                                <span>
                                    {t('blog.list.showingAll')}{' '}
                                    <span className="font-semibold text-[var(--brand-blue)]">{totalBlogs}</span>{' '}
                                    {t('blog.list.articles')}
                                </span>
                            ) : (
                                <span>
                                    {t('blog.list.showingFiltered')}{' '}
                                    <span className="font-semibold text-[var(--brand-blue)]">{filteredCount}</span>{' '}
                                    {t('blog.list.articlesIn')}
                                    <span className="font-semibold text-[var(--text-primary)]">
                                        {' '}
                                        {getDisplayTitle()}
                                    </span>
                                </span>
                            )}
                        </div>

                        <div className="mt-6 hidden items-center justify-between gap-6 xl:flex">
                            <div className="flex flex-wrap items-center gap-2">
                                {visibleCategories.map((category) => {
                                    const categoryKey = category.id === 'ALL' ? 'ALL' : String(category.id);
                                    const isSelected =
                                        selectedCategory === categoryKey || selectedCategory === category.name;

                                    return (
                                        <motion.button
                                            key={categoryKey}
                                            className={`rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em] transition-all duration-200 ${
                                                isSelected
                                                    ? 'bg-[rgba(41,171,226,0.12)] text-[var(--brand-blue)]'
                                                    : 'text-[var(--text-secondary)] hover:text-white'
                                            }`}
                                            whileHover={{ scale: 1.03 }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={() => onCategoryClick(categoryKey)}
                                        >
                                            {category.id === 'ALL' ? t('blog.list.allCategories') : category.name}
                                        </motion.button>
                                    );
                                })}
                            </div>

                            <div className="relative ml-auto" ref={dropdownRef}>
                                {dropdownCategories.length > 0 ? (
                                    <button
                                        className="brand-button-secondary flex items-center gap-2 rounded-full px-4 py-2 text-sm text-[var(--text-primary)]"
                                        onClick={() => setIsDropdownOpen((value) => !value)}
                                    >
                                        {t('blog.list.moreCategories')}
                                        <FiChevronDown
                                            className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                                        />
                                    </button>
                                ) : null}

                                <AnimatePresence>
                                    {isDropdownOpen && dropdownCategories.length > 0 ? (
                                        <motion.div
                                            className="brand-card absolute right-0 mt-2 w-56 rounded-[22px] p-2 shadow-2xl"
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: 8 }}
                                        >
                                            {dropdownCategories.map((category) => (
                                                <button
                                                    key={String(category.id)}
                                                    className="block w-full rounded-2xl px-3 py-2 text-left text-sm text-[var(--text-primary)] transition hover:bg-[rgba(41,171,226,0.12)]"
                                                    onClick={() => {
                                                        onCategoryClick(String(category.id));
                                                        setIsDropdownOpen(false);
                                                    }}
                                                >
                                                    {category.name}
                                                </button>
                                            ))}
                                        </motion.div>
                                    ) : null}
                                </AnimatePresence>
                            </div>
                        </div>

                        <div className="relative mt-6 max-w-2xl">
                            <FiSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                            <input
                                type="search"
                                value={searchQuery}
                                onChange={(event) => onSearchChange(event.target.value)}
                                placeholder={t('blog.list.searchPlaceholder')}
                                className="brand-input h-12 w-full rounded-full pl-12 pr-4 text-sm text-white outline-none transition focus:border-[var(--brand-blue)]"
                            />
                        </div>
                    </motion.div>
                </div>
            </AvoidSidebar>
        </div>
    );
};

export default BlogBreadcrumb;
