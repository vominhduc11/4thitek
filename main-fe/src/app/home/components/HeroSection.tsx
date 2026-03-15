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
        transition: animate
            ? { duration: 0.5, delay: 0.65, type: 'spring', stiffness: 160 }
            : { duration: 0.3 }
    },
    hover: {
        scale: 1.04,
        boxShadow: '0 10px 25px rgba(255,255,255,0.2)',
        borderColor: '#4FC8FF',
        transition: { duration: 0.2 }
    },
    tap: { scale: 0.97 }
});

interface HeroSectionProps {
    initialProduct?: SimpleProduct | null;
}

const formatProductTitle = (title: string) => {
    if (title.length <= 25) {
        return title;
    }

    const midpoint = Math.floor(title.length / 2);
    const spaceIndex = title.indexOf(' ', midpoint);
    if (spaceIndex !== -1 && spaceIndex < title.length - 5) {
        return `${title.substring(0, spaceIndex)}\n${title.substring(spaceIndex + 1)}`;
    }

    return title;
};

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
            <motion.video
                src={HERO_VIDEO}
                className="absolute inset-0 hidden h-full w-full object-cover md:block"
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

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,200,255,0.22),_transparent_45%),linear-gradient(180deg,_#0c131d_0%,_#07101a_55%,_#03070d_100%)] md:hidden" />

            <motion.div
                className="absolute inset-0 bg-black/55"
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                aria-hidden="true"
            />

            <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#0c131d] to-transparent pointer-events-none z-10" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0c131d] to-transparent pointer-events-none z-10" />

            <motion.h1
                className="absolute left-0 right-0 top-[14%] z-20 px-4 text-center text-2xl leading-tight text-white xs:text-3xl sm:left-20 sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl"
                variants={titleVariants}
                initial="hidden"
                animate="visible"
                title={displayName}
            >
                <span style={{ whiteSpace: 'pre-line' }}>{formatProductTitle(displayName)}</span>
            </motion.h1>

            <motion.div
                className="absolute left-0 right-0 top-[24%] z-20 flex justify-center sm:left-20"
                variants={productVariants}
                initial="hidden"
                animate="visible"
            >
                {displayImage ? (
                    <Image
                        src={displayImage}
                        alt={displayName}
                        width={384}
                        height={216}
                        className="h-auto w-[180px] object-contain drop-shadow-2xl xs:w-[220px] sm:w-[280px] md:w-[350px] lg:w-[384px]"
                        priority
                    />
                ) : (
                    <div className="flex h-[100px] w-[180px] items-center justify-center rounded-lg border border-white/10 bg-white/5 text-center text-sm text-white/70 xs:h-[120px] xs:w-[220px] sm:h-[157px] sm:w-[280px] md:h-[197px] md:w-[350px] lg:h-[216px] lg:w-[384px]">
                        {t('products.detail.media.imageUnavailable')}
                    </div>
                )}
            </motion.div>

            <motion.div
                className="absolute bottom-[10%] left-0 right-0 z-20 px-4 text-center sm:left-20 sm:px-6"
                variants={contentVariants}
                initial="hidden"
                animate="visible"
            >
                <div className="mx-auto mb-4 max-w-2xl">
                    <p className="line-clamp-5 text-sm leading-relaxed text-white xs:text-base sm:text-lg lg:text-xl xl:text-2xl">
                        {product?.shortDescription || t('hero.subtitle')}
                    </p>
                </div>

                <motion.button
                    className="min-w-[160px] rounded-full border border-white px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white hover:text-black sm:px-6 sm:py-3 sm:text-base"
                    variants={buttonVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover="hover"
                    whileTap="tap"
                    onClick={() => {
                        if (product?.id) {
                            router.push(`/products/${product.id}`);
                            return;
                        }
                        router.push('/products');
                    }}
                    aria-label={t('hero.discoverAria').replace('{product}', displayName)}
                >
                    {t('hero.cta')}
                </motion.button>
            </motion.div>

            {enableInfiniteAnimations &&
                [
                    { left: '12%', top: '24%', delay: '0s' },
                    { left: '32%', top: '68%', delay: '0.4s' },
                    { left: '78%', top: '38%', delay: '0.8s' }
                ].map((particle, index) => (
                    <div
                        key={index}
                        className="absolute h-2 w-2 animate-float-slow rounded-full bg-blue-400 opacity-60"
                        style={{ left: particle.left, top: particle.top, animationDelay: particle.delay }}
                        aria-hidden="true"
                    />
                ))}
        </section>
    );
}
