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

const SIDEBAR_LAYOUT_QUERY = '(min-width: 844px)';
const iconButtonClass =
    'flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[rgba(133,170,197,0.16)] bg-[rgba(7,17,27,0.56)] text-[var(--text-secondary)] transition-all duration-200 hover:border-[var(--brand-border-strong)] hover:bg-[rgba(41,171,226,0.12)] hover:text-[var(--text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06111B]';
const railSocialClass =
    'flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(133,170,197,0.12)] bg-[rgba(7,17,27,0.56)] text-[var(--text-secondary)] transition-all duration-200 hover:border-[var(--brand-border-strong)] hover:bg-[rgba(41,171,226,0.14)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06111B]';

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

        const mediaQuery = window.matchMedia(SIDEBAR_LAYOUT_QUERY);
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
        `group relative flex min-h-[56px] w-full items-center justify-between overflow-hidden rounded-[24px] border px-4 py-3 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06111B] ${
            isActive
                ? 'border-[var(--brand-border-strong)] bg-[linear-gradient(135deg,rgba(41,171,226,0.18),rgba(0,113,188,0.14))] text-white shadow-[0_18px_40px_rgba(0,113,188,0.16)]'
                : 'border-[rgba(133,170,197,0.08)] bg-[rgba(9,18,29,0.5)] text-[var(--text-secondary)] hover:border-[rgba(41,171,226,0.16)] hover:bg-[rgba(41,171,226,0.08)] hover:text-[var(--text-primary)]'
        } sm:min-h-[52px]`;

    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <>
                    <motion.div
                        className="fixed inset-0 bg-[rgba(1,8,15,0.78)] backdrop-blur-md"
                        style={{ zIndex: Z_INDEX.DRAWER_BACKDROP }}
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={onClose}
                    />

                    <motion.aside
                        id="site-navigation-drawer"
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
                            className="hidden w-20 flex-col items-center justify-between border-r border-[rgba(133,170,197,0.12)] bg-[linear-gradient(180deg,rgba(10,20,31,0.98),rgba(4,10,16,0.96))] px-3 py-6 lg:flex lg:py-8"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.3 }}
                        >
                            <div className="flex flex-col items-center gap-4">
                                <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-[rgba(41,171,226,0.24)] bg-[linear-gradient(180deg,rgba(15,33,48,0.96),rgba(9,19,31,0.92))] text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-primary)] shadow-[0_12px_26px_rgba(0,113,188,0.18)]">
                                    4T
                                </div>
                                <motion.button
                                    aria-label={t('common.closeMenu')}
                                    className={iconButtonClass}
                                    onClick={onClose}
                                    autoFocus
                                    whileHover={{ scale: 1.08 }}
                                    whileTap={{ scale: 0.95 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                >
                                    <FiX size={20} />
                                </motion.button>
                            </div>

                            <div className="flex flex-col gap-3">
                                {SOCIAL_ITEMS.map(({ href, labelKey, Icon }) => (
                                    <motion.div
                                        key={href}
                                        whileHover={{ scale: 1.08 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                    >
                                        <a
                                            href={href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            aria-label={t(labelKey)}
                                            className={railSocialClass}
                                        >
                                            <Icon size={14} />
                                        </a>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        <motion.nav
                            className="custom-scrollbar relative flex h-[min(40rem,100dvh)] w-full flex-col overflow-y-auto rounded-b-[30px] border-b border-[rgba(133,170,197,0.14)] bg-[radial-gradient(circle_at_top,rgba(41,171,226,0.16),transparent_38%),linear-gradient(180deg,rgba(11,22,34,0.98),rgba(6,13,21,0.98))] px-4 py-4 text-[var(--text-secondary)] sm:px-5 sm:py-5 md:px-6 md:py-6 lg:h-full lg:w-72 lg:max-w-none lg:rounded-b-none lg:border-b-0 lg:border-r lg:border-r-[rgba(133,170,197,0.14)] lg:px-6 lg:py-8 xl:w-80 xl:px-8 xl:py-10 2xl:w-96 2xl:px-10 2xl:py-12"
                            variants={panelVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(41,171,226,0.7)] to-transparent lg:inset-x-8" />

                            <motion.div
                                className="mb-6 flex items-start justify-between gap-4 lg:hidden"
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35, duration: 0.3 }}
                            >
                                <div>
                                    <p className="brand-eyebrow text-[0.68rem]">4T HITEK</p>
                                    <h2 className="mt-2 font-serif text-xl font-bold text-white">{t('nav.navigation')}</h2>
                                    <p className="mt-1 text-sm text-[var(--text-muted)]">{t('brand.message')}</p>
                                </div>
                                <motion.button
                                    aria-label={t('common.closeMenu')}
                                    className={iconButtonClass}
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
                                <div className="flex items-center gap-3">
                                    <motion.div
                                        className="h-0.5 w-10 bg-[linear-gradient(135deg,var(--brand-gradient-start),var(--brand-gradient-end))] lg:w-12 xl:h-1 xl:w-14"
                                        initial={{ width: 0 }}
                                        animate={{ width: '2.5rem' }}
                                        transition={{ delay: 0.6, duration: 0.5, ease: 'easeOut' }}
                                    />
                                    <span className="text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">4T HITEK</span>
                                </div>
                            </motion.div>

                            <motion.ul
                                className="space-y-2.5 md:space-y-3"
                                variants={staggerContainer}
                                initial="hidden"
                                animate="visible"
                            >
                                {NAV_ITEMS.map((item, index) => {
                                    const isActive =
                                        item.matchPath === '/'
                                            ? pathname === '/'
                                            : pathname === item.matchPath || pathname.startsWith(`${item.matchPath}/`);

                                    return (
                                        <motion.li key={item.href} variants={staggerItem}>
                                            <motion.button
                                                onClick={() => handleNavigation(item.href)}
                                                className={getLinkClass(isActive)}
                                                whileHover={{ x: 4 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                                aria-current={isActive ? 'page' : undefined}
                                            >
                                                <span className="flex items-center gap-3">
                                                    <span
                                                        aria-hidden="true"
                                                        className={`text-[0.68rem] font-semibold uppercase tracking-[0.22em] ${
                                                            isActive
                                                                ? 'text-[rgba(223,245,252,0.78)]'
                                                                : 'text-[rgba(139,163,185,0.72)]'
                                                        }`}
                                                    >
                                                        {(index + 1).toString().padStart(2, '0')}
                                                    </span>
                                                    <span className="text-[0.92rem] font-semibold uppercase tracking-[0.14em] sm:text-[0.95rem]">
                                                        {t(item.key)}
                                                    </span>
                                                </span>
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
                                className="mt-auto flex items-center justify-between border-t border-[rgba(133,170,197,0.14)] pt-5 lg:hidden"
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
                                            className={railSocialClass}
                                        >
                                            <Icon size={14} />
                                        </a>
                                    ))}
                                </div>
                                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--text-muted)]">
                                    4T HITEK
                                </p>
                            </motion.div>
                        </motion.nav>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}
