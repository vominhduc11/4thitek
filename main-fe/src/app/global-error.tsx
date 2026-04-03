'use client';

import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import { FiAlertTriangle } from 'react-icons/fi';
import { useLanguage } from '@/context/LanguageContext';

const containerVariants: Variants = {
    hidden: { y: 50, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', duration: 0.8 } }
};

const iconVariants: Variants = {
    hidden: { rotate: 12, scale: 0.5, opacity: 0 },
    visible: { rotate: 0, scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 150, delay: 0.1 } }
};

const titleVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { delay: 0.25 } }
};

const descVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { delay: 0.35 } }
};

const actionsVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { delay: 0.55 } }
};

export default function GlobalError({ reset }: { reset: () => void }) {
    const { t } = useLanguage();

    return (
        <div className="brand-section flex min-h-screen flex-col items-center justify-center px-2 xs:px-4 sm:px-8 md:px-12 lg:px-20">
            <motion.div
                className="brand-card flex max-w-full flex-col items-center rounded-[32px] border border-[rgba(239,95,120,0.28)] px-4 py-8 text-center xs:max-w-md xs:p-8 sm:max-w-lg sm:p-10 md:max-w-xl md:p-12 lg:max-w-2xl lg:p-16"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.span
                    className="mb-3 rounded-full border border-[rgba(239,95,120,0.22)] bg-[rgba(239,95,120,0.14)] p-3 xs:p-4"
                    variants={iconVariants}
                >
                    <FiAlertTriangle size={32} className="text-[var(--destructive)] xs:hidden" />
                    <FiAlertTriangle size={44} className="hidden text-[var(--destructive)] xs:block sm:hidden" />
                    <FiAlertTriangle size={52} className="hidden text-[var(--destructive)] sm:block md:hidden" />
                    <FiAlertTriangle size={64} className="hidden text-[var(--destructive)] md:block lg:hidden" />
                    <FiAlertTriangle size={76} className="hidden text-[var(--destructive)] lg:block" />
                </motion.span>
                <motion.h1
                    className="mb-2 text-center font-serif text-xl font-semibold text-[var(--destructive-text)] xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl 3xl:text-8xl"
                    variants={titleVariants}
                >
                    {t('errors.global.title')}
                </motion.h1>
                <motion.p
                    className="mb-5 text-center text-sm text-[var(--text-secondary)] xs:text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl 3xl:text-5xl"
                    variants={descVariants}
                >
                    {t('errors.global.message')}
                </motion.p>
                <motion.div
                    className="mb-1 mt-1 flex w-full flex-col gap-2 xs:mt-2 xs:flex-row xs:gap-3"
                    variants={actionsVariants}
                >
                    <button
                        onClick={() => reset()}
                        className="brand-button-primary w-full rounded-full py-2 text-center text-sm font-semibold text-[var(--text-primary)] transition xs:flex-1 xs:py-2.5 xs:text-base"
                    >
                        {t('errors.global.tryAgain')}
                    </button>
                    <Link
                        href="/"
                        className="brand-button-secondary w-full rounded-full py-2 text-center text-sm font-semibold text-[var(--text-primary)] transition xs:flex-1 xs:py-2.5 xs:text-base"
                    >
                        {t('errors.global.goHome')}
                    </Link>
                </motion.div>
            </motion.div>
        </div>
    );
}
