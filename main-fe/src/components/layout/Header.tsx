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

interface HeaderProps {
    onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
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
              backgroundColor: scrollY <= 0 ? 'transparent' : `rgba(6,17,27,${Math.min(0.58 + scrollY / 700, 0.92)})`,
              backdropFilter: scrollY > 20 ? `blur(${Math.min(scrollY / 80, 14)}px)` : 'none',
              borderBottom: `1px solid rgba(41,171,226,${Math.min(scrollY / 550, 0.2)})`,
              boxShadow: scrollY > 100 ? '0 18px 40px rgba(1,8,15,0.24)' : 'none'
          }
        : {
              backgroundColor: 'transparent',
              backdropFilter: 'none',
              borderBottom: '1px solid rgba(41,171,226,0)',
              boxShadow: 'none'
          };

    const logoStyle = isHydrated
        ? {
              transform: scrollY > 100 ? 'scale(0.95)' : 'scale(1)',
              filter: scrollY > 200 ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' : 'none'
          }
        : {
              transform: 'scale(1)',
              filter: 'none'
          };

    return (
        <motion.header
            className="fixed left-0 right-0 top-0 flex items-center justify-between px-3 py-2.5 transition-all duration-300 ease-out sm:left-20 sm:px-6 sm:py-4"
            variants={headerVariants}
            initial="hidden"
            animate="visible"
            style={{ ...headerStyle, zIndex: Z_INDEX.HEADER }}
        >
            <motion.div className="flex items-center gap-2.5 sm:gap-4" variants={logoVariants}>
                <button
                    onClick={onMenuClick}
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--brand-border)] bg-[rgba(7,17,27,0.72)] text-[var(--brand-blue)] shadow-[0_10px_24px_rgba(1,8,15,0.18)] transition-all duration-200 hover:border-[var(--brand-border-strong)] hover:bg-[rgba(12,30,44,0.86)] sm:hidden"
                    aria-label={t('common.openMenu')}
                    suppressHydrationWarning
                >
                    <FiMenu size={22} color="var(--brand-blue)" />
                </button>
                <Link href="/" className="cursor-pointer transition-all duration-300 ease-out" style={logoStyle}>
                    <Image
                        src="/logo-4t.png"
                        alt={t('brand.logoAlt')}
                        width={142}
                        height={32}
                        className="h-auto w-[102px] transition-transform duration-200 hover:scale-[1.03] sm:w-[150px]"
                        priority
                    />
                </Link>
            </motion.div>

            <nav
                className="hidden items-center gap-2 rounded-full border border-[var(--brand-border)] bg-[rgba(7,17,27,0.62)] px-2 py-1.5 shadow-[0_12px_30px_rgba(1,8,15,0.18)] backdrop-blur-xl md:flex"
                aria-label={t('nav.navigation')}
            >
                {NAV_LINKS.map(({ href, key }) => {
                    const isActive = pathname === href || pathname.startsWith(href + '/');
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`rounded-full px-4 py-2 text-sm font-semibold tracking-[0.18em] transition-all duration-200 ${
                                isActive
                                    ? 'bg-[linear-gradient(135deg,var(--brand-gradient-start),var(--brand-gradient-end))] text-white shadow-[0_12px_24px_rgba(0,113,188,0.24)]'
                                    : 'text-[var(--text-muted)] hover:bg-[rgba(41,171,226,0.12)] hover:text-[var(--text-primary)]'
                            }`}
                        >
                            {t(key)}
                        </Link>
                    );
                })}
            </nav>

            <motion.div variants={searchVariants} className="flex items-center gap-1.5 sm:gap-3">
                <button
                    onClick={openSearch}
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--brand-border)] bg-[rgba(7,17,27,0.64)] text-[var(--brand-blue)] transition-all duration-200 hover:border-[var(--brand-border-strong)] hover:bg-[rgba(41,171,226,0.12)]"
                    aria-label={t('common.search')}
                    suppressHydrationWarning
                >
                    <FiSearch size={20} color="var(--brand-blue)" />
                </button>
                <LanguageSwitcher />
            </motion.div>
        </motion.header>
    );
}
