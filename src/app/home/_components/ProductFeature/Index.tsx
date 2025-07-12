'use client';

import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { featuredItems } from './mockdata';
import { useProductFeature } from './useProductFeature';
import { ANIMATION_DURATION, SPRING_CONFIG } from './constants';
import {
    imageVariants,
    infoVariants,
    titleVariants,
    arrowVariants,
    dotVariants,
    headingVariants,
    patternVariants,
    buttonVariants
} from './config';

export default function ProductFeature() {
    const { activeIndex, direction, goToPrevious, goToNext, goToIndex } = useProductFeature(featuredItems.length);
    const activeItem = featuredItems[activeIndex];

    return (
        <section className="relative overflow-hidden bg-gradient-to-b from-[#0c131d] to-[#001A35] py-12 sm:py-16 md:py-24">
            <div className="sidebar-aware-container">
                {/* Diagonal Pattern */}
                <motion.div
                    className="absolute inset-0 pointer-events-none z-0"
                    style={{
                        backgroundImage: `repeating-linear-gradient(30deg, rgba(255,255,255,0.05) 0, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 80px)`
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
                                src={activeItem.img}
                                alt={activeItem.title}
                                custom={direction}
                                variants={imageVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                whileHover={{ scale: 1.12 }}
                                transition={{
                                    x: { type: 'spring', ...SPRING_CONFIG },
                                    opacity: { duration: ANIMATION_DURATION.FAST },
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
                            transition={{ duration: ANIMATION_DURATION.NORMAL, ease: 'easeInOut' }}
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
                                transition={{ duration: ANIMATION_DURATION.NORMAL, delay: 0.2 }}
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
    );
}
