'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { FiSearch, FiFilter, FiX, FiArrowLeft } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { apiService } from '@/services/apiService';
import { useLanguage } from '@/context/LanguageContext';
import Hero from '@/components/ui/Hero';

interface SearchResult {
    type: 'product' | 'blog';
    id: string;
    title: string;
    subtitle?: string;
    image?: string;
    href: string;
    category?: string;
}

// Helper function to parse image JSON string
const parseImageUrl = (imageString: string): string => {
    try {
        const imageData = JSON.parse(imageString);
        return imageData.imageUrl || '';
    } catch {
        return '';
    }
};

function SearchContent() {
    const { t } = useLanguage();
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';

    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'all' | 'products' | 'blogs'>('all');
    const [searchInput, setSearchInput] = useState(query);

    // Perform search when query changes
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const performSearch = async () => {
            setIsLoading(true);
            try {
                const response = await apiService.search(query, 20);

                if (!response.success) {
                    console.error('Search failed:', response.error);
                    setResults([]);
                    return;
                }

                const searchResults: SearchResult[] = [];

                // Process products
                response.data.products.forEach((product: { id: number; name: string; shortDescription: string; image: string }) => {
                    searchResults.push({
                        type: 'product',
                        id: product.id?.toString() || `product-${Date.now()}`,
                        title: product.name,
                        subtitle: product.shortDescription,
                        image: parseImageUrl(product.image),
                        href: `/products/${product.id}`,
                        category: 'Sản phẩm'
                    });
                });

                // Process blogs
                response.data.blogs.forEach((blog: { id: number; title: string; description: string; image: string; category?: string }) => {
                    searchResults.push({
                        type: 'blog',
                        id: blog.id?.toString() || `blog-${Date.now()}`,
                        title: blog.title,
                        subtitle: blog.description,
                        image: parseImageUrl(blog.image),
                        href: `/blogs/${blog.id}`,
                        category: blog.category || 'Blog'
                    });
                });

                setResults(searchResults);
            } catch (error) {
                console.error('Search error:', error);
                setResults([]);
            } finally {
                setIsLoading(false);
            }
        };

        performSearch();
    }, [query]);

    // Update search input when query param changes
    useEffect(() => {
        setSearchInput(query);
    }, [query]);

    // Filter results based on active filter
    const filteredResults = useMemo(() => {
        return results.filter((result) => {
            if (activeFilter === 'all') return true;
            if (activeFilter === 'products') return result.type === 'product';
            if (activeFilter === 'blogs') return result.type === 'blog';
            return true;
        });
    }, [results, activeFilter]);

    // Handle new search
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchInput.trim()) {
            window.location.href = `/search?q=${encodeURIComponent(searchInput.trim())}`;
        }
    };

    const breadcrumbItems = [
        { label: t('nav.home'), href: '/' },
        { label: 'Tìm kiếm', active: true }
    ];

    const productCount = results.filter(r => r.type === 'product').length;
    const blogCount = results.filter(r => r.type === 'blog').length;

    return (
        <div className="min-h-screen bg-[#0c131d]">
            {/* Hero Section */}
            <Hero breadcrumbItems={breadcrumbItems} />

            {/* Search Section */}
            <section className="ml-16 sm:ml-20 py-4 sm:py-6 lg:py-8 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-20">
                <div className="max-w-6xl mx-auto">
                    {/* Search Header */}
                    <div className="mb-6 lg:mb-8">
                        <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                            <Link
                                href="/"
                                className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors flex-shrink-0"
                                aria-label="Back to home"
                            >
                                <FiArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                            </Link>
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white truncate">
                                Kết quả tìm kiếm
                            </h1>
                        </div>

                        {/* Search Form */}
                        <form onSubmit={handleSearch} className="mb-4 sm:mb-6">
                            <div className="relative max-w-full sm:max-w-2xl">
                                <FiSearch className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm sản phẩm, bài viết..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    className="w-full pl-10 sm:pl-12 pr-10 sm:pr-12 py-3 sm:py-4 text-sm sm:text-base bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#4FC8FF] focus:bg-gray-800/70 transition-all duration-300"
                                />
                                {searchInput && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchInput('')}
                                        className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-600/50 rounded transition-colors"
                                    >
                                        <FiX className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400" />
                                    </button>
                                )}
                            </div>
                        </form>

                        {/* Search Info */}
                        {query && (
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm sm:text-base text-gray-300 mb-1">
                                        Tìm kiếm cho: <span className="text-white font-medium break-words">&ldquo;{query}&rdquo;</span>
                                    </p>
                                    <p className="text-xs sm:text-sm text-gray-400">
                                        Tìm thấy {filteredResults.length} kết quả
                                    </p>
                                </div>

                                {/* Filter Tabs */}
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <FiFilter className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm text-gray-400 hidden sm:block">Lọc:</span>
                                    </div>
                                    <div className="flex items-center gap-1 overflow-x-auto">
                                        {[
                                            { id: 'all', label: 'Tất cả', count: results.length },
                                            { id: 'products', label: 'Sản phẩm', count: productCount },
                                            { id: 'blogs', label: 'Bài viết', count: blogCount }
                                        ].map((tab) => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveFilter(tab.id as 'all' | 'products' | 'blogs')}
                                                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                                                    activeFilter === tab.id
                                                        ? 'bg-[#4FC8FF] text-white'
                                                        : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                                                }`}
                                            >
                                                <span className="sm:hidden">{tab.label}</span>
                                                <span className="hidden sm:inline">{tab.label} ({tab.count})</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Results */}
                    <div className="min-h-[300px] sm:min-h-[400px]">
                        {isLoading ? (
                            /* Loading State */
                            <div className="flex items-center justify-center py-12 sm:py-16">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-[#4FC8FF] mx-auto mb-3 sm:mb-4"></div>
                                    <p className="text-sm sm:text-base text-gray-400">Đang tìm kiếm...</p>
                                </div>
                            </div>
                        ) : !query ? (
                            /* No Query State */
                            <div className="text-center py-12 sm:py-16 px-4">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 bg-gray-700/30 rounded-full flex items-center justify-center">
                                    <FiSearch className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Tìm kiếm nội dung</h3>
                                <p className="text-sm sm:text-base text-gray-400">Nhập từ khóa để tìm kiếm sản phẩm và bài viết</p>
                            </div>
                        ) : filteredResults.length > 0 ? (
                            /* Results Grid */
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                                {filteredResults.map((result, index) => (
                                    <motion.div
                                        key={`${result.type}-${result.id}`}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.3, delay: index * 0.1 }}
                                    >
                                        <Link
                                            href={result.href}
                                            className="block bg-[#1a2332] rounded-lg overflow-hidden hover:bg-[#243447] transition-all duration-300 group border border-transparent hover:border-[#4FC8FF]/30"
                                        >
                                            {/* Image */}
                                            <div className="aspect-video bg-gray-700/50 relative overflow-hidden">
                                                {result.image ? (
                                                    <Image
                                                        src={result.image}
                                                        alt={result.title}
                                                        fill
                                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <FiSearch className="w-8 h-8 text-gray-500" />
                                                    </div>
                                                )}

                                                {/* Type Badge */}
                                                <div className="absolute top-3 left-3">
                                                    <span
                                                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                            result.type === 'product'
                                                                ? 'bg-blue-500/90 text-white'
                                                                : 'bg-green-500/90 text-white'
                                                        }`}
                                                    >
                                                        {result.type === 'product' ? 'Sản phẩm' : 'Bài viết'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-3 sm:p-4">
                                                <h3 className="text-sm sm:text-base text-white font-semibold mb-2 group-hover:text-[#4FC8FF] transition-colors line-clamp-2">
                                                    {result.title}
                                                </h3>
                                                {result.subtitle && (
                                                    <p className="text-xs sm:text-sm text-gray-400 line-clamp-2 sm:line-clamp-3 mb-2 sm:mb-3">
                                                        {result.subtitle}
                                                    </p>
                                                )}
                                                {result.category && (
                                                    <span className="text-xs text-[#4FC8FF] font-medium">
                                                        {result.category}
                                                    </span>
                                                )}
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            /* No Results */
                            <div className="text-center py-12 sm:py-16 px-4">
                                <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 sm:mb-6 bg-gray-700/30 rounded-full flex items-center justify-center">
                                    <FiSearch className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                                </div>
                                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Không tìm thấy kết quả</h3>
                                <p className="text-sm sm:text-base text-gray-400 mb-4 max-w-md mx-auto leading-relaxed">
                                    Không có kết quả nào cho <span className="break-words">&ldquo;{query}&rdquo;</span>. Thử tìm kiếm với từ khóa khác.
                                </p>
                                <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
                                    {['Audio', 'Headphone', 'Speaker', 'Microphone'].map((suggestion, index) => (
                                        <Link
                                            key={index}
                                            href={`/search?q=${encodeURIComponent(suggestion)}`}
                                            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#4FC8FF]/10 hover:bg-[#4FC8FF]/20 border border-[#4FC8FF]/30 rounded-full text-xs sm:text-sm text-[#4FC8FF] hover:text-white transition-colors"
                                        >
                                            {suggestion}
                                        </Link>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#0c131d] text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4FC8FF] mx-auto mb-4"></div>
                    <p className="text-gray-400">Đang tải...</p>
                </div>
            </div>
        }>
            <SearchContent />
        </Suspense>
    );
}