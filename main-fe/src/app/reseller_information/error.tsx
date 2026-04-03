'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiAlertTriangle } from 'react-icons/fi';
import { useLanguage } from '@/context/LanguageContext';

export default function ResellerInfoError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    const { t } = useLanguage();

    useEffect(() => {
        console.error('Reseller Information page error:', error);
    }, [error]);

    return (
        <motion.div
            className="brand-section flex min-h-screen items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
        >
            <motion.div
                className="brand-card max-w-md w-full rounded-[28px] border border-[rgba(239,95,120,0.28)] p-8 text-center"
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(239,95,120,0.14)]">
                    <FiAlertTriangle className="h-8 w-8 text-[var(--destructive)]" />
                </div>
                <h3 className="mb-2 font-serif text-xl font-semibold text-[var(--destructive-text)]">
                    {t('errors.pages.resellerInfo.title')}
                </h3>
                <p className="mb-6 text-[var(--text-secondary)]">
                    {error.message || t('errors.pages.resellerInfo.message')}
                </p>

                <div className="flex gap-3">
                    <motion.button
                        onClick={reset}
                        className="brand-button-primary flex-1 rounded-full px-4 py-3 font-semibold text-[var(--text-primary)]"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {t('errors.global.tryAgain')}
                    </motion.button>

                    <motion.a
                        href="/"
                        className="brand-button-secondary inline-block flex-1 rounded-full px-4 py-3 text-center font-semibold text-[var(--text-primary)]"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        {t('errors.global.goHome')}
                    </motion.a>
                </div>
            </motion.div>
        </motion.div>
    );
}
