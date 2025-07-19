// src/app/home/components/HeroSection.tsx
'use client';

import Image from 'next/image';
import { motion, Variants } from 'framer-motion';
import { useRouter } from 'next/navigation';

// Product info
const PRODUCT_INFO = {
    NAME: 'SCS S8X Pro',
    IMAGE: '/products/product1.png',
    VIDEO: '/videos/motorbike-road-trip-2022-07-26-01-49-02-utc.mp4',
    DESCRIPTION: `4T HITEK latest S8X's unique appearance and a variety of functions allow users to have a better product experience. S8X has a unique rain proof structure, Bluetooth 5.0 communication technology, group intercom connection, advanced noise control, stereo music playback, GPS navigation, etc.`,
    CTA_TEXT: 'DISCOVERY NOW'
};

// Particle effect config inlined
//         id,  left,    top,     duration, delay
const particles = [
    { id: 0, left: '10%', top: '20%', duration: 2.5, delay: 0 },
    { id: 1, left: '25%', top: '45%', duration: 2.8, delay: 0.4 },
    { id: 2, left: '40%', top: '70%', duration: 3.1, delay: 0.8 },
    { id: 3, left: '55%', top: '95%', duration: 3.4, delay: 1.2 },
    { id: 4, left: '70%', top: '120%', duration: 3.7, delay: 1.6 },
    { id: 5, left: '85%', top: '145%', duration: 4.0, delay: 2.0 }
];
// Light rays config inlined
const lightRays = [
    { id: 0, left: '25%', duration: 3.5, delay: 0 },
    { id: 1, left: '55%', duration: 4.0, delay: 1.5 }
];

// Animation variants with concrete values
const videoVariants: Variants = {
    hidden: { scale: 1.1, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { duration: 2.0, ease: 'easeOut' } }
};
const overlayVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 1.2, delay: 0.5 } }
};
const titleVariants: Variants = {
    hidden: { y: -100, opacity: 0, scale: 0.8 },
    visible: {
        y: 0,
        opacity: 1,
        scale: 1,
        transition: { duration: 1.2, delay: 1.0, type: 'spring', stiffness: 100, damping: 15 }
    },
    hover: { scale: 1.05, textShadow: '0 0 30px rgba(79,200,255,0.5)', transition: { duration: 0.3 } }
};
const productVariants: Variants = {
    hidden: { scale: 0, rotate: -180, opacity: 0 },
    visible: {
        scale: 1,
        rotate: 0,
        opacity: 1,
        transition: { duration: 1.8, delay: 1.5, type: 'spring', stiffness: 80, damping: 12 }
    },
    hover: { scale: 1.1, rotate: 5, y: -10, transition: { duration: 0.4, type: 'spring', stiffness: 300 } }
};
const descWrapperVariants: Variants = {
    hidden: { y: 100, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 1.2, delay: 2.2 } }
};
const descVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 1.0, delay: 2.5 } }
};
const buttonVariants: Variants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
        scale: 1,
        opacity: 1,
        transition: { duration: 0.8, delay: 2.8, type: 'spring', stiffness: 200 }
    },
    hover: {
        scale: 1.05,
        boxShadow: '0 10px 25px rgba(255,255,255,0.2)',
        borderColor: '#4FC8FF',
        transition: { duration: 0.3 }
    },
    tap: { scale: 0.95 }
};
const gradientVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 2.0, delay: 1.5 } }
};

