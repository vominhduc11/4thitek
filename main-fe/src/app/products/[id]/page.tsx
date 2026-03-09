'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import ProductHero from '@/app/products/[id]/components/ProductHero';
import ProductDetails from '@/app/products/[id]/components/ProductDetails';
import ProductVideos from '@/app/products/[id]/components/ProductVideos';
import ProductSpecifications from '@/app/products/[id]/components/ProductSpecifications';
import ProductWarranty from '@/app/products/[id]/components/ProductWarranty';
import RelatedProducts from '@/app/products/[id]/components/RelatedProducts';
import AvoidSidebar from '@/components/ui/AvoidSidebar';
import { useLanguage } from '@/context/LanguageContext';
import { apiService } from '@/services/apiService';
import type { Product, ProductSpecification, ProductVideo } from '@/types/product';
import { CardSkeleton } from '@/components/ui/SkeletonLoader';
import { useRetry } from '@/hooks/useRetry';
import { parseImageUrl, parseJsonArray } from '@/utils/media';

interface ApiProductData {
    id: string | number;
    name: string;
    shortDescription: string;
    description?: string;
    descriptions?: string;
    image: string;
    videos: string;
    specifications: string;
    price?: number;
    category?: string;
    features?: string[];
    tags?: string[];
}

const EMPTY_PRODUCT_CATEGORY = {
    id: '',
    name: '',
    description: '',
    slug: ''
};

const EMPTY_PRODUCT_WARRANTY = {
    period: '',
    coverage: [],
    conditions: [],
    excludes: [],
    registrationRequired: false
};

const EMPTY_PRODUCT_SPECIFICATIONS: ProductSpecification = {
    driver: '',
    frequencyResponse: '',
    impedance: '',
    sensitivity: '',
    maxPower: '',
    cable: '',
    weight: '',
    dimensions: '',
    connector: '',
    compatibility: []
};

const toProductId = (value: string | number | null | undefined): string | null => {
    const nextValue = value?.toString().trim();
    return nextValue ? nextValue : null;
};

const normalizeTextArray = (value: unknown): string[] =>
    Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];

const normalizeProductSpecifications = (value: unknown): ProductSpecification => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return { ...EMPTY_PRODUCT_SPECIFICATIONS };
    }

    const raw = value as Partial<Record<keyof ProductSpecification, unknown>>;

    return {
        driver: typeof raw.driver === 'string' ? raw.driver : '',
        frequencyResponse: typeof raw.frequencyResponse === 'string' ? raw.frequencyResponse : '',
        impedance: typeof raw.impedance === 'string' ? raw.impedance : '',
        sensitivity: typeof raw.sensitivity === 'string' ? raw.sensitivity : '',
        maxPower: typeof raw.maxPower === 'string' ? raw.maxPower : '',
        cable: typeof raw.cable === 'string' ? raw.cable : '',
        weight: typeof raw.weight === 'string' ? raw.weight : '',
        dimensions: typeof raw.dimensions === 'string' ? raw.dimensions : '',
        connector: typeof raw.connector === 'string' ? raw.connector : '',
        compatibility: normalizeTextArray(raw.compatibility)
    };
};

