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
                const targetSection = document.getElementById('product-details');
                if (targetSection) {
                    const headerOffset =
                        window.innerWidth < 480
                            ? 250
                            : window.innerWidth < 640
                              ? 280
                              : window.innerWidth < 700
                                ? 220
                                : 100;
                    const elementPosition = targetSection.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
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

        // End transition and scroll
        setTimeout(() => {
            setIsTransitioning(false);
            // Try to find the actual content section title (h2)
            let targetSection = null;

            // For desktop/tablet, try to find the section title first for better positioning
            if (window.innerWidth >= 640) {
                // Tablet and Desktop
                // Try to find the h2 title element directly
                const sectionTitles = document.querySelectorAll('.hidden.sm\\:block h2');
                if (sectionTitles.length > 0) {
                    targetSection = sectionTitles[0]; // First h2 in desktop layout
                } else {
                    // Fallback to container
                    targetSection = document.querySelector('.hidden.sm\\:block .container.mx-auto.px-4');
                    if (!targetSection) {
                        targetSection = document.querySelector('.ml-20 .container.mx-auto');
                    }
                }
            } else {
                // Mobile
                targetSection = document.getElementById('product-details');
            }

            // Fallback to original selector
            if (!targetSection) {
                targetSection = document.getElementById('product-details');
            }

            console.log('Target section found:', targetSection);

            if (targetSection) {
                // Điều chỉnh offset dựa trên kích thước màn hình (mobile có offset cao hơn để tránh hero buttons)
                const headerOffset =
                    window.innerWidth < 480 ? 250 : window.innerWidth < 640 ? 280 : window.innerWidth < 700 ? 220 : 100;

                const elementPosition = targetSection.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                // Force scroll with smooth behavior
                try {
                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                } catch {
                    // Fallback for older browsers
                    console.log('Smooth scroll failed, using instant scroll');
                    window.scrollTo(0, offsetPosition);
                }
            } else {
                console.log('Target section not found');
            }
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
                                    className="w-full bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent appearance-none cursor-pointer"
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
                            <div className="px-4 overflow-hidden -mt-24 xs:-mt-28">
                                <AnimatePresence mode="wait">{renderSectionContent()}</AnimatePresence>
                            </div>
                        </div>
                        <div className="pt-8">
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
                        <div className="overflow-hidden -mt-16 md:-mt-20 px-4 md:px-6">
                            <AnimatePresence mode="wait">{renderSectionContent()}</AnimatePresence>
                        </div>
                    </div>
                    <div className="pt-8 md:pt-12">
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
                        <div className="overflow-hidden -mt-32 lg:-mt-48 xl:-mt-48 px-6 lg:px-8">
                            <AnimatePresence mode="wait">{renderSectionContent()}</AnimatePresence>
                        </div>
                    </div>
                    <div className="pt-10 lg:pt-16">
                        <RelatedProducts products={relatedProducts} />
                    </div>
                </div>
            </div>
        </div>
    );
}
