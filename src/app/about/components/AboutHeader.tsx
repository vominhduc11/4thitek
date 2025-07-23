'use client';

import { motion } from 'framer-motion';

export default function AboutHeader() {
    return (
        <div className="ml-16 sm:ml-20 -mt-16 sm:-mt-20 lg:-mt-24 relative z-20 py-4 sm:py-6 lg:py-8">
            <div className="px-4 sm:px-12 md:px-16 lg:px-20">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                >
                    <motion.h1
                        className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 font-mono text-[#4FC8FF]"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    >
                        ABOUT US
                    </motion.h1>

                    <motion.p
                        className="text-gray-300 text-sm sm:text-base lg:text-lg mb-8 leading-relaxed max-w-4xl"
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
