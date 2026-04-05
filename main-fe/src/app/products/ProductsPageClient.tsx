'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { GridSkeleton } from '@/components/ui/SkeletonLoader';
import AvoidSidebar from '@/components/ui/AvoidSidebar';
import { useLanguage } from '@/context/LanguageContext';
import { useDebounce } from '@/hooks/useDebounce';
import { useRetry } from '@/hooks/useRetry';
import { mapProductSummaryToSimpleProduct } from '@/lib/contentMappers';
import { apiService } from '@/services/apiService';
import type { SimpleProduct } from '@/types/product';
import ProductGrid from './components/ProductGrid';
import ProductsHero from './components/ProductsHero';
import ProductsSimpleHeader from './components/ProductsSimpleHeader';

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
            <div className="brand-section min-h-screen text-white">
                <ProductsHero />
                <ProductsSimpleHeader totalProducts={0} />
                <AvoidSidebar>
                    <main className="brand-shell flex justify-center py-8">
                        <div className="w-full">
                            <GridSkeleton count={8} columns={4} backgroundColor="#132230" foregroundColor="#22384d" />
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
                className="brand-section flex min-h-screen items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
            >
                <motion.div
                    className="brand-card max-w-md rounded-[28px] p-8 text-center"
                    initial={{ scale: 0.96 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.25 }}
                >
                    <svg
                        className="mx-auto mb-4 h-12 w-12 text-[var(--destructive)]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                        />
                    </svg>
                    <h3 className="mb-2 text-lg font-semibold text-[var(--destructive-text)]">
                        {t('errors.products.loadFailed')}
                    </h3>
                    <p className="mb-6 text-[var(--text-secondary)]">{t(errorKey)}</p>

                    <div className="flex gap-3">
                        <motion.button
                            onClick={handleRetry}
                            disabled={isRetrying || !canRetry}
                            className="brand-button-primary flex-1 rounded-full px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)] disabled:opacity-50"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {isRetrying
                                ? t('errors.products.retrying').replace('{count}', String(retryCount))
                                : t('common.retry')}
                        </motion.button>

                        <motion.button
                            onClick={() => router.refresh()}
                            className="brand-button-secondary flex-1 rounded-full px-4 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)]"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {t('common.reload')}
                        </motion.button>
                    </div>

                    {!canRetry && (
                        <p className="mt-4 text-xs text-[var(--text-muted)]">{t('errors.general.maxRetries')}</p>
                    )}
                </motion.div>
            </motion.div>
        );
    }

    return (
        <div className="brand-section relative min-h-screen text-white">
            <div className="absolute inset-0 bg-dot-grid opacity-15" />
            <ProductsHero />
            <ProductsSimpleHeader totalProducts={products.length} />

            <section className="relative pb-6">
                <AvoidSidebar>
                    <div className="brand-shell flex justify-center">
                        <div className="brand-card w-full max-w-3xl rounded-[30px] p-4 md:p-6">
                            <div className="flex flex-col gap-4 sm:flex-row">
                                <label className="block flex-1">
                                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">
                                        {t('common.search')}
                                    </span>
                                    <input
                                        value={searchQuery}
                                        onChange={(event) => setSearchQuery(event.target.value)}
                                        placeholder={t('search.placeholder')}
                                        className="brand-input h-12 w-full rounded-full px-4 text-white outline-none transition focus:border-[var(--brand-blue)]"
                                    />
                                </label>
                                {hasActiveFilters && (
                                    <div className="flex items-end">
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery('')}
                                            className="brand-button-secondary h-12 rounded-full px-5 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)] transition hover:border-[var(--brand-blue)] hover:bg-[rgba(41,171,226,0.14)]"
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
                <main className="brand-shell relative py-8">
                    {products.length === 0 && !loading ? (
                        <div className="brand-card-muted flex flex-col items-center justify-center rounded-[30px] px-4 py-20 text-center">
                            <svg
                                className="mx-auto mb-4 h-14 w-14 text-[var(--text-muted)]"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={1.5}
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                            <h3 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">
                                {t('products.filter.noResults')}
                            </h3>
                            <p className="mb-6 max-w-sm text-sm text-[var(--text-secondary)]">
                                {t('products.filter.noResultsHint')}
                            </p>
                            {hasActiveFilters && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="brand-button-secondary rounded-full px-5 py-2.5 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)] transition hover:border-[var(--brand-blue)] hover:bg-[rgba(41,171,226,0.14)]"
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
