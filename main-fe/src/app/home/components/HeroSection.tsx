/*
 * Modified HeroSection component for 4thitek main-fe.
 *
 * This version addresses several issues identified in the UI/UX audit:
 *  - Removed interactive behaviours from semantic elements (heading and product image) to improve accessibility.
 *  - Consolidated the call‑to‑action hierarchy down to a primary and secondary button; removed tertiary links from the hero.
 *  - Removed the quick links grid from the hero to simplify the hero and allow trust links to live elsewhere (e.g. BrandValues section).
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { useAnimationConfig, useReducedMotion } from '@/hooks/useReducedMotion';
import { buildProductPath } from '@/lib/slug';
import type { HomeHeroContent } from '@/types/content';
import type { SimpleProduct } from '@/types/product';

const HERO_VIDEO = '/videos/hero-road-tech-loop.mp4';
const HERO_VIDEO_POSTER = '/logo-4t.png';
const HERO_SUMMARY_MAX_LENGTH = 136;

const ensureTerminalPunctuation = (value: string) => (/[.!?…]$/.test(value) ? value : `${value}.`);

const trimAtWordBoundary = (value: string, maxLength: number) => {
    if (value.length <= maxLength) {
        return value;
    }

    const truncated = value.slice(0, maxLength + 1);
    const punctuationCut = Math.max(truncated.lastIndexOf(', '), truncated.lastIndexOf('; '), truncated.lastIndexOf(': '));

    if (punctuationCut >= 80) {
        return ensureTerminalPunctuation(truncated.slice(0, punctuationCut).trim());
    }

    const lastSpace = truncated.lastIndexOf(' ');
    const safeCut = lastSpace > 0 ? lastSpace : maxLength;
    return `${truncated.slice(0, safeCut).trim()}...`;
};

const createHeroSummary = (value: string) => {
    const normalized = value.replace(/\s+/g, ' ').trim();
    if (!normalized) {
        return '';
    }

    const firstSentence = normalized.split(/(?<=[.!?])\s+/)[0]?.trim();
    if (firstSentence) {
        if (firstSentence.length <= HERO_SUMMARY_MAX_LENGTH) {
            return firstSentence;
        }

        const clauseBreaks = [
            firstSentence.indexOf(', '),
            firstSentence.indexOf('; '),
            firstSentence.indexOf(': ')
        ].filter((index) => index >= 0);
        const preferredBreak = clauseBreaks.find((index) => index >= 72 && index <= 120);

        if (preferredBreak !== undefined) {
            return ensureTerminalPunctuation(firstSentence.slice(0, preferredBreak).trim());
        }

        return trimAtWordBoundary(firstSentence, HERO_SUMMARY_MAX_LENGTH);
    }

    return trimAtWordBoundary(normalized, HERO_SUMMARY_MAX_LENGTH);
};

const makeVideoVariants = (animate: boolean): Variants => ({
    hidden: animate ? { scale: 1.02, opacity: 0 } : { opacity: 0 },
    visible: animate
        ? { scale: 1, opacity: 1, transition: { duration: 0.6, ease: 'easeOut' } }
        : { opacity: 1, transition: { duration: 0.4 } }
});

const makeTitleVariants = (animate: boolean): Variants => ({
    hidden: { y: animate ? -24 : 0, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: animate
            ? { duration: 0.55, delay: 0.12, ease: 'easeOut' }
            : { duration: 0.4 }
    }
});

const makeProductVariants = (animate: boolean): Variants => ({
    hidden: { scale: animate ? 0.9 : 1, opacity: 0, y: animate ? 24 : 0 },
    visible: {
        scale: 1,
        opacity: 1,
        y: 0,
        transition: animate
            ? { duration: 0.65, delay: 0.22, ease: 'easeOut' }
            : { duration: 0.4 }
    },
    hover: {
        scale: 1.02,
        y: -6,
        filter: 'brightness(1.03) drop-shadow(0 18px 28px rgba(0,113,188,0.2))',
        transition: { duration: 0.25, ease: 'easeOut' }
    }
});

const makeContentVariants = (animate: boolean): Variants => ({
    hidden: { y: animate ? 32 : 0, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, delay: animate ? 0.45 : 0 } }
});

const makeButtonVariants = (animate: boolean): Variants => ({
    hidden: { y: animate ? 12 : 0, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: animate ? { duration: 0.4, delay: 0.45, ease: 'easeOut' } : { duration: 0.3 }
    },
    hover: { scale: 1.01, boxShadow: '0 12px 24px rgba(0,113,188,0.24)', transition: { duration: 0.18 } },
    tap: { scale: 0.985 }
});

interface HeroSectionProps {
    initialProduct?: SimpleProduct | null;
    content?: HomeHeroContent | null;
}

export default function HeroSection({ initialProduct = null, content = null }: HeroSectionProps) {
    const { t } = useLanguage();
    const { enableDecorativeAnimations } = useAnimationConfig();
    const { shouldReduceAnimations } = useReducedMotion();
    const [isVideoReady, setIsVideoReady] = useState(false);
    const [videoFailed, setVideoFailed] = useState(false);
    const product = initialProduct;
    const displayName = product?.name || t('products.title');
    const displayImage = product?.image || '';

    const videoVariants = makeVideoVariants(enableDecorativeAnimations);
    const titleVariants = makeTitleVariants(enableDecorativeAnimations);
    const productVariants = makeProductVariants(enableDecorativeAnimations);
    const contentVariants = makeContentVariants(enableDecorativeAnimations);
    const buttonVariants = makeButtonVariants(enableDecorativeAnimations);
    const primaryTargetHref = product?.id
        ? buildProductPath(product.id, product.name)
        : content?.primaryCtaHref?.trim() || '/products';
    const heroSummary = createHeroSummary(product?.shortDescription || content?.summary || t('hero.subtitle'));
    const heroEyebrow = content?.eyebrow?.trim() || t('brand.message');
    const heroBadge = content?.badge?.trim() || t('brandValues.eyebrow');
    const primaryCtaLabel = content?.primaryCtaLabel?.trim() || t('hero.cta');
    const secondaryCtaLabel = content?.secondaryCtaLabel?.trim() || t('warrantyCheck.title');
    const secondaryCtaHref = content?.secondaryCtaHref?.trim() || '/warranty-check';
    const shouldRenderVideo = !shouldReduceAnimations && !videoFailed;

    return (
        <section
            className="relative h-[clamp(39rem,84svh,44rem)] w-full overflow-hidden min-[480px]:h-[clamp(36rem,78svh,41rem)] sm:h-[clamp(34rem,76vw,44rem)] md:h-[clamp(36rem,72vw,48rem)] lg:h-[clamp(28rem,72vw,100vh)]"
            aria-label={t('hero.ariaLabel').replace('{product}', displayName)}
        >
            <motion.div variants={videoVariants} initial="hidden" animate="visible" className="absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_28%,rgba(41,171,226,0.22),transparent_20%,rgba(41,171,226,0.08)_34%,transparent_54%),linear-gradient(180deg,#08111A_0%,#09131D_54%,#03070D_100%)]" />
                <div className="absolute inset-0 bg-topo opacity-18" />
                <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(6,17,27,0.38)_0%,rgba(6,17,27,0.16)_38%,rgba(6,17,27,0.54)_100%)]" />
                <div className="absolute right-[7%] top-[17%] hidden h-[20rem] w-[20rem] rounded-full border border-[rgba(41,171,226,0.12)] bg-[radial-gradient(circle,rgba(41,171,226,0.1)_0%,rgba(41,171,226,0.02)_48%,transparent_72%)] sm:block" />

                {shouldRenderVideo ? (
                    <motion.video
                        key="hero-video"
                        src={HERO_VIDEO}
                        className={`absolute inset-0 hidden h-full w-full object-cover object-[62%_center] sm:block md:object-[66%_44%] lg:object-[70%_46%] xl:object-[72%_48%] ${
                            isVideoReady ? 'opacity-100' : 'opacity-0'
                        }`}
                        autoPlay
                        loop
                        muted
                        playsInline
                        preload="metadata"
                        poster={HERO_VIDEO_POSTER}
                        onCanPlay={() => setIsVideoReady(true)}
                        onLoadedData={() => setIsVideoReady(true)}
                        onError={() => setVideoFailed(true)}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        aria-hidden="true"
                    />
                ) : null}
            </motion.div>

            <div className="absolute inset-0 bg-topo opacity-32 sm:hidden" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(41,171,226,0.18),_transparent_42%),linear-gradient(180deg,_#09111A_0%,_#07101A_58%,_#03070D_100%)] sm:hidden" />
            <div className="absolute inset-0 bg-black/52 sm:bg-black/24 md:bg-black/18" aria-hidden="true" />
            <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(96deg,rgba(7,17,26,0.9)_0%,rgba(7,17,26,0.8)_26%,rgba(7,17,26,0.34)_52%,rgba(7,17,26,0.52)_76%,rgba(7,17,26,0.72)_100%)] sm:bg-[linear-gradient(96deg,rgba(7,17,26,0.92)_0%,rgba(7,17,26,0.68)_28%,rgba(7,17,26,0.16)_54%,rgba(7,17,26,0.34)_74%,rgba(7,17,26,0.62)_100%)]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-36 bg-gradient-to-b from-[#06111B] via-[rgba(6,17,27,0.94)] to-transparent min-[480px]:h-32 sm:h-28 sm:via-[rgba(6,17,27,0.78)] md:h-24 md:via-[rgba(6,17,27,0.68)]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-28 bg-gradient-to-t from-[#06111B] via-[rgba(6,17,27,0.88)] to-transparent min-[480px]:h-24 sm:h-32 sm:via-[rgba(6,17,27,0.72)]" />

            <div className="absolute inset-0 z-20 flex flex-col items-center justify-between gap-4 px-4 pb-8 pt-[5.25rem] min-[480px]:items-start min-[480px]:px-6 min-[480px]:pb-9 min-[480px]:pt-[5rem] sm:items-start sm:gap-0 sm:px-6 sm:pb-10 sm:pt-24 md:px-8 md:pb-12 md:pt-28 lg:pl-32 lg:pr-14 xl:pl-36 xl:pr-[4.5rem] 2xl:pl-40 2xl:pr-20">
                <motion.h1
                    className="w-full max-w-[18rem] text-center font-serif text-[2.15rem] leading-[0.94] text-white transition-colors duration-300 min-[480px]:max-w-[16rem] min-[480px]:text-left min-[480px]:text-[2.35rem] sm:max-w-[15rem] sm:text-left sm:text-[3.35rem] md:max-w-[18rem] md:text-[4.1rem] lg:max-w-none lg:text-6xl xl:text-7xl 2xl:text-8xl"
                    variants={titleVariants}
                    initial="hidden"
                    animate="visible"
                    title={displayName}
                >
                    {displayName}
                </motion.h1>

                {/* Product preview: wrap with Link instead of onClick to improve semantics */}
                <Link
                    href={primaryTargetHref}
                    className="group relative flex min-h-0 w-full flex-1 items-center justify-center py-2 min-[480px]:items-center min-[480px]:py-3 sm:py-4"
                    aria-label={product ? t('hero.discoverAria').replace('{product}', displayName) : primaryCtaLabel}
                >
                    <motion.div
                        variants={productVariants}
                        initial="hidden"
                        animate="visible"
                        whileHover={enableDecorativeAnimations ? 'hover' : undefined}
                    >
                        {displayImage ? (
                            <Image
                                src={displayImage}
                                alt={displayName}
                                width={384}
                                height={216}
                                className="max-h-[29svh] w-auto object-contain drop-shadow-2xl min-[480px]:max-h-[27svh] sm:max-h-[31vh] md:max-h-[34vh] lg:max-h-[40vh] xl:max-h-[45vh] 2xl:max-h-[50vh]"
                                priority
                            />
                        ) : (
                            <div className="flex h-[100px] w-[180px] items-center justify-center rounded-[24px] border border-[var(--brand-border)] bg-[rgba(7,17,27,0.72)] text-center text-sm text-[var(--text-secondary)] xs:h-[120px] xs:w-[220px] sm:h-[157px] sm:w-[280px] md:h-[197px] md:w-[350px] lg:h-[216px] lg:w-[384px]">
                                {t('products.detail.media.imageUnavailable')}
                            </div>
                        )}
                    </motion.div>
                </Link>

                <motion.div
                    className="w-full max-w-[22rem] text-center min-[480px]:max-w-[30rem] min-[480px]:text-left sm:max-w-[34rem] md:max-w-[38rem] lg:max-w-2xl"
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <div className="mx-auto mb-2.5 max-w-[22rem] min-[480px]:mx-0 min-[480px]:max-w-[30rem] sm:mb-4 sm:max-w-[34rem] md:max-w-[38rem] lg:max-w-2xl">
                        <div className="mb-2 flex flex-wrap items-center justify-center gap-2 min-[480px]:justify-start sm:mb-3">
                            <p className="brand-eyebrow text-center text-[0.66rem] leading-[1.48] tracking-[0.14em] min-[480px]:text-left min-[480px]:text-[0.7rem] min-[480px]:tracking-[0.17em] sm:text-[0.72rem] sm:tracking-[0.2em] md:text-[0.74rem] md:tracking-[0.22em]">
                                {heroEyebrow}
                            </p>
                            <span className="brand-badge-muted border-[rgba(41,171,226,0.2)] bg-[rgba(8,22,35,0.74)] px-3 py-1 text-[0.67rem] font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)] sm:text-[0.72rem]">
                                {heroBadge}
                            </span>
                        </div>
                        <p className="text-[0.95rem] leading-[1.65] text-[var(--text-primary)] xs:text-[1rem] sm:text-[1.02rem] sm:leading-[1.7] md:text-[1.12rem] lg:text-xl lg:leading-relaxed">
                            {heroSummary}
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                        <motion.button
                            className="brand-button-primary min-w-[176px] rounded-full px-5 py-3 text-sm font-semibold sm:min-w-[184px] sm:px-6 sm:py-3 sm:text-base"
                            variants={buttonVariants}
                            initial="hidden"
                            animate="visible"
                            whileHover={enableDecorativeAnimations ? 'hover' : undefined}
                            whileTap="tap"
                            onClick={() => {
                                /* navigate via button only */
                                window.location.href = primaryTargetHref;
                            }}
                            aria-label={product ? t('hero.discoverAria').replace('{product}', displayName) : primaryCtaLabel}
                        >
                            {primaryCtaLabel}
                        </motion.button>

                        {/* Secondary CTA: link to warranty check */}
                        <Link
                            href={secondaryCtaHref}
                            className="brand-button-secondary inline-flex min-w-[176px] items-center justify-center rounded-full px-5 py-3 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--text-primary)] transition duration-200 hover:border-[var(--brand-blue)] hover:bg-[rgba(41,171,226,0.12)] sm:min-w-[184px] sm:px-6 sm:text-base"
                        >
                            {secondaryCtaLabel}
                        </Link>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
