'use client';

import { startTransition, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, type Variants } from 'framer-motion';
import ProductDetails from '@/app/products/[id]/components/ProductDetails';
import ProductHero from '@/app/products/[id]/components/ProductHero';
import ProductSpecifications from '@/app/products/[id]/components/ProductSpecifications';
import ProductVideos from '@/app/products/[id]/components/ProductVideos';
import ProductWarranty from '@/app/products/[id]/components/ProductWarranty';
import RelatedProducts from '@/app/products/[id]/components/RelatedProducts';
import AvoidSidebar from '@/components/ui/AvoidSidebar';
import { useLanguage } from '@/context/LanguageContext';
import { Z_INDEX } from '@/constants/zIndex';
import { mapProductDetailToViewModel, mapProductSummaryToProductCard } from '@/lib/contentMappers';

interface ProductPageClientProps {
    initialProductData: {
        id: string | number;
        name: string;
        shortDescription: string;
        description?: string;
        descriptions?: string;
        image: string;
        videos: string;
        specifications: string | unknown;
        price?: number;
        category?: string;
        tags?: string[];
    };
    initialRelatedProducts: Array<{
        id: string | number;
        name: string;
        shortDescription: string;
        image: string;
    }>;
}

const contentVariants: Variants = {
    hidden: {
        opacity: 0,
        y: 36,
        scale: 0.98
    },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1
    },
    exit: {
        opacity: 0,
        y: -24,
        scale: 1.01
    }
};

