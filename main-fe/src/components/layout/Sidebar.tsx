import { FaFacebookF, FaYoutube } from 'react-icons/fa';
import { FiMenu } from 'react-icons/fi';
import { motion, Variants } from 'framer-motion';
import { Z_INDEX } from '@/constants/zIndex';
import { SOCIAL_URLS } from '@/constants/urls';
import { useLanguage } from '@/context/LanguageContext';

interface SidebarProps {
    onMenuClick: () => void;
    isDrawerOpen: boolean;
}

const sidebarVariants: Variants = {
    hidden: { x: -64, opacity: 0 },
    visible: {
        x: 0,
        opacity: 1,
        transition: { type: 'spring', duration: 0.7, bounce: 0.18 }
    }
};

const SOCIAL_ITEMS = [
    { href: SOCIAL_URLS.FACEBOOK, labelKey: 'social.facebook', Icon: FaFacebookF },
    { href: SOCIAL_URLS.YOUTUBE, labelKey: 'social.youtube', Icon: FaYoutube }
] as const;

export default function Sidebar({ onMenuClick, isDrawerOpen }: SidebarProps) {
    const { t } = useLanguage();

    return (
        <motion.aside
            className="fixed left-0 top-0 hidden h-full w-20 flex-col items-center border-r border-[rgba(133,170,197,0.12)] bg-[linear-gradient(180deg,rgba(10,20,31,0.94),rgba(4,10,16,0.92))] px-3 py-5 shadow-[0_24px_60px_rgba(1,8,15,0.32)] backdrop-blur-xl lg:flex"
            style={{ zIndex: Z_INDEX.SIDEBAR }}
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
        >
            <div className="flex w-full flex-col items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-[rgba(41,171,226,0.24)] bg-[linear-gradient(180deg,rgba(15,33,48,0.96),rgba(9,19,31,0.92))] text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--text-primary)] shadow-[0_12px_26px_rgba(0,113,188,0.18)]">
                    4T
                </div>
                <button
                    className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[rgba(133,170,197,0.16)] bg-[rgba(7,17,27,0.62)] text-[var(--brand-blue)] shadow-[0_12px_28px_rgba(1,8,15,0.18)] transition-all duration-200 hover:border-[var(--brand-border-strong)] hover:bg-[rgba(12,30,44,0.86)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06111B]"
                    onClick={onMenuClick}
                    aria-label={t('common.openMenu')}
                    aria-controls="site-navigation-drawer"
                    aria-expanded={isDrawerOpen}
                    suppressHydrationWarning
                >
                    <FiMenu className="h-5 w-5" />
                </button>
            </div>

            <div className="flex-1" />

            <div className="mb-1 flex flex-col items-center gap-3">
                {SOCIAL_ITEMS.map(({ href, labelKey, Icon }) => (
                    <a
                        key={href}
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={t(labelKey)}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(133,170,197,0.12)] bg-[rgba(7,17,27,0.56)] text-[var(--text-secondary)] transition-all duration-200 hover:border-[var(--brand-border-strong)] hover:bg-[rgba(41,171,226,0.14)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[#06111B]"
                    >
                        <Icon size={14} />
                    </a>
                ))}
            </div>
        </motion.aside>
    );
}
