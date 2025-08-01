'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import ProductHero from '@/app/products/[id]/components/ProductHero';
import ProductDetails from '@/app/products/[id]/components/ProductDetails';
import ProductVideos from '@/app/products/[id]/components/ProductVideos';
import ProductSpecifications from '@/app/products/[id]/components/ProductSpecifications';
import ProductWarranty from '@/app/products/[id]/components/ProductWarranty';
import RelatedProducts from '@/app/products/[id]/components/RelatedProducts';
import AvoidSidebar from '@/components/ui/AvoidSidebar';
import { getProductById, getRelatedProducts } from '@/data/products';
import type { Product } from '@/types/product';

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
    const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null);
    const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [activeBreadcrumb, setActiveBreadcrumb] = useState('PRODUCT DETAILS');
    const [currentSection, setCurrentSection] = useState('details');
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        params.then(setResolvedParams);
    }, [params]);

    useEffect(() => {
        if (resolvedParams?.id) {
            const product = getProductById(resolvedParams.id);

            if (product) {
                setCurrentProduct(product);
                // Get related products based on category and position
                const related = getRelatedProducts(product.id, 4);
                setRelatedProducts(related);
            } else {
                // Fallback for unknown product
                console.error('Product not found:', resolvedParams.id);
            }
        }
    }, [resolvedParams]);

    // Listen for sticky breadcrumb navigation events
    useEffect(() => {
        const handleStickyBreadcrumbNavigation = (event: CustomEvent) => {
            console.log('📍 Received breadcrumbNavigation event:', event.detail);
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

    const breadcrumbItems = [
        { label: 'PRODUCT DETAILS', section: 'details' },
        { label: 'PRODUCT VIDEOS', section: 'videos' },
        { label: 'SPECIFICATIONS', section: 'specifications' },
        { label: 'WARRANTY', section: 'warranty' }
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleBreadcrumbClick = (item: any) => {
        console.log('handleBreadcrumbClick called with:', item);
        // Don't trigger if already active or transitioning
        if (activeBreadcrumb === item.label || isTransitioning) {
            console.log('Skipping - already active or transitioning:', { activeBreadcrumb, isTransitioning });
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
                        <ProductVideos productName={currentProduct?.name} />
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
                        <ProductSpecifications />
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
                            features={currentProduct?.features || []}
                            highlights={currentProduct?.highlights || []}
                            description={currentProduct?.longDescription || currentProduct?.description || ''}
                        />
                    </motion.div>
                );
        }
    };

    if (!currentProduct) {
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
