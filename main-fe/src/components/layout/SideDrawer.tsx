'use client';

import { useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { FaFacebookF, FaYoutube } from 'react-icons/fa';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { Z_INDEX } from '@/constants/zIndex';
import { SOCIAL_URLS } from '@/constants/urls';
import { modalManager } from '@/utils/modalManager';

interface SideDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

const NAV_ITEMS = [
    { key: 'nav.home', href: '/', matchPath: '/' },
    { key: 'nav.products', href: '/products', matchPath: '/products' },
    { key: 'nav.company', href: '/about', matchPath: '/about' },
    { key: 'nav.reseller', href: '/become_our_reseller#dealer-network', matchPath: '/become_our_reseller' },
    { key: 'nav.blog', href: '/blogs', matchPath: '/blogs' },
    { key: 'nav.contact', href: '/contact', matchPath: '/contact' }
] as const;

const SOCIAL_ITEMS = [
    { href: SOCIAL_URLS.FACEBOOK, labelKey: 'social.facebook', Icon: FaFacebookF },
    { href: SOCIAL_URLS.YOUTUBE, labelKey: 'social.youtube', Icon: FaYoutube }
] as const;

export default function SideDrawer({ isOpen, onClose }: SideDrawerProps) {
    const { t } = useLanguage();
    const router = useRouter();
    const pathname = usePathname();
    const [isDesktop, setIsDesktop] = useState(false);

    const handleNavigation = useCallback(
        (href: string) => {
            onClose();
            router.push(href);
        },
        [onClose, router]
    );

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

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const mediaQuery = window.matchMedia('(min-width: 1024px)');
        const updateViewportMode = (event?: MediaQueryListEvent) => {
            setIsDesktop(event ? event.matches : mediaQuery.matches);
        };

        updateViewportMode();
        mediaQuery.addEventListener('change', updateViewportMode);

        return () => {
            mediaQuery.removeEventListener('change', updateViewportMode);
        };
    }, []);

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

    const drawerVariants: Variants = isDesktop
        ? {
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
          }
        : {
              hidden: {
                  y: '-100%',
                  transition: { duration: 0.28, ease: 'easeIn' }
              },
              visible: {
                  y: 0,
                  transition: {
                      duration: 0.38,
                      ease: [0.25, 0.46, 0.45, 0.94]
                  }
              },
              exit: {
                  y: '-100%',
                  transition: { duration: 0.24, ease: 'easeIn' }
              }
          };

    const panelVariants: Variants = isDesktop
        ? {
              hidden: { opacity: 0, x: -50 },
              visible: {
                  opacity: 1,
                  x: 0,
                  transition: { delay: 0.2, duration: 0.4 }
              },
              exit: {
                  opacity: 0,
                  x: -28,
                  transition: { duration: 0.18, ease: 'easeIn' }
              }
          }
        : {
              hidden: { opacity: 0, y: -24 },
              visible: {
                  opacity: 1,
                  y: 0,
                  transition: { delay: 0.12, duration: 0.28, ease: 'easeOut' }
              },
              exit: {
                  opacity: 0,
                  y: -20,
                  transition: { duration: 0.16, ease: 'easeIn' }
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

    const getLinkClass = (isActive: boolean) =>
        `group flex min-h-[48px] w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-[0.95rem] font-semibold uppercase tracking-[0.12em] transition-all duration-200 ${
            isActive
                ? 'border-[var(--brand-border-strong)] bg-[rgba(41,171,226,0.14)] text-white shadow-[0_16px_36px_rgba(0,113,188,0.18)]'
                : 'border-transparent text-[var(--text-secondary)] hover:border-[rgba(41,171,226,0.16)] hover:bg-[rgba(41,171,226,0.08)] hover:text-[var(--text-primary)]'
        } sm:min-h-[44px] sm:rounded-full sm:px-4 sm:py-3 sm:text-base sm:tracking-[0.18em]`;

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
                        className="fixed inset-x-0 top-0 flex w-full flex-col shadow-2xl lg:inset-y-0 lg:left-0 lg:right-auto lg:w-auto lg:flex-row"
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
                            className="hidden w-20 flex-col items-center justify-between border-r border-[var(--brand-border)] bg-[linear-gradient(180deg,rgba(15,29,44,0.98),rgba(6,13,21,0.98))] py-6 lg:flex lg:py-8"
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
                                {SOCIAL_ITEMS.map(({ href, labelKey, Icon }) => (
                                    <motion.div
                                        key={href}
                                        className="p-1.5 text-[var(--text-secondary)] sm:p-2 md:p-2.5"
                                        whileHover={{ scale: 1.2, color: '#29ABE2' }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                    >
                                        <a
                                            href={href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label={t(labelKey)}
                                            className="block"
                                        >
                                            <Icon size={14} className="sm:h-4 sm:w-4 md:h-5 md:w-5" />
                                        </a>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.nav
                            className="relative flex h-[min(38rem,100dvh)] w-full flex-col overflow-y-auto rounded-b-[30px] border-b border-[var(--brand-border)] bg-[radial-gradient(circle_at_top,rgba(41,171,226,0.12),transparent_34%),linear-gradient(180deg,rgba(12,22,33,0.98),rgba(7,14,22,0.98))] px-4 py-4 text-[var(--text-secondary)] sm:px-5 sm:py-5 md:px-6 md:py-6 lg:h-full lg:w-72 lg:max-w-none lg:rounded-b-none lg:border-b-0 lg:border-r lg:px-6 lg:py-8 xl:w-80 xl:px-8 xl:py-10 2xl:w-96 2xl:px-10 2xl:py-12"
                            variants={panelVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            <motion.div
                                className="mb-5 flex items-start justify-between gap-4 lg:hidden"
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35, duration: 0.3 }}
                            >
                                <div>
                                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                                        4T HITEK
                                    </p>
                                    <h2 className="mt-2 font-serif text-xl font-bold text-white">{t('nav.navigation')}</h2>
                                </div>
                                <motion.button
                                    aria-label={t('common.closeMenu')}
                                    className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--brand-border)] bg-[rgba(7,17,27,0.56)] text-[var(--text-secondary)] transition-colors hover:border-[var(--brand-border-strong)] hover:bg-[rgba(41,171,226,0.12)] hover:text-[var(--text-primary)]"
                                    onClick={onClose}
                                    autoFocus
                                    whileTap={{ scale: 0.95 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                >
                                    <FiX size={20} />
                                </motion.button>
                            </motion.div>

                            <motion.div
                                className="mb-8 hidden lg:block xl:mb-10"
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.3 }}
                            >
                                <p className="brand-eyebrow text-[0.72rem]">{t('brand.message')}</p>
                                <h2 className="mb-2 mt-3 font-serif text-lg font-bold text-white lg:text-xl xl:mb-3 xl:text-2xl">
                                    {t('nav.navigation') || 'Navigation'}
                                </h2>
                                <motion.div
                                    className="h-0.5 w-10 bg-[linear-gradient(135deg,var(--brand-gradient-start),var(--brand-gradient-end))] lg:w-12 xl:h-1 xl:w-14"
                                    initial={{ width: 0 }}
                                    animate={{ width: '2.5rem' }}
                                    transition={{ delay: 0.6, duration: 0.5, ease: 'easeOut' }}
                                />
                            </motion.div>

                            <motion.ul
                                className="space-y-2 md:space-y-3 lg:space-y-4 xl:space-y-5"
                                variants={staggerContainer}
                                initial="hidden"
                                animate="visible"
                            >
                                {NAV_ITEMS.map((item) => {
                                    const isActive =
                                        item.matchPath === '/'
                                            ? pathname === '/'
                                            : pathname === item.matchPath || pathname.startsWith(`${item.matchPath}/`);

                                    return (
                                        <motion.li key={item.href} variants={staggerItem}>
                                            <motion.button
                                                onClick={() => handleNavigation(item.href)}
                                                className={getLinkClass(isActive)}
                                                whileHover={{ x: 4, color: '#F8FBFF' }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                                aria-current={isActive ? 'page' : undefined}
                                            >
                                                <span>{t(item.key)}</span>
                                                <span
                                                    className={`h-2.5 w-2.5 rounded-full transition-all duration-200 ${
                                                        isActive
                                                            ? 'bg-[var(--brand-blue)] shadow-[0_0_14px_rgba(41,171,226,0.75)]'
                                                            : 'bg-[rgba(133,170,197,0.2)] group-hover:bg-[rgba(41,171,226,0.5)]'
                                                    }`}
                                                    aria-hidden="true"
                                                />
                                            </motion.button>
                                        </motion.li>
                                    );
                                })}
                            </motion.ul>

                            <motion.div
                                className="mt-auto flex items-center justify-between border-t border-[rgba(133,170,197,0.14)] pt-4 lg:hidden"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.45, duration: 0.3 }}
                            >
                                <div className="flex items-center gap-2">
                                    {SOCIAL_ITEMS.map(({ href, labelKey, Icon }) => (
                                        <a
                                            key={href}
                                            href={href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label={t(labelKey)}
                                            className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(133,170,197,0.14)] bg-[rgba(7,17,27,0.52)] text-[var(--text-secondary)] transition-colors hover:border-[var(--brand-border-strong)] hover:text-white"
                                        >
                                            <Icon size={14} />
                                        </a>
                                    ))}
                                </div>
                                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                                    4T HITEK
                                </p>
                            </motion.div>

                            <motion.div
                                className="absolute bottom-[4.5rem] right-4 hidden opacity-20 lg:block lg:bottom-20 lg:right-6 xl:bottom-24 xl:right-8"
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
