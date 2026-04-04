'use client';

import Image from 'next/image';
import { motion, Variants } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useAnimationConfig } from '@/hooks/useReducedMotion';
import { buildProductPath } from '@/lib/slug';
import type { SimpleProduct } from '@/types/product';

const HERO_VIDEO = '/videos/motorbike-road-trip-2022-07-26-01-49-02-utc.mp4';

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

    return (
        <section
            className="relative h-[100svh] w-full overflow-hidden sm:h-[clamp(28rem,72vw,100vh)]"
            aria-label={t('hero.ariaLabel').replace('{product}', displayName)}
        >
            <motion.video
                src={HERO_VIDEO}
                className="absolute inset-0 hidden h-full w-full object-cover sm:block"
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
                className="absolute inset-0 bg-black/55"
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                aria-hidden="true"
            />

            <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(90deg,rgba(7,17,26,0.82),rgba(7,17,26,0.2)_35%,rgba(7,17,26,0.65)_100%)]" />
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-[#06111B] to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-32 bg-gradient-to-t from-[#06111B] to-transparent" />

            <div className="pointer-events-none absolute bottom-[15%] right-4 z-10 sm:right-6" aria-hidden="true">
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
                    className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden -translate-x-1/2 -translate-y-1/2 sm:block"
                    aria-hidden="true"
                >
                    <div className="relative flex items-center justify-center">
                        <div className="absolute h-[30vh] w-[30vh] min-h-[200px] min-w-[200px] rounded-full border border-[rgba(41,171,226,0.22)] animate-signal-ring transition-colors duration-500 group-hover:border-[rgba(41,171,226,0.5)]" />
                        <div className="absolute h-[30vh] w-[30vh] min-h-[200px] min-w-[200px] rounded-full border border-[rgba(41,171,226,0.22)] animate-signal-ring-2 transition-colors duration-500 group-hover:border-[rgba(41,171,226,0.5)]" />
                        <div className="absolute h-[30vh] w-[30vh] min-h-[200px] min-w-[200px] rounded-full border border-[rgba(41,171,226,0.15)] animate-signal-ring-3 transition-colors duration-500 group-hover:border-[rgba(41,171,226,0.4)]" />
                    </div>
                </div>
            )}

            <div className="absolute inset-0 z-20 flex flex-col items-center gap-4 px-4 pb-7 pt-[5.25rem] sm:items-start sm:justify-between sm:gap-0 sm:pb-12 sm:pt-20 sm:pl-24 sm:pr-8 md:pl-28 md:pr-8 lg:pl-32 lg:pr-12 xl:pl-36 xl:pr-16 2xl:pl-40 2xl:pr-20">
                <motion.h1
                    className="w-full max-w-[18rem] cursor-pointer text-center font-serif text-[2.15rem] leading-[0.94] text-white transition-colors duration-300 hover:text-[var(--brand-blue)] xs:max-w-[20rem] xs:text-[2.45rem] sm:max-w-none sm:text-left sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl 2xl:text-8xl"
                    variants={titleVariants}
                    initial="hidden"
                    animate="visible"
                    title={displayName}
                    onClick={() => router.push(productPath)}
                >
                    {displayName}
                </motion.h1>

                <motion.div
                    className="group relative flex min-h-0 w-full flex-1 cursor-pointer items-center justify-center py-3 sm:py-4"
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
                            className="max-h-[28svh] w-auto object-contain drop-shadow-2xl xs:max-h-[30svh] sm:max-h-[30vh] md:max-h-[35vh] lg:max-h-[40vh] xl:max-h-[45vh] 2xl:max-h-[50vh]"
                            priority
                        />
                    ) : (
                        <div className="flex h-[100px] w-[180px] items-center justify-center rounded-[24px] border border-[var(--brand-border)] bg-[rgba(7,17,27,0.72)] text-center text-sm text-[var(--text-secondary)] xs:h-[120px] xs:w-[220px] sm:h-[157px] sm:w-[280px] md:h-[197px] md:w-[350px] lg:h-[216px] lg:w-[384px]">
                            {t('products.detail.media.imageUnavailable')}
                        </div>
                    )}
                </motion.div>

                <motion.div
                    className="w-full max-w-[22rem] text-center sm:max-w-2xl sm:text-left"
                    variants={contentVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <div className="mx-auto mb-3 max-w-[22rem] sm:mx-0 sm:mb-4 sm:max-w-2xl">
                        <p className="brand-eyebrow mb-2 text-center text-[0.68rem] leading-[1.55] tracking-[0.2em] xs:text-[0.72rem] sm:mb-3 sm:text-left sm:text-[0.74rem] sm:tracking-[0.24em]">
                            {t('brand.message')}
                        </p>
                        <p className="line-clamp-3 text-[0.95rem] leading-[1.55] text-[var(--text-primary)] xs:text-base sm:text-lg sm:leading-relaxed lg:text-xl">
                            {product?.shortDescription || t('hero.subtitle')}
                        </p>
                    </div>
                    <motion.button
                        className="brand-button-primary min-w-[176px] rounded-full px-5 py-3 text-sm font-semibold sm:min-w-[160px] sm:px-6 sm:py-3 sm:text-base"
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
