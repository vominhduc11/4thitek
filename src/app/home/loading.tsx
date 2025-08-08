'use client';

import { motion } from 'framer-motion';

export default function Loading() {
    return (
        <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center px-4">
            <motion.div
                className="bg-[#151e2b] rounded-2xl shadow-2xl p-8 sm:p-12 flex flex-col items-center space-y-6 border border-gray-700/50 max-w-md w-full"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
            >
                {/* Main spinner */}
                <div className="relative">
                    <motion.div
                        className="w-16 h-16 border-4 border-gray-700 border-t-[#4FC8FF] rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: 'linear'
                        }}
                    />
                    {/* Inner spinner */}
                    <motion.div
                        className="absolute inset-3 border-2 border-transparent border-b-[#4FC8FF]/60 rounded-full"
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
                    <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl 3xl:text-7xl 4xl:text-8xl 5xl:text-9xl font-bold text-white mb-2">Đang tải trang chủ</h2>
                    <motion.p
                        className="text-gray-300 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl 5xl:text-6xl"
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: 1 }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            repeatType: 'reverse',
                            ease: 'easeInOut'
                        }}
                    >
                        Đang chuẩn bị trải nghiệm tuyệt vời...
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
