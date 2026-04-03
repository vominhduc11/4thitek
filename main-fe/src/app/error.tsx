'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiAlertTriangle } from 'react-icons/fi';
import { useLanguage } from '@/context/LanguageContext';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    const { t } = useLanguage();

    useEffect(() => {
        console.error('Global error caught:', error);
    }, [error]);

    return (
        <html>
            <body className="brand-section">
                <motion.div
                    className="flex min-h-screen items-center justify-center p-4"
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
                        <motion.div
                            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(239,95,120,0.14)]"
                            animate={{ rotate: [0, -5, 5, 0] }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                        >
                            <FiAlertTriangle className="h-8 w-8 text-[var(--destructive)]" />
                        </motion.div>

                        <h1 className="mb-3 font-serif text-2xl font-semibold text-[var(--destructive-text)]">
                            {t('errors.global.title')}
                        </h1>

                        <p className="mb-6 text-[var(--text-secondary)]">
                            {error.message || t('errors.global.message')}
                        </p>

                        {process.env.NODE_ENV === 'development' && (
                            <details className="mb-6 rounded-2xl border border-[rgba(239,95,120,0.18)] bg-[rgba(65,13,22,0.22)] p-3 text-left">
                                <summary className="mb-2 cursor-pointer font-semibold text-[var(--destructive-text)]">
                                    {t('errors.global.devDetailsTitle')}
                                </summary>
                                <pre className="max-h-40 overflow-auto text-xs text-[var(--destructive-text)]">
                                    {error.stack}
                                </pre>
                            </details>
                        )}

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

                        {error.digest && (
                            <p className="mt-4 text-xs text-[var(--text-muted)]">
                                {t('errors.global.errorId')} {error.digest}
                            </p>
                        )}
                    </motion.div>
                </motion.div>
            </body>
        </html>
    );
}
