'use client';

import { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiX, FiArrowRight, FiClock } from 'react-icons/fi';
import Link from 'next/link';
import Image from 'next/image';
import { apiService } from '@/services/apiService';
// import type { Product } from '@/types/product';
// import type { BlogPost } from '@/types/blog';
import { Z_INDEX } from '@/constants/zIndex';
import { modalManager } from '@/utils/modalManager';
import { useAnimationCoordinator } from '@/utils/animationCoordinator';
import { ANIMATION_DURATIONS } from '@/constants/ui';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useLanguage } from '@/context/LanguageContext';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface SearchResult {
    type: 'product' | 'blog' | 'category';
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

const SearchModal = memo(function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const { t } = useLanguage();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'products' | 'blogs'>('all');
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const { registerAnimation, completeAnimation, cancelAnimation } = useAnimationCoordinator();
    const { handleError } = useErrorHandler();

    // Load recent searches from localStorage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('tunecore_recent_searches');
            if (saved) {
                setRecentSearches(JSON.parse(saved));
            }
        }
    }, []);

    // Focus input when modal opens
    useEffect(() => {
        if (isOpen && inputRef.current) {
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    // API search function
    const performSearch = useCallback(async (searchQuery: string): Promise<SearchResult[]> => {
        if (!searchQuery.trim()) return [];

        try {
            const response = await apiService.search(searchQuery, 10);

            if (!response.success) {
                console.error('Search failed:', response.error);
                return [];
            }

            const results: SearchResult[] = [];
            const data = response.data ?? { products: [], blogs: [] };

            // Process products
            data.products.forEach((product: { id: string | number; name: string; shortDescription: string; image: string }) => {
                const productId = product.id?.toString().trim();
                if (!productId) {
                    return;
                }

                results.push({
                    type: 'product',
                    id: productId,
                    title: product.name,
                    subtitle: product.shortDescription,
                    image: parseImageUrl(product.image),
                    href: `/products/${productId}`,
                    category: t('search.type.product')
                });
            });

            // Process blogs
            data.blogs.forEach((blog: { id: string | number; title: string; description: string; image: string; category?: string }) => {
                const blogId = blog.id?.toString().trim();
                if (!blogId) {
                    return;
                }

                results.push({
                    type: 'blog',
                    id: blogId,
                    title: blog.title,
                    subtitle: blog.description,
                    image: parseImageUrl(blog.image),
                    href: `/blogs/${blogId}`,
                    category: blog.category || t('search.type.blog')
                });
            });

            return results;
        } catch (error) {
            handleError(error instanceof Error ? error : new Error('Search failed'), 'SearchModal.performSearch');
            return [];
        }
    }, [handleError, t]);

    // Handle search with debouncing
    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const searchTimeout = setTimeout(async () => {
            const searchResults = await performSearch(query);
            setResults(searchResults);
            setIsSearching(false);
        }, ANIMATION_DURATIONS.NORMAL * 1000);

        return () => clearTimeout(searchTimeout);
    }, [query, performSearch]);

    // Optimized search submit handler
    const handleSearch = useCallback((searchQuery: string) => {
        if (!searchQuery.trim()) return;

        // Save to recent searches
        const newRecentSearches = [searchQuery, ...recentSearches.filter((s) => s !== searchQuery)].slice(0, 5);

        setRecentSearches(newRecentSearches);
        if (typeof window !== 'undefined') {
            localStorage.setItem('tunecore_recent_searches', JSON.stringify(newRecentSearches));
        }

        // Navigate to search results page or handle search
        window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }, [recentSearches]);

    // Optimized filtered results with useMemo
    const filteredResults = useMemo(() => {
        return results.filter((result) => {
            if (activeTab === 'all') return true;
            if (activeTab === 'products') return result.type === 'product';
            if (activeTab === 'blogs') return result.type === 'blog';
            return true;
        });
    }, [results, activeTab]);

    // Handle escape key and body scroll lock
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            modalManager.openModal('search-modal');
            document.addEventListener('keydown', handleEscape);
            
            // Register modal opening animation
            registerAnimation('search-modal-open', () => {
                // Modal opening animation handled by Framer Motion
            }, 2);
        } else {
            modalManager.closeModal('search-modal');
            cancelAnimation('search-modal-open');
        }

        return () => {
            modalManager.closeModal('search-modal');
            document.removeEventListener('keydown', handleEscape);
            cancelAnimation('search-modal-open');
        };
    }, [isOpen, onClose, cancelAnimation, registerAnimation]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                        style={{ zIndex: Z_INDEX.MODAL_BACKDROP }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Modal */}
                    <motion.div
                        className="fixed top-0 left-0 right-0"
                        style={{ zIndex: Z_INDEX.MODAL }}
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onAnimationComplete={() => completeAnimation('search-modal-open')}
                    >
                        <div className="bg-[#0c131d] border-b border-gray-700/30 shadow-2xl backdrop-blur-sm">
                            {/* Search Header */}
                            <div className="px-6 py-4 border-b border-gray-700/30">
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 relative">
                                        <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            placeholder={t('search.placeholder')}
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handleSearch(query);
                                                }
                                            }}
                                            className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#4FC8FF] focus:bg-gray-800/70 transition-all duration-300"
                                        />
                                        {isSearching && (
                                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#4FC8FF]"></div>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
                                        aria-label={t('search.modal.closeAria')}
                                    >
                                        <FiX className="w-5 h-5 text-gray-400" />
                                    </button>
                                </div>

                                {/* Tabs */}
                                {query && (
                                    <div className="flex items-center gap-1 mt-4">
                                        {[
                                            { id: 'all', label: t('search.tabs.all'), count: results.length },
                                            {
                                                id: 'products',
                                                label: t('search.tabs.products'),
                                                count: results.filter((r) => r.type === 'product').length
                                            },
                                            {
                                                id: 'blogs',
                                                label: t('search.tabs.blogs'),
                                                count: results.filter((r) => r.type === 'blog').length
                                            }
                                        ].map((tab) => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id as 'all' | 'products' | 'blogs')}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                                    activeTab === tab.id
                                                        ? 'bg-[#4FC8FF] text-white'
                                                        : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                                                }`}
                                            >
                                                {tab.label} {tab.count > 0 && `(${tab.count})`}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Search Content */}
                            <div className="max-h-[70vh] overflow-y-auto custom-scrollbar">
                                {!query ? (
                                    /* Empty State - Recent Searches */
                                    <div className="p-6 space-y-6">
                                        {/* Recent Searches */}
                                        {recentSearches.length > 0 && (
                                            <div>
                                                <div className="flex items-center gap-2 mb-3">
                                                    <FiClock className="w-4 h-4 text-gray-400" />
                                                    <h3 className="text-sm font-medium text-gray-300">
                                                        {t('search.modal.recentTitle')}
                                                    </h3>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {recentSearches.map((search, index) => (
                                                        <button
                                                            key={index}
                                                            onClick={() => setQuery(search)}
                                                            className="px-3 py-1.5 bg-gray-700/50 hover:bg-gray-600/50 rounded-full text-sm text-gray-300 hover:text-white transition-colors"
                                                        >
                                                            {search}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                ) : filteredResults.length > 0 ? (
                                    /* Search Results */
                                    <div className="p-4 space-y-2">
                                        {filteredResults.map((result) => (
                                            <Link
                                                key={`${result.type}-${result.id}`}
                                                href={result.href}
                                                onClick={onClose}
                                                className="block p-3 hover:bg-gray-700/30 rounded-lg transition-colors group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    {/* Image */}
                                                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-700/50 flex-shrink-0">
                                                        {result.image && (
                                                            <Image
                                                                src={result.image}
                                                                alt={result.title}
                                                                width={48}
                                                                height={48}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        )}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span
                                                                className={`text-xs px-2 py-0.5 rounded-full ${
                                                                result.type === 'product'
                                                                    ? 'bg-blue-500/20 text-blue-400'
                                                                    : 'bg-green-500/20 text-green-400'
                                                            }`}
                                                        >
                                                            {result.type === 'product' ? t('search.type.product') : t('search.type.blog')}
                                                        </span>
                                                            {result.category && (
                                                                <span className="text-xs text-gray-400">
                                                                    {result.category}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h4 className="text-white font-medium text-sm group-hover:text-[#4FC8FF] transition-colors line-clamp-1">
                                                            {result.title}
                                                        </h4>
                                                        {result.subtitle && (
                                                            <p className="text-gray-400 text-xs mt-1 line-clamp-2">
                                                                {result.subtitle}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Arrow */}
                                                    <FiArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#4FC8FF] transition-colors flex-shrink-0" />
                                                </div>
                                            </Link>
                                        ))}

                                        {/* View All Results */}
                                        <button
                                            onClick={() => handleSearch(query)}
                                            className="w-full p-3 mt-4 border border-gray-600/50 hover:border-[#4FC8FF]/50 rounded-lg text-gray-400 hover:text-[#4FC8FF] transition-colors text-sm"
                                        >
                                            {t('search.modal.viewAllResults').replace('{query}', query)}
                                        </button>
                                    </div>
                                ) : query && !isSearching ? (
                                    /* No Results */
                                    <div className="p-8 text-center">
                                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-700/30 rounded-full flex items-center justify-center">
                                            <FiSearch className="w-6 h-6 text-gray-400" />
                                        </div>
                                        <h3 className="text-white font-medium mb-2">{t('search.modal.noResultsTitle')}</h3>
                                        <p className="text-gray-400 text-sm mb-4">
                                            {t('search.modal.noResultsBody').replace('{query}', query)}
                                        </p>
                                    </div>
                                ) : isSearching ? (
                                    /* Loading State */
                                    <div className="p-8 text-center">
                                        <div className="w-16 h-16 mx-auto mb-4 bg-gray-700/30 rounded-full flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4FC8FF]"></div>
                                        </div>
                                        <h3 className="text-white font-medium mb-2">{t('search.modal.searchingTitle')}</h3>
                                        <p className="text-gray-400 text-sm">
                                            {t('search.modal.searchingBody').replace('{query}', query)}
                                        </p>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
});

export default SearchModal;
