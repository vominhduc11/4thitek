'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import Image from 'next/image';
import { Montserrat } from 'next/font/google';
import Link from 'next/link';
import AvoidSidebar from '@/components/layout/AvoidSidebar';
import { useLanguage } from '@/context/LanguageContext';
import type { SimpleProduct } from '@/types/product';
import { useAnimationConfig } from '@/hooks/useReducedMotion';

const montserrat = Montserrat({
    subsets: ['latin', 'vietnamese'],
    weight: ['700', '900'],
    display: 'swap'
});

interface FeaturedProductsCarouselProps {
    products?: SimpleProduct[];
    initialIndex?: number;
}

export default function FeaturedProductsCarousel({
    products: initialProducts = [],
    initialIndex = 0
}: FeaturedProductsCarouselProps) {
    const { t } = useLanguage();
    const { enableComplexAnimations, enableInfiniteAnimations, duration, ease } = useAnimationConfig();
    const [products] = useState(initialProducts);
    const [currentIndex, setCurrentIndex] = useState(initialIndex);
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

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
            <section className="relative overflow-hidden bg-gradient-to-b from-[#013A5E] to-[#032B4A] py-16 md:py-24">
                <div className="container relative z-10 mx-auto max-w-[1400px] px-4">
                    <div className="mb-16 text-center">
                        <h2 className="text-[2rem] font-semibold text-[#E1F0FF]">{t('products.featured.carouselTitle')}</h2>
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
                            aria-label={t('common.previous')}
                        >
                            <ChevronLeftIcon className="h-5 w-5" />
                        </button>

                        <button
                            type="button"
                            onClick={nextProduct}
                            className="absolute right-4 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/10 bg-black/30 p-3 text-white transition hover:border-cyan-300 hover:text-cyan-200"
                            aria-label={t('common.next')}
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
                                    <h3 className={`${montserrat.className} text-3xl font-black uppercase text-white sm:text-4xl lg:text-5xl`}>
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
                                        {enableInfiniteAnimations && (
                                            <span className="rounded-full border border-white/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300">
                                                {currentIndex + 1} / {products.length}
                                            </span>
                                        )}
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
