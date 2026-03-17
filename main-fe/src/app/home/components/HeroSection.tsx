'use client';

import Image from 'next/image';
import { motion, Variants } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useAnimationConfig } from '@/hooks/useReducedMotion';
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
        y: 0, opacity: 1, scale: 1,
        transition: animate
            ? { duration: 0.7, delay: 0.15, type: 'spring', stiffness: 100, damping: 15 }
            : { duration: 0.4 }
    }
});

const makeProductVariants = (animate: boolean): Variants => ({
    hidden: { scale: animate ? 0.9 : 1, opacity: 0, y: animate ? 24 : 0 },
    visible: {
        scale: 1, opacity: 1, y: 0,
        transition: animate
            ? { duration: 0.8, delay: 0.3, type: 'spring', stiffness: 90, damping: 14 }
            : { duration: 0.4 }
    }
});

const makeContentVariants = (animate: boolean): Variants => ({
    hidden: { y: animate ? 32 : 0, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, delay: animate ? 0.45 : 0 } }
});

const makeButtonVariants = (animate: boolean): Variants => ({
    hidden: { scale: animate ? 0.96 : 1, opacity: 0 },
    visible: {
        scale: 1, opacity: 1,
        transition: animate
            ? { duration: 0.5, delay: 0.65, type: 'spring', stiffness: 160 }
            : { duration: 0.3 }
    },
    hover: { scale: 1.04, boxShadow: '0 10px 25px rgba(255,255,255,0.2)', borderColor: '#4FC8FF', transition: { duration: 0.2 } },
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

    return (
        <section
            className="relative h-[clamp(28rem,72vw,75rem)] w-full overflow-hidden"
            role="banner"
            aria-label={t('hero.ariaLabel').replace('{product}', displayName)}
        >
            {/* Background video (desktop) */}
            <motion.video
                src={HERO_VIDEO}
                className="absolute inset-0 hidden h-full w-full object-cover md:block"
                autoPlay loop muted playsInline preload="none" poster="/logo-4t.png"
                variants={videoVariants} initial="hidden" animate="visible"
                aria-hidden="true"
            />

            {/* Mobile gradient background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,200,255,0.22),_transparent_45%),linear-gradient(180deg,_#0c131d_0%,_#07101a_55%,_#03070d_100%)] md:hidden" />

            {/* Dark overlay */}
            <motion.div
                className="absolute inset-0 bg-black/55"
                variants={overlayVariants} initial="hidden" animate="visible"
                aria-hidden="true"
            />

            {/* Top & bottom fades */}
            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#0c131d] to-transparent pointer-events-none z-10" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0c131d] to-transparent pointer-events-none z-10" />

            {/* ── Sound wave decoration — brand identity: audio communication ── */}
            <div className="absolute bottom-[18%] right-6 z-10 hidden md:block pointer-events-none" aria-hidden="true">
                <svg width="260" height="56" viewBox="0 0 260 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Three layered sine waves, each with different amplitude — suggests audio frequency */}
                    <path
                        d="M0,28 C16,28 16,8 32,8 C48,8 48,48 64,48 C80,48 80,8 96,8 C112,8 112,48 128,48 C144,48 144,8 160,8 C176,8 176,48 192,48 C208,48 208,8 224,8 C240,8 240,48 260,48"
                        stroke="#4FC8FF" strokeWidth="1.5"
                        strokeDasharray="600" strokeDashoffset="600"
                        className="animate-dash-flow animate-wave-pulse"
                    />
                    <path
                        d="M0,28 C16,28 16,14 32,14 C48,14 48,42 64,42 C80,42 80,14 96,14 C112,14 112,42 128,42 C144,42 144,14 160,14 C176,14 176,42 192,42 C208,42 208,14 224,14 C240,14 240,42 260,42"
                        stroke="#4FC8FF" strokeWidth="1"
                        strokeDasharray="600" strokeDashoffset="600"
                        className="animate-dash-flow animate-wave-pulse-delayed"
                        style={{ animationDelay: '1s, 0.6s' }}
                    />
                    <path
                        d="M0,28 C16,28 16,20 32,20 C48,20 48,36 64,36 C80,36 80,20 96,20 C112,20 112,36 128,36 C144,36 144,20 160,20 C176,20 176,36 192,36 C208,36 208,20 224,20 C240,20 240,36 260,36"
                        stroke="#4FC8FF" strokeWidth="0.6" opacity="0.5"
                        strokeDasharray="600" strokeDashoffset="600"
                        className="animate-dash-flow-reverse animate-wave-pulse-slow"
                    />
                </svg>
            </div>

            {/* ── Signal / Bluetooth connectivity rings around product ── */}
            {enableInfiniteAnimations && (
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none hidden md:block" aria-hidden="true">
                    <div className="relative flex items-center justify-center">
                        <div className="absolute h-64 w-64 rounded-full border border-cyan-400/20 animate-signal-ring" />
                        <div className="absolute h-64 w-64 rounded-full border border-cyan-400/20 animate-signal-ring-2" />
                        <div className="absolute h-64 w-64 rounded-full border border-cyan-400/15 animate-signal-ring-3" />
                    </div>
                </div>
            )}

            {/* Content: flexbox column */}
            <div className="absolute inset-0 z-20 flex flex-col items-center sm:items-start sm:pl-24 justify-between pt-20 pb-12 px-4 sm:px-8">

                {/* Title */}
                <motion.h1
                    className="w-full text-center sm:text-left text-2xl leading-tight text-white xs:text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl"
                    variants={titleVariants} initial="hidden" animate="visible"
                    title={displayName}
                >
                    {displayName}
                </motion.h1>

                {/* Product image */}
                <motion.div
                    className="flex flex-1 items-center justify-center py-4 w-full"
                    variants={productVariants} initial="hidden" animate="visible"
                >
                    {displayImage ? (
                        <Image
                            src={displayImage} alt={displayName}
                            width={384} height={216}
                            className="max-h-[160px] xs:max-h-[200px] sm:max-h-[260px] md:max-h-[320px] lg:max-h-[380px] w-auto object-contain drop-shadow-2xl"
                            priority
                        />
                    ) : (
                        <div className="flex h-[100px] w-[180px] items-center justify-center rounded-lg border border-white/10 bg-white/5 text-center text-sm text-white/70 xs:h-[120px] xs:w-[220px] sm:h-[157px] sm:w-[280px] md:h-[197px] md:w-[350px] lg:h-[216px] lg:w-[384px]">
                            {t('products.detail.media.imageUnavailable')}
                        </div>
                    )}
                </motion.div>

                {/* Description + CTA */}
                <motion.div
                    className="w-full text-center sm:text-left"
                    variants={contentVariants} initial="hidden" animate="visible"
                >
                    <div className="mx-auto sm:mx-0 mb-4 max-w-2xl">
                        <p className="line-clamp-3 text-sm leading-relaxed text-white xs:text-base sm:text-lg lg:text-xl">
                            {product?.shortDescription || t('hero.subtitle')}
                        </p>
                    </div>
                    <motion.button
                        className="min-w-[160px] rounded-full border border-white px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white hover:text-black sm:px-6 sm:py-3 sm:text-base"
                        variants={buttonVariants} initial="hidden" animate="visible"
                        whileHover="hover" whileTap="tap"
                        onClick={() => product?.id ? router.push(`/products/${product.id}`) : router.push('/products')}
                        aria-label={t('hero.discoverAria').replace('{product}', displayName)}
                    >
                        {t('hero.cta')}
                    </motion.button>
                </motion.div>
            </div>
        </section>
    );
}
