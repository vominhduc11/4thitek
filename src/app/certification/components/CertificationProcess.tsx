'use client';

import { motion } from 'framer-motion';
import { FiFileText, FiCheckCircle, FiActivity, FiAward } from 'react-icons/fi';
import { useLanguage } from '@/context/LanguageContext';

export default function CertificationProcess() {
    const { t } = useLanguage();

    const steps = [
        {
            icon: <FiFileText className="w-6 h-6" />,
            title: t('certification.process.steps.design.title'),
            description: t('certification.process.steps.design.description')
        },
        {
            icon: <FiActivity className="w-6 h-6" />,
            title: t('certification.process.steps.testing.title'),
            description: t('certification.process.steps.testing.description')
        },
        {
            icon: <FiCheckCircle className="w-6 h-6" />,
            title: t('certification.process.steps.documentation.title'),
            description: t('certification.process.steps.documentation.description')
        },
        {
            icon: <FiAward className="w-6 h-6" />,
            title: t('certification.process.steps.certification.title'),
            description: t('certification.process.steps.certification.description')
        }
    ];

    return (
        <section className="bg-[#0f1824] py-16 sm:py-20">
            <div className="ml-16 sm:ml-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-white">{t('certification.process.title')}</h2>
                    <div className="w-20 h-1 bg-[#4FC8FF] mx-auto mb-6"></div>
                    <p className="text-gray-300 max-w-2xl mx-auto">
                        {t('certification.process.subtitle')}
                    </p>
                </motion.div>

                <div className="relative">
                    {/* Process line */}
                    <div className="absolute left-[28px] top-0 h-full w-1 bg-[#4FC8FF]/20 hidden sm:block"></div>

                    {/* Process steps */}
                    <div className="space-y-12 sm:space-y-0">
                        {steps.map((step, index) => (
                            <motion.div
                                key={step.title}
                                className="flex flex-col sm:flex-row items-start sm:items-center gap-6 sm:gap-8 sm:mb-16 relative"
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: index * 0.1 }}
                                viewport={{ once: true, margin: '-100px' }}
                            >
                                {/* Step number and icon */}
                                <motion.div
                                    className="flex items-center justify-center w-14 h-14 rounded-full bg-[#151e2b] border-2 border-[#4FC8FF]/30 text-[#4FC8FF] z-10"
                                    whileHover={{ scale: 1.1, borderColor: 'rgba(79, 200, 255, 0.8)' }}
                                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                                >
                                    {step.icon}
                                </motion.div>

                                {/* Content */}
                                <div className="sm:w-full">
                                    <h3 className="text-xl font-bold text-white mb-2">
                                        <span className="text-[#4FC8FF] mr-2">0{index + 1}.</span> {step.title}
                                    </h3>
                                    <p className="text-gray-300">{step.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
