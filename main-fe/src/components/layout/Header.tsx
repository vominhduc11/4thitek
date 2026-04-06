import Image from 'next/image';
import Link from 'next/link';
import { FiMenu, FiSearch } from 'react-icons/fi';
import { motion, Variants } from 'framer-motion';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSearchModal } from '@/context/SearchModalContext';
import { Z_INDEX } from '@/constants/zIndex';
import { useLanguage } from '@/context/LanguageContext';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

const NAV_LINKS = [
    { href: '/products', key: 'nav.products' },
    { href: '/about', key: 'nav.company' },
    { href: '/become_our_reseller', key: 'nav.reseller' },
    { href: '/blogs', key: 'nav.blog' },
    { href: '/contact', key: 'nav.contact' }
] as const;

const headerVariants: Variants = {
    hidden: { y: -48, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100, damping: 14, duration: 0.7 } }
};

const logoVariants: Variants = {
    hidden: { scale: 0.85, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { delay: 0.25, type: 'spring', stiffness: 120, duration: 0.6 } }
};

const searchVariants: Variants = {
    hidden: { x: 20, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { delay: 0.1, type: 'spring', stiffness: 120 } }
};

const actionButtonClass =
    'flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[rgba(133,170,197,0.16)] bg-[rgba(7,17,27,0.64)] text-[var(--brand-blue)] shadow-[0_12px_28px_rgba(1,8,15,0.18)] transition-all duration-200 hover:border-[var(--brand-border-strong)] hover:bg-[rgba(12,30,44,0.86)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06111B]';

interface HeaderProps {
    onMenuClick: () => void;
    isDrawerOpen: boolean;
}

export default function Header({ onMenuClick, isDrawerOpen }: HeaderProps) {
    const [scrollY, setScrollY] = useState(0);
    const [isHydrated, setIsHydrated] = useState(false);
    const { openSearch } = useSearchModal();
    const { t } = useLanguage();
    const pathname = usePathname();

    useEffect(() => {
        setIsHydrated(true);

        if (typeof window !== 'undefined') {
            const handleScroll = () => setScrollY(window.scrollY);
            window.addEventListener('scroll', handleScroll, { passive: true });
            return () => window.removeEventListener('scroll', handleScroll);
        }
    }, []);

    const headerStyle = isHydrated
        ? {
              backgroundColor: scrollY <= 0 ? 'rgba(7,17,27,0.58)' : `rgba(7,17,27,${Math.min(0.82 + scrollY / 800, 0.96)})`,
              backdropFilter: `blur(${Math.min(18 + scrollY / 45, 24)}px)`,
              borderColor: `rgba(41,171,226,${Math.min(0.1 + scrollY / 700, 0.22)})`,
              boxShadow:
                  scrollY > 36
                      ? '0 22px 52px rgba(1,8,15,0.28), inset 0 1px 0 rgba(255,255,255,0.04)'
                      : '0 14px 34px rgba(1,8,15,0.18), inset 0 1px 0 rgba(255,255,255,0.03)'
          }
        : {
              backgroundColor: 'rgba(7,17,27,0.58)',
              backdropFilter: 'blur(18px)',
              borderColor: 'rgba(41,171,226,0.1)',
              boxShadow: '0 14px 34px rgba(1,8,15,0.18), inset 0 1px 0 rgba(255,255,255,0.03)'
          };

    const logoStyle = isHydrated
        ? {
              transform: scrollY > 100 ? 'scale(0.97)' : 'scale(1)',
              filter: scrollY > 180 ? 'drop-shadow(0 4px 14px rgba(0,0,0,0.24))' : 'none'
          }
        : {
              transform: 'scale(1)',
              filter: 'none'
          };

    return (
        <motion.header
            className="fixed left-0 right-0 top-0 px-3 pt-3 transition-all duration-300 ease-out sm:px-5 sm:pt-4 md:px-6 lg:left-20"
            variants={headerVariants}
            initial="hidden"
            animate="visible"
            style={{ zIndex: Z_INDEX.HEADER }}
        >
            <div
                className="mx-auto flex max-w-[var(--shell-max)] items-center justify-between gap-3 rounded-[24px] border px-3 py-2.5 sm:px-4 sm:py-3 md:gap-4 lg:rounded-[28px] lg:px-5 lg:py-3.5"
                style={headerStyle}
            >
                <motion.div className="flex min-w-0 items-center gap-2.5 sm:gap-3.5" variants={logoVariants}>
                    <button
                        onClick={onMenuClick}
                        className={`${actionButtonClass} lg:hidden`}
                        aria-label={t('common.openMenu')}
                        aria-controls="site-navigation-drawer"
                        aria-expanded={isDrawerOpen}
                        suppressHydrationWarning
                    >
                        <FiMenu className="h-[22px] w-[22px]" />
                    </button>
                    <Link href="/" className="cursor-pointer transition-all duration-300 ease-out" style={logoStyle}>
                        <Image
                            src="/logo-4t.png"
                            alt={t('brand.logoAlt')}
                            width={142}
                            height={32}
                            className="h-auto w-[102px] transition-transform duration-200 hover:scale-[1.03] sm:w-[128px] md:w-[142px] lg:w-[146px]"
                            priority
                        />
                    </Link>
                </motion.div>

                <nav className="hidden flex-1 items-center justify-center lg:flex" aria-label={t('nav.navigation')}>
                    <div className="flex items-center gap-1 rounded-full border border-[rgba(133,170,197,0.12)] bg-[rgba(8,18,28,0.4)] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                        {NAV_LINKS.map(({ href, key }) => {
                            const isActive = pathname === href || pathname.startsWith(href + '/');
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    aria-current={isActive ? 'page' : undefined}
                                    className={`rounded-full px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] transition-all duration-200 xl:px-4 ${
                                        isActive
                                            ? 'border border-[rgba(41,171,226,0.22)] bg-[linear-gradient(135deg,rgba(41,171,226,0.18),rgba(0,113,188,0.16))] text-white shadow-[0_14px_30px_rgba(0,113,188,0.18)]'
                                            : 'border border-transparent text-[var(--text-muted)] hover:bg-[rgba(41,171,226,0.1)] hover:text-[var(--text-primary)]'
                                    }`}
                                >
                                    {t(key)}
                                </Link>
                            );
                        })}
                    </div>
                </nav>

                <motion.div variants={searchVariants} className="flex items-center gap-1.5 sm:gap-2 md:gap-3">
                    <button
                        onClick={openSearch}
                        className={actionButtonClass}
                        aria-label={t('common.search')}
                        suppressHydrationWarning
                    >
                        <FiSearch className="h-5 w-5" />
                    </button>
                    <LanguageSwitcher />
                </motion.div>
            </div>
        </motion.header>
    );
}
