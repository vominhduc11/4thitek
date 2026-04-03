'use client';

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { FaFacebookF, FaYoutube } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { Z_INDEX } from '@/constants/zIndex';
import { SOCIAL_URLS } from '@/constants/urls';
import { modalManager } from '@/utils/modalManager';

interface SideDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SideDrawer({ isOpen, onClose }: SideDrawerProps) {
    const { t } = useLanguage();
    const router = useRouter();

    const handleProductsNavigation = () => {
        onClose();
        router.push('/products');
    };

    const handleHomeNavigation = () => {
        onClose();
        router.push('/');
    };

    const handleBlogNavigation = () => {
        onClose();
        router.push('/blogs');
    };

    useEffect(() => {
        if (isOpen) {
            modalManager.openModal('side-drawer');
        } else {
            modalManager.closeModal('side-drawer');
        }

        return () => {
            modalManager.closeModal('side-drawer');
        };
    }, [isOpen]);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        },
        [isOpen, onClose]
    );

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    const backdropVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { duration: 0.3, ease: 'easeOut' }
        },
        exit: {
            opacity: 0,
            transition: { duration: 0.2, ease: 'easeIn' }
        }
    };

    const drawerVariants: Variants = {
        hidden: {
            x: '-100%',
            transition: { duration: 0.3, ease: 'easeIn' }
        },
        visible: {
            x: 0,
            transition: {
                duration: 0.4,
                ease: [0.25, 0.46, 0.45, 0.94]
            }
        },
        exit: {
            x: '-100%',
            transition: { duration: 0.3, ease: 'easeIn' }
        }
    };

    const staggerContainer: Variants = {
        visible: {
            transition: {
                staggerChildren: 0.05,
                delayChildren: 0.2
            }
        }
    };

    const staggerItem: Variants = {
        hidden: { opacity: 0, x: -20 },
        visible: {
            opacity: 1,
            x: 0,
            transition: { duration: 0.3, ease: 'easeOut' }
        }
    };

    const linkClass =
        'flex min-h-[44px] w-full items-center rounded-full px-4 py-3 text-left text-sm font-semibold uppercase tracking-[0.18em] text-[var(--text-secondary)] transition-colors hover:bg-[rgba(41,171,226,0.12)] hover:text-[var(--text-primary)] sm:text-base';

    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <>
                    <motion.div
                        className="fixed inset-0 bg-[rgba(1,8,15,0.72)] backdrop-blur-md"
                        style={{ zIndex: Z_INDEX.DRAWER_BACKDROP }}
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={onClose}
                    />

                    <motion.aside
                        className="fixed left-0 top-0 flex h-screen w-auto max-w-[85vw] shadow-2xl sm:max-w-[75vw] lg:max-w-none"
                        style={{ zIndex: Z_INDEX.DRAWER }}
                        variants={drawerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        role="dialog"
                        aria-modal="true"
                        aria-label={t('nav.navigation')}
                    >
                        <motion.div
                            className="flex w-16 flex-col items-center justify-between border-r border-[var(--brand-border)] bg-[linear-gradient(180deg,rgba(15,29,44,0.98),rgba(6,13,21,0.98))] py-4 sm:w-20 sm:py-6 md:py-8"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.3 }}
                        >
                            <motion.button
                                aria-label={t('common.closeMenu')}
                                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--brand-border)] bg-[rgba(7,17,27,0.56)] text-[var(--text-secondary)] transition-colors hover:border-[var(--brand-border-strong)] hover:bg-[rgba(41,171,226,0.12)] hover:text-[var(--text-primary)]"
                                onClick={onClose}
                                autoFocus
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                            >
                                <FiX size={20} />
                            </motion.button>

                            <div className="flex flex-col gap-4 sm:gap-6 md:gap-8">
                                <motion.div
                                    className="p-1.5 text-[var(--text-secondary)] sm:p-2 md:p-2.5"
                                    whileHover={{ scale: 1.2, color: '#29ABE2' }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                >
                                    <a
                                        href={SOCIAL_URLS.FACEBOOK}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={t('social.facebook')}
                                        className="block"
                                    >
                                        <FaFacebookF size={14} className="sm:h-4 sm:w-4 md:h-5 md:w-5" />
                                    </a>
                                </motion.div>
                                <motion.div
                                    className="p-1.5 text-[var(--text-secondary)] sm:p-2 md:p-2.5"
                                    whileHover={{ scale: 1.2, color: '#29ABE2' }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                >
                                    <a
                                        href={SOCIAL_URLS.YOUTUBE}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={t('social.youtube')}
                                        className="block"
                                    >
                                        <FaYoutube size={14} className="sm:h-4 sm:w-4 md:h-5 md:w-5" />
                                    </a>
                                </motion.div>
                            </div>
                        </motion.div>

                        <motion.nav
                            className="relative w-56 border-r border-[var(--brand-border)] bg-[radial-gradient(circle_at_top,rgba(41,171,226,0.12),transparent_34%),linear-gradient(180deg,rgba(12,22,33,0.98),rgba(7,14,22,0.98))] px-3 py-5 text-[var(--text-secondary)] xs:w-64 xs:px-4 xs:py-6 sm:w-72 sm:px-6 sm:py-8 md:w-80 md:px-8 md:py-10 lg:w-96 lg:px-10 lg:py-12"
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2, duration: 0.4 }}
                        >
                            <motion.div
                                className="mb-6 sm:mb-8 md:mb-10"
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.3 }}
                            >
                                <p className="brand-eyebrow text-[0.72rem]">{t('brand.message')}</p>
                                <h2 className="mb-2 mt-3 font-serif text-lg font-bold text-white sm:text-xl md:mb-3 md:text-2xl">
                                    {t('nav.navigation') || 'Navigation'}
                                </h2>
                                <motion.div
                                    className="h-0.5 w-10 bg-[linear-gradient(135deg,var(--brand-gradient-start),var(--brand-gradient-end))] sm:w-12 md:h-1 md:w-14"
                                    initial={{ width: 0 }}
                                    animate={{ width: '2.5rem' }}
                                    transition={{ delay: 0.6, duration: 0.5, ease: 'easeOut' }}
                                />
                            </motion.div>

                            <motion.ul
                                className="space-y-3 sm:space-y-4 md:space-y-5"
                                variants={staggerContainer}
                                initial="hidden"
                                animate="visible"
                            >
                                <motion.li variants={staggerItem}>
                                    <motion.button
                                        onClick={handleHomeNavigation}
                                        className={linkClass}
                                        whileHover={{ x: 4, color: '#F8FBFF' }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                    >
                                        {t('nav.home')}
                                    </motion.button>
                                </motion.li>

                                <motion.li variants={staggerItem}>
                                    <motion.button
                                        onClick={handleProductsNavigation}
                                        className={linkClass}
                                        whileHover={{ x: 4, color: '#F8FBFF' }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                    >
                                        {t('nav.products')}
                                    </motion.button>
                                </motion.li>

                                <motion.li variants={staggerItem}>
                                    <motion.button
                                        onClick={() => {
                                            onClose();
                                            router.push('/about');
                                        }}
                                        className={linkClass}
                                        whileHover={{ x: 4, color: '#F8FBFF' }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                    >
                                        {t('nav.company')}
                                    </motion.button>
                                </motion.li>

                                <motion.li variants={staggerItem}>
                                    <motion.button
                                        onClick={() => {
                                            onClose();
                                            router.push('/become_our_reseller#dealer-network');
                                        }}
                                        className={linkClass}
                                        whileHover={{ x: 4, color: '#F8FBFF' }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                    >
                                        {t('nav.reseller')}
                                    </motion.button>
                                </motion.li>

                                <motion.li variants={staggerItem}>
                                    <motion.button
                                        onClick={handleBlogNavigation}
                                        className={linkClass}
                                        whileHover={{ x: 4, color: '#F8FBFF' }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                    >
                                        {t('nav.blog')}
                                    </motion.button>
                                </motion.li>

                                <motion.li variants={staggerItem}>
                                    <motion.button
                                        onClick={() => {
                                            onClose();
                                            router.push('/contact');
                                        }}
                                        className={linkClass}
                                        whileHover={{ x: 4, color: '#F8FBFF' }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                    >
                                        {t('nav.contact')}
                                    </motion.button>
                                </motion.li>
                            </motion.ul>

                            <motion.div
                                className="absolute bottom-[4.5rem] right-4 hidden opacity-20 sm:bottom-20 sm:right-6 sm:block md:bottom-24 md:right-8"
                                initial={{ opacity: 0, rotate: 0 }}
                                animate={{ opacity: 0.2, rotate: 90 }}
                                transition={{ delay: 0.8, duration: 0.5 }}
                            >
                                <span className="origin-center select-none text-4xl font-black uppercase text-[var(--brand-blue)] sm:text-6xl md:text-7xl">
                                    {t('common.menu')}
                                </span>
                            </motion.div>
                        </motion.nav>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}
