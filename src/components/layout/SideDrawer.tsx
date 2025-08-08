'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { FiX, FiCheck } from 'react-icons/fi';
import { FaFacebookF, FaTwitter } from 'react-icons/fa';
import clsx from 'clsx';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { Z_INDEX } from '@/constants/zIndex';
import { modalManager } from '@/utils/modalManager';

interface SideDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SideDrawer({ isOpen, onClose }: SideDrawerProps) {
    const { language, setLanguage, t } = useLanguage();
    const router = useRouter();

    const selectLanguage = (lang: 'en' | 'vi') => setLanguage(lang);

    // Handle Products navigation
    const handleProductsNavigation = () => {
        onClose(); // Close drawer first
        router.push('/products');
    };

    // Remove series navigation as we now use individual products

    // Handle Home navigation
    const handleHomeNavigation = () => {
        onClose(); // Close drawer first
        router.push('/home');
    };

    // Handle Blog navigation
    const handleBlogNavigation = () => {
        onClose(); // Close drawer first
        router.push('/blogs');
    };

    // Remove hover effects as no longer needed

    // Handle body scroll lock with centralized modal manager
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

    // Animation variants
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
                ease: [0.25, 0.46, 0.45, 0.94] // Custom easing for smooth slide
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

    // Remove productMenuVariants as no longer needed

