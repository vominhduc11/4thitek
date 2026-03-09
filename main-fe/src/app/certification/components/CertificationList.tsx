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
        <section className="bg-[#0c131d] py-12 sm:py-16 2xl:py-20 3xl:py-24 4xl:py-32 5xl:py-40">
            <div className="ml-0 sm:ml-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 5xl:px-24">
                <motion.div
                    className="mb-12 2xl:mb-16 3xl:mb-20 4xl:mb-24 5xl:mb-32"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-2xl sm:text-3xl 2xl:text-4xl 3xl:text-5xl 4xl:text-6xl 5xl:text-7xl font-bold mb-4 2xl:mb-6 3xl:mb-8 4xl:mb-10 5xl:mb-12 text-white">{data?.list.title || ''}</h2>
                    <div className="w-16 h-1 2xl:w-20 2xl:h-1.5 3xl:w-24 3xl:h-2 4xl:w-32 4xl:h-2.5 5xl:w-40 5xl:h-3 bg-[#4FC8FF] mb-6 2xl:mb-8 3xl:mb-10 4xl:mb-12 5xl:mb-16"></div>
                    <p className="text-gray-300 text-base 2xl:text-lg 3xl:text-xl 4xl:text-2xl 5xl:text-3xl max-w-3xl 2xl:max-w-4xl 3xl:max-w-5xl 4xl:max-w-6xl 5xl:max-w-7xl">
                        {data?.list.description || ''}
                    </p>
                    {error && !data && (
                        <p className="mt-4 text-sm text-red-300">
                            {language === 'vi' ? 'Không thể tải nội dung chứng nhận.' : 'Unable to load certification content.'}
                        </p>
                    )}
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-4 4xl:grid-cols-5 5xl:grid-cols-6 gap-8 2xl:gap-10 3xl:gap-12 4xl:gap-16 5xl:gap-20">
                    {(data?.items ?? []).map((cert, index) => (
                        <motion.div
                            key={cert.id}
                            className="bg-[#151e2b] rounded-lg 2xl:rounded-xl 3xl:rounded-2xl overflow-hidden shadow-lg"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            whileHover={{ y: -5, transition: { duration: 0.2 } }}
                        >
                            <div className="p-6 2xl:p-8 3xl:p-10 4xl:p-12 flex items-center justify-center h-40 2xl:h-48 3xl:h-56 4xl:h-64 bg-white/5">
                                <div className="relative h-24 2xl:h-28 3xl:h-32 4xl:h-40 w-full">
                                    {cert.logo ? (
                                        <Image
                                            src={cert.logo}
                                            alt={cert.name}
                                            fill
                                            className="object-contain"
                                            sizes="(max-width: 768px) 100vw, (max-width: 3200px) 33vw, 40vw"
                                        />
                                    ) : (
                                        <div className="flex h-full items-center justify-center text-gray-500">
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
                            <div className="p-6 2xl:p-8 3xl:p-10 4xl:p-12">
                                <h3 className="text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl font-bold text-white mb-2 2xl:mb-3 3xl:mb-4 4xl:mb-5">{cert.name}</h3>
                                <p className="text-gray-400 text-sm 2xl:text-base 3xl:text-lg 4xl:text-xl mb-4 2xl:mb-6 3xl:mb-8 4xl:mb-10 leading-relaxed">{cert.description}</p>
                                <div className="flex justify-between items-center">
                                    <span className="text-xs 2xl:text-sm 3xl:text-base 4xl:text-lg text-[#4FC8FF]">{data?.list.issuedBy}: {cert.issuedBy}</span>
                                    <Link
                                        href={cert.link}
                                        className="text-gray-400 hover:text-[#4FC8FF] transition-colors flex items-center gap-1 2xl:gap-2 3xl:gap-3 4xl:gap-4 text-sm 2xl:text-base 3xl:text-lg 4xl:text-xl"
                                    >
                                        {data?.list.details} <FiExternalLink className="w-3.5 h-3.5 2xl:w-4 2xl:h-4 3xl:w-5 3xl:h-5 4xl:w-6 4xl:h-6" />
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
