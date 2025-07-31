'use client';

import { useState, useCallback } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import AvoidSidebar from '@/components/layout/AvoidSidebar';

// Types
/**
 * Represents a featured product item
 */
export interface FeaturedItem {
    /** Unique identifier for the item */
    id: number;
    /** Product title/name */
    title: string;
    /** Product image URL */
    img: string;
    /** Product description */
    description: string;
}

/**
 * Direction for carousel navigation
 */
export type CarouselDirection = -1 | 0 | 1;

/**
 * Animation variant keys
 */
export type AnimationVariant = 'enter' | 'center' | 'exit' | 'hidden' | 'visible' | 'hover' | 'tap';

// Mock Data
export const featuredItems: FeaturedItem[] = [
    {
        id: 1,
        title: 'SCS S8X Pro',
        img: '/products/product1.png',
        description:
            'Advanced communication device with Bluetooth 5.0 technology, waterproof design, and crystal clear audio quality for professional use.'
    },
    {
        id: 2,
        title: 'SCS G+ Elite',
        img: '/products/product2.png',
        description:
            'Premium position featuring enhanced noise cancellation, extended battery life, and seamless group communication capabilities.'
    },
    {
        id: 3,
        title: 'SCS S Ultimate',
        img: '/products/product3.png',
        description:
            'Reliable and durable communication solution designed for everyday use with superior sound quality and ergonomic design.'
    }
] as const;

// Animation Variants Configuration
export const imageVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 300 : -300,
        opacity: 0,
        rotateY: direction > 0 ? 35 : -35,
        scale: 0.95
    }),
    center: {
        x: 0,
        opacity: 1,
        rotateY: 0,
        scale: 1
    },
    exit: (direction: number) => ({
        x: direction < 0 ? 300 : -300,
        opacity: 0,
        rotateY: direction < 0 ? 35 : -35,
        scale: 0.95
    })
} as const;

export const infoVariants = {
    enter: { opacity: 0, y: 40 },
    center: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -40 }
} as const;

export const titleVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
} as const;

export const arrowVariants = {
    hover: { scale: 1.15 },
    tap: { scale: 0.9 }
} as const;

export const dotVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    hover: { scale: 1.2 },
    tap: { scale: 0.95 }
} as const;

export const headingVariants = {
    hidden: { opacity: 0, y: -30 },
    visible: { opacity: 1, y: 0 }
} as const;

export const patternVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            duration: 1.0,
            delay: 0.2
        }
    }
} as const;

export const buttonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1 },
    hover: {
        scale: 1.05,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderColor: '#4FC8FF',
        color: '#4FC8FF'
    },
    tap: { scale: 0.95 }
} as const;

