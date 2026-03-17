'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import Link from 'next/link';
import AvoidSidebar from '@/components/ui/AvoidSidebar';
import { useLanguage } from '@/context/LanguageContext';
import type { SimpleProduct } from '@/types/product';
import { useAnimationConfig } from '@/hooks/useReducedMotion';

interface FeaturedProductsCarouselProps {
    products?: SimpleProduct[];
    initialIndex?: number;
}

export default function FeaturedProductsCarousel({
    products = [],
    initialIndex = 0
}: FeaturedProductsCarouselProps) {
    const { t } = useLanguage();
    const { enableComplexAnimations, duration, ease } = useAnimationConfig();
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
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
        setCurrentIndex((prev) => (prev + 1) % products.length);
    }, [products.length]);

    const prevProduct = useCallback(() => {
        if (!products.length) return;
        setCurrentIndex((prev) => (prev - 1 + products.length) % products.length);
    }, [products.length]);

    const handleTouchEnd = () => {
        if (touchStart === null || touchEnd === null) return;
        const distance = touchStart - touchEnd;
        if (distance > 50) {
            nextProduct();
        } else if (distance < -50) {
            prevProduct();
        }
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (!products.length) return;
            // Only handle when no input/textarea/select is focused
            const tag = (document.activeElement?.tagName ?? '').toLowerCase();
            if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
            // Only handle when section is in viewport
            if (sectionRef.current) {
                const rect = sectionRef.current.getBoundingClientRect();
                const inViewport = rect.top < window.innerHeight && rect.bottom > 0;
                if (!inViewport) return;
            }
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                prevProduct();
            } else if (event.key === 'ArrowRight') {
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
                <section className="relative overflow-hidden bg-gradient-to-b from-[#013A5E] to-[#032B4A] py-16 md:py-24">
                    <div className="container relative z-10 mx-auto max-w-[1400px] px-4 text-center">
                        <h2 className="mb-4 text-[2rem] font-semibold text-[#E1F0FF]">
                            {t('products.featured.carouselTitle')}
                        </h2>
                        <p className="text-gray-300">{t('products.featured.empty')}</p>
                    </div>
                </section>
            </AvoidSidebar>
        );
    }

    const currentProduct = products[currentIndex];
    const transitionEase = enableComplexAnimations ? 'easeInOut' : ease;
    const transitionDuration = enableComplexAnimations ? 0.8 : duration;

    return (
        <AvoidSidebar>
            <section
                ref={sectionRef}
                className="relative overflow-hidden bg-gradient-to-b from-[#013A5E] to-[#032B4A] py-16 md:py-24 bg-grain"
                aria-labelledby="featured-carousel-heading"
            >
                {/* Subtle diagonal lines — suggest road / path / motion */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03]" aria-hidden="true">
                    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <pattern id="diagonal-lines" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
                                <line x1="0" y1="0" x2="0" y2="40" stroke="#4FC8FF" strokeWidth="1"/>
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#diagonal-lines)"/>
                    </svg>
                </div>
                <div className="container relative z-10 mx-auto max-w-[1400px] px-4">
                    <div className="mb-16 text-center">
                        {/* Cyan eyebrow — marks this as the curated/spotlight section */}
                        <span className="mb-4 inline-block rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-400">
                            {t('products.featured.product')}
                        </span>
                        <h2 id="featured-carousel-heading" className="text-[2rem] font-semibold text-[#E1F0FF]">
                            {t('products.featured.carouselTitle')}
                        </h2>
                    </div>

                    <div
                        className="relative overflow-hidden rounded-[32px] border border-white/10 bg-black/25 p-6 backdrop-blur"
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
                            className="absolute left-4 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/10 bg-black/30 p-3 text-white transition hover:border-cyan-300 hover:text-cyan-200"
                            aria-label={t('products.featured.prev')}
                        >
                            <ChevronLeftIcon className="h-5 w-5" />
                        </button>

                        <button
                            type="button"
                            onClick={nextProduct}
                            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/10 bg-black/30 p-3 text-white transition hover:border-cyan-300 hover:text-cyan-200"
                            aria-label={t('products.featured.next')}
                        >
                            <ChevronRightIcon className="h-5 w-5" />
                        </button>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentProduct.id}
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -18 }}
                                transition={{ duration: transitionDuration, ease: transitionEase }}
                                className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center"
                            >
                                <div className="relative mx-auto aspect-[4/3] w-full max-w-2xl overflow-hidden rounded-3xl bg-gradient-to-br from-white/10 to-white/5 p-6">
                                    {currentProduct.image ? (
                                        <Image
                                            src={currentProduct.image}
                                            alt={currentProduct.name}
                                            fill
                                            className="object-contain p-8"
                                            sizes="(max-width: 1024px) 100vw, 50vw"
                                            priority={currentIndex === 0}
                                        />
                                    ) : null}
                                </div>

                                <div className="text-center lg:text-left">
                                    <p className="mb-3 text-sm uppercase tracking-[0.3em] text-cyan-300">
                                        {t('products.featured.product')}
                                    </p>
                                    <h3 className="text-3xl font-black uppercase text-white sm:text-4xl lg:text-5xl">
                                        {currentProduct.name}
                                    </h3>
                                    <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-200 sm:text-lg">
                                        {currentProduct.shortDescription}
                                    </p>
                                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                                        <Link
                                            href={`/products/${currentProduct.id}`}
                                            className="rounded-full bg-cyan-400 px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-slate-950 transition hover:bg-cyan-300"
                                        >
                                            {t('products.featured.discoveryNow')}
                                        </Link>
                                        <span className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300">
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
