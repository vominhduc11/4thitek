'use client';

import { motion } from 'framer-motion';
import { newsItems } from './mockdata';
import { useNewsroom } from './useNewsroom';
import { LAYOUT } from './constants';
import NewsCard from './NewsCard';

export default function Newsroom() {
    const { animationVariants, backgroundDots } = useNewsroom();

    return (
        <motion.section
            className="relative bg-gradient-to-b from-[#001A35] to-[#0c131d] py-16 sm:py-20 md:py-24 overflow-hidden"
            {...animationVariants.section}
            viewport={{ once: true, amount: 0.2 }}
        >
            <div className="sidebar-aware-container">
                {/* Header Section */}
                <motion.div
                    className="text-center text-white z-10 mb-8 sm:mb-10 md:mb-12"
                    {...animationVariants.header}
                    viewport={{ once: true }}
                >
                    <motion.h2
                        className="text-3xl sm:text-4xl md:text-5xl font-semibold font-sans"
                        whileHover={{
                            scale: 1.05,
                            color: '#4FC8FF',
                            transition: { duration: 0.3 }
                        }}
                    >
                        Newsroom
                    </motion.h2>
                    <motion.p
                        className="mt-2 sm:mt-3 text-sm sm:text-base uppercase tracking-wider font-sans"
                        {...animationVariants.subtitle}
                        viewport={{ once: true }}
                    >
                        #RIDING, EXPLORING, ENJOYING
                    </motion.p>
                    <motion.span
                        className="mt-1 sm:mt-2 text-xs sm:text-sm text-white/70 block font-sans"
                        {...animationVariants.tagline}
                        viewport={{ once: true }}
                    >
                        SCSETC is here for your Ride...
                    </motion.span>
                </motion.div>

                {/* News Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-6 z-10 relative">
                    {newsItems.map((post, index) => (
                        <NewsCard
                            key={post.id}
                            post={post}
                            index={index}
                            animationVariant={animationVariants.newsItem(index)}
                        />
                    ))}
                </div>

                {/* Explore More Button */}
                <motion.div
                    className="text-center mt-8 sm:mt-10 z-10 relative"
                    {...animationVariants.button}
                    viewport={{ once: true }}
                >
                    <motion.button
                        className="px-6 sm:px-8 py-2 sm:py-3 border border-white text-white hover:bg-white/10 rounded-full transition text-sm sm:text-base font-medium font-sans"
                        whileHover={{
                            scale: LAYOUT.BUTTON_HOVER_SCALE,
                            borderColor: '#4FC8FF',
                            color: '#4FC8FF',
                            boxShadow: '0 10px 25px rgba(79, 200, 255, 0.2)'
                        }}
                        whileTap={{ scale: LAYOUT.BUTTON_TAP_SCALE }}
                        transition={{ duration: 0.3 }}
                        aria-label="Explore more news articles"
                    >
                        Explore More
                    </motion.button>
                </motion.div>

                {/* Background Animated Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {backgroundDots.map((dot) => (
                        <motion.div
                            key={dot.id}
                            className="absolute w-1 h-1 bg-blue-400/30 rounded-full"
                            style={{
                                left: dot.left,
                                top: dot.top
                            }}
                            animate={dot.animate}
                            transition={dot.transition}
                        />
                    ))}
                </div>
            </div>
        </motion.section>
    );
}
