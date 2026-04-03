'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import AvoidSidebar from '@/components/ui/AvoidSidebar';
import { useLanguage } from '@/context/LanguageContext';
import { useAnimationConfig } from '@/hooks/useReducedMotion';
import { buildProductPath } from '@/lib/slug';
import type { SimpleProduct } from '@/types/product';

interface FeaturedProductsCarouselProps {
    products?: SimpleProduct[];
    initialIndex?: number;
}

export default function FeaturedProductsCarousel({ products = [], initialIndex = 0 }: FeaturedProductsCarouselProps) {
    const { t } = useLanguage();
    const { enableComplexAnimations, duration, ease } = useAnimationConfig();
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [direction, setDirection] = useState(1);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (!products.length) return;
        if (currentIndex >= products.length) {
            setCurrentIndex(0);
        }
    }, [products.length, currentIndex]);

    const nextProduct = useCallback(() => {
        if (!products.length) return;
        setDirection(1);
        setCurrentIndex((previous) => (previous + 1) % products.length);
    }, [products.length]);

    const prevProduct = useCallback(() => {
        if (!products.length) return;
        setDirection(-1);
        setCurrentIndex((previous) => (previous - 1 + products.length) % products.length);
    }, [products.length]);

    const handleTouchEnd = () => {
        if (touchStart === null || touchEnd === null) return;
        const distance = touchStart - touchEnd;
        if (distance > 50) nextProduct();
        if (distance < -50) prevProduct();
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!products.length) return;
            const tag = (document.activeElement?.tagName ?? '').toLowerCase();
            if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
            if (sectionRef.current) {
                const rect = sectionRef.current.getBoundingClientRect();
                const inViewport = rect.top < window.innerHeight && rect.bottom > 0;
                if (!inViewport) return;
            }

            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                prevProduct();
            }

            if (event.key === 'ArrowRight') {
                event.preventDefault();
                nextProduct();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nextProduct, prevProduct, products.length]);

    if (!products.length) {
        return (
            <AvoidSidebar>
                <section className="brand-section-blue py-16 md:py-24">
                    <div className="brand-shell relative z-10 text-center sm:ml-16 md:ml-20">
                        <h2 className="font-serif text-[2rem] font-semibold text-[var(--text-primary)]">
                            {t('products.featured.carouselTitle')}
                        </h2>
                        <p className="mt-4 text-[var(--text-secondary)]">{t('products.featured.empty')}</p>
                    </div>
                </section>
            </AvoidSidebar>
        );
    }

    const currentProduct = products[currentIndex];
    const transitionEase = enableComplexAnimations ? 'easeInOut' : ease;
    const transitionDuration = enableComplexAnimations ? 0.7 : duration;
    const navButtonClass =
        'absolute top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--brand-border)] bg-[rgba(7,17,27,0.7)] text-[var(--text-primary)] transition-all duration-200 hover:border-[var(--brand-border-strong)] hover:bg-[rgba(41,171,226,0.16)]';

    return (
        <AvoidSidebar>
            <section
                ref={sectionRef}
                className="brand-section-blue py-16 md:py-24"
                aria-labelledby="featured-carousel-heading"
            >
                <div className="absolute inset-0 bg-topo opacity-30" />
                <div className="pointer-events-none absolute inset-0 opacity-[0.08]" aria-hidden="true">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern
                                id="diagonal-lines-brand"
                                x="0"
                                y="0"
                                width="48"
                                height="48"
                                patternUnits="userSpaceOnUse"
                                patternTransform="rotate(35)"
                            >
                                <line x1="0" y1="0" x2="0" y2="48" stroke="#29ABE2" strokeWidth="1" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#diagonal-lines-brand)" />
                    </svg>
                </div>

                <div className="brand-shell relative z-10 sm:ml-16 md:ml-20">
                    <div className="mb-12 text-center">
                        <span className="brand-badge mb-4">{t('products.featured.product')}</span>
                        <h2
                            id="featured-carousel-heading"
                            className="font-serif text-[2rem] font-semibold text-[var(--text-primary)] sm:text-[2.5rem]"
                        >
                            {t('products.featured.carouselTitle')}
                        </h2>
                    </div>

                    <div
                        className="brand-card group relative overflow-hidden rounded-[34px] p-6 sm:p-8"
                        onTouchStart={(event) => {
                            setTouchEnd(null);
                            setTouchStart(event.targetTouches[0].clientX);
                        }}
                        onTouchMove={(event) => setTouchEnd(event.targetTouches[0].clientX)}
                        onTouchEnd={handleTouchEnd}
                    >
                        <button
                            type="button"
                            onClick={prevProduct}
                            className={`${navButtonClass} left-4`}
                            aria-label={t('products.featured.prev')}
                        >
                            <ChevronLeftIcon className="h-5 w-5" />
                        </button>

                        <button
                            type="button"
                            onClick={nextProduct}
                            className={`${navButtonClass} right-4`}
                            aria-label={t('products.featured.next')}
                        >
                            <ChevronRightIcon className="h-5 w-5" />
                        </button>

                        <AnimatePresence mode="wait" custom={direction}>
                            <motion.div
                                key={currentProduct.id}
                                custom={direction}
                                initial={{ opacity: 0, x: direction * 80 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: direction * -80 }}
                                transition={{ duration: transitionDuration, ease: transitionEase }}
                                className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center"
                            >
                                <div className="brand-card-muted relative mx-auto aspect-[4/3] w-full max-w-2xl overflow-hidden rounded-[30px] p-6">
                                    {currentProduct.image ? (
                                        <Image
                                            src={currentProduct.image}
                                            alt={currentProduct.name}
                                            fill
                                            className="object-contain p-8 transition-transform duration-700 group-hover:scale-105"
                                            sizes="(max-width: 1024px) 100vw, 50vw"
                                            priority={currentIndex === 0}
                                        />
                                    ) : null}
                                </div>

                                <div className="flex flex-col justify-center text-center lg:min-h-[360px] lg:text-left">
                                    <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-[var(--brand-blue)]">
                                        {t('products.featured.product')}
                                    </p>
                                    <h3 className="font-serif text-3xl font-semibold text-[var(--text-primary)] sm:text-4xl lg:text-5xl">
                                        {currentProduct.name}
                                    </h3>
                                    <p className="mt-5 max-w-xl text-base leading-8 text-[var(--text-secondary)] sm:text-lg">
                                        {currentProduct.shortDescription}
                                    </p>
                                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                                        <Link
                                            href={buildProductPath(currentProduct.id, currentProduct.name)}
                                            className="brand-button-primary rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-primary)] transition hover:-translate-y-0.5 hover:brightness-105"
                                        >
                                            {t('products.featured.discoveryNow')}
                                        </Link>
                                        <span className="brand-badge-muted">
                                            {currentIndex + 1} / {products.length}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </section>
        </AvoidSidebar>
    );
}
