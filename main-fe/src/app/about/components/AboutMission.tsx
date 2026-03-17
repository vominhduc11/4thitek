'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { FiTarget, FiEye, FiAward } from 'react-icons/fi';
import { useLanguage } from '@/context/LanguageContext';
import { usePublicContent } from '@/hooks/usePublicContent';
import type { AboutContent } from '@/types/content';

const valueIcons = {
    mission: <FiTarget className="w-6 h-6" />,
    vision: <FiEye className="w-6 h-6" />,
    values: <FiAward className="w-6 h-6" />
};

export default function AboutMission() {
    const { language } = useLanguage();
    const { data, error } = usePublicContent<AboutContent>('about');

    return (
        <section className="bg-[#0c131d] py-12 sm:py-16">
            <div className="ml-0 sm:ml-16 md:ml-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
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
                            alt={data?.purpose.title || '4thitek'}
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
                            <h3 className="text-2xl font-bold text-white mb-2">{data?.purpose.title || ''}</h3>
                            <div className="w-16 h-1 bg-[#4FC8FF] mb-6"></div>
                            <p className="text-gray-300 mb-8">
                                {data?.purpose.description || ''}
                            </p>
                            {error && !data && (
                                <p className="text-sm text-red-300">
                                    {language === 'vi' ? 'Không thể tải nội dung trang giới thiệu.' : 'Unable to load about content.'}
                                </p>
                            )}
                        </motion.div>

                        <div className="space-y-6">
                            {(data?.cards ?? []).map((item, index) => (
                                <motion.div
                                    key={item.key}
                                    className="flex items-start gap-4"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                >
                                    <div className="p-3 bg-[#4FC8FF]/20 text-[#4FC8FF] rounded-lg">
                                        {valueIcons[item.key as keyof typeof valueIcons] || valueIcons.values}
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-semibold text-white mb-1">{item.title}</h4>
                                        <p className="text-gray-400">{item.description}</p>
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
