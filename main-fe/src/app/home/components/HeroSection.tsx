'use client';

import Image from 'next/image';
import { motion, Variants } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useAnimationConfig } from '@/hooks/useReducedMotion';
import { buildProductPath } from '@/lib/slug';
import type { SimpleProduct } from '@/types/product';

const HERO_VIDEO = '/videos/hero-road-tech-loop.mp4';
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
    hidden: animate ? { scale: 1.04, opacity: 0 } : { opacity: 0 },
    visible: animate
        ? { scale: 1, opacity: 1, transition: { duration: 0.8, ease: 'easeOut' } }
        : { opacity: 1, transition: { duration: 0.5 } }
});

const makeOverlayVariants = (): Variants => ({
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5 } }
});

const makeTitleVariants = (animate: boolean): Variants => ({
    hidden: { y: animate ? -40 : 0, opacity: 0, scale: animate ? 0.95 : 1 },
    visible: {
        y: 0,
        opacity: 1,
        scale: 1,
        transition: animate
            ? { duration: 0.7, delay: 0.15, type: 'spring', stiffness: 100, damping: 15 }
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
            ? { duration: 0.8, delay: 0.3, type: 'spring', stiffness: 90, damping: 14 }
            : { duration: 0.4 }
    },
    hover: {
        scale: 1.06,
        y: -15,
        rotate: 1.5,
        filter: 'brightness(1.08) drop-shadow(0 25px 35px rgba(0,113,188,0.28))',
        transition: { duration: 0.4, ease: 'easeOut' }
    }
});

const makeContentVariants = (animate: boolean): Variants => ({
    hidden: { y: animate ? 32 : 0, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, delay: animate ? 0.45 : 0 } }
});

const makeButtonVariants = (animate: boolean): Variants => ({
    hidden: { scale: animate ? 0.96 : 1, opacity: 0 },
    visible: {
        scale: 1,
        opacity: 1,
        transition: animate ? { duration: 0.5, delay: 0.65, type: 'spring', stiffness: 160 } : { duration: 0.3 }
    },
    hover: { scale: 1.04, boxShadow: '0 10px 25px rgba(0,113,188,0.35)', transition: { duration: 0.2 } },
    tap: { scale: 0.97 }
});

interface HeroSectionProps {
    initialProduct?: SimpleProduct | null;
}

