'use client';

import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import { FiBox } from 'react-icons/fi';
import { useLanguage } from '@/context/LanguageContext';
import { useHydration } from '@/hooks/useHydration';

const containerVariants: Variants = {
    hidden: { y: 40, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', duration: 0.7 } }
};
const iconVariants: Variants = {
    hidden: { rotate: -10, scale: 0.7, opacity: 0 },
    visible: { rotate: 0, scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 120, delay: 0.15 } }
};
const textBlockVariants: Variants = {
    hidden: { scale: 0.7, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { type: 'spring', delay: 0.2 } }
};
const titleVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { delay: 0.35 } }
};
const descVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { delay: 0.45 } }
};
const actionsVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { delay: 0.6 } }
};
const copyrightVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { delay: 0.9 } }
};

export default function NotFound() {
    const isHydrated = useHydration();
    const { t } = useLanguage();
    const currentYear = isHydrated ? new Date().getFullYear() : 2024;

    return (
        <div className="brand-section flex min-h-screen flex-col items-center justify-center px-2 xs:px-4 sm:px-8 md:px-12 lg:px-20">
            <motion.div
                className="brand-card flex max-w-full flex-col items-center rounded-[32px] border border-[var(--brand-border)] px-4 py-8 shadow-2xl xs:max-w-md xs:p-8 sm:max-w-lg sm:p-10 md:max-w-xl md:p-12 lg:max-w-2xl lg:p-16"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div
                    className="mb-4 flex flex-col items-center gap-2 xs:mb-6 xs:gap-3"
                    variants={textBlockVariants}
                >
                    <motion.span
                        className="mb-1 rounded-full border border-[var(--brand-border-strong)] bg-[rgba(41,171,226,0.14)] p-3 xs:mb-2 xs:p-4"
                        variants={iconVariants}
                    >
                        <FiBox className="h-7 w-7 text-[var(--brand-blue)] xs:h-10 xs:w-10 sm:h-12 sm:w-12 md:h-14 md:w-14 lg:h-16 lg:w-16" />
                    </motion.span>
                    <motion.h1
                        className="mb-1 text-center font-serif text-xl font-semibold text-white xs:mb-2 xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl"
                        variants={titleVariants}
                    >
                        {t('notFound.title')}
                    </motion.h1>
                    <motion.p
                        className="text-center text-sm text-[var(--text-secondary)] xs:text-base sm:text-lg md:text-xl"
                        variants={descVariants}
                    >
                        {t('notFound.description')}
                    </motion.p>
                </motion.div>
                <motion.div
                    className="mb-1 mt-3 flex w-full flex-col gap-2 xs:mt-4 xs:flex-row xs:gap-3"
                    variants={actionsVariants}
                >
                    <Link
                        href="/"
                        className="brand-button-primary w-full rounded-full py-2 text-center text-sm font-semibold text-[var(--text-primary)] transition xs:flex-1 xs:py-2.5 xs:text-base"
                    >
                        {t('notFound.backHome')}
                    </Link>
                    <Link
                        href="/products"
                        className="brand-button-secondary w-full rounded-full py-2 text-center text-sm font-semibold text-[var(--brand-blue)] transition hover:bg-[rgba(41,171,226,0.12)] xs:flex-1 xs:py-2.5 xs:text-base"
                    >
                        {t('notFound.viewProducts')}
                    </Link>
                </motion.div>
                <motion.p
                    className="mt-4 text-center text-xs text-[var(--text-muted)] xs:mt-6 xs:text-sm"
                    variants={copyrightVariants}
                >
                    {t('notFound.footer').replace('{year}', String(currentYear))}
                </motion.p>
            </motion.div>
        </div>
    );
}
