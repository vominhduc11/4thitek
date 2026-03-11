import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FiLogOut, FiMenu, FiSearch, FiUser } from 'react-icons/fi';
import { motion, Variants } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useSearchModal } from '@/context/SearchModalContext';
import { Z_INDEX } from '@/constants/zIndex';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useLoginModal } from '@/context/LoginModalContext';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';

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
    const router = useRouter();
    const [scrollY, setScrollY] = useState(0);
    const [isHydrated, setIsHydrated] = useState(false);
    const { openSearch } = useSearchModal();
    const { t, language } = useLanguage();
    const { isAuthenticated, isHydrated: authHydrated, logout } = useAuth();
    const { openLoginModal } = useLoginModal();

    const accountLabel = language === 'vi' ? 'Tai khoan' : 'Account';
    const loginLabel = language === 'vi' ? 'Dang nhap' : 'Sign in';
    const logoutLabel = language === 'vi' ? 'Dang xuat' : 'Sign out';

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
              backgroundColor: scrollY <= 0 ? 'transparent' : `rgba(12,19,29,${Math.min(scrollY / 400, 0.9)})`,
              backdropFilter: scrollY > 20 ? `blur(${Math.min(scrollY / 80, 10)}px)` : 'none',
              borderBottom: `1px solid rgba(255,255,255,${Math.min(scrollY / 200, 0.1)})`,
              boxShadow: scrollY > 150 ? '0 4px 20px rgba(0,0,0,0.2)' : 'none'
          }
        : {
              backgroundColor: 'transparent',
              backdropFilter: 'none',
              borderBottom: '1px solid rgba(255,255,255,0)',
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
            className="fixed top-0 left-0 sm:left-20 right-0 flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 transition-all duration-300 ease-out bg-transparent"
            variants={headerVariants}
            initial="hidden"
            animate="visible"
            style={{ ...headerStyle, zIndex: Z_INDEX.HEADER }}
        >
            <motion.div className="flex items-center gap-3 sm:gap-4" variants={logoVariants}>
                <button
                    onClick={onMenuClick}
                    className="p-1.5 sm:p-2 rounded transition-all duration-200 hover:bg-white/10 sm:hidden"
                    aria-label={t('common.openMenu')}
                    suppressHydrationWarning
                >
                    <FiMenu size={24} className="sm:w-8 sm:h-8" color="#27b2fc" />
                </button>
                <Link href="/" className="transition-all duration-300 ease-out cursor-pointer" style={logoStyle}>
                    <Image
                        width={142}
                        height={32}
                        sizes="142px"
                        priority
                        src="/logo-4t.png"
                        alt={t('brand.logoAlt')}
                        className="h-6 sm:h-8 w-auto hover:scale-105 transition-transform duration-200"
                    />
                </Link>
            </motion.div>

            <motion.div variants={searchVariants} className="flex items-center gap-2 sm:gap-3">
                {authHydrated && (
                    <>
                        {isAuthenticated ? (
                            <>
                                <Link
                                    href="/account"
                                    className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:border-[#4FC8FF]/60 hover:text-[#4FC8FF]"
                                >
                                    <FiUser className="h-4 w-4" />
                                    <span>{accountLabel}</span>
                                </Link>
                                <button
                                    type="button"
                                    onClick={async () => {
                                        await logout();
                                        router.replace('/');
                                        router.refresh();
                                    }}
                                    className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-rose-400/40 hover:text-rose-200"
                                >
                                    <FiLogOut className="h-4 w-4" />
                                    <span>{logoutLabel}</span>
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                onClick={() => openLoginModal('/account')}
                                className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition hover:border-[#4FC8FF]/60 hover:text-[#4FC8FF]"
                            >
                                <FiUser className="h-4 w-4" />
                                <span>{loginLabel}</span>
                            </button>
                        )}
                    </>
                )}
                <button
                    onClick={openSearch}
                    className="p-1.5 sm:p-2 rounded transition-all duration-200 hover:bg-white/10"
                    aria-label={t('common.search')}
                    suppressHydrationWarning
                >
                    <FiSearch size={20} className="sm:w-5 sm:h-5" color="#fff" />
                </button>
                <LanguageSwitcher />
            </motion.div>
        </motion.header>
    );
}
