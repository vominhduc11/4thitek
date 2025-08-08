'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiGlobe } from 'react-icons/fi';
import { useLanguage } from '@/context/LanguageContext';

export default function LanguageSwitcher() {
    const { language, setLanguage, isHydrated } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);

    // Don't render anything until hydrated to prevent mismatch
    if (!isHydrated) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 text-gray-300 rounded-lg">
                <FiGlobe className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">🇺🇸 English</span>
                <span className="text-sm font-medium sm:hidden">🇺🇸</span>
                <FiChevronDown className="w-4 h-4" />
            </div>
        );
    }

    const languages = [
        { code: 'en', label: 'English', flag: '🇺🇸' },
        { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' }
    ];

    const currentLanguage = languages.find((lang) => lang.code === language);

    const handleLanguageSelect = (langCode: 'en' | 'vi') => {
        setLanguage(langCode);
        setIsOpen(false);
    };

    return (
        <div className="relative">
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white transition-colors duration-200 rounded-lg hover:bg-white/5"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <FiGlobe className="w-4 h-4" />
                <span className="text-sm font-medium hidden sm:inline">
                    {currentLanguage?.flag} {currentLanguage?.label}
                </span>
                <span className="text-sm font-medium sm:hidden">{currentLanguage?.flag}</span>
                <FiChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

                        {/* Dropdown */}
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-full right-0 mt-2 w-48 bg-[#1a2332] border border-gray-700/50 rounded-lg shadow-xl z-20 overflow-hidden"
                        >
                            {languages.map((lang, index) => (
                                <motion.button
                                    key={lang.code}
                                    onClick={() => handleLanguageSelect(lang.code as 'en' | 'vi')}
                                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-200 ${
                                        language === lang.code
                                            ? 'bg-blue-500/20 text-blue-400'
                                            : 'text-gray-300 hover:text-white hover:bg-white/5'
                                    }`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileHover={{ x: 4 }}
                                >
                                    <span className="text-lg">{lang.flag}</span>
                                    <span className="text-sm font-medium">{lang.label}</span>
                                    {language === lang.code && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="ml-auto w-2 h-2 bg-blue-400 rounded-full"
                                        />
                                    )}
                                </motion.button>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