export default function ProductPageClient({
    initialProductData,
    initialRelatedProducts
}: ProductPageClientProps) {
    const { t } = useLanguage();
    const { product, descriptions, apiSpecifications, hasApiSpecifications } = mapProductDetailToViewModel(
        initialProductData,
        t('products.detail.media.videoTitle')
    );
    const relatedProducts = initialRelatedProducts
        .map((relatedProduct) => mapProductSummaryToProductCard(relatedProduct))
        .filter((relatedProduct): relatedProduct is NonNullable<typeof relatedProduct> => relatedProduct !== null);

    const breadcrumbItems = useMemo(
        () => [
            { label: t('products.detail.breadcrumbs.productDetails'), section: 'details' },
            { label: t('products.detail.breadcrumbs.productVideos'), section: 'videos' },
            { label: t('products.detail.breadcrumbs.specifications'), section: 'specifications' },
            { label: t('products.detail.breadcrumbs.warranty'), section: 'warranty' }
        ],
        [t]
    );

    const [activeBreadcrumb, setActiveBreadcrumb] = useState(breadcrumbItems[0]?.label || '');
    const [currentSection, setCurrentSection] = useState('details');
    const [showStickyNav, setShowStickyNav] = useState(false);

    useEffect(() => {
        const el = document.getElementById('hero-breadcrumb');
        if (!el) {
            setShowStickyNav(true);
            return;
        }
        const observer = new IntersectionObserver(
            ([entry]) => setShowStickyNav(!entry.isIntersecting),
            { threshold: 0 }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

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
                        transition={{ duration: 0.45, ease: 'easeOut' }}
                    >
                        <ProductVideos productName={product.name} videos={product.videos || []} />
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
                        transition={{ duration: 0.45, ease: 'easeOut' }}
                    >
                        <ProductSpecifications
                            specifications={
                                hasApiSpecifications
                                    ? apiSpecifications
                                    : [
                                          { label: t('products.specifications.labels.driver'), value: product.specifications?.driver || '' },
                                          { label: t('products.specifications.labels.frequencyResponse'), value: product.specifications?.frequencyResponse || '' },
                                          { label: t('products.specifications.labels.impedance'), value: product.specifications?.impedance || '' },
                                          { label: t('products.specifications.labels.sensitivity'), value: product.specifications?.sensitivity || '' },
                                          { label: t('products.specifications.labels.maxPower'), value: product.specifications?.maxPower || '' },
                                          { label: t('products.specifications.labels.cable'), value: product.specifications?.cable || '' },
                                          { label: t('products.specifications.labels.weight'), value: product.specifications?.weight || '' },
                                          { label: t('products.specifications.labels.dimensions'), value: product.specifications?.dimensions || '' },
                                          { label: t('products.specifications.labels.connector'), value: product.specifications?.connector || '' }
                                      ].filter((specification) => specification.value.trim().length > 0)
                            }
                        />
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
                        transition={{ duration: 0.45, ease: 'easeOut' }}
                    >
                        <ProductWarranty />
                    </motion.div>
                );
            default:
                return (
                    <motion.div
                        key="details"
                        variants={contentVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        transition={{ duration: 0.45, ease: 'easeOut' }}
                    >
                        <ProductDetails description={product.longDescription || product.description || ''} descriptions={descriptions} />
                    </motion.div>
                );
        }
    };

    const handleBreadcrumbClick = (item: { label: string; section: string }) => {
        if (activeBreadcrumb !== item.label) {
            setActiveBreadcrumb(item.label);
            startTransition(() => {
                setCurrentSection(item.section);
            });
        }

        requestAnimationFrame(() => {
            const el = document.getElementById('product-details');
            if (!el) return;
            const navOffset = showStickyNav ? 76 + 44 : 76;
            const top = el.getBoundingClientRect().top + window.scrollY - navOffset;
            window.scrollTo({ top, behavior: 'smooth' });
        });
    };

    return (
        <div className="min-h-screen bg-[#0c131d] text-white flex flex-col">
            {/* Hero first — no flow space consumed before it, video fills from top */}
            <AvoidSidebar>
                <ProductHero
                    product={product}
                    relatedProducts={relatedProducts}
                    breadcrumbItems={breadcrumbItems}
                    activeBreadcrumb={activeBreadcrumb}
                    onBreadcrumbClick={handleBreadcrumbClick}
                />
            </AvoidSidebar>

            {/* Mobile section selector (< md) */}
            <motion.div
                className="fixed left-0 right-0 top-[68px] border-b border-gray-800/50 bg-[#0c131d]/95 py-3 backdrop-blur-sm md:hidden sm:top-[76px]"
                style={{ zIndex: Z_INDEX.STICKY }}
                animate={{ opacity: showStickyNav ? 1 : 0, y: showStickyNav ? 0 : -8, pointerEvents: showStickyNav ? 'auto' : 'none' }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
            >
                <AvoidSidebar>
                    <div className="relative px-4">
                        <select
                            value={activeBreadcrumb}
                            onChange={(event) => {
                                const selectedItem = breadcrumbItems.find((item) => item.label === event.target.value);
                                if (selectedItem) handleBreadcrumbClick(selectedItem);
                            }}
                            className="w-full appearance-none rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-3 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                            aria-label={t('products.detail.selectSection')}
                        >
                            {breadcrumbItems.map((item) => (
                                <option key={item.label} value={item.label} className="bg-gray-800 text-white">
                                    {item.label}
                                </option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </AvoidSidebar>
            </motion.div>

            {/* Desktop section tab nav (md+) */}
            <motion.div
                className="fixed left-0 right-0 top-[76px] hidden border-b border-gray-800/50 bg-[#0c131d]/95 backdrop-blur-sm md:block"
                style={{ zIndex: Z_INDEX.STICKY }}
                animate={{ opacity: showStickyNav ? 1 : 0, y: showStickyNav ? 0 : -8, pointerEvents: showStickyNav ? 'auto' : 'none' }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
            >
                <AvoidSidebar>
                    <nav
                        className="flex items-center justify-center gap-1 px-4 py-2"
                        aria-label={t('products.detail.selectSection')}
                    >
                        {breadcrumbItems.map((item, index) => (
                            <div key={item.label} className="flex items-center">
                                <button
                                    type="button"
                                    onClick={() => handleBreadcrumbClick(item)}
                                    className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                                        activeBreadcrumb === item.label
                                            ? 'text-cyan-400'
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                >
                                    {item.label}
                                </button>
                                {index < breadcrumbItems.length - 1 && (
                                    <span className="text-gray-700 text-xs select-none">/</span>
                                )}
                            </div>
                        ))}
                    </nav>
                </AvoidSidebar>
            </motion.div>

            {/* Section content + related products */}
            <AvoidSidebar>
                <div className="relative z-30 -mt-[clamp(5rem,12vw,14rem)] bg-transparent">
                    <div id="product-details" className="overflow-hidden">
                        <AnimatePresence mode="wait">{renderSectionContent()}</AnimatePresence>
                    </div>
                    <div className="pt-2 md:pt-4">
                        <RelatedProducts products={relatedProducts} />
                    </div>
                </div>
            </AvoidSidebar>
        </div>
    );
}
