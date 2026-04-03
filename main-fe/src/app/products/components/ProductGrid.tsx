'use client';

import { memo, useCallback, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { FiArrowUpRight, FiHeadphones } from 'react-icons/fi';
import type { SimpleProduct } from '@/types/product';
import { useLanguage } from '@/context/LanguageContext';
import { useAnimationConfig } from '@/hooks/useReducedMotion';
import { buildProductPath } from '@/lib/slug';

interface ProductImageWithFallbackProps {
    src: string;
    alt: string;
    className?: string;
}

const ProductImageWithFallback = memo(function ProductImageWithFallback({
    src,
    alt,
    className
}: ProductImageWithFallbackProps) {
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    if (!src || imageError) {
        return (
            <div className={`${className} flex items-center justify-center`}>
                <FiHeadphones className="h-12 w-12 text-[var(--text-muted)]" />
            </div>
        );
    }

    return (
        <div className={`${className} relative`}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--brand-blue)] border-t-transparent" />
                </div>
            )}
            <Image
                src={src}
                alt={alt}
                width={220}
                height={220}
                sizes="(max-width: 1024px) 200px, 240px"
                className={`h-full w-full object-contain transition-opacity duration-200 ease-out ${isLoading ? 'opacity-0' : 'opacity-100'}`}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                    setImageError(true);
                    setIsLoading(false);
                }}
            />
        </div>
    );
});

interface ProductGridProps {
    products: SimpleProduct[];
}

export default function ProductGrid({ products }: ProductGridProps) {
    const { t } = useLanguage();
    const animationConfig = useAnimationConfig();

    const renderProductCard = useCallback(
        (product: SimpleProduct, index: number) => (
            <motion.article
                key={product.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{
                    duration: animationConfig.duration,
                    delay: animationConfig.enableComplexAnimations ? Math.min(index * animationConfig.stagger, 0.4) : 0,
                    ease: animationConfig.ease
                }}
                className="relative w-full"
            >
                <Link href={buildProductPath(product.id, product.name)} className="group block h-full">
                    <motion.div
                        className="brand-card flex h-full min-h-[360px] flex-col overflow-hidden rounded-[28px] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--brand-border-strong)] hover:shadow-[0_24px_44px_rgba(0,113,188,0.16)] sm:min-h-[390px] xl:min-h-[430px]"
                        whileHover={
                            animationConfig.enableComplexAnimations
                                ? { y: -5, transition: { duration: 0.22, ease: 'easeOut' } }
                                : undefined
                        }
                        whileTap={{ scale: 0.99 }}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <span className="brand-badge-muted text-[11px] font-semibold uppercase tracking-[0.18em]">
                                {t('products.featured.product')}
                            </span>
                            <FiArrowUpRight className="h-5 w-5 text-[var(--text-muted)] transition-colors duration-200 group-hover:text-[var(--brand-blue)]" />
                        </div>

                        <div className="relative mt-6 flex flex-1 items-center justify-center overflow-hidden rounded-[24px] border border-[var(--brand-border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-6">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(41,171,226,0.12),transparent_60%)] opacity-80" />
                            <ProductImageWithFallback
                                src={product.image || ''}
                                alt={product.name}
                                className="relative z-10 h-[180px] w-[180px] sm:h-[200px] sm:w-[200px] xl:h-[220px] xl:w-[220px]"
                            />
                        </div>

                        <div className="mt-5 flex flex-1 flex-col">
                            <h3 className="line-clamp-2 text-xl font-semibold leading-snug text-[var(--text-primary)] transition-colors duration-200 group-hover:text-[var(--brand-blue)]">
                                {product.name}
                            </h3>
                            <p className="mt-3 line-clamp-3 text-sm leading-7 text-[var(--text-secondary)] sm:text-base">
                                {product.description}
                            </p>
                        </div>
                    </motion.div>
                </Link>
            </motion.article>
        ),
        [animationConfig, t]
    );

    return (
        <div className="w-full overflow-visible">
            <motion.div
                className="relative mb-12 grid grid-cols-1 gap-5 overflow-visible sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                layout
                transition={{ duration: 0.45, ease: 'easeInOut' }}
            >
                <AnimatePresence mode="popLayout">
                    {products.map((product, index) => renderProductCard(product, index))}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
