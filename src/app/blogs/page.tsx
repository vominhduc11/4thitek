'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BlogHero, BlogBreadcrumb, BlogGrid, BlogPagination } from './components';
import { getPublishedPosts } from '@/data/blogs';
import type { BlogPost } from '@/types/blog';
import { useLanguage } from '@/context/LanguageContext';

// Get published blog posts
const publishedBlogPosts: BlogPost[] = getPublishedPosts();

function BlogPageContent() {
    // State management
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(9); // 3x3 grid
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy] = useState<'date' | 'popularity' | 'views'>('date');

    // Get URL parameters
    const searchParams = useSearchParams();

    // Handle URL parameters on component mount
    useEffect(() => {
        if (!searchParams) return;

        const categoryParam = searchParams.get('category');
        if (categoryParam && categoryParam !== selectedCategory) {
            setSelectedCategory(categoryParam);
            setCurrentPage(1); // Reset to first page when category changes
        }
    }, [searchParams, selectedCategory]);

    // Filter and sort blogs
    const filteredBlogs = useMemo(() => {
        let filtered = publishedBlogPosts;

        // Filter by category
        if (selectedCategory !== 'ALL') {
            filtered = filtered.filter((blog) => blog.category.slug === selectedCategory.toLowerCase());
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(
                (blog) =>
                    blog.title.toLowerCase().includes(query) ||
                    blog.excerpt.toLowerCase().includes(query) ||
                    blog.tags.some((tag) => tag.name.toLowerCase().includes(query))
            );
        }

        // Sort blogs
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'date':
                    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
                case 'popularity':
                    return (b.likes || 0) - (a.likes || 0);
                case 'views':
                    return (b.views || 0) - (a.views || 0);
                default:
                    return 0;
            }
        });

        return filtered;
    }, [selectedCategory, searchQuery, sortBy]);

    // Pagination calculations
    const { currentBlogs, totalPages, totalItems } = useMemo(() => {
        const total = filteredBlogs.length;
        const pages = Math.ceil(total / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const blogs = filteredBlogs.slice(startIndex, endIndex);

        return {
            currentBlogs: blogs,
            totalPages: pages,
            totalItems: total
        };
    }, [filteredBlogs, currentPage, itemsPerPage]);

    // Event handlers
    const handleCategoryClick = (category: string) => {
        if (category === selectedCategory) return; // Prevent unnecessary re-renders
        setSelectedCategory(category);
        setCurrentPage(1); // Reset to first page when category changes
    };

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            // Force scroll to top of page
            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                // Fallback for browsers that don't support smooth scroll
                document.documentElement.scrollTop = 0;
                document.body.scrollTop = 0;
            }, 100);
        }
    };

    return (
        <div className="min-h-screen bg-[#0c131d] text-white flex flex-col overflow-x-hidden">
            {/* Hero Video Section */}
            <BlogHero />

            {/* Breadcrumb Section */}
            <BlogBreadcrumb
                selectedCategory={selectedCategory}
                onCategoryClick={handleCategoryClick}
                totalBlogs={publishedBlogPosts.length}
                filteredCount={totalItems}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
            />

            {/* Blog Grid */}
            <div data-blog-grid>
                <BlogGrid blogs={currentBlogs} />
            </div>

            {/* Pagination */}
            <BlogPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                currentItemsCount={currentBlogs.length}
                onPageChange={handlePageChange}
            />
        </div>
    );
}

function LoadingFallback() {
    const { t } = useLanguage();
    return (
        <div className="min-h-screen bg-[#0c131d] text-white flex items-center justify-center">
            <div className="text-center">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#4FC8FF]"></div>
                <p className="mt-4 text-gray-300">{t('common.loading')}</p>
            </div>
        </div>
    );
}

export default function BlogsPage() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <BlogPageContent />
        </Suspense>
    );
}
