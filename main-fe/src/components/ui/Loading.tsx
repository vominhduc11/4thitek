'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';

interface LoadingProps {
    title?: string;
    message?: string;
    size?: 'sm' | 'md' | 'lg';
    fullScreen?: boolean;
}

export default function Loading({
    title,
    message,
    size = 'md',
    fullScreen = true
}: LoadingProps) {
    const { t } = useLanguage();
    const displayTitle = title ?? t('common.loading');
    const displayMessage = message ?? t('common.loadingMessage');
    const sizeClasses = {
        sm: {
            spinner: 'h-12 w-12',
            container: 'p-6',
            title: 'text-lg',
            message: 'text-sm'
        },
        md: {
            spinner: 'h-16 w-16',
            container: 'p-8 sm:p-12',
            title: 'text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl 3xl:text-7xl',
            message: 'text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 2xl:text-3xl 3xl:text-4xl'
        },
        lg: {
            spinner: 'h-20 w-20',
            container: 'p-12 sm:p-16',
            title: 'text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl 3xl:text-8xl',
            message: 'text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl 3xl:text-5xl'
        }
    };

    const containerClass = fullScreen
        ? 'flex min-h-screen items-center justify-center bg-[#07111a] px-4'
        : 'flex min-h-[400px] items-center justify-center bg-[#07111a] px-4';

    return (
        <div className={containerClass}>
            <motion.div
                className={`brand-card relative flex w-full max-w-md flex-col items-center space-y-6 overflow-hidden rounded-[28px] ${sizeClasses[size].container}`}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
            >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--brand-blue)] to-transparent" />
                <div className="relative">
                    <motion.div
                        className={`${sizeClasses[size].spinner} rounded-full border-4 border-[var(--brand-border)] border-t-[var(--brand-blue)]`}
                        animate={{ rotate: 360 }}
                        transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: 'linear'
                        }}
                    />
                    <motion.div
                        className="absolute inset-3 rounded-full border-2 border-transparent border-b-[var(--brand-gradient-end)]"
                        animate={{ rotate: -360 }}
                        transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            ease: 'linear'
                        }}
                    />
                </div>

                <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                >
                    <p className="brand-eyebrow mb-3 text-[0.72rem]">{t('brand.message')}</p>
                    <h2 className={`${sizeClasses[size].title} mb-2 font-serif font-bold text-[var(--text-primary)]`}>{displayTitle}</h2>
                    <motion.p
                        className={`${sizeClasses[size].message} text-[var(--text-secondary)]`}
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: 1 }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            repeatType: 'reverse',
                            ease: 'easeInOut'
                        }}
                    >
                        {displayMessage}
                    </motion.p>
                </motion.div>

                <div className="flex space-x-2">
                    {[0, 1, 2].map((index) => (
                        <motion.div
                            key={index}
                            className="h-3 w-3 rounded-full bg-[var(--brand-blue)]"
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
