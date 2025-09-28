'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BlogHero, BlogBreadcrumb, BlogGrid, BlogPagination } from './components';
import { getPublishedPosts } from '@/data/blogs';
import { apiService } from '@/services/apiService';
import type { BlogPost } from '@/types/blog';
import { BlogCategory } from '@/types/api';
import { useLanguage } from '@/context/LanguageContext';

// Fallback mock data
const fallbackBlogPosts: BlogPost[] = getPublishedPosts();

function BlogPageContent() {
    // State management
    const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(9); // 3x3 grid
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy] = useState<'date' | 'popularity' | 'views'>('date');
    const [blogPosts, setBlogPosts] = useState<BlogPost[]>(fallbackBlogPosts);
    const [blogCategories, setBlogCategories] = useState<BlogCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [, setError] = useState<string | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

    // Get URL parameters
    const searchParams = useSearchParams();

    // Fetch categories on mount
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const categoriesResponse = await apiService.fetchBlogCategories();
                if (categoriesResponse.success && categoriesResponse.data) {
                    setBlogCategories(categoriesResponse.data);
                }
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };

        fetchCategories();
    }, []);

    // Fetch blogs when category changes
    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                setLoading(true);
                setError(null);
                setConnectionStatus('checking');

                const fields = 'id%2Ctitle%2Cdescription%2Cimage%2Ccategory%2CcreatedAt';
                let blogsResponse;

                if (selectedCategory === 'ALL') {
                    // Fetch all blogs
                    blogsResponse = await apiService.fetchBlogs(fields);
                } else {
                    // Find category ID by name
                    const category = blogCategories.find(cat => cat.name === selectedCategory);
                    if (category) {
                        blogsResponse = await apiService.fetchBlogsByCategory(category.id, fields);
                    } else {
                        throw new Error('Category not found');
                    }
                }

                if (blogsResponse?.success && blogsResponse.data) {
                    setConnectionStatus('connected');
                    setBlogPosts(blogsResponse.data as BlogPost[]);
                } else {
                    throw new Error(blogsResponse?.error || 'Failed to fetch blogs');
                }
            } catch (fetchError) {
                console.error('Error fetching blogs:', fetchError);
                setConnectionStatus('disconnected');
                setError('Unable to load latest blog data. Showing cached information.');
                setBlogPosts(fallbackBlogPosts);
            } finally {
                setLoading(false);
            }
        };

        // Only fetch blogs if we have categories loaded (for category filtering)
        if (blogCategories.length > 0 || selectedCategory === 'ALL') {
            fetchBlogs();
        }
    }, [selectedCategory, blogCategories]);

    // Handle URL parameters on component mount
    useEffect(() => {
        if (!searchParams) return;

        const categoryParam = searchParams.get('category');
        if (categoryParam && categoryParam !== selectedCategory) {
            setSelectedCategory(categoryParam);
            setCurrentPage(1); // Reset to first page when category changes
        }
    }, [searchParams, selectedCategory]);

    // Filter and sort blogs (only search query and sorting, category is handled by API)
    const filteredBlogs = useMemo(() => {
        let filtered = blogPosts;

        // Filter by search query (client-side)
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(
                (blog) =>
                    blog.title?.toLowerCase().includes(query) ||
                    blog.excerpt?.toLowerCase().includes(query) ||
                    blog.category?.name?.toLowerCase().includes(query)
            );
        }

        // Sort blogs
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'date':
                    return new Date(b.publishedAt || '').getTime() - new Date(a.publishedAt || '').getTime();
                case 'popularity':
                    return (b.likes || 0) - (a.likes || 0);
                case 'views':
                    return (b.views || 0) - (a.views || 0);
                default:
                    return 0;
            }
        });

        return filtered;
    }, [searchQuery, sortBy, blogPosts]);

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
                totalBlogs={blogPosts.length}
                filteredCount={totalItems}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                apiCategories={blogCategories.length > 0 ? blogCategories : undefined}
            />

            {/* Connection Status Indicator */}
            {connectionStatus !== 'connected' && !loading && (
                <div className="ml-16 sm:ml-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 pb-4">
                    <div className={`rounded-lg p-3 text-sm flex items-center gap-3 ${
                        connectionStatus === 'disconnected' 
                            ? 'bg-yellow-900/20 border border-yellow-600 text-yellow-300'
                            : 'bg-gray-700/20 border border-gray-600 text-gray-300'
                    }`}>
                        <div className={`w-2 h-2 rounded-full ${
                            connectionStatus === 'disconnected' ? 'bg-yellow-500' : 'bg-gray-500'
                        }`}></div>
                        <span>
                            {connectionStatus === 'disconnected' 
                                ? 'Using cached blog data - API temporarily unavailable'
                                : 'Checking connection...'
                            }
                        </span>
                    </div>
                </div>
            )}

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