    return (
        <AnimatePresence mode="wait">
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/60 backdrop-blur-md"
                        style={{ zIndex: Z_INDEX.DRAWER_BACKDROP }}
                        variants={backdropVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={onClose}
                    />

                    {/* Drawer */}
                    <motion.aside
                        className="fixed top-0 left-0 h-screen w-auto flex shadow-2xl max-w-[95vw] xs:max-w-[90vw] sm:max-w-[85vw] md:max-w-[80vw] lg:max-w-none"
                        style={{ zIndex: Z_INDEX.DRAWER }}
                        variants={drawerVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                    >
                        {/* Narrow Side */}
                        <motion.div
                            className="w-16 sm:w-20 md:w-24 lg:w-20 xl:w-24 flex flex-col justify-between items-center py-4 sm:py-6 md:py-8 lg:py-6 xl:py-8 bg-gradient-to-b from-[#1a2332] via-[#1e2631] to-[#0f1419] border-r border-gray-700/50"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.3 }}
                        >
                            <motion.button
                                aria-label="Close menu"
                                className="text-gray-400 hover:text-white hover:bg-white/10 p-1.5 sm:p-2 md:p-2.5 lg:p-2 xl:p-2.5 rounded-lg"
                                onClick={onClose}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                            >
                                <FiX size={16} className="sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-5 lg:h-5 xl:w-6 xl:h-6" />
                            </motion.button>

                            <div className="flex flex-col gap-4 sm:gap-6 md:gap-8 lg:gap-6 xl:gap-8">
                                <motion.div
                                    className="text-gray-400 hover:text-blue-400 p-1.5 sm:p-2 md:p-2.5 lg:p-2 xl:p-2.5"
                                    whileHover={{ scale: 1.2, color: '#60a5fa' }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                >
                                    <Link href="#" className="block">
                                        <FaFacebookF size={14} className="sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-4 lg:h-4 xl:w-5 xl:h-5" />
                                    </Link>
                                </motion.div>
                                <motion.div
                                    className="text-gray-400 hover:text-blue-400 p-1.5 sm:p-2 md:p-2.5 lg:p-2 xl:p-2.5"
                                    whileHover={{ scale: 1.2, color: '#60a5fa' }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                >
                                    <Link href="#" className="block">
                                        <FaTwitter size={14} className="sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-4 lg:h-4 xl:w-5 xl:h-5" />
                                    </Link>
                                </motion.div>
                            </div>
                        </motion.div>

                        {/* Main Navigation */}
                        <motion.nav
                            className="w-56 xs:w-64 sm:w-80 md:w-96 lg:w-80 xl:w-96 bg-gradient-to-b from-[#1e2631] to-[#151e2b] text-gray-300 px-3 xs:px-4 sm:px-8 md:px-10 lg:px-8 xl:px-10 py-5 xs:py-6 sm:py-10 md:py-12 lg:py-10 xl:py-12 relative border-r border-gray-700/30"
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.2, duration: 0.4 }}
                        >
                            <motion.div
                                className="mb-6 sm:mb-8 md:mb-10 lg:mb-8 xl:mb-10"
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.3 }}
                            >
                                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-xl xl:text-2xl font-bold text-white mb-2 md:mb-3 lg:mb-2 xl:mb-3">
                                    {t('nav.navigation') || 'Navigation'}
                                </h2>
                                <motion.div
                                    className="w-10 sm:w-12 md:w-14 lg:w-12 xl:w-14 h-0.5 md:h-1 lg:h-0.5 xl:h-1 bg-blue-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: '2.5rem' }}
                                    transition={{ delay: 0.6, duration: 0.5, ease: 'easeOut' }}
                                />
                            </motion.div>

                            <motion.ul
                                className="space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-4 xl:space-y-5"
                                variants={staggerContainer}
                                initial="hidden"
                                animate="visible"
                            >
                                <motion.li variants={staggerItem}>
                                    <motion.button
                                        onClick={handleHomeNavigation}
                                        className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium uppercase tracking-wider hover:text-white py-1.5 sm:py-2 md:py-3 lg:py-2 xl:py-3 w-full text-left"
                                        whileHover={{ x: 4, color: '#ffffff' }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                    >
                                        {t('nav.home')}
                                    </motion.button>
                                </motion.li>

                                <motion.li variants={staggerItem}>
                                    <motion.button
                                        onClick={handleProductsNavigation}
                                        className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium uppercase tracking-wider hover:text-white py-1.5 sm:py-2 md:py-3 lg:py-2 xl:py-3 w-full text-left"
                                        whileHover={{ x: 4, color: '#ffffff' }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                    >
                                        {t('nav.products')}
                                    </motion.button>
                                </motion.li>

                                {/* Company */}
                                <motion.li variants={staggerItem}>
                                    <motion.button
                                        onClick={() => {
                                            onClose();
                                            router.push('/about');
                                        }}
                                        className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium uppercase tracking-wider hover:text-white py-1.5 sm:py-2 md:py-3 lg:py-2 xl:py-3 w-full text-left"
                                        whileHover={{ x: 4, color: '#ffffff' }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                    >
                                        {t('nav.company')}
                                    </motion.button>
                                </motion.li>

                                {/* Reseller */}
                                <motion.li variants={staggerItem}>
                                    <motion.button
                                        onClick={() => {
                                            onClose();
                                            router.push('/reseller_infomation');
                                        }}
                                        className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium uppercase tracking-wider hover:text-white py-1.5 sm:py-2 md:py-3 lg:py-2 xl:py-3 w-full text-left"
                                        whileHover={{ x: 4, color: '#ffffff' }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                    >
                                        {t('nav.reseller')}
                                    </motion.button>
                                </motion.li>

                                {/* Blog */}
                                <motion.li variants={staggerItem}>
                                    <motion.button
                                        onClick={handleBlogNavigation}
                                        className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium uppercase tracking-wider hover:text-white py-1.5 sm:py-2 md:py-3 lg:py-2 xl:py-3 w-full text-left"
                                        whileHover={{ x: 4, color: '#ffffff' }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                    >
                                        {t('nav.blog')}
                                    </motion.button>
                                </motion.li>

                                {/* Contact Us */}
                                <motion.li variants={staggerItem}>
                                    <motion.button
                                        onClick={() => {
                                            onClose();
                                            router.push('/contact');
                                        }}
                                        className="block text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-medium uppercase tracking-wider hover:text-white py-1.5 sm:py-2 md:py-3 lg:py-2 xl:py-3 w-full text-left"
                                        whileHover={{ x: 4, color: '#ffffff' }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                    >
                                        {t('nav.contact')}
                                    </motion.button>
                                </motion.li>
                            </motion.ul>

                            <motion.div
                                className="absolute bottom-[4.5rem] sm:bottom-20 md:bottom-24 lg:bottom-20 xl:bottom-24 right-4 sm:right-6 md:right-8 lg:right-6 xl:right-8 opacity-20 hidden sm:block"
                                initial={{ opacity: 0, rotate: 0 }}
                                animate={{ opacity: 0.2, rotate: 90 }}
                                transition={{ delay: 0.8, duration: 0.5 }}
                            >
                                <span className="text-4xl sm:text-6xl md:text-7xl lg:text-6xl xl:text-7xl font-black text-white uppercase origin-center select-none">
                                    Menu
                                </span>
                            </motion.div>
                        </motion.nav>

                        {/* Sub Panel */}
                        <motion.div
                            className="w-56 sm:w-72 md:w-80 lg:w-72 xl:w-80 bg-[#1e2a3a]/5 backdrop-blur-[1px] px-4 sm:px-8 md:px-10 lg:px-8 xl:px-10 py-6 sm:py-10 md:py-12 lg:py-10 xl:py-12 text-gray-300 hidden md:block"
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3, duration: 0.4 }}
                        >
                            {/* Language */}
                            <motion.div
                                className="mb-8 sm:mb-10 md:mb-12 lg:mb-10 xl:mb-12"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.5, duration: 0.3 }}
                            >
                                <h4 className="text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-semibold uppercase tracking-widest text-gray-400 mb-3 sm:mb-4 md:mb-5 lg:mb-4 xl:mb-5 flex items-center">
                                    <span className="w-1.5 sm:w-2 md:w-2.5 lg:w-2 xl:w-2.5 h-1.5 sm:h-2 md:h-2.5 lg:h-2 xl:h-2.5 bg-blue-500 rounded-full mr-2 md:mr-3 lg:mr-2 xl:mr-3"></span>
                                    {t('common.language')}
                                </h4>
                                <ul className="space-y-2 sm:space-y-3 md:space-y-4 lg:space-y-3 xl:space-y-4">
                                    {[
                                        { code: 'vi', label: t('common.vietnamese') },
                                        { code: 'en', label: t('common.english') }
                                    ].map((lang, index) => (
                                        <motion.li
                                            key={lang.code}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.6 + index * 0.1, duration: 0.3 }}
                                        >
                                            <motion.button
                                                className={clsx(
                                                    'flex justify-between items-center w-full text-xs sm:text-sm md:text-base lg:text-sm xl:text-base py-1.5 sm:py-2 md:py-2.5 lg:py-2 xl:py-2.5 px-2 sm:px-3 md:px-4 lg:px-3 xl:px-4 rounded-lg',
                                                    language === lang.code
                                                        ? 'text-white'
                                                        : 'hover:bg-white/5 hover:text-white'
                                                )}
                                                onClick={() => selectLanguage(lang.code as 'en' | 'vi')}
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                            >
                                                {lang.label}
                                                {language === lang.code && (
                                                    <motion.div
                                                        initial={{ scale: 0, opacity: 0 }}
                                                        animate={{ scale: 1, opacity: 1 }}
                                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                                    >
                                                        <FiCheck className="text-blue-400" />
                                                    </motion.div>
                                                )}
                                            </motion.button>
                                        </motion.li>
                                    ))}
                                </ul>
                            </motion.div>

                            {/* Contact */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7, duration: 0.3 }}
                            >
                                <h4 className="text-xs sm:text-sm md:text-base lg:text-sm xl:text-base font-semibold uppercase tracking-widest text-gray-400 mb-3 sm:mb-4 md:mb-5 lg:mb-4 xl:mb-5 flex items-center">
                                    <span className="w-1.5 sm:w-2 md:w-2.5 lg:w-2 xl:w-2.5 h-1.5 sm:h-2 md:h-2.5 lg:h-2 xl:h-2.5 bg-green-500 rounded-full mr-2 md:mr-3 lg:mr-2 xl:mr-3"></span>
                                    {t('common.contactUs')}
                                </h4>
                                <motion.div
                                    className="p-3 sm:p-4 md:p-5 lg:p-4 xl:p-5"
                                    whileHover={{ scale: 1.02 }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                >
                                    <p className="text-xs sm:text-sm md:text-base lg:text-sm xl:text-base text-gray-300 mb-1 sm:mb-2 md:mb-3 lg:mb-2 xl:mb-3">Email</p>
                                    <p className="text-white font-medium text-sm sm:text-base md:text-lg lg:text-base xl:text-lg">contact@4thiteck.com</p>
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
}
