'use client';

import { motion } from 'framer-motion';

interface LoadingProps {
    title?: string;
    message?: string;
    size?: 'sm' | 'md' | 'lg';
    fullScreen?: boolean;
}

export default function Loading({ 
    title = "Đang tải",
    message = "Vui lòng chờ trong giây lát...",
    size = 'md',
    fullScreen = true
}: LoadingProps) {
    const sizeClasses = {
        sm: {
            spinner: 'w-12 h-12',
            container: 'p-6',
            title: 'text-lg',
            message: 'text-sm'
        },
        md: {
            spinner: 'w-16 h-16',
            container: 'p-8 sm:p-12',
            title: 'text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl 3xl:text-7xl 4xl:text-8xl 5xl:text-9xl',
            message: 'text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl 5xl:text-6xl'
        },
        lg: {
            spinner: 'w-20 h-20',
            container: 'p-12 sm:p-16',
            title: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl 3xl:text-8xl 4xl:text-9xl 5xl:text-[6rem]',
            message: 'text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl 3xl:text-5xl 4xl:text-6xl 5xl:text-7xl'
        }
    };

    const containerClass = fullScreen 
        ? "min-h-screen bg-[#0a0f1a] flex items-center justify-center px-4"
        : "min-h-[400px] bg-[#0a0f1a] flex items-center justify-center px-4";

    return (
        <div className={containerClass}>
            <motion.div
                className={`bg-[#151e2b] rounded-2xl shadow-2xl ${sizeClasses[size].container} flex flex-col items-center space-y-6 border border-gray-700/50 max-w-md w-full`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
            >
                {/* Main spinner */}
                <div className="relative">
                    <motion.div
                        className={`${sizeClasses[size].spinner} border-4 border-gray-700 border-t-[#4FC8FF] rounded-full`}
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
                    <h2 className={`${sizeClasses[size].title} font-bold text-white mb-2`}>{title}</h2>
                    <motion.p
                        className={`text-gray-300 ${sizeClasses[size].message}`}
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: 1 }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            repeatType: 'reverse',
                            ease: 'easeInOut'
                        }}
                    >
                        {message}
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