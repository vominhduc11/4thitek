'use client';

import { motion } from 'framer-motion';
import AvoidSidebar from '@/components/ui/AvoidSidebar';
import { useLanguage } from '@/context/LanguageContext';

export default function ContactHeader() {
    const { t } = useLanguage();

    return (
        <AvoidSidebar>
            <div className="brand-shell relative z-20 -mt-16 py-6 sm:-mt-20 sm:py-8 lg:-mt-24 lg:py-10">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                >
                    <motion.h1
                        className="mb-2 font-serif text-2xl font-semibold text-[var(--brand-blue)] sm:text-3xl md:text-4xl lg:text-5xl"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    >
                        {t('contact.title')}
                    </motion.h1>

                    <motion.p
                        className="mb-8 max-w-4xl text-sm leading-relaxed text-[var(--text-secondary)] sm:text-base lg:text-lg"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        {t('contact.description')}
                    </motion.p>
                </motion.div>
            </div>
        </AvoidSidebar>
    );
}