const buildProductRecord = ({
    id,
    name,
    description,
    image,
    features = [],
    highlights = [],
    specifications,
    videos = []
}: {
    id: string;
    name: string;
    description: string;
    image: string;
    features?: Product['features'];
    highlights?: string[];
    specifications?: unknown;
    videos?: ProductVideo[];
}): Product => ({
    id,
    name,
    description,
    longDescription: description,
    images: image
        ? [{
            id: '1',
            url: image,
            alt: name,
            type: 'main' as const,
            order: 0
        }]
        : [],
    subtitle: description,
    category: { ...EMPTY_PRODUCT_CATEGORY },
    features,
    highlights,
    specifications: normalizeProductSpecifications(specifications),
    videos,
    availability: {
        status: 'unknown'
    },
    warranty: { ...EMPTY_PRODUCT_WARRANTY },
    targetAudience: [],
    useCases: [],
    popularity: 0,
    tags: [],
    relatedProductIds: [],
    accessories: [],
    createdAt: '',
    updatedAt: ''
});

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { t } = useLanguage();
    const [productId, setProductId] = useState<string | null>(null);
    const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [activeBreadcrumb, setActiveBreadcrumb] = useState('');
    const [currentSection, setCurrentSection] = useState('details');
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [errorKey, setErrorKey] = useState<string | null>(null);
    const [descriptions, setDescriptions] = useState<unknown[]>([]);
    const [apiSpecifications, setApiSpecifications] = useState<{label: string; value: string}[]>([]);
    const [hasApiSpecifications, setHasApiSpecifications] = useState(false);
    const { retry, retryCount, isRetrying, canRetry } = useRetry({
        maxAttempts: 3,
        delayMs: 1500,
        exponentialBackoff: true,
    });

    useEffect(() => {
        params.then((value) => setProductId(value.id)).catch((err) => {
            console.error('Failed to resolve params:', err);
            setProductId(null);
            setErrorKey('errors.products.notFound');
        });
    }, [params]);

    useEffect(() => {
        if (!productId) return;

        const fetchProduct = async () => {
            try {
                setIsLoading(true);
                setErrorKey(null);
                setApiSpecifications([]);
                setHasApiSpecifications(false);

                const response = await apiService.fetchProductById(productId);

                if (!response.success || !response.data) {
                    setCurrentProduct(null);
                    setRelatedProducts([]);
                    setErrorKey('errors.products.notFound');
                    return;
                }

                const productData = response.data as ApiProductData;

                const featuredImage = parseImageUrl(productData.image, '');

                // Parse descriptions JSON for content
                const parsedDescriptions = parseJsonArray(productData.descriptions || '[]');
                setDescriptions(parsedDescriptions);

                // Parse videos JSON
                const videos = parseJsonArray(productData.videos || '[]');

                // Parse specifications JSON - API returns array format
                let specifications: unknown = {};
                let specsArray: { label: string; value: string }[] = [];
                try {
                    if (typeof productData.specifications === 'string') {
                        const parsedSpecs = parseJsonArray(productData.specifications, []);
                        const isSpecsArray = Array.isArray(parsedSpecs);
                        specsArray = isSpecsArray ? parsedSpecs : [];
                        setApiSpecifications(specsArray);
                        setHasApiSpecifications(isSpecsArray);
                        // Convert array format to object format for compatibility
                        if (isSpecsArray) {
                            specifications = specsArray.reduce((acc: Record<string, string>, spec: { label: string; value: string }) => {
                                // Map API labels to our expected keys
                                const labelMap: Record<string, string> = {
                                    'Camera / Video': 'camera',
                                    'Dung lượng pin': 'battery',
                                    'Thời gian ghi hình liên tục': 'recordingTime',
                                    'Thời gian đàm thoại / intercom': 'talkTime'
                                };
                                const key = labelMap[spec.label] || spec.label.toLowerCase().replace(/\s+/g, '');
                                acc[key] = spec.value;
                                return acc;
                            }, {});
                        } else if (parsedSpecs && typeof parsedSpecs === 'object') {
                            specifications = parsedSpecs;
                        }
                    } else if (typeof productData.specifications === 'object' && productData.specifications !== null) {
                        specifications = productData.specifications;
                    }
                } catch (e) {
                    console.warn('Failed to parse specifications JSON:', e);
                    setApiSpecifications([]);
                    setHasApiSpecifications(false);
                }

                const normalizedProductId = toProductId(productData.id) ?? productId;
                const transformedProduct = buildProductRecord({
                    id: normalizedProductId,
                    name: productData.name,
                    description: productData.description || productData.shortDescription,
                    image: featuredImage,
                    features: parsedDescriptions
                        .filter((d) => (d as { type: string }).type === 'title')
                        .map((d, index) => ({
                            id: `feature-${index}`,
                            title: (d as { text: string }).text,
                            description: (d as { text: string }).text
                        })),
                    highlights: parsedDescriptions
                        .filter((d) => (d as { type: string }).type === 'description')
                        .map((d) => (d as { text: string }).text),
                    specifications,
                    videos: videos.map((v, index) => ({
                        id: `video-${index}`,
                        title: (v as { title: string }).title || t('products.detail.media.videoTitle'),
                        description: (v as { description?: string }).description || '',
                        url: (v as { videoUrl: string }).videoUrl || '',
                        type: 'unknown'
                    })) as ProductVideo[]
                });

                setCurrentProduct(transformedProduct);

                // Fetch related products from API
                try {
                    const relatedResponse = await apiService.fetchRelatedProducts(normalizedProductId, 4);
                    if (relatedResponse.success && relatedResponse.data) {
                        // Transform API data to match Product interface
                        const transformedRelated = (relatedResponse.data as unknown[]).flatMap((product: unknown) => {
                            const typedProduct = product as { id: string | number; name: string; shortDescription: string; image: string; category: string; price?: number };
                            const relatedProductId = toProductId(typedProduct.id);
                            if (!relatedProductId) {
                                return [];
                            }

                            const relatedImage = parseImageUrl(typedProduct.image, '');

                            return [buildProductRecord({
                                id: relatedProductId,
                                name: typedProduct.name,
                                description: typedProduct.shortDescription || '',
                                image: relatedImage
                            })];
                        });
                        setRelatedProducts(transformedRelated);
                    } else {
                        setRelatedProducts([]);
                    }
                } catch (relatedError) {
                    console.error('Error fetching related products:', relatedError);
                    setRelatedProducts([]);
                }
            } catch (fetchError) {
                console.error('Error fetching product:', fetchError);
                setCurrentProduct(null);
                setRelatedProducts([]);
                setErrorKey('errors.products.loadFailed');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProduct();
    }, [productId, t]);

    // Define breadcrumb items with useMemo to prevent unnecessary re-renders
    const breadcrumbItems = useMemo(() => [
        { label: t('products.detail.breadcrumbs.productDetails'), section: 'details' },
        { label: t('products.detail.breadcrumbs.productVideos'), section: 'videos' },
        { label: t('products.detail.breadcrumbs.specifications'), section: 'specifications' },
        { label: t('products.detail.breadcrumbs.warranty'), section: 'warranty' }
    ], [t]);

    // Initialize activeBreadcrumb when language changes
    useEffect(() => {
        if (breadcrumbItems && breadcrumbItems.length > 0 && !activeBreadcrumb) {
            setActiveBreadcrumb(breadcrumbItems[0].label);
        }
    }, [breadcrumbItems, activeBreadcrumb]);

    // Listen for sticky breadcrumb navigation events
    useEffect(() => {
        const handleStickyBreadcrumbNavigation = (event: CustomEvent) => {
            const { label, section } = event.detail;

            // Use the same logic as handleBreadcrumbClick
            if (activeBreadcrumb === label || isTransitioning) {
                return;
            }

            setIsTransitioning(true);
            setActiveBreadcrumb(label);

            setTimeout(() => {
                setCurrentSection(section);
            }, 150);

            setTimeout(() => {
                setIsTransitioning(false);
            }, 600);
        };

        window.addEventListener('breadcrumbNavigation', handleStickyBreadcrumbNavigation as EventListener);
        return () => {
            window.removeEventListener('breadcrumbNavigation', handleStickyBreadcrumbNavigation as EventListener);
        };
    }, [activeBreadcrumb, isTransitioning]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleBreadcrumbClick = (item: any) => {
        // Don't trigger if already active or transitioning
        if (activeBreadcrumb === item.label || isTransitioning) {
            return;
        }

        // Start transition
        setIsTransitioning(true);

        // Update breadcrumb immediately for visual feedback
        setActiveBreadcrumb(item.label);

        // Small delay before content change for smoother transition
        setTimeout(() => {
            setCurrentSection(item.section);
        }, 150);

        // End transition without scrolling
        setTimeout(() => {
            setIsTransitioning(false);
        }, 600);
    };

    // Animation variants for content transitions
    const contentVariants: Variants = {
        hidden: {
            opacity: 0,
            y: 50,
            scale: 0.95
        },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1
        },
        exit: {
            opacity: 0,
            y: -50,
            scale: 1.05
        }
    };

    // Render content based on current section
    const renderSectionContent = () => {
        switch (currentSection) {
            case 'videos':
                return (
                    <motion.div
                        key="videos"
                        variants={contentVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{
                            duration: 0.6,
                            ease: 'easeOut'
                        }}
                    >
                        <ProductVideos productName={currentProduct?.name} videos={currentProduct?.videos?.map(v => ({
                            title: v.title,
                            videoUrl: v.url,
                            description: v.description
                        })) || []} />
                    </motion.div>
                );
            case 'specifications':
                return (
                    <motion.div
                        key="specifications"
                        variants={contentVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{
                            duration: 0.6,
                            ease: 'easeOut'
                        }}
                    >
                        <ProductSpecifications specifications={hasApiSpecifications ? apiSpecifications : [
                            { label: t('products.specifications.labels.driver'), value: currentProduct?.specifications?.driver || '' },
                            { label: t('products.specifications.labels.frequencyResponse'), value: currentProduct?.specifications?.frequencyResponse || '' },
                            { label: t('products.specifications.labels.impedance'), value: currentProduct?.specifications?.impedance || '' },
                            { label: t('products.specifications.labels.sensitivity'), value: currentProduct?.specifications?.sensitivity || '' },
                            { label: t('products.specifications.labels.maxPower'), value: currentProduct?.specifications?.maxPower || '' },
                            { label: t('products.specifications.labels.cable'), value: currentProduct?.specifications?.cable || '' },
                            { label: t('products.specifications.labels.weight'), value: currentProduct?.specifications?.weight || '' },
                            { label: t('products.specifications.labels.dimensions'), value: currentProduct?.specifications?.dimensions || '' },
                            { label: t('products.specifications.labels.connector'), value: currentProduct?.specifications?.connector || '' }
                        ].filter((spec) => spec.value.trim().length > 0)} />
                    </motion.div>
                );
            case 'warranty':
                return (
                    <motion.div
                        key="warranty"
                        variants={contentVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{
                            duration: 0.6,
                            ease: 'easeOut'
                        }}
                    >
                        <ProductWarranty />
                    </motion.div>
                );
            default: // 'details'
                return (
                    <motion.div
                        key="details"
                        variants={contentVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{
                            duration: 0.6,
                            ease: 'easeOut'
                        }}
                    >
                        <ProductDetails
                            description={currentProduct?.longDescription || currentProduct?.description || ''}
                            descriptions={descriptions}
                        />
                    </motion.div>
                );
        }
    };

    if (errorKey && !currentProduct) {
        const handleRetry = async () => {
            if (!productId) return;
            try {
                await retry(async () => {
                    setIsLoading(true);
                    const response = await apiService.fetchProductById(productId);
                    if (response.success && response.data) {
                        const productData = response.data as ApiProductData;
                        const featuredImage = parseImageUrl(productData.image, '');
                        const parsedDescriptions = parseJsonArray(productData.descriptions || '[]');
                        const parsedVideos = parseJsonArray(productData.videos || '[]');
                        const normalizedProductId = toProductId(productData.id) ?? productId;
                        let specifications: unknown = {};
                        let specsArray: { label: string; value: string }[] = [];
                        try {
                            if (typeof productData.specifications === 'string') {
                                const parsedSpecs = parseJsonArray(productData.specifications, []);
                                if (Array.isArray(parsedSpecs)) {
                                    specsArray = parsedSpecs;
                                    setApiSpecifications(specsArray);
                                    setHasApiSpecifications(true);
                                    specifications = specsArray.reduce((acc: Record<string, string>, spec: { label: string; value: string }) => {
                                        const labelMap: Record<string, string> = {
                                            'Camera / Video': 'camera',
                                            'Dung lÆ°á»£ng pin': 'battery',
                                            'Thá»i gian ghi hĂ¬nh liĂªn tá»¥c': 'recordingTime',
                                            'Thá»i gian Ä‘Ă m thoáº¡i / intercom': 'talkTime'
                                        };
                                        const key = labelMap[spec.label] || spec.label.toLowerCase().replace(/\s+/g, '');
                                        acc[key] = spec.value;
                                        return acc;
                                    }, {});
                                } else if (parsedSpecs && typeof parsedSpecs === 'object') {
                                    setApiSpecifications([]);
                                    setHasApiSpecifications(false);
                                    specifications = parsedSpecs;
                                }
                            } else if (typeof productData.specifications === 'object' && productData.specifications !== null) {
                                setApiSpecifications([]);
                                setHasApiSpecifications(false);
                                specifications = productData.specifications;
                            }
                        } catch (specificationsError) {
                            console.warn('Failed to parse specifications JSON during retry:', specificationsError);
                            setApiSpecifications([]);
                            setHasApiSpecifications(false);
                        }
                        setDescriptions(parsedDescriptions);
                        const transformedProduct = buildProductRecord({
                            id: normalizedProductId,
                            name: productData.name,
                            description: productData.description || productData.shortDescription,
                            image: featuredImage,
                            features: parsedDescriptions
                                .filter((d) => (d as { type: string }).type === 'title')
                                .map((d, index) => ({
                                    id: `feature-${index}`,
                                    title: (d as { text: string }).text,
                                    description: (d as { text: string }).text
                                })),
                            highlights: parsedDescriptions
                                .filter((d) => (d as { type: string }).type === 'description')
                                .map((d) => (d as { text: string }).text),
                            specifications,
                            videos: parsedVideos.map((v, index) => ({
                                id: `video-${index}`,
                                title: (v as { title: string }).title || t('products.detail.media.videoTitle'),
                                description: (v as { description?: string }).description || '',
                                url: (v as { videoUrl: string }).videoUrl || '',
                                type: 'unknown'
                            })) as ProductVideo[]
                        });
                        setCurrentProduct(transformedProduct);
                        setErrorKey(null);
                    } else {
                        throw new Error(t('errors.products.loadFailed'));
                    }
                });
            } catch (err) {
                console.error('Retry failed:', err);
            } finally {
                setIsLoading(false);
            }
        };

        return (
            <motion.div
                className="min-h-screen bg-[#0a0f1a] flex items-center justify-center p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <motion.div
                    className="bg-[#1e293b] rounded-lg border border-red-500/30 p-8 max-w-md w-full text-center"
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h3 className="text-lg font-semibold text-red-400 mb-2">
                        {t('products.detail.errorTitle')}
                    </h3>
                    <p className="text-gray-300 mb-6">
                        {t(errorKey)}
                    </p>

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

                        <motion.a
                            href="/products"
                            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded transition-colors inline-block text-center"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {t('common.backToList')}
                        </motion.a>
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

    if (isLoading || !currentProduct) {
        return (
            <div className="min-h-screen bg-[#0a0f1a] text-white">
                {/* Mobile Layout Skeleton */}
                <div className="md:hidden">
                    <motion.div
                        className="sticky top-[72px] z-[200] py-3 bg-[#0a0f1a]/95 backdrop-blur-sm border-b border-gray-800/50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                    >
                        <AvoidSidebar>
                            <div className="px-4">
                                <div className="h-10 bg-gray-700 rounded animate-pulse"></div>
                            </div>
                        </AvoidSidebar>
                    </motion.div>

                    <AvoidSidebar>
                        <div className="pt-16 px-4">
                            {/* Hero Image Skeleton */}
                            <div className="relative w-full aspect-video bg-gray-800 rounded-lg mb-8 animate-pulse"></div>

                            {/* Title & Description Skeleton */}
                            <div className="space-y-4 mb-8">
                                <div className="h-8 bg-gray-700 rounded w-3/4 animate-pulse"></div>
                                <div className="h-4 bg-gray-700 rounded w-full animate-pulse"></div>
                                <div className="h-4 bg-gray-700 rounded w-5/6 animate-pulse"></div>
                            </div>

                            {/* Content Card Skeleton */}
                            <CardSkeleton height={400} backgroundColor="#1e293b" foregroundColor="#334155" />
                        </div>
                    </AvoidSidebar>
                </div>

                {/* Tablet/Desktop Layout Skeleton */}
                <div className="hidden md:block">
                    <div className="ml-16 md:ml-20">
                        {/* Hero Section Skeleton */}
                        <div className="relative h-[500px] lg:h-[600px] bg-gray-900 mb-8">
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0a0f1a]"></div>
                            <div className="relative z-10 h-full flex items-center px-8">
                                <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Image Skeleton */}
                                    <div className="aspect-square bg-gray-800 rounded-lg animate-pulse"></div>

                                    {/* Info Skeleton */}
                                    <div className="space-y-6">
                                        <div className="h-10 bg-gray-700 rounded w-3/4 animate-pulse"></div>
                                        <div className="h-6 bg-gray-700 rounded w-1/2 animate-pulse"></div>
                                        <div className="space-y-2">
                                            <div className="h-4 bg-gray-700 rounded w-full animate-pulse"></div>
                                            <div className="h-4 bg-gray-700 rounded w-5/6 animate-pulse"></div>
                                            <div className="h-4 bg-gray-700 rounded w-4/6 animate-pulse"></div>
                                        </div>
                                        <div className="h-12 bg-gray-700 rounded w-48 animate-pulse"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Breadcrumb Navigation Skeleton */}
                        <div className="flex gap-4 px-8 mb-8">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-10 bg-gray-700 rounded w-32 animate-pulse"></div>
                            ))}
                        </div>

                        {/* Content Section Skeleton */}
                        <div className="px-8 pb-8">
                            <CardSkeleton height={600} backgroundColor="#1e293b" foregroundColor="#334155" />
                        </div>

                        {/* Related Products Skeleton */}
                        <div className="px-8 py-8">
                            <div className="h-8 bg-gray-700 rounded w-64 mb-6 animate-pulse"></div>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                {[1, 2, 3, 4].map((i) => (
                                    <CardSkeleton key={i} height={300} backgroundColor="#1e293b" foregroundColor="#334155" />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0f1a] text-white">
            {/* Mobile Layout (Small screens) */}
            <div className="md:hidden">
                {/* Mobile Navigation Dropdown - Above Hero */}
                <motion.div
                    className="sticky top-[72px] z-[200] py-3 bg-[#0a0f1a]/95 backdrop-blur-sm border-b border-gray-800/50"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.6,
                        ease: 'easeOut',
                        delay: 0.2
                    }}
                >
                    <AvoidSidebar>
                        <div className="px-4">
                            <div className="relative z-10">
                                <select
                                    value={activeBreadcrumb}
                                    onChange={(e) => {
                                        const selectedItem = breadcrumbItems.find(
                                            (item) => item.label === e.target.value
                                        );
                                        if (selectedItem) {
                                            handleBreadcrumbClick(selectedItem);
                                        }
                                    }}
                                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-3 py-2 xs:px-4 xs:py-3 sm:px-5 sm:py-3.5 text-white text-xs xs:text-sm sm:text-base md:text-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent appearance-none cursor-pointer"
                                    aria-label={t('products.detail.selectSection')}
                                >
                                    {breadcrumbItems.map((item) => (
                                        <option key={item.label} value={item.label} className="bg-gray-800 text-white">
                                            {item.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                    <svg
                                        className="w-4 h-4 text-gray-400"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </AvoidSidebar>
                </motion.div>

                {/* Mobile Hero - Compact */}
                <AvoidSidebar>
                    <div className="pt-16">
                        <ProductHero
                            product={currentProduct}
                            relatedProducts={relatedProducts}
                            breadcrumbItems={breadcrumbItems}
                            activeBreadcrumb={activeBreadcrumb}
                            onBreadcrumbClick={handleBreadcrumbClick}
                        />
                    </div>
                </AvoidSidebar>

                {/* Mobile Content */}
                <AvoidSidebar>
                    <div className="-mt-32 xs:-mt-36 relative z-30 bg-transparent">
                        <div id="product-details" className="relative bg-transparent">
                            <AnimatePresence>
                                {isTransitioning && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute inset-0 bg-[#0a0f1a]/30 backdrop-blur-sm z-50 flex items-center justify-center"
                                    >
                                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                            <div className="overflow-hidden -mt-20 xs:-mt-22 sm:-mt-24 md:-mt-28 lg:-mt-32 xl:-mt-36 2xl:-mt-40 3xl:-mt-44 4xl:-mt-48">
                                <AnimatePresence mode="wait">{renderSectionContent()}</AnimatePresence>
                            </div>
                        </div>
                        <div className="pt-2">
                            <RelatedProducts products={relatedProducts} />
                        </div>
                    </div>
                </AvoidSidebar>
            </div>

            {/* Tablet Layout (md to lg) */}
            <div className="hidden md:block lg:hidden">
                {/* Tablet Hero */}
                <div className="ml-16 md:ml-20">
                    <ProductHero
                        product={currentProduct}
                        relatedProducts={relatedProducts}
                        breadcrumbItems={breadcrumbItems}
                        activeBreadcrumb={activeBreadcrumb}
                        onBreadcrumbClick={handleBreadcrumbClick}
                    />
                </div>

                {/* Tablet Content */}
                <div className="ml-16 md:ml-20 -mt-24 md:-mt-32 relative z-30 bg-transparent">
                    <div id="product-details" className="relative bg-transparent">
                        <AnimatePresence>
                            {isTransitioning && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute inset-0 bg-[#0a0f1a]/30 backdrop-blur-sm z-50 flex items-center justify-center"
                                >
                                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <div className="overflow-hidden -mt-12 sm:-mt-14 md:-mt-16 lg:-mt-20 xl:-mt-24 2xl:-mt-28 3xl:-mt-32 4xl:-mt-36">
                            <AnimatePresence mode="wait">{renderSectionContent()}</AnimatePresence>
                        </div>
                    </div>
                    <div className="pt-2 md:pt-4">
                        <RelatedProducts products={relatedProducts} />
                    </div>
                </div>
            </div>

            {/* Desktop Layout (lg và lớn hơn) */}
            <div className="hidden lg:block">
                {/* Desktop Hero */}
                <div className="ml-20">
                    <ProductHero
                        product={currentProduct}
                        relatedProducts={relatedProducts}
                        breadcrumbItems={breadcrumbItems}
                        activeBreadcrumb={activeBreadcrumb}
                        onBreadcrumbClick={handleBreadcrumbClick}
                    />
                </div>

                {/* Desktop Content */}
                <div className="ml-20 -mt-32 lg:-mt-48 xl:-mt-48 relative z-30 bg-transparent">
                    <div id="product-details" className="relative bg-transparent">
                        <AnimatePresence>
                            {isTransitioning && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute inset-0 bg-[#0a0f1a]/30 backdrop-blur-sm z-50 flex items-center justify-center"
                                >
                                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <div className="overflow-hidden -mt-24 sm:-mt-28 md:-mt-32 lg:-mt-40 xl:-mt-48 2xl:-mt-56 3xl:-mt-64 4xl:-mt-72">
                            <AnimatePresence mode="wait">{renderSectionContent()}</AnimatePresence>
                        </div>
                    </div>
                    <div className="pt-2 lg:pt-4">
                        <RelatedProducts products={relatedProducts} />
                    </div>
                </div>
            </div>
        </div>
    );
}
