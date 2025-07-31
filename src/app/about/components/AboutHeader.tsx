'use client';

import { motion } from 'framer-motion';

export default function AboutHeader() {
    return (
        <div className="ml-16 sm:ml-20 mr-4 sm:mr-12 md:mr-16 lg:mr-20 -mt-16 sm:-mt-20 lg:-mt-24 relative z-20 py-4 sm:py-6 lg:py-8">
            <div className="px-4 sm:px-12 md:px-16 lg:px-20 2xl:px-24 3xl:px-32 4xl:px-40">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                >
                    <motion.h1
                        className="text-3xl sm:text-4xl lg:text-5xl 2xl:text-6xl 3xl:text-7xl 4xl:text-8xl font-bold mb-2 font-mono text-[#4FC8FF]"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    >
                        ABOUT US
                    </motion.h1>

                    <motion.p
                        className="text-gray-300 text-sm sm:text-base lg:text-lg 2xl:text-xl 3xl:text-2xl 4xl:text-3xl mb-8 leading-relaxed max-w-4xl 2xl:max-w-5xl 3xl:max-w-6xl 4xl:max-w-7xl"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        At 4thitek, we believe that exceptional audio is not just heard—it&apos;s experienced. Our
                        journey began with a simple mission: to create audio products that deliver uncompromising sound
                        quality, innovative design, and reliable performance.
                    </motion.p>
                </motion.div>
            </div>
        </div>
    );
}
