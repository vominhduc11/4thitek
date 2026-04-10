'use client';

import { startTransition, useEffect, useMemo, useRef, useState } from 'react';
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
        descriptions?: Array<Record<string, unknown>>;
        image: string;
        videos: Array<Record<string, unknown>>;
        specifications: unknown;
        price?: number;
        tags?: string[];
    };
    initialRelatedProducts: Array<{
        id: string | number;
        name: string;
        shortDescription: string;
        image: string;
    }>;
}

type SectionKey = 'details' | 'videos' | 'specifications' | 'warranty';

interface BreadcrumbItem {
    label: string;
    section: SectionKey;
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

export default function ProductPageClient({ initialProductData, initialRelatedProducts }: ProductPageClientProps) {
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
    ) satisfies BreadcrumbItem[];

    const [currentSection, setCurrentSection] = useState<SectionKey>('details');
    const [showStickyNav, setShowStickyNav] = useState(false);
    const [headerHeight, setHeaderHeight] = useState(76);
    const mobileNavRef = useRef<HTMLDivElement>(null);
    const desktopNavRef = useRef<HTMLDivElement>(null);
    const activeBreadcrumb = breadcrumbItems.find((item) => item.section === currentSection)?.label || breadcrumbItems[0]?.label || '';

    useEffect(() => {
        document.body.classList.add('product-detail-body');

        const header = document.querySelector('header');
        if (!header) {
            setHeaderHeight(76);
            return () => {
                document.body.classList.remove('product-detail-body');
            };
        }

        const updateHeaderHeight = () => {
            const nextHeight = Math.ceil(header.getBoundingClientRect().height);
            if (nextHeight > 0) {
                setHeaderHeight(nextHeight);
            }
        };

        updateHeaderHeight();
        window.addEventListener('resize', updateHeaderHeight);

        const resizeObserver = new ResizeObserver(() => updateHeaderHeight());
        resizeObserver.observe(header);

        return () => {
            document.body.classList.remove('product-detail-body');
            window.removeEventListener('resize', updateHeaderHeight);
            resizeObserver.disconnect();
        };
    }, []);

