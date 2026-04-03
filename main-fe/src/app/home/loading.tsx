'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';

export default function Loading() {
    const { t } = useLanguage();
    return (
        <div className="brand-section flex min-h-screen items-center justify-center px-4">
            <motion.div
                className="brand-card flex max-w-md w-full flex-col items-center space-y-6 rounded-[30px] border border-[var(--brand-border)] p-8 shadow-2xl sm:p-12"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
            >
                <div className="relative">
                    <motion.div
                        className="h-16 w-16 rounded-full border-4 border-[rgba(133,170,197,0.18)] border-t-[var(--brand-blue)]"
                        animate={{ rotate: 360 }}
                        transition={{
                            duration: 1,
                            repeat: Infinity,
                            ease: 'linear'
                        }}
                    />
                    <motion.div
                        className="absolute inset-3 rounded-full border-2 border-transparent border-b-[rgba(41,171,226,0.6)]"
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
                    <h2 className="mb-2 font-serif text-2xl font-semibold text-[var(--brand-blue)] sm:text-3xl">
                        {t('home.loadingTitle')}
                    </h2>
                    <motion.p
                        className="text-sm text-[var(--text-secondary)] sm:text-base"
                        initial={{ opacity: 0.5 }}
                        animate={{ opacity: 1 }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            repeatType: 'reverse',
                            ease: 'easeInOut'
                        }}
                    >
                        {t('home.loadingMessage')}
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
