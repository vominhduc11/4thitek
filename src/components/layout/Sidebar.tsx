import { FaFacebookF, FaTwitter } from 'react-icons/fa';
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
            className="fixed top-0 left-0 h-full w-16 sm:w-20 bg-[#1e2631]/50 backdrop-blur-md flex flex-col items-center py-3 sm:py-4 shadow-lg"
            style={{ zIndex: Z_INDEX.SIDEBAR }}
            variants={sidebarVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Menu Icon */}
            <div className="mb-6 sm:mb-8 mt-1 sm:mt-2">
                <button
                    className="p-1.5 sm:p-2 rounded hover:bg-[#263040] transition"
                    onClick={onMenuClick}
                    suppressHydrationWarning
                >
                    <FiMenu size={24} className="sm:w-8 sm:h-8" color="#27b2fc" />
                </button>
            </div>

            <div className="flex-1" />

            {/* Social icons */}
            <div className="mb-3 sm:mb-4 flex flex-col gap-3 sm:gap-4">
                <a
                    href={SOCIAL_URLS.FACEBOOK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 sm:p-2 rounded hover:bg-[#263040] transition flex items-center justify-center"
                >
                    <FaFacebookF size={14} className="sm:w-4.5 sm:h-4.5" color="#fff" />
                </a>
                <a
                    href={SOCIAL_URLS.TWITTER}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 sm:p-2 rounded hover:bg-[#263040] transition flex items-center justify-center"
                >
                    <FaTwitter size={14} className="sm:w-4.5 sm:h-4.5" color="#fff" />
                </a>
            </div>
        </motion.aside>
    );
}
