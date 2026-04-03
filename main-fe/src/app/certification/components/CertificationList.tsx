'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { FiExternalLink } from 'react-icons/fi';
import { useLanguage } from '@/context/LanguageContext';
import { usePublicContent } from '@/hooks/usePublicContent';
import type { CertificationContent } from '@/types/content';

export default function CertificationList() {
    const { language } = useLanguage();
    const { data, error } = usePublicContent<CertificationContent>('certification');

    return (
        <section className="brand-section py-12 sm:py-16 2xl:py-20 3xl:py-24">
            <div className="brand-shell sm:ml-16 md:ml-20">
                <motion.div
                    className="mb-12 2xl:mb-16 3xl:mb-20"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                >
                    <p className="brand-eyebrow mb-3">
                        {language === 'vi' ? 'Chuẩn mực và chứng nhận' : 'Standards and certifications'}
                    </p>
                    <h2 className="mb-4 font-serif text-3xl font-semibold text-[var(--brand-blue)] sm:text-4xl xl:text-5xl 3xl:text-6xl">
                        {data?.list.title || ''}
                    </h2>
                    <div className="mb-6 h-1 w-24 rounded-full bg-[linear-gradient(90deg,var(--brand-gradient-start),var(--brand-gradient-end))] 2xl:mb-8 3xl:mb-10" />
                    <p className="max-w-3xl text-base text-[var(--text-secondary)] 2xl:max-w-4xl 2xl:text-lg 3xl:max-w-5xl 3xl:text-xl">
                        {data?.list.description || ''}
                    </p>
                    {error && !data && (
                        <p className="mt-4 text-sm text-[var(--destructive-text)]">
                            {language === 'vi'
                                ? 'KhĂ´ng thá»ƒ táº£i ná»™i dung chá»©ng nháº­n.'
                                : 'Unable to load certification content.'}
                        </p>
                    )}
                </motion.div>

                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 2xl:gap-10 3xl:grid-cols-5 3xl:gap-12">
                    {(data?.items ?? []).map((cert, index) => (
                        <motion.div
                            key={cert.id}
                            className="brand-card overflow-hidden rounded-[28px]"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            whileHover={{ y: -5, transition: { duration: 0.2 } }}
                        >
                            <div className="flex h-40 items-center justify-center bg-[rgba(255,255,255,0.03)] p-6 2xl:h-48 2xl:p-8 3xl:h-56 3xl:p-10">
                                <div className="relative h-24 w-full 2xl:h-28 3xl:h-32">
                                    {cert.logo ? (
                                        <Image
                                            src={cert.logo}
                                            alt={cert.name}
                                            fill
                                            className="object-contain"
                                            sizes="(max-width: 768px) 100vw, (max-width: 3200px) 33vw, 40vw"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-[var(--text-muted)]">
                                            <svg
                                                aria-hidden="true"
                                                className="h-10 w-10"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={1.5}
                                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2 1.586-1.586a2 2 0 012.828 0L20 14m-6-8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                                />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="p-6 2xl:p-8 3xl:p-10">
                                <h3 className="mb-2 text-xl font-semibold text-[var(--text-primary)] 2xl:mb-3 2xl:text-2xl 3xl:mb-4 3xl:text-3xl">
                                    {cert.name}
                                </h3>
                                <p className="mb-4 text-sm leading-relaxed text-[var(--text-secondary)] 2xl:mb-6 2xl:text-base 3xl:mb-8 3xl:text-lg">
                                    {cert.description}
                                </p>
                                <div className="flex items-center justify-between gap-4">
                                    <span className="brand-badge-muted text-xs 2xl:text-sm 3xl:text-base">
                                        {data?.list.issuedBy}: {cert.issuedBy}
                                    </span>
                                    <Link
                                        href={cert.link}
                                        className="flex items-center gap-1 text-sm text-[var(--brand-blue)] transition-colors hover:text-[var(--text-primary)] 2xl:gap-2 2xl:text-base 3xl:gap-3 3xl:text-lg"
                                    >
                                        {data?.list.details}{' '}
                                        <FiExternalLink className="h-3.5 w-3.5 2xl:h-4 2xl:w-4 3xl:h-5 3xl:w-5" />
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
