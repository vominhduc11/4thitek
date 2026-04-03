'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiArrowUpRight, FiHeadphones } from 'react-icons/fi';
import { useLanguage } from '@/context/LanguageContext';
import { buildProductPath } from '@/lib/slug';
import type { Product } from '@/types/product';

interface RelatedProductsProps {
    products: Product[];
}

export default function RelatedProducts({ products }: RelatedProductsProps) {
    const { t } = useLanguage();

    return (
        <section className="relative py-12 md:py-16">
            <div className="brand-shell">
                <div className="mb-10 text-center">
                    <span className="brand-badge mb-4">{t('products.detail.relatedProducts')}</span>
                    <h2 className="font-serif text-2xl font-semibold text-[var(--text-primary)] md:text-3xl xl:text-4xl">
                        {t('products.detail.relatedProducts')}
                    </h2>
                </div>

                {products.length === 0 ? (
                    <div className="brand-card-muted rounded-[28px] p-6 text-center">
                        <p className="text-sm text-[var(--text-secondary)] sm:text-base">
                            {t('products.detail.noRelatedProducts')}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {products.map((product, index) => (
                            <motion.article
                                key={product.id}
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.45, delay: Math.min(index * 0.08, 0.32), ease: 'easeOut' }}
                            >
                                <Link href={buildProductPath(product.id, product.name)} className="group block h-full">
                                    <div className="brand-card flex h-full min-h-[360px] flex-col rounded-[28px] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--brand-border-strong)] hover:shadow-[0_24px_44px_rgba(0,113,188,0.16)]">
                                        <div className="flex items-start justify-between gap-3">
                                            <span className="brand-badge-muted text-[11px] font-semibold uppercase tracking-[0.18em]">
                                                {t('products.featured.product')}
                                            </span>
                                            <FiArrowUpRight className="h-5 w-5 text-[var(--text-muted)] transition-colors duration-200 group-hover:text-[var(--brand-blue)]" />
                                        </div>

                                        <div className="relative mt-6 flex flex-1 items-center justify-center overflow-hidden rounded-[24px] border border-[var(--brand-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-6">
                                            {product.images?.[0]?.url ? (
                                                <Image
                                                    src={product.images[0].url}
                                                    alt={product.name}
                                                    width={220}
                                                    height={220}
                                                    sizes="(max-width: 640px) 180px, 220px"
                                                    className="h-[190px] w-[190px] object-contain"
                                                />
                                            ) : (
                                                <FiHeadphones className="h-16 w-16 text-[var(--text-muted)]" />
                                            )}
                                        </div>

                                        <div className="mt-5 flex flex-1 flex-col">
                                            <h3 className="line-clamp-2 text-xl font-semibold text-[var(--text-primary)] transition-colors duration-200 group-hover:text-[var(--brand-blue)]">
                                                {product.name}
                                            </h3>
                                            <p className="mt-3 line-clamp-3 text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
                                                {product.description}
                                            </p>
                                        </div>
                                    </div>
                                </Link>
                            </motion.article>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
