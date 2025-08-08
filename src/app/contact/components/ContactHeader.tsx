'use client';

import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';

export default function ContactHeader() {
    const { t } = useLanguage();

    return (
        <div className="ml-16 sm:ml-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 -mt-16 sm:-mt-20 lg:-mt-24 relative z-20 py-6 sm:py-8 lg:py-10">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
            >
                <motion.h1
                    className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-2 font-mono text-[#4FC8FF]"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                    {t('contact.title')}
                </motion.h1>

                <motion.p
                    className="text-gray-300 text-sm sm:text-base lg:text-lg mb-8 leading-relaxed max-w-4xl"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    {t('contact.description')}
                </motion.p>
            </motion.div>
        </div>
    );
}
