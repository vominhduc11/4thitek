'use client';

import { motion } from 'framer-motion';

const ProductsHero = () => {
    return (
        <section className="relative w-full h-[400px] overflow-hidden">
            {/* Background Video */}
            <motion.video
                src="/videos/motorbike-road-trip-2022-07-26-01-49-02-utc.mp4"
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                initial={{ scale: 1.1, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 2, ease: 'easeOut' }}
            />

            {/* Dark Overlay */}
            <motion.div
                className="absolute inset-0 bg-black/60 z-10"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1.5, delay: 0.5 }}
            />

            {/* Breadcrumb - Bottom Left */}
            <motion.div
                className="absolute bottom-16 sm:bottom-20 lg:bottom-24 left-20 sm:left-24 z-20"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 1.2 }}
            >
                <div className="px-12 sm:px-16 lg:px-20">
                    <nav className="flex items-center space-x-2 text-sm">
                        <motion.a
                            href="/home"
                            className="text-gray-300 hover:text-[#4FC8FF] transition-colors duration-300"
                            whileHover={{ scale: 1.05 }}
                        >
                            Home
                        </motion.a>
                        <span className="text-gray-500">/</span>
                        <span className="text-white font-medium">Products</span>
                    </nav>
                </div>
            </motion.div>

            {/* Gradient Overlay - Transition to content below */}
            <motion.div
                className="
          absolute inset-x-0 bottom-0
          h-24 xs:h-32 sm:h-48 md:h-64
          bg-gradient-to-b
          from-transparent
          to-[#0c131d]
          pointer-events-none
          z-10
        "
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 2, delay: 1.5 }}
            />
        </section>
    );
};

export default ProductsHero;