export default function HeroSection() {
    const router = useRouter();

    const handleDiscoveryClick = () => {
        router.push('/products?series=SX%20SERIES');
    };

    return (
        <section
            className="relative w-full h-[450px] xs:h-[500px] sm:h-[600px] md:h-[700px] lg:h-[800px] overflow-hidden"
            role="banner"
            aria-label="Hero section showcasing SCS S8X product"
        >
            <motion.div
                className="absolute inset-x-0 top-0 h-24 xs:h-32 sm:h-48 md:h-64 bg-gradient-to-t from-transparent to-[#0c131d] pointer-events-none z-10"
                variants={gradientVariants}
                initial="hidden"
                animate="visible"
                aria-hidden="true"
            />
            {/* Background Video */}
            <motion.video
                src={PRODUCT_INFO.VIDEO}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                variants={videoVariants}
                initial="hidden"
                animate="visible"
                aria-hidden="true"
            />

            {/* Dark Overlay */}
            <motion.div
                className="absolute inset-0 bg-black/60 z-10"
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                aria-hidden="true"
            />

            {/* Title */}
            <motion.h1
                className="absolute top-[12%] xs:top-[15%] sm:top-[18%] md:top-[16%] left-1/2 transform -translate-x-1/2 text-white text-[35px] xs:text-[45px] sm:text-[60px] md:text-[80px] lg:text-[100px] xl:text-[120px] font-sans leading-none z-20 text-center px-2"
                variants={titleVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
            >
                {PRODUCT_INFO.NAME}
            </motion.h1>

            {/* Product Image */}
            <motion.div
                className="absolute top-[16%] xs:top-[18%] sm:top-[20%] md:top-[18%] lg:top-[20%] left-1/2 transform -translate-x-1/2 z-25"
                variants={productVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
            >
                <Image
                    src={PRODUCT_INFO.IMAGE}
                    alt={PRODUCT_INFO.NAME}
                    width={384}
                    height={216}
                    className="object-contain drop-shadow-2xl w-[180px] xs:w-[220px] sm:w-[280px] md:w-[350px] lg:w-[384px] h-auto"
                    priority
                />
            </motion.div>

            {/* Description & Button */}
            <motion.div
                className="absolute bottom-[3%] xs:bottom-[4%] sm:bottom-[6%] md:bottom-[5%] left-1/2 transform -translate-x-1/2 text-center px-3 xs:px-4 sm:px-6 z-20 w-full max-w-[90%] sm:max-w-none"
                variants={descWrapperVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.p
                    className="text-white text-xs xs:text-sm sm:text-base md:text-lg max-w-sm xs:max-w-lg sm:max-w-xl md:max-w-2xl mx-auto mb-3 xs:mb-4 sm:mb-6 font-sans leading-relaxed"
                    variants={descVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {PRODUCT_INFO.DESCRIPTION}
                </motion.p>
                <motion.button
                    className="px-3 xs:px-4 sm:px-6 py-2 xs:py-2.5 sm:py-3 border border-white text-white text-xs xs:text-sm sm:text-base font-medium font-sans rounded-full hover:bg-white hover:text-black transition cursor-pointer min-w-[140px] xs:min-w-[160px] sm:min-w-auto"
                    variants={buttonVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover="hover"
                    whileTap="tap"
                    onClick={handleDiscoveryClick}
                    aria-label={`Discover more about ${PRODUCT_INFO.NAME}`}
                >
                    {PRODUCT_INFO.CTA_TEXT}
                </motion.button>
            </motion.div>

            {/* Gradient Overlay */}
            <motion.div
                className="absolute inset-x-0 bottom-0 h-24 xs:h-32 sm:h-48 md:h-64 bg-gradient-to-b from-transparent to-[#0c131d] pointer-events-none z-10"
                variants={gradientVariants}
                initial="hidden"
                animate="visible"
                aria-hidden="true"
            />

            {/* Floating Particles Effect */}
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    className="absolute w-2 h-2 bg-blue-400 rounded-full opacity-60"
                    style={{ left: p.left, top: p.top }}
                    animate={{ y: [-20, 20, -20], opacity: [0.3, 0.8, 0.3] }}
                    transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'easeInOut' }}
                />
            ))}

            {/* Animated Light Rays */}
            {lightRays.map((r) => (
                <motion.div
                    key={r.id}
                    className="absolute w-1 h-32 bg-gradient-to-b from-blue-400/30 to-transparent"
                    style={{ left: r.left, top: '10%', transform: 'rotate(12deg)' }}
                    animate={{ opacity: [0, 0.6, 0], scaleY: [0.5, 1, 0.5] }}
                    transition={{ duration: r.duration, delay: r.delay, repeat: Infinity, ease: 'easeInOut' }}
                />
            ))}
        </section>
    );
}
