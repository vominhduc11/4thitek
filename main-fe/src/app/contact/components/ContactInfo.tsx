'use client';

import { EnvelopeIcon, MapPinIcon, PhoneIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { ANIMATION_OFFSET, getStaggerTransition } from '@/constants/animations';
import { usePublicContent } from '@/hooks/usePublicContent';
import type { ContactContent } from '@/types/content';

const infoIcons = {
    address: MapPinIcon,
    phone: PhoneIcon,
    email: EnvelopeIcon
};

const renderSocialIcon = (key: string) => {
    switch (key) {
        case 'facebook':
            return (
                <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
            );
        case 'youtube':
            return (
                <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
            );
        default:
            return (
                <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.1 1.75 2.9 2.9 0 0 1 2.31-4.64 2.86 2.86 0 0 1 .88.13V9.4a6.26 6.26 0 0 0-1-.1A6.15 6.15 0 0 0 5 20.1a6.14 6.14 0 0 0 10.86-1.1A6.26 6.26 0 0 0 16 9.26v-3a8.26 8.26 0 0 0 5.92 2.23v-3.45a4.87 4.87 0 0 1-.59-.04z" />
                </svg>
            );
    }
};

export default function ContactInfo() {
    const { language } = useLanguage();
    const { data, error } = usePublicContent<ContactContent>('contact');

    return (
        <div>
            <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-3 lg:grid-cols-3">
                {(data?.infoCards ?? []).map((item, index) => {
                    const Icon = infoIcons[item.key as keyof typeof infoIcons] || EnvelopeIcon;
                    return (
                        <motion.div
                            key={item.key}
                            className="brand-card-muted rounded-[26px] p-6 transition-all duration-300 hover:-translate-y-1"
                            initial={{ opacity: 0, y: ANIMATION_OFFSET.small }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={getStaggerTransition(index)}
                            whileHover={{ y: -5 }}
                        >
                            <div className="mb-4 flex items-center">
                                <Icon className="mr-3 h-6 w-6 text-[var(--brand-blue)]" />
                                <h3 className="text-lg font-semibold text-[var(--text-primary)]">{item.title}</h3>
                            </div>
                            <div className="space-y-1">
                                {item.content.map((line, lineIndex) => (
                                    <p key={lineIndex} className="text-sm leading-normal text-[var(--text-secondary)]">
                                        {line}
                                    </p>
                                ))}
                            </div>
                        </motion.div>
                    );
                })}
            </div>
            {error && !data && (
                <p className="mb-10 text-center text-sm text-[var(--destructive-text)]">
                    {language === 'vi'
                        ? 'Không thể tải thông tin liên hệ.'
                        : 'Unable to load contact details.'}
                </p>
            )}

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="text-center"
            >
                <p className="brand-eyebrow mb-3">{language === 'vi' ? 'Kết nối đa kênh' : 'Stay connected'}</p>
                <h3 className="mb-8 font-serif text-3xl font-semibold text-[var(--brand-blue)]">
                    {data?.social.title || ''}
                </h3>
                <div className="flex justify-center space-x-6">
                    {(data?.social.items ?? []).map((item) => (
                        <motion.a
                            key={item.key}
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group relative"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <div className="brand-card flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--brand-border)] transition-all duration-300 hover:border-[var(--brand-border-strong)] hover:bg-[rgba(41,171,226,0.12)] hover:shadow-[0_18px_40px_rgba(0,113,188,0.22)]">
                                {renderSocialIcon(item.key)}
                            </div>
                            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-sm text-[var(--text-secondary)] opacity-0 transition-opacity group-hover:opacity-100">
                                {item.label}
                            </span>
                        </motion.a>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
