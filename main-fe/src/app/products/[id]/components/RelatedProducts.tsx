'use client';

import { motion } from 'framer-motion';
import { FiArrowUpRight, FiHeadphones } from 'react-icons/fi';
import Link from 'next/link';
import Image from 'next/image';
import { useLanguage } from '@/context/LanguageContext';
import { buildProductPath } from '@/lib/slug';
import type { Product } from '@/types/product';

interface RelatedProductsProps {
    products: Product[];
}

export default function RelatedProducts({ products }: RelatedProductsProps) {
    const { t } = useLanguage();

    return (
        <section className="bg-[#0c131d] py-12 md:py-16">
            <div className="mx-auto max-w-[1800px] px-4">
                <h2 className="mb-10 text-center text-xl font-bold text-white md:text-2xl lg:text-3xl xl:text-4xl">
                    {t('products.detail.relatedProducts')}
                </h2>

                {products.length === 0 ? (
                    <div className="rounded-2xl border border-gray-700/50 bg-gray-900/50 p-6 text-center">
                        <p className="text-sm text-gray-400 sm:text-base">{t('products.detail.noRelatedProducts')}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-px sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                        {products.map((product, index) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: Math.min(index * 0.1, 0.5), ease: 'easeOut' }}
                                className="relative w-full"
                            >
                                <Link href={buildProductPath(product.id, product.name)}>
                                    <div className="group relative grid h-[380px] cursor-pointer grid-rows-[auto_1fr_auto] overflow-hidden border border-gray-700/30 bg-gradient-to-b from-gray-900/40 to-gray-800/60 shadow-lg backdrop-blur-sm transition-colors duration-300 hover:border-[#4FC8FF]/40 hover:from-gray-800/60 hover:to-gray-700/70 sm:h-[420px] md:h-[460px] xl:h-[500px] 2xl:h-[560px]">
                                        {/* Vertical label */}
                                        <div className="absolute left-3 top-3 z-20 sm:left-4 sm:top-4">
                                            <div
                                                className="text-xs font-bold uppercase tracking-widest text-gray-400 transition-colors duration-300 group-hover:text-[#4FC8FF] sm:text-sm"
                                                style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                                            >
                                                {t('products.featured.product')}
                                            </div>
                                        </div>

                                        {/* Product image */}
                                        <div className="relative z-10 flex items-center justify-center px-5 py-5 md:px-6 md:py-6">
                                            {product.images?.[0]?.url ? (
                                                <Image
                                                    src={product.images[0].url}
                                                    alt={product.name}
                                                    width={200}
                                                    height={200}
                                                    sizes="(max-width: 640px) 140px, (max-width: 1024px) 180px, 220px"
                                                    className="h-[140px] w-[140px] object-contain transition-opacity duration-200 sm:h-[160px] sm:w-[160px] md:h-[180px] md:w-[180px] lg:h-[200px] lg:w-[200px] xl:h-[220px] xl:w-[220px] 2xl:h-[260px] 2xl:w-[260px]"
                                                />
                                            ) : (
                                                <FiHeadphones className="h-16 w-16 text-slate-600 lg:h-20 lg:w-20" />
                                            )}
                                        </div>

                                        {/* Text content */}
                                        <div className="relative z-10 flex h-full flex-col px-5 pb-6 pt-2 md:px-6 md:pb-8">
                                            <h3 className="mb-2 flex min-h-[2.5rem] items-center text-base font-bold text-white transition-colors duration-300 group-hover:text-[#4FC8FF] sm:min-h-[3rem] sm:text-lg md:text-xl xl:text-2xl">
                                                <span className="line-clamp-2">{product.name}</span>
                                            </h3>
                                            <p className="line-clamp-2 text-xs leading-relaxed text-gray-300 sm:text-sm xl:text-base">
                                                {product.description}
                                            </p>
                                            <div className="mt-auto flex justify-end pt-2 sm:pt-3">
                                                <div className="rounded-full p-2 transition-colors group-hover:bg-white/10 sm:p-3">
                                                    <FiArrowUpRight className="h-4 w-4 text-gray-500 transition-colors duration-300 group-hover:text-cyan-400 sm:h-5 sm:w-5" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Hover glow */}
                                        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-[radial-gradient(circle_at_center,_rgba(79,200,255,0.08),_transparent_65%)]" />
                                        <div className="pointer-events-none absolute inset-0 border-2 border-transparent transition-colors duration-300 group-hover:border-[#4FC8FF]/40" />
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
