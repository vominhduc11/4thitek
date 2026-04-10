'use client';

import { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiX, FiArrowRight, FiClock } from 'react-icons/fi';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { apiService } from '@/services/apiService';
import { Z_INDEX } from '@/constants/zIndex';
import { modalManager } from '@/utils/modalManager';
import { useAnimationCoordinator } from '@/utils/animationCoordinator';
import { ANIMATION_DURATIONS } from '@/constants/ui';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useLanguage } from '@/context/LanguageContext';
import { buildBlogPath, buildProductPath } from '@/lib/slug';
import { parseImageUrl } from '@/utils/media';

interface SearchModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SEARCH_HISTORY_STORAGE_KEY = '4thitek_recent_searches';
const LEGACY_SEARCH_HISTORY_STORAGE_KEY = 'tunecore_recent_searches';

interface SearchResult {
    type: 'product' | 'blog';
    id: string;
    title: string;
    subtitle?: string;
    image?: string;
    href: string;
    metaLabel?: string;
}

const SearchModal = memo(function SearchModal({ isOpen, onClose }: SearchModalProps) {
    const { t } = useLanguage();
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [activeTab, setActiveTab] = useState<'all' | 'products' | 'blogs'>('all');
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const searchRequestIdRef = useRef(0);
    const { registerAnimation, completeAnimation, cancelAnimation } = useAnimationCoordinator();
    const { handleError } = useErrorHandler();

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved =
                localStorage.getItem(SEARCH_HISTORY_STORAGE_KEY) ??
                localStorage.getItem(LEGACY_SEARCH_HISTORY_STORAGE_KEY);
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    const normalized = Array.isArray(parsed)
                        ? parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
                        : [];
                    setRecentSearches(normalized);
                    localStorage.setItem(SEARCH_HISTORY_STORAGE_KEY, JSON.stringify(normalized));
                    localStorage.removeItem(LEGACY_SEARCH_HISTORY_STORAGE_KEY);
                } catch {
                    localStorage.removeItem(SEARCH_HISTORY_STORAGE_KEY);
                    localStorage.removeItem(LEGACY_SEARCH_HISTORY_STORAGE_KEY);
                }
            }
        }
    }, []);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            const focusTimer = window.setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
            return () => window.clearTimeout(focusTimer);
        }
    }, [isOpen]);

    const performSearch = useCallback(async (searchQuery: string): Promise<SearchResult[]> => {
        if (!searchQuery.trim()) return [];

        try {
            const response = await apiService.search(searchQuery, 10);

            if (!response.success) {
                console.error('Search failed:', response.error);
                return [];
            }

            const nextResults: SearchResult[] = [];
            const data = response.data ?? { products: [], blogs: [] };

            data.products.forEach((product: { id: string | number; name: string; shortDescription: string; image: string }) => {
                const productId = product.id?.toString().trim();
                if (!productId) {
                    return;
                }

                nextResults.push({
                    type: 'product',
                    id: productId,
                    title: product.name,
                    subtitle: product.shortDescription,
                    image: parseImageUrl(product.image),
                    href: buildProductPath(productId, product.name),
                    metaLabel: t('search.type.product')
                });
            });

            data.blogs.forEach((blog: { id: string | number; title: string; description: string; image: string; category?: string }) => {
                const blogId = blog.id?.toString().trim();
                if (!blogId) {
                    return;
                }

                nextResults.push({
                    type: 'blog',
                    id: blogId,
                    title: blog.title,
                    subtitle: blog.description,
                    image: parseImageUrl(blog.image),
                    href: buildBlogPath(blogId, blog.title),
                    metaLabel: blog.category || t('search.type.blog')
                });
            });

            return nextResults;
        } catch (error) {
            handleError(error instanceof Error ? error : new Error('Search failed'), 'SearchModal.performSearch');
            return [];
        }
    }, [handleError, t]);

    useEffect(() => {
        if (!query.trim()) {
            searchRequestIdRef.current += 1;
            setResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const requestId = searchRequestIdRef.current + 1;
        searchRequestIdRef.current = requestId;
        const searchTimeout = window.setTimeout(async () => {
            const searchResults = await performSearch(query);
            if (searchRequestIdRef.current !== requestId) {
                return;
            }
            setResults(searchResults);
            setIsSearching(false);
        }, ANIMATION_DURATIONS.NORMAL * 1000);

        return () => window.clearTimeout(searchTimeout);
    }, [query, performSearch]);

    const handleSearch = useCallback((searchQuery: string) => {
        if (!searchQuery.trim()) return;

        const newRecentSearches = [searchQuery, ...recentSearches.filter((s) => s !== searchQuery)].slice(0, 5);

        setRecentSearches(newRecentSearches);
        if (typeof window !== 'undefined') {
            localStorage.setItem(SEARCH_HISTORY_STORAGE_KEY, JSON.stringify(newRecentSearches));
        }

        onClose();
        router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }, [onClose, recentSearches, router]);

    const filteredResults = useMemo(() => {
        return results.filter((result) => {
            if (activeTab === 'all') return true;
            if (activeTab === 'products') return result.type === 'product';
            if (activeTab === 'blogs') return result.type === 'blog';
            return true;
        });
    }, [results, activeTab]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            modalManager.openModal('search-modal');
            document.addEventListener('keydown', handleEscape);

            registerAnimation('search-modal-open', () => {
                return undefined;
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
                    <motion.div
                        className="fixed inset-0 bg-[rgba(1,8,15,0.64)] backdrop-blur-md"
                        style={{ zIndex: Z_INDEX.MODAL_BACKDROP }}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    <motion.div
                        className="fixed left-0 right-0 top-0"
                        style={{ zIndex: Z_INDEX.MODAL }}
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="search-modal-title"
                        onAnimationComplete={() => completeAnimation('search-modal-open')}
                    >
                        <div className="border-b border-[var(--brand-border)] bg-[radial-gradient(circle_at_top,rgba(41,171,226,0.14),transparent_28%),linear-gradient(180deg,rgba(9,17,26,0.98),rgba(7,14,22,0.98))] shadow-2xl backdrop-blur-sm">
                            <div className="border-b border-[var(--brand-border)] px-6 py-4">
                                <div className="flex items-center gap-4">
                                    <div className="relative flex-1">
                                        <label htmlFor="site-search-input" className="sr-only">
                                            {t('search.placeholder')}
                                        </label>
                                        <h2 id="search-modal-title" className="sr-only">
                                            {t('search.placeholder')}
                                        </h2>
                                        <FiSearch className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--brand-blue)]" />
                                        <input
                                            id="site-search-input"
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
                                            className="brand-input w-full rounded-2xl border pl-12 pr-4 py-3 text-[var(--text-primary)] transition-all duration-300 focus:border-[var(--brand-border-strong)] focus:bg-[rgba(12,30,44,0.88)] focus:outline-none"
                                        />
                                        {isSearching && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-[var(--brand-blue)]"></div>
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="rounded-full border border-[var(--brand-border)] bg-[rgba(7,17,27,0.56)] p-2 text-[var(--text-secondary)] transition-colors hover:border-[var(--brand-border-strong)] hover:bg-[rgba(41,171,226,0.12)] hover:text-[var(--text-primary)]"
                                        aria-label={t('search.modal.closeAria')}
                                    >
                                        <FiX className="h-5 w-5" />
                                    </button>
                                </div>

                                {query && (
                                    <div className="mt-4 flex items-center gap-1">
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
                                                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                                                    activeTab === tab.id
                                                        ? 'bg-[linear-gradient(135deg,var(--brand-gradient-start),var(--brand-gradient-end))] text-white shadow-[0_10px_20px_rgba(0,113,188,0.22)]'
                                                        : 'text-[var(--text-secondary)] hover:bg-[rgba(41,171,226,0.12)] hover:text-[var(--text-primary)]'
                                                }`}
                                            >
                                                {tab.label} {tab.count > 0 && `(${tab.count})`}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="custom-scrollbar max-h-[70vh] overflow-y-auto">
                                {!query ? (
                                    <div className="space-y-6 p-6">
                                        {recentSearches.length > 0 && (
                                            <div>
                                                <div className="mb-3 flex items-center gap-2">
                                                    <FiClock className="h-4 w-4 text-[var(--brand-blue)]" />
                                                    <h3 className="text-sm font-medium text-[var(--text-secondary)]">
                                                        {t('search.modal.recentTitle')}
                                                    </h3>
                                                </div>
                                                <div className="flex flex-wrap gap-2">
                                                    {recentSearches.map((search, index) => (
                                                        <button
                                                            key={index}
                                                            onClick={() => setQuery(search)}
                                                            className="brand-badge rounded-full border border-[var(--brand-border)] bg-[rgba(7,17,27,0.72)] px-3 py-1.5 text-sm text-[var(--text-secondary)] transition-colors hover:border-[var(--brand-border-strong)] hover:text-[var(--text-primary)]"
                                                        >
                                                            {search}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : filteredResults.length > 0 ? (
                                    <div className="space-y-2 p-4">
                                        {filteredResults.map((result) => (
                                            <Link
                                                key={`${result.type}-${result.id}`}
                                                href={result.href}
                                                onClick={onClose}
                                                className="group block rounded-2xl border border-transparent p-3 transition-colors hover:border-[var(--brand-border)] hover:bg-[rgba(41,171,226,0.08)]"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-2xl border border-[var(--brand-border)] bg-[rgba(7,17,27,0.72)]">
                                                        {result.image && (
                                                            <Image
                                                                src={result.image}
                                                                alt={result.title}
                                                                width={48}
                                                                height={48}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        )}
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="mb-1 flex items-center gap-2">
                                                            <span
                                                                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                                                    result.type === 'product'
                                                                        ? 'bg-[rgba(41,171,226,0.18)] text-[var(--brand-blue)]'
                                                                        : 'bg-[rgba(43,224,134,0.18)] text-[#7BF0B1]'
                                                                }`}
                                                            >
                                                                {result.type === 'product' ? t('search.type.product') : t('search.type.blog')}
                                                            </span>
                                                            {result.metaLabel && (
                                                                <span className="text-xs text-[var(--text-secondary)]">
                                                                    {result.metaLabel}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h4 className="line-clamp-1 text-sm font-medium text-[var(--text-primary)] transition-colors group-hover:text-[var(--brand-blue)]">
                                                            {result.title}
                                                        </h4>
                                                        {result.subtitle && (
                                                            <p className="mt-1 line-clamp-2 text-xs text-[var(--text-secondary)]">
                                                                {result.subtitle}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <FiArrowRight className="h-4 w-4 flex-shrink-0 text-[var(--text-secondary)] transition-colors group-hover:text-[var(--brand-blue)]" />
                                                </div>
                                            </Link>
                                        ))}

                                        <button
                                            onClick={() => handleSearch(query)}
                                            className="brand-button-secondary mt-4 w-full rounded-2xl p-3 text-sm transition-colors hover:border-[var(--brand-border-strong)] hover:text-[var(--brand-blue)]"
                                        >
                                            {t('search.modal.viewAllResults').replace('{query}', query)}
                                        </button>
                                    </div>
                                ) : query && !isSearching ? (
                                    <div className="p-8 text-center">
                                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--brand-border)] bg-[rgba(7,17,27,0.72)]">
                                            <FiSearch className="h-6 w-6 text-[var(--brand-blue)]" />
                                        </div>
                                        <h3 className="mb-2 font-medium text-[var(--text-primary)]">{t('search.modal.noResultsTitle')}</h3>
                                        <p className="mb-4 text-sm text-[var(--text-secondary)]">
                                            {t('search.modal.noResultsBody').replace('{query}', query)}
                                        </p>
                                    </div>
                                ) : isSearching ? (
                                    <div className="p-8 text-center">
                                        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-[var(--brand-border)] bg-[rgba(7,17,27,0.72)]">
                                            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[var(--brand-blue)]"></div>
                                        </div>
                                        <h3 className="mb-2 font-medium text-[var(--text-primary)]">{t('search.modal.searchingTitle')}</h3>
                                        <p className="text-sm text-[var(--text-secondary)]">
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
