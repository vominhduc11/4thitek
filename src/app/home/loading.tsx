'use client';

import { motion } from 'framer-motion';

export default function Loading() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
            <motion.div
                className="bg-white rounded-2xl shadow-2xl p-12 flex flex-col items-center space-y-6"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
            >
                {/* Main spinner */}
                <div className="relative">
                    <motion.div
                        className="w-16 h-16 border-4 border-gray-200 border-t-[#4FC8FF] rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: 'linear'
                        }}
                    />
                    {/* Inner spinner */}
                    <motion.div
                        className="absolute inset-3 border-2 border-transparent border-b-blue-400 rounded-full"
                        animate={{ rotate: -360 }}
                        transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            ease: 'linear'
                        }}
                    />
                </div>

                {/* Loading text */}
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Loading Home</h2>
                    <motion.p
                        className="text-gray-600"
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: 1 }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            repeatType: 'reverse',
                            ease: 'easeInOut'
                        }}
                    >
                        Preparing your experience...
                    </motion.p>
                </motion.div>

                {/* Animated dots */}
                <div className="flex space-x-2">
                    {[0, 1, 2].map((index) => (
                        <motion.div
                            key={index}
                            className="w-3 h-3 bg-[#4FC8FF] rounded-full"
                            animate={{
                                scale: [1, 1.3, 1],
                                opacity: [0.5, 1, 0.5]
                            }}
                            transition={{
                                duration: 1.2,
                                repeat: Infinity,
                                delay: index * 0.2,
                                ease: 'easeInOut'
                            }}
                        />
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
