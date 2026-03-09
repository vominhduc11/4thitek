'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BlogHero, BlogBreadcrumb, BlogGrid, BlogPagination } from './components';
import BlogGridSkeleton from './components/BlogGridSkeleton';
import { apiService } from '@/services/apiService';
import type { BlogPost } from '@/types/blog';
import { BlogCategory } from '@/types/api';
import { useLanguage } from '@/context/LanguageContext';
import { PageLoader } from '@/components/ui/LottieLoader';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { parseImageUrl } from '@/utils/media';

function mapApiBlogToPost(
    blog: { id: string | number; title: string; description: string; image: string; category: string; createdAt: string },
): BlogPost | null {
    const blogId = blog.id?.toString().trim();
    if (!blogId) {
        return null;
    }

    return {
        id: blogId,
        title: blog.title,
        slug: blog.title.toLowerCase().replace(/\s+/g, '-'),
        excerpt: blog.description,
        content: blog.description,
        featuredImage: parseImageUrl(blog.image),
        publishedAt: blog.createdAt,
        category: {
            id: blog.category,
            name: blog.category,
            slug: blog.category.toLowerCase().replace(/\s+/g, '-'),
            description: blog.category
        },
        tags: [],
        isPublished: true
    };
}

function BlogPageContent() {
    const { language, t } = useLanguage();
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(9);
    const [searchQuery, setSearchQuery] = useState('');
    const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
    const [blogCategories, setBlogCategories] = useState<BlogCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const searchParams = useSearchParams();

    useEffect(() => {
        setSelectedCategory('ALL');
        setCurrentPage(1);
    }, [language]);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const categoriesResponse = await apiService.fetchBlogCategories();
                if (categoriesResponse.success && categoriesResponse.data) {
                    setBlogCategories(categoriesResponse.data);
                }
            } catch (loadError) {
                console.error('Error fetching categories:', loadError);
            }
        };

        void loadCategories();
    }, [language]);

    useEffect(() => {
        const loadBlogs = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = selectedCategory === 'ALL'
                    ? await apiService.fetchBlogs()
                    : await apiService.fetchBlogsByCategory(selectedCategory);

                if (!response.success || !response.data) {
                    throw new Error(response.error || 'Failed to fetch blogs');
                }

                const transformed = (response.data as Array<{ id: string | number; title: string; description: string; image: string; category: string; createdAt: string }>)
                    .map((blog) => mapApiBlogToPost(blog))
                    .filter((blog): blog is BlogPost => blog !== null);
                setBlogPosts(transformed);
            } catch (loadError) {
                console.error('Error fetching blogs:', loadError);
                setBlogPosts([]);
                setError(t('errors.blogs.loadFailed'));
            } finally {
                setLoading(false);
            }
        };

        void loadBlogs();
    }, [selectedCategory, t]);

    useEffect(() => {
        if (!searchParams) return;
        const categoryParam = searchParams.get('category');
        if (categoryParam && categoryParam !== selectedCategory) {
            setSelectedCategory(categoryParam);
            setCurrentPage(1);
        }
    }, [searchParams, selectedCategory]);

    const filteredBlogs = useMemo(() => {
        const normalized = searchQuery.toLowerCase().trim();
        const next = normalized
            ? blogPosts.filter((blog) =>
                blog.title.toLowerCase().includes(normalized) ||
                blog.excerpt.toLowerCase().includes(normalized) ||
                blog.category.name.toLowerCase().includes(normalized)
            )
            : blogPosts;

        return [...next].sort(
            (a, b) => new Date(b.publishedAt || '').getTime() - new Date(a.publishedAt || '').getTime(),
        );
    }, [searchQuery, blogPosts]);

    const { currentBlogs, totalPages, totalItems } = useMemo(() => {
        const total = filteredBlogs.length;
        const pages = Math.ceil(total / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return {
            currentBlogs: filteredBlogs.slice(startIndex, endIndex),
            totalPages: pages,
            totalItems: total
        };
    }, [filteredBlogs, currentPage, itemsPerPage]);

    const handleCategoryClick = (category: string) => {
        if (category === selectedCategory) return;
        setSelectedCategory(category);
        setCurrentPage(1);
    };

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                document.documentElement.scrollTop = 0;
                document.body.scrollTop = 0;
            }, 100);
        }
    };

    return (
        <div className="min-h-screen bg-[#0c131d] text-white flex flex-col overflow-x-hidden">
            <BlogHero />
            <BlogBreadcrumb
                selectedCategory={selectedCategory}
                onCategoryClick={handleCategoryClick}
                totalBlogs={blogPosts.length}
                filteredCount={totalItems}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                apiCategories={blogCategories}
            />
            {error ? (
                <div className="ml-0 sm:ml-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 pb-4">
                    <div className="rounded-lg border border-red-600 bg-red-900/20 p-3 text-sm text-red-300">
                        {error}
                    </div>
                </div>
            ) : null}
            <div data-blog-grid>
                {loading ? <BlogGridSkeleton count={itemsPerPage} /> : <BlogGrid blogs={currentBlogs} />}
            </div>
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
    return <PageLoader message={t('common.loading')} />;
}

export default function BlogsPage() {
    return (
        <ErrorBoundary>
            <Suspense fallback={<LoadingFallback />}>
                <BlogPageContent />
            </Suspense>
        </ErrorBoundary>
    );
}
