'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { FiAward, FiEye, FiTarget } from 'react-icons/fi';
import { useLanguage } from '@/context/LanguageContext';
import { usePublicContent } from '@/hooks/usePublicContent';
import type { AboutContent } from '@/types/content';

const valueIcons = {
    mission: <FiTarget className="h-6 w-6" />,
    vision: <FiEye className="h-6 w-6" />,
    values: <FiAward className="h-6 w-6" />
};

export default function AboutMission() {
    const { language } = useLanguage();
    const { data, error } = usePublicContent<AboutContent>('about');

    return (
        <section className="brand-section py-12 sm:py-16">
            <div className="brand-shell sm:ml-16 md:ml-20">
                <div className="grid grid-cols-1 items-center gap-8 md:gap-12 lg:grid-cols-2">
                    <motion.div
                        className="brand-card relative h-[400px] overflow-hidden rounded-[30px]"
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7 }}
                        viewport={{ once: true }}
                    >
                        <div className="absolute inset-0 z-10 bg-[linear-gradient(140deg,rgba(0,113,188,0.12),rgba(41,171,226,0.32),transparent_68%)]" />
                        <Image
                            src="/images/about-mission.jpg"
                            alt={data?.purpose.title || '4T HITEK'}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 3200px) 50vw, 60vw"
                        />
                    </motion.div>

                    <div>
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                            viewport={{ once: true }}
                        >
                            <p className="brand-eyebrow mb-3">
                                {language === 'vi' ? 'Tinh thần thương hiệu' : 'Brand foundation'}
                            </p>
                            <h3 className="mb-3 font-serif text-3xl font-semibold text-[var(--brand-blue)] sm:text-4xl">
                                {data?.purpose.title || ''}
                            </h3>
                            <div className="mb-6 h-1 w-24 rounded-full bg-[linear-gradient(90deg,var(--brand-gradient-start),var(--brand-gradient-end))]" />
                            <p className="mb-8 max-w-2xl text-base leading-8 text-[var(--text-secondary)] sm:text-lg">
                                {data?.purpose.description || ''}
                            </p>
                            {error && !data && (
                                <p className="text-sm text-[var(--destructive-text)]">
                                    {language === 'vi'
                                        ? 'KhĂ´ng thá»ƒ táº£i ná»™i dung trang giá»›i thiá»‡u.'
                                        : 'Unable to load about content.'}
                                </p>
                            )}
                        </motion.div>

                        <div className="space-y-6">
                            {(data?.cards ?? []).map((item, index) => (
                                <motion.div
                                    key={item.key}
                                    className="brand-card-muted flex items-start gap-4 rounded-[24px] p-5"
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, delay: index * 0.1 }}
                                    viewport={{ once: true }}
                                >
                                    <div className="rounded-2xl border border-[var(--brand-border-strong)] bg-[rgba(41,171,226,0.14)] p-3 text-[var(--brand-blue)]">
                                        {valueIcons[item.key as keyof typeof valueIcons] || valueIcons.values}
                                    </div>
                                    <div>
                                        <h4 className="mb-1 text-lg font-semibold text-[var(--text-primary)]">
                                            {item.title}
                                        </h4>
                                        <p className="text-[var(--text-secondary)]">{item.description}</p>
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
