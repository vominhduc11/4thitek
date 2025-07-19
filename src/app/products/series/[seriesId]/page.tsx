'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import ProductHero from './components/ProductHero';
import ProductDetails from './components/ProductDetails';
import ProductVideos from './components/ProductVideos';
import ProductSpecifications from './components/ProductSpecifications';
import ProductWarranty from './components/ProductWarranty';
import RelatedProducts from './components/RelatedProducts';
import { getProductsBySeries, productSeries } from '@/data/products';
import { ProductSeries } from '@/types/product';

// Legacy interface for backward compatibility
interface LegacyProduct {
    id: string;
    name: string;
    subtitle: string;
    description: string;
    image: string;
    features: Array<{
        title: string;
        subtitle: string;
        description: string;
        value?: string;
    }>;
    additionalFeatures: Array<{
        icon: string;
        description: string;
    }>;
    series?: {
        id: string;
        name: string;
    };
}

export default function SeriesPage({ params }: { params: Promise<{ seriesId: string }> }) {
    const [resolvedParams, setResolvedParams] = useState<{ seriesId: string } | null>(null);
    const [currentProduct, setCurrentProduct] = useState<LegacyProduct | null>(null);
    const [seriesProducts, setSeriesProducts] = useState<LegacyProduct[]>([]);
    const [seriesInfo, setSeriesInfo] = useState<ProductSeries | null>(null);
    const [currentProductIndex, setCurrentProductIndex] = useState(0);
    const [activeBreadcrumb, setActiveBreadcrumb] = useState('PRODUCT DETAILS');
    const [currentSection, setCurrentSection] = useState('details');
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        params.then(setResolvedParams);
    }, [params]);

    useEffect(() => {
        if (resolvedParams?.seriesId) {
            // Find series by ID
            const series = productSeries.find(s => s.id === resolvedParams.seriesId);
            
            if (series) {
                // Load all products from this series
                const sameSeriesProducts = getProductsBySeries(series.id);
                
                if (sameSeriesProducts.length > 0) {
                    // Convert real products to legacy format
                    const legacySeriesProducts: LegacyProduct[] = sameSeriesProducts.map(prod => ({
                        id: prod.id,
                        name: prod.name,
                        subtitle: prod.subtitle,
                        description: prod.description,
                        image: prod.images[0]?.url || '/products/product1.png',
                        series: {
                            id: prod.series.id,
                            name: prod.series.name
                        },
                        features: prod.features.slice(0, 3).map(feature => ({
                            title: feature.title,
                            subtitle: feature.subtitle || '',
                            description: feature.description
                        })),
                        additionalFeatures: prod.features.slice(3).map(feature => ({
                            icon: feature.icon || '🎧',
                            description: feature.description
                        }))
                    }));
                    
                    setSeriesProducts(legacySeriesProducts);
                    setCurrentProduct(legacySeriesProducts[0]); // Start with first product
                    setCurrentProductIndex(0);
                    setSeriesInfo(series);
                } else {
                    // Fallback to mock data if series exists but no products
                    loadMockSeriesData(resolvedParams.seriesId);
                }
            } else {
                // Fallback to mock data for unknown series
                loadMockSeriesData(resolvedParams.seriesId);
            }
        }
    }, [resolvedParams]);

    const loadMockSeriesData = (seriesId: string) => {
        const mockSeriesProducts: LegacyProduct[] = [
            {
                id: `${seriesId}-1`,
                name: `TUNECORE ${seriesId.toUpperCase()} Pro Elite`,
                subtitle: 'Professional Gaming Headset',
                description: 'Tai nghe gaming cao cấp với công nghệ tiên tiến.',
                image: '/products/product1.png',
                series: { id: seriesId, name: `${seriesId.toUpperCase()} SERIES` },
                features: [
                    { title: 'Premium', subtitle: 'High Quality', description: 'Chất lượng cao cấp' },
                    { title: '50mm', subtitle: 'Driver Size', description: 'Driver lớn cho âm thanh tốt' },
                    { title: '7.1', subtitle: 'Surround Sound', description: 'Âm thanh vòm chân thực' }
                ],
                additionalFeatures: [
                    { icon: '🎧', description: 'Thiết kế ergonomic thoải mái' },
                    { icon: '🎵', description: 'Chất lượng âm thanh vượt trội' }
                ]
            },
            {
                id: `${seriesId}-2`,
                name: `TUNECORE ${seriesId.toUpperCase()} Gaming Master`,
                subtitle: 'Professional Gaming Audio',
                description: 'Tai nghe gaming chuyên nghiệp cho game thủ.',
                image: '/products/product1.png',
                series: { id: seriesId, name: `${seriesId.toUpperCase()} SERIES` },
                features: [
                    { title: 'Master', subtitle: 'Pro Level', description: 'Cấp độ chuyên nghiệp' },
                    { title: '40mm', subtitle: 'Driver Size', description: 'Driver chính xác' },
                    { title: 'RGB', subtitle: 'LED Lighting', description: 'Đèn LED RGB' }
                ],
                additionalFeatures: [
                    { icon: '🎮', description: 'Tối ưu cho gaming' },
                    { icon: '💡', description: 'RGB LED tùy chỉnh' }
                ]
            }
        ];
        
        setSeriesProducts(mockSeriesProducts);
        setCurrentProduct(mockSeriesProducts[0]);
        setCurrentProductIndex(0);
        setSeriesInfo({ 
            id: seriesId, 
            name: `${seriesId.toUpperCase()} SERIES`,
            description: `Dòng sản phẩm ${seriesId.toUpperCase()} cao cấp`,
            targetAudience: 'Professional Gamers',
            positionInMarket: 'Premium',
            thumbnail: '/productCards/card1/image1.png'
        });
    };

    // Function to switch to specific product in series
    const switchToProduct = (productIndex: number) => {
        if (productIndex >= 0 && productIndex < seriesProducts.length) {
            setCurrentProduct(seriesProducts[productIndex]);
            setCurrentProductIndex(productIndex);
        }
    };

    const breadcrumbItems = [
        { label: 'PRODUCT DETAILS', section: 'details' },
        { label: 'PRODUCT VIDEOS', section: 'videos' },
        { label: 'SPECIFICATIONS', section: 'specifications' },
        { label: 'WARRANTY', section: 'warranty' }
    ];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleBreadcrumbClick = (item: any) => {
        // Don't trigger if already active or transitioning
        if (activeBreadcrumb === item.label || isTransitioning) return;

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
            const targetSection = document.getElementById('product-details');
            if (targetSection) {
                const headerOffset = 80; // Account for fixed header
                const elementPosition = targetSection.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
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
                            additionalFeatures={currentProduct?.additionalFeatures || []}
                        />
                    </motion.div>
                );
        }
    };

    if (!currentProduct || !seriesInfo) {
        return (
            <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Đang tải series...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0f1a] text-white">
            {/* Hero Section */}
            <ProductHero
                product={currentProduct}
                breadcrumbItems={breadcrumbItems}
                activeBreadcrumb={activeBreadcrumb}
                onBreadcrumbClick={handleBreadcrumbClick}
                seriesProducts={seriesProducts}
                currentProductIndex={currentProductIndex}
                onProductSwitch={switchToProduct}
            />

            {/* Dynamic Section Content with Animation */}
            <div id="product-details" className="relative">
                {/* Transition overlay */}
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

                <AnimatePresence mode="wait">{renderSectionContent()}</AnimatePresence>
            </div>

            {/* Related Products Section */}
            <RelatedProducts />
        </div>
    );
}