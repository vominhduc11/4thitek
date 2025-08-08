'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { FiTarget, FiEye, FiAward } from 'react-icons/fi';
import { useLanguage } from '@/context/LanguageContext';

export default function AboutMission() {
    const { t } = useLanguage();

    const values = [
        {
            icon: <FiTarget className="w-6 h-6" />,
            titleKey: 'about.mission.title',
            descriptionKey: 'about.mission.description'
        },
        {
            icon: <FiEye className="w-6 h-6" />,
            titleKey: 'about.vision.title',
            descriptionKey: 'about.vision.description'
        },
        {
            icon: <FiAward className="w-6 h-6" />,
            titleKey: 'about.values.title',
            descriptionKey: 'about.values.description'
        }
    ];

    return (
        <section className="bg-[#0c131d] py-12 sm:py-16">
            <div className="ml-16 sm:ml-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
                    {/* Image Section */}
                    <motion.div
                        className="relative h-[400px] rounded-lg overflow-hidden"
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7 }}
                        viewport={{ once: true }}
                    >
                        <div className="absolute inset-0 bg-gradient-to-tr from-[#4FC8FF]/20 to-transparent z-10"></div>
                        <Image
                            src="/images/about-mission.jpg"
                            alt="4thitek mission"
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 3200px) 50vw, 60vw"
                        />
                    </motion.div>

                    {/* Content Section */}
                    <div>
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            viewport={{ once: true }}
                        >
                            <h3 className="text-2xl font-bold text-white mb-2">{t('about.purpose.title')}</h3>
                            <div className="w-16 h-1 bg-[#4FC8FF] mb-6"></div>
                            <p className="text-gray-300 mb-8">
                                {t('about.purpose.description')}
                            </p>
                        </motion.div>

                        <div className="space-y-6">
                            {values.map((item, index) => (
                                <motion.div
                                    key={item.titleKey}
                                    className="flex items-start gap-4"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                >
                                    <div className="p-3 bg-[#4FC8FF]/20 text-[#4FC8FF] rounded-lg">{item.icon}</div>
                                    <div>
                                        <h4 className="text-lg font-semibold text-white mb-1">{t(item.titleKey)}</h4>
                                        <p className="text-gray-400">{t(item.descriptionKey)}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
