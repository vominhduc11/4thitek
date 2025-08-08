'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown } from 'react-icons/fi';
import { useLanguage } from '@/context/LanguageContext';
import { ANIMATION_SCALE, ANIMATION_EASING } from '@/constants/animations';

export default function CertificationFAQ() {
    const { t } = useLanguage();
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const faqs = [
        {
            question: t('certification.faq.questions.q1.question'),
            answer: t('certification.faq.questions.q1.answer')
        },
        {
            question: t('certification.faq.questions.q2.question'),
            answer: t('certification.faq.questions.q2.answer')
        },
        {
            question: t('certification.faq.questions.q3.question'),
            answer: t('certification.faq.questions.q3.answer')
        }
    ];

    return (
        <section className="bg-[#0c131d] py-16 sm:py-20">
            <div className="ml-16 sm:ml-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
                <motion.div
                    className="mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-white">{t('certification.faq.title')}</h2>
                    <div className="w-16 h-1 bg-[#4FC8FF] mb-6"></div>
                    <p className="text-gray-300 max-w-3xl">
                        {t('certification.faq.subtitle')}
                    </p>
                </motion.div>

                <div className="max-w-3xl mx-auto">
                    {faqs.map((faq, index) => (
                        <motion.div
                            key={index}
                            className="mb-4"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: index * 0.1 }}
                            viewport={{ once: true }}
                        >
                            <motion.button
                                className={`w-full text-left p-5 rounded-lg flex justify-between items-center ${
                                    openIndex === index
                                        ? 'bg-[#1a2332] text-white'
                                        : 'bg-[#151e2b] text-gray-200 hover:bg-[#1a2332]/70'
                                }`}
                                onClick={() => toggleFAQ(index)}
                                whileHover={{ scale: ANIMATION_SCALE.hover }}
                                transition={ANIMATION_EASING.springBouncy}
                            >
                                <span className="font-medium text-base sm:text-lg">{faq.question}</span>
                                <motion.div
                                    animate={{ rotate: openIndex === index ? 180 : 0 }}
                                    transition={{ duration: 0.3 }}
                                    className={`${openIndex === index ? 'text-[#4FC8FF]' : 'text-gray-400'}`}
                                >
                                    <FiChevronDown size={20} />
                                </motion.div>
                            </motion.button>

                            <AnimatePresence>
                                {openIndex === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="overflow-hidden"
                                    >
                                        <div className="p-5 bg-[#151e2b]/50 rounded-b-lg border-t border-[#2a3548] text-gray-300">
                                            {faq.answer}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
