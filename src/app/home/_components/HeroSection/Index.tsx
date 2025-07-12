'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useHeroSection } from './useHeroSection';
import { PRODUCT_INFO } from './constants';
import FloatingParticles from './FloatingParticles';
import LightRays from './LightRays';
import {
    buttonVariants,
    descVariants,
    descWrapperVariants,
    gradientVariants,
    overlayVariants,
    productVariants,
    titleVariants,
    videoVariants
} from './config';

function HeroSection() {
    const { particles, lightRays } = useHeroSection();

    return (
        <section 
            className="relative w-full h-[450px] xs:h-[500px] sm:h-[600px] md:h-[700px] lg:h-[800px] overflow-hidden"
            role="banner"
            aria-label="Hero section showcasing SCS S8X product"
        >
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
                className="absolute top-[12%] xs:top-[15%] sm:top-[18%] md:top-[16%] left-1/2 transform -translate-x-1/2 text-white text-[45px] xs:text-[55px] sm:text-[80px] md:text-[120px] lg:text-[160px] xl:text-[200px] font-sans leading-none z-20 text-center px-2"
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
            <FloatingParticles particles={particles} />

            {/* Animated Light Rays */}
            <LightRays lightRays={lightRays} />
        </section>
    );
}

export default HeroSection;
