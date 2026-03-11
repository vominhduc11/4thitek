'use client';

import { useMemo, useState } from 'react';
import { BlogHero, BlogBreadcrumb, BlogGrid, BlogPagination } from './components';
import { useLanguage } from '@/context/LanguageContext';
import type { BlogPost } from '@/types/blog';
import type { BlogCategory } from '@/types/api';

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
                : initialPosts.filter((blog) => blog.category.id === selectedCategory || blog.category.name === selectedCategory);

        const searchedBlogs = normalizedQuery
            ? selectedBlogs.filter((blog) =>
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
        <div className="min-h-screen bg-[#0c131d] text-white flex flex-col overflow-x-hidden">
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
                <div className="pb-8 text-center text-sm text-gray-400">
                    {t('blog.grid.emptyBodyLine1')}
                </div>
            )}
        </div>
    );
}
