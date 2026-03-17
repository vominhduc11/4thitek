'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiArrowRight, FiHeadphones } from 'react-icons/fi';
import Image from 'next/image';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import type { SimpleProduct } from '@/types/product';
import AvoidSidebar from '@/components/ui/AvoidSidebar';

interface ProductSeriesProps {
    initialProducts?: SimpleProduct[];
}

export default function ProductSeries({ initialProducts = [] }: ProductSeriesProps) {
    const { t } = useLanguage();
    const [selectedProduct, setSelectedProduct] = useState<SimpleProduct | null>(initialProducts[0] ?? null);

    return (
        <AvoidSidebar>
            <section className="bg-[#0c131d] text-white py-16 lg:py-24 relative overflow-hidden bg-grain" aria-labelledby="product-series-heading">
                {/* Dot-grid background — precision / technical network identity */}
                <div className="absolute inset-0 bg-dot-grid opacity-40 pointer-events-none" />
                {/* Directional spotlight from top-left — single light source, not duplicated */}
                <div className="absolute -top-32 -left-32 w-[600px] h-[600px] bg-[#4FC8FF]/6 rounded-full blur-[100px] pointer-events-none" />

                <div className="px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 relative z-10">
                    <div className="max-w-7xl mx-auto">
                        <motion.div
                            className="text-center mb-16"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                        >
                            {/* Amber eyebrow — distinguishes this "browse all" section from the featured carousel */}
                            <span className="mb-5 inline-block rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">
                                {t('products.showcase.viewAll')}
                            </span>
                            <h2 id="product-series-heading" className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                                {t('products.showcase.titlePrimary')}{' '}
                                <span className="bg-gradient-to-r from-[#4FC8FF] to-[#00D4FF] bg-clip-text text-transparent">
                                    {t('products.showcase.titleHighlight')}
                                </span>
                            </h2>
                            <div className="w-32 h-1 bg-gradient-to-r from-[#4FC8FF] to-[#00D4FF] mx-auto rounded-full mb-6" />
                            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                                {t('products.showcase.description')}
                            </p>
                        </motion.div>

                        {initialProducts.length === 0 ? (
                            <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-10 text-center text-sm text-gray-400">
                                {t('products.loadingMessage')}
                            </div>
                        ) : (
                            <>
                                <motion.div
                                    className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-16"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.2 }}
                                    viewport={{ once: true }}
                                >
                                    {initialProducts.map((product, index) => {
                                        const isSelected = selectedProduct?.id === product.id;
                                        return (
                                            <motion.button
                                                key={product.id}
                                                type="button"
                                                onClick={() => setSelectedProduct(product)}
                                                className={`relative p-4 rounded-xl border transition-all duration-300 overflow-hidden group ${isSelected ? 'border-[#4FC8FF] bg-[#4FC8FF]/10' : 'border-gray-600 hover:border-[#4FC8FF]/50'}`}
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.08 }}
                                                aria-pressed={isSelected}
                                            >
                                                <div className="aspect-square mb-3 flex items-center justify-center rounded-xl bg-white/5">
                                                    {product.image ? (
                                                        <Image
                                                            src={product.image}
                                                            alt={product.name}
                                                            width={80}
                                                            height={80}
                                                            className="object-contain opacity-80 group-hover:opacity-100 transition-opacity"
                                                        />
                                                    ) : (
                                                        <FiHeadphones className="h-10 w-10 text-gray-500" />
                                                    )}
                                                </div>
                                                <div className="text-center">
                                                    <p className={`text-xs font-medium mb-1 line-clamp-2 ${isSelected ? 'text-[#4FC8FF]' : 'text-gray-300 group-hover:text-white'}`}>
                                                        {product.name}
                                                    </p>
                                                    <p className="text-xs text-gray-400 line-clamp-1">{product.sku || '4ThiTek'}</p>
                                                </div>
                                            </motion.button>
                                        );
                                    })}
                                </motion.div>

                                <AnimatePresence mode="wait">
                                    {selectedProduct ? (
                                        <motion.div
                                            key={selectedProduct.id}
                                            initial={{ opacity: 0, y: 30 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -30 }}
                                            transition={{ duration: 0.5 }}
                                            className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center"
                                        >
                                            <div className="space-y-8">
                                                <div>
                                                    <h3 className="text-3xl sm:text-4xl font-bold mb-4 text-[#4FC8FF]">
                                                        {selectedProduct.name}
                                                    </h3>
                                                    <p className="text-lg text-gray-300 leading-relaxed mb-6">
                                                        {selectedProduct.shortDescription}
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap gap-4">
                                                    <Link
                                                        href={`/products/${selectedProduct.id}`}
                                                        className="inline-flex items-center gap-2 rounded-full bg-[#4FC8FF] px-6 py-3 font-semibold text-[#0c131d] transition hover:bg-[#38dfff]"
                                                    >
                                                        {t('products.showcase.viewDetails')}
                                                        <FiArrowRight className="h-4 w-4" />
                                                    </Link>
                                                </div>
                                            </div>

                                            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-8">
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
                                                        <div className="flex h-full w-full items-center justify-center rounded-3xl border border-dashed border-white/10 text-gray-500">
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
                </div>
            </section>
        </AvoidSidebar>
    );
}
