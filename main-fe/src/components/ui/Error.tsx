'use client';

import { motion, Variants } from 'framer-motion';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';

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
    title,
    message,
    showRetry = true,
    onRetry,
    showHome = true
}: ErrorProps) {
    const { t } = useLanguage();
    const displayTitle = title ?? t('errors.global.title');
    const displayMessage = message ?? t('errors.global.message');
    return (
        <div className="flex min-h-[400px] items-center justify-center bg-[#07111a] p-4">
            <motion.div
                className="brand-card relative w-full max-w-md overflow-hidden rounded-[28px] p-6 text-center sm:p-8"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--brand-blue)] to-transparent" />
                <motion.div
                    className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-[rgba(255,132,132,0.26)] bg-[rgba(124,24,35,0.28)]"
                    variants={itemVariants}
                >
                    <FiAlertTriangle className="text-3xl text-[#ff8585]" />
                </motion.div>

                <motion.h2
                    className="mb-3 font-serif text-xl font-bold text-[var(--text-primary)]"
                    variants={itemVariants}
                >
                    {displayTitle}
                </motion.h2>

                <motion.p
                    className="mb-6 leading-relaxed text-[var(--text-secondary)]"
                    variants={itemVariants}
                >
                    {displayMessage}
                </motion.p>

                <motion.div
                    className="flex flex-col gap-3 sm:flex-row"
                    variants={itemVariants}
                >
                    {showRetry && onRetry && (
                        <button
                            onClick={onRetry}
                            className="brand-button-primary flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-colors duration-300"
                        >
                            <FiRefreshCw className="text-sm" />
                            {t('common.retry')}
                        </button>
                    )}

                    {showHome && (
                        <Link
                            href="/"
                            className="brand-button-secondary flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium transition-all duration-300"
                        >
                            <FiHome className="text-sm" />
                            {t('common.backToHome')}
                        </Link>
                    )}
                </motion.div>
            </motion.div>
        </div>
    );
}