export default function HeroSection({ initialProduct = null }: HeroSectionProps) {
    const router = useRouter();
    const { t } = useLanguage();
    const { enableInfiniteAnimations, enableDecorativeAnimations } = useAnimationConfig();
    const product = initialProduct;
    const displayName = product?.name || t('products.title');
    const displayImage = product?.image || '';

    const videoVariants = makeVideoVariants(enableDecorativeAnimations);
    const overlayVariants = makeOverlayVariants();
    const titleVariants = makeTitleVariants(enableDecorativeAnimations);
    const productVariants = makeProductVariants(enableDecorativeAnimations);
    const contentVariants = makeContentVariants(enableDecorativeAnimations);
    const buttonVariants = makeButtonVariants(enableDecorativeAnimations);
    const productPath = product?.id ? buildProductPath(product.id, product.name) : '/products';
    const heroSummary = createHeroSummary(product?.shortDescription || t('hero.subtitle'));

    return (
        <section
            className="relative h-[clamp(39rem,84svh,44rem)] w-full overflow-hidden min-[480px]:h-[clamp(36rem,78svh,41rem)] sm:h-[clamp(34rem,76vw,44rem)] md:h-[clamp(36rem,72vw,48rem)] lg:h-[clamp(28rem,72vw,100vh)]"
            aria-label={t('hero.ariaLabel').replace('{product}', displayName)}
        >
            <motion.video
                src={HERO_VIDEO}
                className="absolute inset-0 hidden h-full w-full object-cover object-center sm:block md:object-[center_46%] lg:object-[center_50%]"
                autoPlay
                loop
                muted
                playsInline
                preload="none"
                poster="/logo-4t.png"
                variants={videoVariants}
                initial="hidden"
                animate="visible"
                aria-hidden="true"
            />

            <div className="absolute inset-0 bg-topo opacity-40 sm:hidden" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(41,171,226,0.24),_transparent_42%),linear-gradient(180deg,_#09111A_0%,_#07101A_55%,_#03070D_100%)] sm:hidden" />

            <motion.div
                className="absolute inset-0 bg-black/55 sm:bg-black/28 md:bg-black/24"
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                aria-hidden="true"
            />

            <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(92deg,rgba(7,17,26,0.84)_0%,rgba(7,17,26,0.76)_28%,rgba(7,17,26,0.42)_52%,rgba(7,17,26,0.6)_74%,rgba(7,17,26,0.8)_100%)] sm:bg-[linear-gradient(92deg,rgba(7,17,26,0.92)_0%,rgba(7,17,26,0.72)_26%,rgba(7,17,26,0.2)_50%,rgba(7,17,26,0.46)_72%,rgba(7,17,26,0.78)_100%)]" />
            <div className="pointer-events-none absolute inset-0 z-10 hidden sm:block bg-[radial-gradient(circle_at_54%_42%,rgba(7,17,26,0.02)_0%,rgba(7,17,26,0.08)_28%,rgba(7,17,26,0.34)_62%,rgba(7,17,26,0.64)_100%)]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-36 bg-gradient-to-b from-[#06111B] via-[rgba(6,17,27,0.94)] to-transparent min-[480px]:h-32 sm:h-28 sm:via-[rgba(6,17,27,0.78)] md:h-24 md:via-[rgba(6,17,27,0.68)]" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-28 bg-gradient-to-t from-[#06111B] via-[rgba(6,17,27,0.88)] to-transparent min-[480px]:h-24 sm:h-32 sm:via-[rgba(6,17,27,0.72)]" />

            <div className="pointer-events-none absolute bottom-[13%] right-4 z-10 hidden opacity-75 md:block md:right-6" aria-hidden="true">
                <svg
                    width="260"
                    height="56"
                    viewBox="0 0 260 56"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-auto w-[120px] opacity-60 sm:w-[200px] sm:opacity-100 md:w-[260px]"
                >
                    <path
                        d="M0,28 C16,28 16,8 32,8 C48,8 48,48 64,48 C80,48 80,8 96,8 C112,8 112,48 128,48 C144,48 144,8 160,8 C176,8 176,48 192,48 C208,48 208,8 224,8 C240,8 240,48 260,48"
                        stroke="#29ABE2"
                        strokeWidth="1.5"
                        strokeDasharray="600"
                        strokeDashoffset="600"
                        className="animate-dash-flow animate-wave-pulse"
                    />
                    <path
                        d="M0,28 C16,28 16,14 32,14 C48,14 48,42 64,42 C80,42 80,14 96,14 C112,14 112,42 128,42 C144,42 144,14 160,14 C176,14 176,42 192,42 C208,42 208,14 224,14 C240,14 240,42 260,42"
                        stroke="#29ABE2"
                        strokeWidth="1"
                        strokeDasharray="600"
                        strokeDashoffset="600"
                        className="animate-dash-flow animate-wave-pulse-delayed"
                        style={{ animationDelay: '1s, 0.6s' }}
                    />
                    <path
                        d="M0,28 C16,28 16,20 32,20 C48,20 48,36 64,36 C80,36 80,20 96,20 C112,20 112,36 128,36 C144,36 144,20 160,20 C176,20 176,36 192,36 C208,36 208,20 224,20 C240,20 240,36 260,36"
                        stroke="#29ABE2"
                        strokeWidth="0.6"
                        opacity="0.5"
                        strokeDasharray="600"
                        strokeDashoffset="600"
                        className="animate-dash-flow-reverse animate-wave-pulse-slow"
                    />
                </svg>
            </div>

            {enableInfiniteAnimations && (
                <div
                    className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 lg:block"
                    aria-hidden="true"
                >
                    <div className="relative flex items-center justify-center">
                        <div className="absolute h-[30vh] w-[30vh] min-h-[200px] min-w-[200px] rounded-full border border-[rgba(41,171,226,0.22)] animate-signal-ring transition-colors duration-500 group-hover:border-[rgba(41,171,226,0.5)]" />
                        <div className="absolute h-[30vh] w-[30vh] min-h-[200px] min-w-[200px] rounded-full border border-[rgba(41,171,226,0.22)] animate-signal-ring-2 transition-colors duration-500 group-hover:border-[rgba(41,171,226,0.5)]" />
                        <div className="absolute h-[30vh] w-[30vh] min-h-[200px] min-w-[200px] rounded-full border border-[rgba(41,171,226,0.15)] animate-signal-ring-3 transition-colors duration-500 group-hover:border-[rgba(41,171,226,0.4)]" />
                    </div>
                </div>
            )}

            <div className="absolute inset-0 z-20 flex flex-col items-center justify-between gap-4 px-4 pb-8 pt-[5.25rem] min-[480px]:items-start min-[480px]:px-6 min-[480px]:pb-9 min-[480px]:pt-[5rem] sm:items-start sm:gap-0 sm:px-6 sm:pb-10 sm:pt-24 md:px-8 md:pb-12 md:pt-28 lg:pl-32 lg:pr-14 xl:pl-36 xl:pr-[4.5rem] 2xl:pl-40 2xl:pr-20">
                <motion.h1
                    className="w-full max-w-[18rem] cursor-pointer text-center font-serif text-[2.15rem] leading-[0.94] text-white transition-colors duration-300 hover:text-[var(--brand-blue)] min-[480px]:max-w-[16rem] min-[480px]:text-left min-[480px]:text-[2.35rem] sm:max-w-[15rem] sm:text-left sm:text-[3.35rem] md:max-w-[18rem] md:text-[4.1rem] lg:max-w-none lg:text-6xl xl:text-7xl 2xl:text-8xl"
                    variants={titleVariants}
                    initial="hidden"
                    animate="visible"
                    title={displayName}
                    onClick={() => router.push(productPath)}
                >
                    {displayName}
                </motion.h1>

                <motion.div
                    className="group relative flex min-h-0 w-full flex-1 cursor-pointer items-center justify-center py-2 min-[480px]:items-center min-[480px]:py-3 sm:py-4"
                    variants={productVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover="hover"
                    onClick={() => router.push(productPath)}
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

                <motion.div
                    className="w-full max-w-[22rem] text-center min-[480px]:max-w-[30rem] min-[480px]:text-left sm:max-w-[34rem] md:max-w-[38rem] lg:max-w-2xl"
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <div className="mx-auto mb-2.5 max-w-[22rem] min-[480px]:mx-0 min-[480px]:max-w-[30rem] sm:mb-4 sm:max-w-[34rem] md:max-w-[38rem] lg:max-w-2xl">
                        <p className="brand-eyebrow mb-1.5 text-center text-[0.66rem] leading-[1.48] tracking-[0.14em] min-[480px]:text-left min-[480px]:text-[0.7rem] min-[480px]:tracking-[0.17em] sm:mb-3 sm:text-[0.72rem] sm:tracking-[0.2em] md:text-[0.74rem] md:tracking-[0.22em]">
                            {t('brand.message')}
                        </p>
                        <p className="text-[0.95rem] leading-[1.65] text-[var(--text-primary)] xs:text-[1rem] sm:text-[1.02rem] sm:leading-[1.7] md:text-[1.12rem] lg:text-xl lg:leading-relaxed">
                            {heroSummary}
                        </p>
                    </div>
                    <motion.button
                        className="brand-button-primary min-w-[176px] rounded-full px-5 py-3 text-sm font-semibold sm:min-w-[184px] sm:px-6 sm:py-3 sm:text-base"
                        variants={buttonVariants}
                        initial="hidden"
                        animate="visible"
                        whileHover="hover"
                        whileTap="tap"
                        onClick={() => router.push(productPath)}
                        aria-label={t('hero.discoverAria').replace('{product}', displayName)}
                    >
                        {t('hero.cta')}
                    </motion.button>
                </motion.div>
            </div>
        </section>
    );
}
