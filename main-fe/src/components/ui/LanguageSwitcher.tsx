'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiChevronDown, FiGlobe } from 'react-icons/fi';
import { useLanguage } from '@/context/LanguageContext';

export default function LanguageSwitcher() {
    const { language, setLanguage, isHydrated, t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);

    if (!isHydrated) {
        return (
            <div className="brand-card-muted flex items-center gap-2 rounded-full px-3 py-2 text-[var(--text-secondary)]">
                <FiGlobe className="h-4 w-4" />
                <span className="hidden text-sm font-medium sm:inline">{t('common.vietnamese')}</span>
                <span className="text-sm font-medium sm:hidden">VI</span>
                <FiChevronDown className="h-4 w-4" />
            </div>
        );
    }

    const languages = [
        { code: 'en', label: t('common.english'), shortLabel: 'EN' },
        { code: 'vi', label: t('common.vietnamese'), shortLabel: 'VI' }
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
                className="brand-card-muted flex items-center gap-2 rounded-full px-3 py-2 text-[var(--text-secondary)] transition-colors duration-200 hover:border-[var(--brand-border-strong)] hover:text-white"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
            >
                <FiGlobe className="h-4 w-4" />
                <span className="hidden text-sm font-medium sm:inline">{currentLanguage?.label}</span>
                <span className="text-sm font-medium sm:hidden">{currentLanguage?.shortLabel}</span>
                <FiChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-[999]" onClick={() => setIsOpen(false)} />

                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="brand-card absolute right-0 top-full z-[1001] mt-2 w-48 overflow-hidden rounded-[22px] border border-[var(--brand-border)] shadow-xl"
                        >
                            {languages.map((lang, index) => (
                                <motion.button
                                    key={lang.code}
                                    onClick={() => handleLanguageSelect(lang.code as 'en' | 'vi')}
                                    className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors duration-200 ${
                                        language === lang.code
                                            ? 'bg-[rgba(41,171,226,0.16)] text-[var(--brand-blue)]'
                                            : 'text-[var(--text-secondary)] hover:bg-[rgba(41,171,226,0.08)] hover:text-white'
                                    }`}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    whileHover={{ x: 4 }}
                                >
                                    <span className="rounded-full border border-[var(--brand-border)] px-2 py-1 text-xs font-semibold">
                                        {lang.shortLabel}
                                    </span>
                                    <span className="text-sm font-medium">{lang.label}</span>
                                    {language === lang.code && (
                                        <motion.div
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="ml-auto h-2 w-2 rounded-full bg-[var(--brand-blue)]"
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
