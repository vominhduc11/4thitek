'use client';

import { motion, Variants } from 'framer-motion';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';
import Link from 'next/link';

interface ErrorProps {
    title?: string;
    message?: string;
    showRetry?: boolean;
    onRetry?: () => void;
    showHome?: boolean;
}

const containerVariants: Variants = {
    hidden: { y: 50, opacity: 0, scale: 0.95 },
    visible: { 
        y: 0, 
        opacity: 1, 
        scale: 1,
        transition: { 
            type: 'spring', 
            duration: 0.8,
            staggerChildren: 0.1
        } 
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

export default function Error({ 
    title = "Error occurred",
    message = "Something went wrong. Please try again later.",
    showRetry = true,
    onRetry,
    showHome = true
}: ErrorProps) {
    return (
        <div className="min-h-[400px] flex items-center justify-center p-4 bg-[#0a0f1a]">
            <motion.div
                className="bg-[#151e2b] rounded-xl shadow-lg p-6 sm:p-8 max-w-md w-full text-center border border-gray-700/50"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div
                    className="bg-red-900/20 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center"
                    variants={itemVariants}
                >
                    <FiAlertTriangle className="text-red-400 text-3xl" />
                </motion.div>

                <motion.h2 
                    className="text-xl font-bold text-white mb-3"
                    variants={itemVariants}
                >
                    {title}
                </motion.h2>

                <motion.p 
                    className="text-gray-300 mb-6 leading-relaxed"
                    variants={itemVariants}
                >
                    {message}
                </motion.p>

                <motion.div 
                    className="flex flex-col sm:flex-row gap-3"
                    variants={itemVariants}
                >
                    {showRetry && onRetry && (
                        <button
                            onClick={onRetry}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#4FC8FF] hover:bg-[#4FC8FF]/90 text-white rounded-lg font-medium transition-colors duration-300"
                        >
                            <FiRefreshCw className="text-sm" />
                            Try Again
                        </button>
                    )}
                    
                    {showHome && (
                        <Link
                            href="/home"
                            className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white rounded-lg font-medium transition-all duration-300"
                        >
                            <FiHome className="text-sm" />
                            Go Home
                        </Link>
                    )}
                </motion.div>
            </motion.div>
        </div>
    );
}