    useEffect(() => {
        const el = document.getElementById('hero-nav-sentinel');
        if (!el) {
            setShowStickyNav(false);
            return;
        }

        const updateStickyNav = () => {
            const shouldShow = el.getBoundingClientRect().top <= headerHeight + 12;
            setShowStickyNav((previous) => (previous === shouldShow ? previous : shouldShow));
        };

        updateStickyNav();
        window.addEventListener('scroll', updateStickyNav, { passive: true });
        window.addEventListener('resize', updateStickyNav);

        return () => {
            window.removeEventListener('scroll', updateStickyNav);
            window.removeEventListener('resize', updateStickyNav);
        };
    }, [headerHeight]);

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
                                          {
                                              label: t('products.specifications.labels.driver'),
                                              value: product.specifications?.driver || ''
                                          },
                                          {
                                              label: t('products.specifications.labels.frequencyResponse'),
                                              value: product.specifications?.frequencyResponse || ''
                                          },
                                          {
                                              label: t('products.specifications.labels.impedance'),
                                              value: product.specifications?.impedance || ''
                                          },
                                          {
                                              label: t('products.specifications.labels.sensitivity'),
                                              value: product.specifications?.sensitivity || ''
                                          },
                                          {
                                              label: t('products.specifications.labels.maxPower'),
                                              value: product.specifications?.maxPower || ''
                                          },
                                          {
                                              label: t('products.specifications.labels.cable'),
                                              value: product.specifications?.cable || ''
                                          },
                                          {
                                              label: t('products.specifications.labels.weight'),
                                              value: product.specifications?.weight || ''
                                          },
                                          {
                                              label: t('products.specifications.labels.dimensions'),
                                              value: product.specifications?.dimensions || ''
                                          },
                                          {
                                              label: t('products.specifications.labels.connector'),
                                              value: product.specifications?.connector || ''
                                          }
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
                        <ProductDetails
                            description={product.longDescription || product.description || ''}
                            descriptions={descriptions}
                        />
                    </motion.div>
                );
        }
    };

    const handleBreadcrumbClick = (item: BreadcrumbItem) => {
        if (currentSection !== item.section) {
            startTransition(() => {
                setCurrentSection(item.section);
            });
        }

        requestAnimationFrame(() => {
            const el = document.getElementById('product-section-anchor');
            if (!el) return;
            const stickyNavHeight =
                window.innerWidth < 768
                    ? mobileNavRef.current?.getBoundingClientRect().height ?? 0
                    : desktopNavRef.current?.getBoundingClientRect().height ?? 0;
            const navOffset = showStickyNav ? headerHeight + stickyNavHeight : headerHeight;
            const top = el.getBoundingClientRect().top + window.scrollY - navOffset;
            window.scrollTo({ top, behavior: 'smooth' });
        });
    };

    const renderMobileSectionNav = () => (
        <nav
            className="scrollbar-none flex items-center gap-2 overflow-x-auto px-4 py-3"
            aria-label={t('products.detail.selectSection')}
        >
            {breadcrumbItems.map((item) => {
                const isActive = currentSection === item.section;
                return (
                    <button
                        key={item.section}
                        type="button"
                        onClick={() => handleBreadcrumbClick(item)}
                        className={`shrink-0 rounded-full border px-4 py-2.5 text-[13px] font-semibold tracking-[0.04em] transition-all duration-200 ${
                            isActive
                                ? 'border-[var(--brand-border-strong)] bg-[rgba(41,171,226,0.14)] text-white shadow-[0_10px_20px_rgba(0,113,188,0.16)]'
                                : 'border-[rgba(255,255,255,0.08)] bg-[rgba(7,17,27,0.72)] text-[var(--text-secondary)] hover:border-[var(--brand-border-strong)] hover:text-white'
                        }`}
                    >
                        {item.label}
                    </button>
                );
            })}
        </nav>
    );

    return (
        <div className="brand-section min-h-screen text-white flex flex-col">
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

            {/* Mobile section nav (< md) */}
            <motion.div
                ref={mobileNavRef}
                className={`fixed left-0 right-0 border-b border-[var(--brand-border)] bg-[rgba(6,17,27,0.95)] shadow-[0_14px_26px_rgba(1,8,15,0.28)] backdrop-blur-sm md:hidden ${
                    showStickyNav ? 'visible' : 'invisible'
                }`}
                style={{ zIndex: Z_INDEX.STICKY, top: headerHeight }}
                aria-hidden={!showStickyNav}
                animate={{
                    opacity: showStickyNav ? 1 : 0,
                    y: showStickyNav ? 0 : -8,
                    pointerEvents: showStickyNav ? 'auto' : 'none'
                }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
            >
                <AvoidSidebar>
                    {renderMobileSectionNav()}
                </AvoidSidebar>
            </motion.div>

            {/* Desktop section tab nav (md+) */}
            <motion.div
                ref={desktopNavRef}
                className={`fixed left-0 right-0 hidden border-b border-[var(--brand-border)] bg-[rgba(6,17,27,0.95)] shadow-[0_14px_26px_rgba(1,8,15,0.24)] backdrop-blur-sm md:block ${
                    showStickyNav ? 'visible' : 'invisible'
                }`}
                style={{ zIndex: Z_INDEX.STICKY, top: headerHeight }}
                aria-hidden={!showStickyNav}
                animate={{
                    opacity: showStickyNav ? 1 : 0,
                    y: showStickyNav ? 0 : -8,
                    pointerEvents: showStickyNav ? 'auto' : 'none'
                }}
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
                                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors duration-200 ${
                                        activeBreadcrumb === item.label
                                            ? 'bg-[rgba(41,171,226,0.12)] text-[var(--brand-blue)]'
                                            : 'text-[var(--text-secondary)] hover:text-white'
                                    }`}
                                >
                                    {item.label}
                                </button>
                                {index < breadcrumbItems.length - 1 && (
                                    <span className="text-[var(--text-muted)] text-xs select-none">/</span>
                                )}
                            </div>
                        ))}
                    </nav>
                </AvoidSidebar>
            </motion.div>

            {/* Section content + related products */}
            <AvoidSidebar>
                <div className="relative z-30 -mt-20 md:-mt-24 lg:-mt-32 xl:-mt-40 2xl:-mt-44 3xl:-mt-52 bg-transparent">
                    <div className="pointer-events-none absolute inset-x-0 -top-40 bottom-0 z-0 xs:-top-44 sm:-top-48 md:-top-56 lg:-top-64">
                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,17,27,0)_0px,rgba(6,17,27,0.28)_84px,rgba(6,17,27,0.72)_168px,rgba(7,17,27,0.94)_260px,rgba(8,18,30,0.985)_360px,rgba(8,18,30,0.985)_100%)]" />
                        <div className="absolute inset-x-[-6%] top-8 h-32 bg-[radial-gradient(ellipse_at_center,rgba(41,171,226,0.12)_0%,rgba(22,50,71,0.18)_38%,rgba(8,18,30,0)_78%)] blur-[64px] md:top-10 md:h-40 lg:h-48" />
                    </div>

                    <div id="product-section-anchor" className="relative z-10 overflow-hidden pt-4 md:pt-6 lg:pt-8">
                        <AnimatePresence mode="wait">{renderSectionContent()}</AnimatePresence>
                    </div>
                    <div className="relative z-10 pt-2 md:pt-4">
                        <RelatedProducts products={relatedProducts} />
                    </div>
                </div>
            </AvoidSidebar>
        </div>
    );
}
