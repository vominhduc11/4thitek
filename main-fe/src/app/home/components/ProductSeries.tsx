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

export default function ProductSeries({ initialProducts = [] }: ProductSeriesProps) {
    const { t } = useLanguage();
    const [selectedProduct, setSelectedProduct] = useState<SimpleProduct | null>(initialProducts[0] ?? null);

    return (
        <AvoidSidebar>
            <section className="brand-section py-16 lg:py-24" aria-labelledby="product-series-heading">
                <div className="absolute inset-0 bg-dot-grid opacity-25" />
                <div className="absolute -left-24 top-0 h-[420px] w-[420px] rounded-full bg-[rgba(41,171,226,0.1)] blur-[120px]" />

                <div className="brand-shell relative z-10 sm:ml-16 md:ml-20">
                    <motion.div
                        className="mx-auto mb-14 max-w-4xl text-center"
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        viewport={{ once: true }}
                    >
                        <span className="brand-badge mb-5">{t('products.showcase.viewAll')}</span>
                        <h2
                            id="product-series-heading"
                            className="font-serif text-4xl font-semibold text-[var(--text-primary)] sm:text-5xl lg:text-6xl"
                        >
                            {t('products.showcase.titlePrimary')}{' '}
                            <span className="brand-gradient-text">{t('products.showcase.titleHighlight')}</span>
                        </h2>
                        <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-[var(--text-secondary)]">
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
                                className="mb-12 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
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
                                            className={`rounded-[24px] border p-4 text-left transition-all duration-300 ${
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
                                            <div className="flex aspect-square items-center justify-center rounded-[18px] border border-[var(--brand-border)] bg-[rgba(255,255,255,0.03)]">
                                                {product.image ? (
                                                    <Image
                                                        src={product.image}
                                                        alt={product.name}
                                                        width={84}
                                                        height={84}
                                                        className="object-contain"
                                                    />
                                                ) : (
                                                    <FiHeadphones className="h-10 w-10 text-[var(--text-muted)]" />
                                                )}
                                            </div>
                                            <div className="mt-3">
                                                <p
                                                    className={`line-clamp-2 text-sm font-semibold ${isSelected ? 'text-[var(--brand-blue)]' : 'text-[var(--text-primary)]'}`}
                                                >
                                                    {product.name}
                                                </p>
                                                <p className="mt-1 text-xs text-[var(--text-muted)]">
                                                    {product.sku || 'TK HiTek'}
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
                                        className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]"
                                    >
                                        <div className="space-y-6">
                                            <span className="brand-badge-muted">{t('products.featured.product')}</span>
                                            <h3 className="font-serif text-3xl font-semibold text-[var(--text-primary)] sm:text-4xl">
                                                {selectedProduct.name}
                                            </h3>
                                            <p className="text-base leading-8 text-[var(--text-secondary)] sm:text-lg">
                                                {selectedProduct.shortDescription}
                                            </p>
                                            <Link
                                                href={buildProductPath(selectedProduct.id, selectedProduct.name)}
                                                className="brand-button-primary inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--text-primary)] transition hover:-translate-y-0.5 hover:brightness-105"
                                            >
                                                {t('products.showcase.viewDetails')}
                                                <FiArrowRight className="h-4 w-4" />
                                            </Link>
                                        </div>

                                        <div className="brand-card-muted overflow-hidden rounded-[2rem] p-8">
                                            <div className="relative aspect-square">
                                                {selectedProduct.image ? (
                                                    <Image
                                                        src={selectedProduct.image}
                                                        alt={selectedProduct.name}
                                                        fill
                                                        className="object-contain"
                                                        sizes="(max-width: 1024px) 90vw, 45vw"
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
