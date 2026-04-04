import { FaFacebookF, FaYoutube } from 'react-icons/fa';
import { FiMenu } from 'react-icons/fi';
import { motion, Variants } from 'framer-motion';
import { Z_INDEX } from '@/constants/zIndex';
import { SOCIAL_URLS } from '@/constants/urls';

interface SidebarProps {
    onMenuClick: () => void;
}

const sidebarVariants: Variants = {
    hidden: { x: -64, opacity: 0 },
    visible: {
        x: 0,
        opacity: 1,
        transition: { type: 'spring', duration: 0.7, bounce: 0.18 }
    }
};

export default function Sidebar({ onMenuClick }: SidebarProps) {
    return (
        <motion.aside
            className="fixed left-0 top-0 hidden h-full w-20 flex-col items-center bg-[#1e2631]/50 py-4 shadow-lg backdrop-blur-md lg:flex"
            style={{ zIndex: Z_INDEX.SIDEBAR }}
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Menu Icon */}
            <div className="mb-8 mt-2">
                <button
                    className="rounded p-2 transition hover:bg-[#263040]"
                    onClick={onMenuClick}
                    suppressHydrationWarning
                >
                    <FiMenu size={24} color="#27b2fc" />
                </button>
            </div>

            <div className="flex-1" />

            {/* Social icons */}
            <div className="mb-4 flex flex-col gap-4">
                <a
                    href={SOCIAL_URLS.FACEBOOK}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    className="flex items-center justify-center rounded p-3 transition hover:bg-[#263040]"
                >
                    <FaFacebookF size={14} color="#fff" />
                </a>
                <a
                    href={SOCIAL_URLS.YOUTUBE}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="YouTube"
                    className="flex items-center justify-center rounded p-3 transition hover:bg-[#263040]"
                >
                    <FaYoutube size={14} color="#fff" />
                </a>
            </div>
        </motion.aside>
    );
}
