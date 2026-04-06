'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { FiArrowRight, FiHeadphones } from 'react-icons/fi';
import AvoidSidebar from '@/components/ui/AvoidSidebar';
import { useLanguage } from '@/context/LanguageContext';
import { buildProductPath } from '@/lib/slug';
import type { SimpleProduct } from '@/types/product';

interface ProductSeriesProps {
    initialProducts?: SimpleProduct[];
}

function ensureTerminalPunctuation(value: string) {
    return /[.!?]$/.test(value) ? value : `${value}.`;
}

function trimAtWordBoundary(value: string, maxLength: number) {
    if (value.length <= maxLength) {
        return ensureTerminalPunctuation(value);
    }

    const sliced = value.slice(0, maxLength).trim();
    const boundaryIndex = sliced.lastIndexOf(' ');
    const safeSlice = boundaryIndex > Math.floor(maxLength * 0.6) ? sliced.slice(0, boundaryIndex) : sliced;

    return `${safeSlice.trim()}...`;
}

function createResponsiveSummary(value: string, maxLength: number) {
    const normalized = value.replace(/\s+/g, ' ').trim();

    if (!normalized) {
        return '';
    }

    return trimAtWordBoundary(normalized, maxLength);
}

export default function ProductSeries({ initialProducts = [] }: ProductSeriesProps) {
    const { t } = useLanguage();
    const [selectedProduct, setSelectedProduct] = useState<SimpleProduct | null>(initialProducts[0] ?? null);
    const skuFallback = t('brand.logoAlt');
    const selectedDescription = selectedProduct?.shortDescription ?? '';
    const compactDescription = createResponsiveSummary(selectedDescription, 116);
    const narrowDescription = createResponsiveSummary(selectedDescription, 148);
    const tabletDescription = createResponsiveSummary(selectedDescription, 210);

    return (
        <AvoidSidebar>
            <section className="brand-section py-16 lg:py-24" aria-labelledby="product-series-heading">
                <div className="absolute inset-0 bg-dot-grid opacity-25" />
                <div className="absolute -left-24 top-0 h-[420px] w-[420px] rounded-full bg-[rgba(41,171,226,0.1)] blur-[120px]" />

                <div className="brand-shell relative z-10 lg:ml-20">
                    <motion.div
                        className="mx-auto mb-12 max-w-4xl text-center min-[480px]:mb-14"
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        <span className="brand-badge mb-5">{t('products.showcase.viewAll')}</span>
                        <h2
                            id="product-series-heading"
                            className="scroll-mt-24 font-serif text-4xl font-semibold text-[var(--text-primary)] min-[480px]:scroll-mt-28 sm:text-5xl lg:scroll-mt-32 lg:text-6xl"
                        >
                            {t('products.showcase.titlePrimary')}{' '}
                            <span className="brand-gradient-text">{t('products.showcase.titleHighlight')}</span>
                        </h2>
                        <p className="mx-auto mt-5 max-w-[34rem] text-base leading-7 text-[var(--text-secondary)] min-[480px]:mt-6 min-[480px]:text-[1.0625rem] min-[480px]:leading-8 sm:max-w-3xl sm:text-lg">
                            {t('products.showcase.description')}
                        </p>
                    </motion.div>

                    {initialProducts.length === 0 ? (
                        <div className="brand-card-muted rounded-[30px] px-6 py-10 text-center text-sm text-[var(--text-secondary)]">
                            {t('products.loadingMessage')}
                        </div>
                    ) : (
                        <>
                            <motion.div
                                className="mb-10 grid grid-cols-2 gap-3 min-[480px]:grid-cols-3 sm:mb-12 md:grid-cols-4 lg:grid-cols-6"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                viewport={{ once: true }}
                            >
                                {initialProducts.map((product, index) => {
                                    const isSelected = selectedProduct?.id === product.id;
                                    return (
                                        <motion.button
                                            key={product.id}
                                            type="button"
                                            onClick={() => setSelectedProduct(product)}
                                            className={`rounded-[22px] border p-3 text-left transition-all duration-300 min-[480px]:p-3.5 sm:rounded-[24px] sm:p-4 ${
                                                isSelected
                                                    ? 'border-[var(--brand-border-strong)] bg-[rgba(41,171,226,0.12)] shadow-[0_16px_36px_rgba(0,113,188,0.16)]'
                                                    : 'border-[var(--brand-border)] bg-[rgba(7,17,27,0.62)] hover:border-[var(--brand-border-strong)] hover:bg-[rgba(41,171,226,0.08)]'
                                            }`}
                                            whileHover={{ y: -4 }}
                                            whileTap={{ scale: 0.98 }}
                                            initial={{ opacity: 0, y: 16 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            aria-pressed={isSelected}
                                        >
                                            <div className="flex aspect-square items-center justify-center rounded-[16px] border border-[var(--brand-border)] bg-[rgba(255,255,255,0.03)] sm:rounded-[18px]">
                                                {product.image ? (
                                                    <Image
                                                        src={product.image}
                                                        alt={product.name}
                                                        width={84}
                                                        height={84}
                                                        className="h-auto w-16 object-contain min-[480px]:w-[4.25rem] sm:w-[5.25rem]"
                                                    />
                                                ) : (
                                                    <FiHeadphones className="h-10 w-10 text-[var(--text-muted)]" />
                                                )}
                                            </div>
                                            <div className="mt-3">
                                                <p
                                                    className={`line-clamp-2 text-[13px] font-semibold min-[480px]:text-sm ${isSelected ? 'text-[var(--brand-blue)]' : 'text-[var(--text-primary)]'}`}
                                                >
                                                    {product.name}
                                                </p>
                                                <p className="mt-1 text-xs text-[var(--text-muted)]">
                                                    {product.sku || skuFallback}
                                                </p>
                                            </div>
                                        </motion.button>
                                    );
                                })}
                            </motion.div>

                            <AnimatePresence mode="wait">
                                {selectedProduct ? (
                                    <motion.div
                                        key={selectedProduct.id}
                                        initial={{ opacity: 0, y: 24, scale: 0.99 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -24, scale: 0.99 }}
                                        transition={{ duration: 0.35, ease: 'easeOut' }}
                                        className="grid items-center gap-8 min-[560px]:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:gap-10 lg:grid-cols-[0.95fr_1.05fr]"
                                    >
                                        <div className="space-y-5 lg:space-y-6">
                                            <span className="brand-badge-muted">{t('products.featured.product')}</span>
                                            <h3 className="font-serif text-3xl font-semibold text-[var(--text-primary)] sm:text-4xl">
                                                {selectedProduct.name}
                                            </h3>
                                            <p className="max-w-[34rem] text-sm leading-7 text-[var(--text-secondary)] min-[480px]:text-[15px] sm:text-base lg:text-lg lg:leading-8">
                                                <span className="inline min-[480px]:hidden">{compactDescription}</span>
                                                <span className="hidden min-[480px]:inline sm:hidden">{narrowDescription}</span>
                                                <span className="hidden sm:inline lg:hidden">{tabletDescription}</span>
                                                <span className="hidden lg:inline">{selectedDescription}</span>
                                            </p>
                                            <Link
                                                href={buildProductPath(selectedProduct.id, selectedProduct.name)}
                                                className="brand-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--text-primary)] transition hover:-translate-y-0.5 hover:brightness-105"
                                            >
                                                {t('products.showcase.viewDetails')}
                                                <FiArrowRight className="h-4 w-4" />
                                            </Link>
                                        </div>

                                        <div className="brand-card-muted overflow-hidden rounded-[2rem] p-6 min-[480px]:p-7 sm:p-8">
                                            <div className="relative aspect-square">
                                                {selectedProduct.image ? (
                                                    <Image
                                                        src={selectedProduct.image}
                                                        alt={selectedProduct.name}
                                                        fill
                                                        className="object-contain"
                                                        sizes="(max-width: 559px) 88vw, (max-width: 1023px) 52vw, 45vw"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center rounded-3xl border border-dashed border-[var(--brand-border)] text-[var(--text-muted)]">
                                                        <FiHeadphones className="h-12 w-12" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                ) : null}
                            </AnimatePresence>
                        </>
                    )}
                </div>
            </section>
        </AvoidSidebar>
    );
}
