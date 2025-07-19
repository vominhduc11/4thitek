'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown } from 'react-icons/fi';

export default function CertificationFAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const faqs = [
        {
            question: 'Why are certifications important for audio products?',
            answer: 'Certifications ensure that audio products meet industry standards for safety, quality, and performance. They provide consumers with confidence that the products they purchase have been tested and verified by independent organizations. For manufacturers, certifications demonstrate a commitment to quality and compliance with regulations.'
        },
        {
            question: 'How can I verify the authenticity of your product certifications?',
            answer: "All our certifications can be verified through the issuing certification bodies. Each product includes a unique certification number that can be checked on the respective certification authority's website. Additionally, you can contact our customer service team who can provide verification documentation upon request."
        },
        {
            question: 'Do all your products have the same certifications?',
            answer: 'Different product lines may have different certifications based on their intended markets and features. While all our products meet basic safety and quality standards, specific certifications like Hi-Res Audio or specialized Bluetooth certifications may apply only to certain product lines. Each product page lists the specific certifications applicable to that model.'
        },
        {
            question: 'What is the difference between CE and FCC certifications?',
            answer: 'CE certification is required for products sold in the European Economic Area and confirms compliance with European health, safety, and environmental protection standards. FCC certification is required for electronic devices sold in the United States and focuses on electromagnetic interference limits. Both are important regulatory certifications but apply to different geographical markets.'
        },
        {
            question: 'How often do you renew your certifications?',
            answer: 'We maintain our certifications according to the requirements of each certification body. Some certifications require annual renewal, while others may be valid for longer periods with periodic audits. We also update certifications whenever there are significant changes to our products or manufacturing processes to ensure continued compliance.'
        }
    ];

    return (
        <section className="bg-[#0c131d] py-16 sm:py-20">
            <div className="ml-16 sm:ml-20 px-12 sm:px-16 lg:px-20">
                <motion.div
                    className="mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-white">Frequently Asked Questions</h2>
                    <div className="w-16 h-1 bg-[#4FC8FF] mb-6"></div>
                    <p className="text-gray-300 max-w-3xl">
                        Find answers to common questions about our product certifications and quality standards.
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
                                whileHover={{ scale: 1.01 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
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
