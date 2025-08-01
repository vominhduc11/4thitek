'use client';

import { motion } from 'framer-motion';

export default function CertificationHeader() {
    return (
        <div className="ml-16 sm:ml-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 -mt-16 sm:-mt-20 lg:-mt-24 relative z-20 py-4 sm:py-6 lg:py-8">
            <div>
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
                        CERTIFICATION
                    </motion.h1>

                    <motion.p
                        className="text-gray-300 text-sm sm:text-base lg:text-lg mb-8 leading-relaxed max-w-4xl"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        Our products meet the highest industry standards and have received certifications from leading
                        international organizations. These certifications ensure that our audio devices deliver
                        exceptional quality, safety, and performance.
                    </motion.p>
                </motion.div>
            </div>
        </div>
    );
}
