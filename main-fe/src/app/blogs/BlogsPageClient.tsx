'use client';

import { useMemo, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import type { BlogCategory } from '@/types/api';
import type { BlogPost } from '@/types/blog';
import { BlogBreadcrumb, BlogGrid, BlogHero, BlogPagination } from './components';

interface BlogsPageClientProps {
    initialPosts: BlogPost[];
    initialCategories: BlogCategory[];
    initialSelectedCategory: string;
}

export default function BlogsPageClient({
    initialPosts,
    initialCategories,
    initialSelectedCategory
}: BlogsPageClientProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>(initialSelectedCategory);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const { t } = useLanguage();
    const itemsPerPage = 9;

    const filteredBlogs = useMemo(() => {
        const normalizedQuery = searchQuery.toLowerCase().trim();
        const selectedBlogs =
            selectedCategory === 'ALL'
                ? initialPosts
                : initialPosts.filter(
                      (blog) => blog.category.id === selectedCategory || blog.category.name === selectedCategory
                  );

        const searchedBlogs = normalizedQuery
            ? selectedBlogs.filter(
                  (blog) =>
                      blog.title.toLowerCase().includes(normalizedQuery) ||
                      blog.excerpt.toLowerCase().includes(normalizedQuery) ||
                      blog.category.name.toLowerCase().includes(normalizedQuery)
              )
            : selectedBlogs;

        return [...searchedBlogs].sort(
            (a, b) => new Date(b.publishedAt || '').getTime() - new Date(a.publishedAt || '').getTime()
        );
    }, [initialPosts, searchQuery, selectedCategory]);

    const { currentBlogs, totalPages, totalItems } = useMemo(() => {
        const total = filteredBlogs.length;
        const pages = Math.max(Math.ceil(total / itemsPerPage), 1);
        const startIndex = (currentPage - 1) * itemsPerPage;
        return {
            currentBlogs: filteredBlogs.slice(startIndex, startIndex + itemsPerPage),
            totalPages: pages,
            totalItems: total
        };
    }, [currentPage, filteredBlogs]);

    return (
        <div className="brand-section min-h-screen overflow-x-hidden text-white">
            <BlogHero />
            <BlogBreadcrumb
                selectedCategory={selectedCategory}
                onCategoryClick={(category) => {
                    setSelectedCategory(category);
                    setCurrentPage(1);
                }}
                totalBlogs={initialPosts.length}
                filteredCount={totalItems}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                apiCategories={initialCategories}
            />
            <div data-blog-grid>
                <BlogGrid blogs={currentBlogs} />
            </div>
            <BlogPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                currentItemsCount={currentBlogs.length}
                onPageChange={(page) => {
                    if (page >= 1 && page <= totalPages) {
                        setCurrentPage(page);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                }}
            />
            {totalItems === 0 && (
                <div className="pb-8 text-center text-sm text-[var(--text-secondary)]">
                    {t('blog.grid.emptyBodyLine1')}
                </div>
            )}
        </div>
    );
}
