'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ProductsHero, ProductGrid } from './components';
import ProductsSimpleHeader from './components/ProductsSimpleHeader';
import { apiService } from '@/services/apiService';
import { ApiProduct } from '@/types/api';
import { SimpleProduct } from '@/types/product';
import { GridSkeleton } from '@/components/ui/SkeletonLoader';
import { PageLoader } from '@/components/ui/LottieLoader';
import { useRetry } from '@/hooks/useRetry';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { parseImageUrl } from '@/utils/media';
import { useLanguage } from '@/context/LanguageContext';

function ProductsPageContent() {
    const [products, setProducts] = useState<SimpleProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorKey, setErrorKey] = useState<string | null>(null);
    const { t } = useLanguage();
    const { retry, retryCount, isRetrying, canRetry } = useRetry({
        maxAttempts: 3,
        delayMs: 1500,
        exponentialBackoff: true,
    });

    // Convert API product to SimpleProduct type
    const convertApiProductToProduct = useCallback((apiProduct: ApiProduct): SimpleProduct | null => {
        const productId = apiProduct.id?.toString().trim();
        if (!productId) {
            return null;
        }

        return {
            id: productId,
            name: apiProduct.name,
            shortDescription: apiProduct.shortDescription,
            description: apiProduct.shortDescription,
            image: parseImageUrl(apiProduct.image),
        };
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const response = await apiService.fetchProducts();

                if (response.success && response.data) {
                    const convertedProducts = response.data
                        .map(convertApiProductToProduct)
                        .filter((product): product is SimpleProduct => product !== null);
                    setProducts(convertedProducts);
                    setErrorKey(null);
                } else {
                    setErrorKey('errors.products.loadFailedMessage');
                }
            } catch (err) {
                console.error('Error fetching products:', err);
                setErrorKey('errors.products.loadFailedMessage');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [convertApiProductToProduct]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0c131d] text-white flex flex-col">
                <ProductsHero />
                <ProductsSimpleHeader totalProducts={0} />
                <main className="ml-0 sm:ml-20 px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-8 flex justify-center">
                    <div className="w-full max-w-none">
                        <GridSkeleton
                            count={8}
                            columns={4}
                            backgroundColor="#1e293b"
                            foregroundColor="#334155"
                        />
                    </div>
                </main>
            </div>
        );
    }

    if (errorKey) {
        const handleRetry = async () => {
            try {
                await retry(async () => {
                    setLoading(true);
                    const response = await apiService.fetchProducts();
                    if (response.success && response.data) {
                        const convertedProducts = response.data
                            .map(convertApiProductToProduct)
                            .filter((product): product is SimpleProduct => product !== null);
                        setProducts(convertedProducts);
                        setErrorKey(null);
                    } else {
                        throw new Error('Failed to load products');
                    }
                });
            } catch (err) {
                console.error('Retry failed:', err);
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
                    <div className="text-red-500 text-4xl mb-4">⚠️</div>
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
                            onClick={() => window.location.reload()}
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
        <div className="min-h-screen bg-[#0c131d] text-white flex flex-col">
            {/* Hero Section */}
            <ProductsHero />

            {/* Header Section */}
            <ProductsSimpleHeader totalProducts={products.length} />

            {/* Main Content */}
            <main className="ml-0 sm:ml-20 px-0 sm:px-0 md:px-1 lg:px-2 xl:px-4 2xl:px-6 py-8 flex justify-center">
                <div className="w-full max-w-none">
                    <ProductGrid products={products} />
                </div>
            </main>
        </div>
    );
}

export default function ProductsPage() {
    const { t } = useLanguage();

    return (
        <ErrorBoundary>
            <Suspense fallback={<PageLoader message={t('products.loadingMessage')} />}>
                <ProductsPageContent />
            </Suspense>
        </ErrorBoundary>
    );
}
