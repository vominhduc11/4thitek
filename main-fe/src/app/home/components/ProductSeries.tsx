'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiArrowRight, FiHeadphones } from 'react-icons/fi';
import AvoidSidebar from '@/components/ui/AvoidSidebar';
import { useLanguage } from '@/context/LanguageContext';
import { buildProductPath } from '@/lib/slug';
import type { HomeSectionHeaderContent } from '@/types/content';
import type { SimpleProduct } from '@/types/product';

interface ProductSeriesProps {
    initialProducts?: SimpleProduct[];
    content?: HomeSectionHeaderContent | null;
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

export default function ProductSeries({ initialProducts = [], content = null }: ProductSeriesProps) {
    const { t } = useLanguage();
    const skuFallback = t('brand.logoAlt');
    const eyebrow = content?.eyebrow?.trim() || t('products.showcase.viewAll');
    const title = content?.title?.trim() || t('products.showcase.titlePrimary');
    const titleHighlight = content?.titleHighlight?.trim() || t('products.showcase.titleHighlight');
    const sectionDescription = content?.description?.trim() || t('products.showcase.description');
    const ctaLabel = content?.ctaLabel?.trim() || t('products.list.allProducts');
    const ctaHref = content?.ctaHref?.trim() || '/products';

    return (
        <AvoidSidebar>
            <section className="brand-section py-16 lg:py-24" aria-labelledby="product-series-heading">
                <div className="absolute inset-0 bg-dot-grid opacity-25" />
                <div className="absolute -left-24 top-0 h-[420px] w-[420px] rounded-full bg-[rgba(41,171,226,0.1)] blur-[120px]" />

                <div className="brand-shell relative z-10">
                    <motion.div
                        className="mx-auto mb-12 max-w-5xl min-[480px]:mb-14"
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55 }}
                        viewport={{ once: true }}
                    >
                        <div className="flex flex-col gap-6 text-center lg:flex-row lg:items-end lg:justify-between lg:text-left">
                            <div className="max-w-4xl">
                                <span className="brand-badge mb-5">{eyebrow}</span>
                                <h2
                                    id="product-series-heading"
                                    className="scroll-mt-24 font-serif text-4xl font-semibold text-[var(--text-primary)] min-[480px]:scroll-mt-28 sm:text-5xl lg:scroll-mt-32 lg:text-6xl"
                                >
                                    {title}{' '}
                                    <span className="brand-gradient-text">{titleHighlight}</span>
                                </h2>
                                <p className="mx-auto mt-5 max-w-[34rem] text-base leading-7 text-[var(--text-secondary)] min-[480px]:mt-6 min-[480px]:text-[1.0625rem] min-[480px]:leading-8 sm:max-w-3xl sm:text-lg lg:mx-0">
                                    {sectionDescription}
                                </p>
                            </div>

                            <Link
                                href={ctaHref}
                                className="brand-button-secondary inline-flex items-center justify-center gap-2 self-center rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-[var(--text-primary)] transition duration-200 hover:border-[var(--brand-blue)] hover:bg-[rgba(41,171,226,0.12)] lg:self-auto"
                            >
                                {ctaLabel}
                                <FiArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </motion.div>

                    {initialProducts.length === 0 ? (
                        <div className="brand-card-muted mx-auto max-w-3xl rounded-[30px] px-6 py-12 text-center">
                            <p className="text-lg font-semibold text-[var(--text-primary)]">{t('products.filter.noResults')}</p>
                            <p className="mt-3 text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
                                {t('products.filter.noResultsHint')}
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                            {initialProducts.map((product, index) => {
                                const productPath = buildProductPath(product.id, product.name);
                                const description =
                                    createResponsiveSummary(product.shortDescription ?? '', 132) ||
                                    sectionDescription;

                                return (
                                    <motion.article
                                        key={product.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, amount: 0.25 }}
                                        transition={{ duration: 0.42, delay: index * 0.05 }}
                                    >
                                        <Link
                                            href={productPath}
                                            className="brand-card group flex h-full flex-col overflow-hidden rounded-[30px] p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[var(--brand-border-strong)] hover:shadow-[0_24px_44px_rgba(0,113,188,0.16)]"
                                            aria-label={`${t('products.showcase.viewDetails')}: ${product.name}`}
                                        >
                                            <div className="relative aspect-[4/3] overflow-hidden rounded-[24px] border border-[var(--brand-border)] bg-[rgba(7,17,27,0.72)]">
                                                {product.image ? (
                                                    <Image
                                                        src={product.image}
                                                        alt={product.name}
                                                        fill
                                                        className="object-contain p-6 transition duration-300 group-hover:scale-[1.02]"
                                                        sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
                                                        loading={index < 3 ? 'eager' : 'lazy'}
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-[var(--text-muted)]">
                                                        <FiHeadphones className="h-12 w-12" />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,17,27,0.02),rgba(6,17,27,0.16))]" />
                                            </div>

                                            <div className="mt-5 flex flex-1 flex-col">
                                                <div className="flex items-center justify-between gap-3">
                                                    <span className="brand-badge-muted rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)]">
                                                        {product.sku || skuFallback}
                                                    </span>
                                                    <span className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                                                        {t('products.showcase.viewDetails')}
                                                    </span>
                                                </div>

                                                <h3 className="mt-4 text-2xl font-semibold leading-tight text-[var(--text-primary)]">
                                                    {product.name}
                                                </h3>
                                                <p className="mt-3 flex-1 text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
                                                    {description}
                                                </p>

                                                <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-blue)]">
                                                    {t('products.showcase.viewDetails')}
                                                    <FiArrowRight className="h-4 w-4" />
                                                </span>
                                            </div>
                                        </Link>
                                    </motion.article>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>
        </AvoidSidebar>
    );
}
