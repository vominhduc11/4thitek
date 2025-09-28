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
import { getProductById, getRelatedProducts } from '@/data/products';
import { useLanguage } from '@/context/LanguageContext';
import { apiService } from '@/services/apiService';
import type { Product, ProductSpecification, ProductVideo } from '@/types/product';

interface ApiProductData {
    id: number;
    name: string;
    shortDescription: string;
    description?: string;
    descriptions?: string;
    image: string;
    videos: string;
    specifications: string;
    price?: number;
    wholesalePrice?: string;
    category?: string;
    features?: string[];
    tags?: string[];
}

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { t } = useLanguage();
    const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
    const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [activeBreadcrumb, setActiveBreadcrumb] = useState('');
    const [currentSection, setCurrentSection] = useState('details');
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [, setError] = useState<string | null>(null);
    const [descriptions, setDescriptions] = useState<unknown[]>([]);
    const [apiSpecifications, setApiSpecifications] = useState<{label: string; value: string}[]>([]);

    useEffect(() => {
        params.then(setResolvedParams);
    }, [params]);

    useEffect(() => {
        if (resolvedParams?.id) {
            const fetchProduct = async () => {
                try {
                    setIsLoading(true);
                    setError(null);

                    const response = await apiService.fetchProductById(resolvedParams.id);

                    if (response.success && response.data) {
                        // Transform API data to match Product interface
                        const productData = response.data as ApiProductData;

                        // Parse image JSON string
                        let featuredImage = '/products/product1.png';
                        try {
                            const parsedImage = JSON.parse(productData.image);
                            featuredImage = parsedImage.imageUrl;
                        } catch (e) {
                            console.warn('Failed to parse product image JSON:', e);
                        }

                        // Parse descriptions JSON for content
                        let parsedDescriptions: unknown[] = [];
                        try {
                            parsedDescriptions = JSON.parse(productData.descriptions || '[]');
                        } catch (e) {
                            console.warn('Failed to parse descriptions JSON:', e);
                        }
                        setDescriptions(parsedDescriptions);

                        // Parse videos JSON
                        let videos: unknown[] = [];
                        try {
                            if (typeof productData.videos === 'string') {
                                videos = JSON.parse(productData.videos || '[]');
                            } else if (Array.isArray(productData.videos)) {
                                videos = productData.videos;
                            }
                        } catch (e) {
                            console.warn('Failed to parse videos JSON:', e);
                        }

                        // Parse specifications JSON - API returns array format
                        let specifications: unknown = {};
                        let specsArray: {label: string; value: string}[] = [];
                        try {
                            if (typeof productData.specifications === 'string') {
                                specsArray = JSON.parse(productData.specifications || '[]');
                                setApiSpecifications(specsArray);
                                // Convert array format to object format for compatibility
                                if (Array.isArray(specsArray)) {
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
                                }
                            } else if (typeof productData.specifications === 'object') {
                                specifications = productData.specifications;
                            }
                        } catch (e) {
                            console.warn('Failed to parse specifications JSON:', e);
                        }


                        const transformedProduct: Product = {
                            id: productData.id?.toString() || resolvedParams.id,
                            name: productData.name,
                            sku: `SKU-${productData.id}`,
                            description: productData.shortDescription,
                            longDescription: productData.shortDescription,
                            images: [{
                                id: '1',
                                url: featuredImage,
                                alt: productData.name,
                                type: 'main' as const,
                                order: 0
                            }],
                            subtitle: productData.shortDescription,
                            category: {
                                id: 'electronics',
                                name: 'Electronics',
                                description: 'Electronic products',
                                slug: 'electronics'
                            },
                            features: parsedDescriptions.filter(d => (d as { type: string }).type === 'title').map((d, index) => ({
                                id: `feature-${index}`,
                                title: (d as { text: string }).text,
                                description: (d as { text: string }).text
                            })),
                            highlights: parsedDescriptions.filter(d => (d as { type: string }).type === 'description').map(d => (d as { text: string }).text),
                            specifications: specifications as ProductSpecification || {
                                driver: 'Unknown',
                                frequencyResponse: 'Unknown',
                                impedance: 'Unknown',
                                sensitivity: 'Unknown',
                                maxPower: 'Unknown',
                                cable: 'Unknown',
                                weight: 'Unknown',
                                dimensions: 'Unknown',
                                connector: 'Unknown',
                                compatibility: []
                            },
                            videos: videos.map((v, index) => ({
                                id: `video-${index}`,
                                title: (v as { title: string }).title || 'Product Video',
                                description: (v as { description?: string }).description || '',
                                url: (v as { videoUrl: string }).videoUrl || '',
                                type: 'demo' as const
                            })) as ProductVideo[],
                            availability: {
                                status: 'available' as const
                            },
                            warranty: {
                                period: '1 year',
                                coverage: ['Manufacturing defects'],
                                conditions: ['Normal use'],
                                excludes: ['Physical damage'],
                                registrationRequired: false
                            },
                            targetAudience: ['General'],
                            useCases: ['General use'],
                            popularity: 0,
                            tags: [],
                            relatedProductIds: [],
                            accessories: [],
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        };

                        setCurrentProduct(transformedProduct);

                        // Fetch related products from API
                        try {
                            const relatedResponse = await apiService.fetchRelatedProducts(productData.id?.toString() || resolvedParams.id, 4);
                            if (relatedResponse.success && relatedResponse.data) {
                                // Transform API data to match Product interface
                                const transformedRelated = (relatedResponse.data as unknown[]).map((product: unknown) => {
                                    const typedProduct = product as { id: number; name: string; shortDescription: string; image: string; category: string; price?: number };
                                    let featuredImage = '/products/product1.png';
                                    try {
                                        const parsedImage = JSON.parse(typedProduct.image);
                                        featuredImage = parsedImage.imageUrl;
                                    } catch (e) {
                                        console.warn('Failed to parse related product image JSON:', e);
                                    }

                                    return {
                                        id: typedProduct.id?.toString() || `product-${Date.now()}`,
                                        name: typedProduct.name,
                                        sku: `SKU-${typedProduct.id}`,
                                        description: typedProduct.shortDescription || '',
                                        longDescription: typedProduct.shortDescription || '',
                                        subtitle: typedProduct.shortDescription || '',
                                        images: [{
                                            id: '1',
                                            url: featuredImage,
                                            alt: typedProduct.name,
                                            type: 'main' as const,
                                            order: 0
                                        }],
                                        category: {
                                            id: 'electronics',
                                            name: 'Electronics',
                                            description: 'Electronic products',
                                            slug: 'electronics'
                                        },
                                        features: [],
                                        highlights: [],
                                        specifications: {
                                            driver: 'Unknown',
                                            frequencyResponse: 'Unknown',
                                            impedance: 'Unknown',
                                            sensitivity: 'Unknown',
                                            maxPower: 'Unknown',
                                            cable: 'Unknown',
                                            weight: 'Unknown',
                                            dimensions: 'Unknown',
                                            connector: 'Unknown',
                                            compatibility: []
                                        },
                                        videos: [],
                                        availability: {
                                            status: 'available' as const
                                        },
                                        warranty: {
                                            period: '1 year',
                                            coverage: ['Manufacturing defects'],
                                            conditions: ['Normal use'],
                                            excludes: ['Physical damage'],
                                            registrationRequired: false
                                        },
                                        targetAudience: ['General'],
                                        useCases: ['General use'],
                                        popularity: 0,
                                        tags: [],
                                        relatedProductIds: [],
                                        accessories: [],
                                        createdAt: new Date().toISOString(),
                                        updatedAt: new Date().toISOString()
                                    };
                                });
                                setRelatedProducts(transformedRelated);
                            } else {
                                // Fallback to mock data
                                const related = getRelatedProducts(productData.id?.toString() || resolvedParams.id, 4);
                                setRelatedProducts(related);
                            }
                        } catch (relatedError) {
                            console.error('Error fetching related products:', relatedError);
                            // Fallback to mock data
                            const related = getRelatedProducts(productData.id?.toString() || resolvedParams.id, 4);
                            setRelatedProducts(related);
                        }

                    } else {
                        // Fallback to mock data
                        const product = getProductById(resolvedParams.id);
                        if (product) {
                            setCurrentProduct(product);
                            const related = getRelatedProducts(product.id, 4);
                            setRelatedProducts(related);
                        } else {
                            setError('Product not found');
                        }
                    }
                } catch (fetchError) {
                    console.error('Error fetching product:', fetchError);
                    // Fallback to mock data
                    const product = getProductById(resolvedParams.id);
                    if (product) {
                        setCurrentProduct(product);
                        const related = getRelatedProducts(product.id, 4);
                        setRelatedProducts(related);
                    } else {
                        setError('Product not found');
                    }
                } finally {
                    setIsLoading(false);
                }
            };

            fetchProduct();
        }
    }, [resolvedParams]);

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
                        <ProductSpecifications specifications={apiSpecifications.length > 0 ? apiSpecifications : [
                            { label: 'Driver', value: currentProduct?.specifications?.driver || 'Unknown' },
                            { label: 'Frequency Response', value: currentProduct?.specifications?.frequencyResponse || 'Unknown' },
                            { label: 'Impedance', value: currentProduct?.specifications?.impedance || 'Unknown' },
                            { label: 'Sensitivity', value: currentProduct?.specifications?.sensitivity || 'Unknown' },
                            { label: 'Max Power', value: currentProduct?.specifications?.maxPower || 'Unknown' },
                            { label: 'Cable', value: currentProduct?.specifications?.cable || 'Unknown' },
                            { label: 'Weight', value: currentProduct?.specifications?.weight || 'Unknown' },
                            { label: 'Dimensions', value: currentProduct?.specifications?.dimensions || 'Unknown' },
                            { label: 'Connector', value: currentProduct?.specifications?.connector || 'Unknown' }
                        ]} />
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

    if (isLoading || !currentProduct) {
        return (
            <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
                <div className="w-full max-w-7xl mx-auto px-4">
                    {/* Skeleton loader */}
                    <div className="ml-16 md:ml-20">
                        {/* Hero skeleton */}
                        <div className="animate-pulse">
                            <div className="h-8 w-48 bg-gray-700 rounded mb-4"></div>
                            <div className="h-16 w-3/4 bg-gray-700 rounded mb-8"></div>

                            <div className="flex flex-col md:flex-row gap-8">
                                {/* Image skeleton */}
                                <div className="w-full md:w-1/2">
                                    <div className="aspect-square bg-gray-800 rounded-lg"></div>
                                </div>

                                {/* Content skeleton */}
                                <div className="w-full md:w-1/2 space-y-4">
                                    <div className="h-8 bg-gray-700 rounded w-3/4"></div>
                                    <div className="h-4 bg-gray-700 rounded w-full"></div>
                                    <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                                    <div className="h-4 bg-gray-700 rounded w-4/6"></div>
                                    <div className="h-12 bg-gray-700 rounded w-48 mt-8"></div>
                                </div>
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
                                    aria-label="Select section"
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
                        <ProductHero product={currentProduct} relatedProducts={relatedProducts} />
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
