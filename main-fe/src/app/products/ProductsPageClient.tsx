'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ProductsHero, ProductGrid } from './components';
import ProductsSimpleHeader from './components/ProductsSimpleHeader';
import { apiService } from '@/services/apiService';
import type { SimpleProduct } from '@/types/product';
import { GridSkeleton } from '@/components/ui/SkeletonLoader';
import { useRetry } from '@/hooks/useRetry';
import { useDebounce } from '@/hooks/useDebounce';
import { mapProductSummaryToSimpleProduct } from '@/lib/contentMappers';
import { useLanguage } from '@/context/LanguageContext';
import AvoidSidebar from '@/components/ui/AvoidSidebar';

interface ProductsPageClientProps {
    initialProducts: SimpleProduct[];
}

export default function ProductsPageClient({ initialProducts }: ProductsPageClientProps) {
    const router = useRouter();
    const [products, setProducts] = useState<SimpleProduct[]>(initialProducts);
    const [loading, setLoading] = useState(false);
    const [errorKey, setErrorKey] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const { t } = useLanguage();
    const activeRequestRef = useRef(0);
    const debouncedSearchQuery = useDebounce(searchQuery, 350);
    const { retry, retryCount, isRetrying, canRetry } = useRetry({
        maxAttempts: 3,
        delayMs: 1500,
        exponentialBackoff: true
    });

    useEffect(() => {
        const normalizedQuery = debouncedSearchQuery.trim();
        const hasFilters = normalizedQuery.length > 0;

        if (!hasFilters) {
            activeRequestRef.current += 1;
            setProducts(initialProducts);
            setErrorKey(null);
            setLoading(false);
            return;
        }

        const requestId = activeRequestRef.current + 1;
        activeRequestRef.current = requestId;
        const controller = new AbortController();

        const fetchProducts = async () => {
            try {
                setLoading(true);
                const response = await apiService.searchProducts(normalizedQuery, 100, {}, controller.signal);

                if (activeRequestRef.current !== requestId || controller.signal.aborted) {
                    return;
                }

                if (response.success && response.data) {
                    const convertedProducts = response.data
                        .map((product) => mapProductSummaryToSimpleProduct(product))
                        .filter((product): product is SimpleProduct => product !== null);
                    setProducts(convertedProducts);
                    setErrorKey(null);
                } else {
                    setErrorKey('errors.products.loadFailedMessage');
                }
            } catch (error) {
                if (controller.signal.aborted || activeRequestRef.current !== requestId) {
                    return;
                }
                console.error('Error fetching products:', error);
                setErrorKey('errors.products.loadFailedMessage');
            } finally {
                if (activeRequestRef.current === requestId && !controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        void fetchProducts();
        return () => controller.abort();
    }, [debouncedSearchQuery, initialProducts]);

    const hasActiveFilters = searchQuery.trim().length > 0;

    if (loading && products.length === 0) {
        return (
            <div className="min-h-screen bg-[#0c131d] text-white flex flex-col">
                <ProductsHero />
                <ProductsSimpleHeader totalProducts={0} />
                <AvoidSidebar>
                    <main className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8 flex justify-center">
                        <div className="w-full max-w-none">
                            <GridSkeleton count={8} columns={4} backgroundColor="#1e293b" foregroundColor="#334155" />
                        </div>
                    </main>
                </AvoidSidebar>
            </div>
        );
    }

    if (errorKey) {
        const handleRetry = async () => {
            try {
                await retry(async () => {
                    setLoading(true);
                    const response = await apiService.fetchProducts();
                    if (!response.success || !response.data) {
                        throw new Error('Failed to load products');
                    }

                    const convertedProducts = response.data
                        .map((product) => mapProductSummaryToSimpleProduct(product))
                        .filter((product): product is SimpleProduct => product !== null);

                    setProducts(convertedProducts);
                    setErrorKey(null);
                    setSearchQuery('');
                });
            } catch (error) {
                console.error('Retry failed:', error);
            } finally {
                setLoading(false);
            }
        };

        return (
            <motion.div
                className="min-h-screen bg-[#0c131d] flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <motion.div
                    className="bg-[#1e293b] rounded-lg border border-red-500/30 p-8 max-w-md text-center"
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <svg className="mx-auto mb-4 h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                    </svg>
                    <h3 className="text-lg font-semibold text-red-400 mb-2">{t('errors.products.loadFailed')}</h3>
                    <p className="text-gray-300 mb-6">{t(errorKey)}</p>

                    <div className="flex gap-3">
                        <motion.button
                            onClick={handleRetry}
                            disabled={isRetrying || !canRetry}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold py-2 px-4 rounded transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {isRetrying
                                ? t('errors.products.retrying').replace('{count}', String(retryCount))
                                : t('common.retry')}
                        </motion.button>

                        <motion.button
                            onClick={() => router.refresh()}
                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {t('common.reload')}
                        </motion.button>
                    </div>

                    {!canRetry && (
                        <p className="text-xs text-gray-400 mt-4">
                            {t('errors.general.maxRetries')}
                        </p>
                    )}
                </motion.div>
            </motion.div>
        );
    }

    return (
        <div className="relative min-h-screen bg-[#0c131d] text-white flex flex-col bg-grain">
            {/* Brand dot-grid texture */}
            <div className="absolute inset-0 bg-dot-grid opacity-20 pointer-events-none" />

            <ProductsHero />
            <ProductsSimpleHeader totalProducts={products.length} />

            <section className="relative bg-transparent text-white pb-6">
                <AvoidSidebar>
                    <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 flex justify-center">
                        <div className="w-full max-w-3xl rounded-[28px] border border-white/10 bg-white/5 p-4 shadow-[0_24px_80px_rgba(2,8,23,0.22)] backdrop-blur md:p-6">
                            <div className="flex gap-4">
                                <label className="block flex-1">
                                    <span className="mb-2 block text-xs uppercase tracking-[0.22em] text-slate-400">
                                        {t('common.search')}
                                    </span>
                                    <input
                                        value={searchQuery}
                                        onChange={(event) => setSearchQuery(event.target.value)}
                                        placeholder={t('search.placeholder')}
                                        className="w-full rounded-2xl border border-white/10 bg-[#0c131d] px-4 py-3 text-white outline-none transition focus:border-cyan-400"
                                    />
                                </label>
                                {hasActiveFilters && (
                                    <div className="flex items-end">
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery('')}
                                            className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200"
                                        >
                                            {t('products.filter.clearFilters')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </AvoidSidebar>
            </section>

            <AvoidSidebar>
                <main className="relative px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8">
                    {products.length === 0 && !loading ? (
                        <div className="flex flex-col items-center justify-center py-20 px-4">
                            <svg className="mx-auto mb-4 h-14 w-14 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <h3 className="mb-2 text-lg font-semibold text-gray-300">{t('products.filter.noResults')}</h3>
                            <p className="mb-6 text-center max-w-sm text-sm text-gray-500">{t('products.filter.noResultsHint')}</p>
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="rounded-full border border-cyan-400/30 px-5 py-2.5 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/10"
                                >
                                    {t('products.filter.clearFilters')}
                                </button>
                            )}
                        </div>
                    ) : (
                        <ProductGrid products={products} />
                    )}
                </main>
            </AvoidSidebar>
        </div>
    );
}