// Main ProductFeature Component
export default function ProductFeature() {
    // State
    const [activeIndex, setActiveIndex] = useState(0);
    const [direction, setDirection] = useState<CarouselDirection>(0);
    const router = useRouter();

    // Helper functions
    const goToPrevious = useCallback(() => {
        setDirection(-1);
        setActiveIndex((current) => (current > 0 ? current - 1 : featuredItems.length - 1));
    }, []);

    const goToNext = useCallback(() => {
        setDirection(1);
        setActiveIndex((current) => (current + 1) % featuredItems.length);
    }, []);

    const goToIndex = useCallback(
        (index: number) => {
            if (index < 0 || index >= featuredItems.length) return;

            setDirection(index > activeIndex ? 1 : -1);
            setActiveIndex(index);
        },
        [activeIndex]
    );

    const handleDiscoveryClick = useCallback(() => {
        const activeItem = featuredItems[activeIndex];

        // Navigate to appropriate product position based on the active product
        if (activeItem.title.includes('S8X')) {
            router.push('/products?position=Premium');
        } else if (activeItem.title.includes('G+')) {
            router.push('/products?position=Ultimate');
        } else if (activeItem.title.includes('G')) {
            router.push('/products?position=Mid-range');
        } else if (activeItem.title.includes('S')) {
            router.push('/products?position=Entry');
        } else {
            // Default to products page if no match
            router.push('/products');
        }
    }, [activeIndex, router]);

    const activeItem = featuredItems[activeIndex];

    return (
        <AvoidSidebar>
            <section className="relative overflow-hidden bg-gradient-to-b from-[#0c131d] to-[#001A35] py-12 sm:py-16 md:py-24">
                <div className="sidebar-aware-container">
                    {/* Dot Grid Pattern */}
                    <motion.div
                        className="absolute inset-0 pointer-events-none z-0"
                        style={{
                            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(79, 200, 255, 0.15) 1px, transparent 0)`,
                            backgroundSize: '40px 40px'
                        }}
                        variants={patternVariants}
                        initial="hidden"
                        animate="visible"
                    />

                    {/* Secondary overlay pattern for more distinction */}
                    <motion.div
                        className="absolute inset-0 pointer-events-none z-0"
                        style={{
                            backgroundImage: `linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px)`,
                            backgroundSize: '20px 20px'
                        }}
                        variants={patternVariants}
                        initial="hidden"
                        animate="visible"
                    />

                    {/* Heading */}
                    <motion.h2
                        className="relative z-10 text-center text-2xl sm:text-3xl md:text-4xl font-medium text-white mb-8 sm:mb-10 md:mb-12 font-sans"
                        variants={headingVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        Our Featured Products
                    </motion.h2>

                    {/* Carousel */}
                    <div className="relative flex items-center justify-center z-10 px-16 sm:px-20">
                        {/* Left Arrow */}
                        <motion.button
                            onClick={goToPrevious}
                            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full transition z-20 border border-white/20"
                            variants={arrowVariants}
                            whileHover="hover"
                            whileTap="tap"
                            aria-label="Previous product"
                        >
                            <FiChevronLeft size={20} className="sm:w-6 sm:h-6" color="white" />
                        </motion.button>

                        {/* Product Image */}
                        <div className="w-[280px] sm:w-[350px] md:w-[400px] h-[210px] sm:h-[260px] md:h-[300px] relative group">
                            <AnimatePresence initial={false} custom={direction} mode="wait">
                                <motion.img
                                    key={activeItem.id}
                                    src={
                                        activeItem.img || 'https://thinkzone.vn/uploads/2022_01/blogging-1641375905.jpg'
                                    }
                                    alt={activeItem.title}
                                    custom={direction}
                                    variants={imageVariants}
                                    initial="enter"
                                    animate="center"
                                    exit="exit"
                                    whileHover={{ scale: 1.12 }}
                                    transition={{
                                        x: { type: 'spring', stiffness: 300, damping: 30 },
                                        opacity: { duration: 0.3 },
                                        scale: { duration: 0.4 },
                                        rotateY: { duration: 0.4 }
                                    }}
                                    className="absolute inset-0 w-full h-full object-contain"
                                    style={{ perspective: '1000px' }}
                                />
                            </AnimatePresence>
                        </div>

                        {/* Right Arrow */}
                        <motion.button
                            onClick={goToNext}
                            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full transition z-20 border border-white/20"
                            variants={arrowVariants}
                            whileHover="hover"
                            whileTap="tap"
                            aria-label="Next product"
                        >
                            <FiChevronRight size={20} className="sm:w-6 sm:h-6" color="white" />
                        </motion.button>
                    </div>

                    {/* Product Info */}
                    <div className="mt-6 sm:mt-8 text-center z-10 max-w-lg sm:max-w-xl mx-auto relative px-4">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeItem.id}
                                variants={infoVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.5, ease: 'easeInOut' }}
                                className="grid grid-rows-[auto_1fr_auto] min-h-[200px] sm:min-h-[220px] gap-3 sm:gap-4"
                            >
                                <motion.h3
                                    className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#4FC8FF] font-sans"
                                    variants={titleVariants}
                                    transition={{ duration: 0.6, ease: 'easeOut' }}
                                >
                                    {activeItem.title}
                                </motion.h3>
                                <motion.p
                                    className="text-sm sm:text-base md:text-lg text-white/80 leading-relaxed font-sans flex items-center justify-center text-center"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                >
                                    {activeItem.description}
                                </motion.p>
                                <motion.button
                                    className="px-4 sm:px-6 py-2 border border-white text-white text-sm sm:text-base font-medium font-sans hover:bg-white/10 rounded-full transition cursor-pointer justify-self-center"
                                    variants={buttonVariants}
                                    initial="hidden"
                                    animate="visible"
                                    whileHover="hover"
                                    whileTap="tap"
                                    onClick={handleDiscoveryClick}
                                    aria-label={`Discover ${activeItem.title}`}
                                >
                                    DISCOVERY NOW
                                </motion.button>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* Dot Indicators */}
                    <motion.div
                        className="flex justify-center mt-8 space-x-2"
                        variants={dotVariants}
                        initial="hidden"
                        animate="visible"
                        role="tablist"
                        aria-label="Product navigation"
                    >
                        {featuredItems.map((item, index) => (
                            <motion.button
                                key={item.id}
                                onClick={() => goToIndex(index)}
                                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                    index === activeIndex ? 'bg-[#4FC8FF] scale-125' : 'bg-white/40 hover:bg-white/60'
                                }`}
                                variants={dotVariants}
                                whileHover="hover"
                                whileTap="tap"
                                role="tab"
                                aria-selected={index === activeIndex}
                                aria-label={`Go to ${item.title}`}
                            />
                        ))}
                    </motion.div>
                </div>
            </section>
        </AvoidSidebar>
    );
}
