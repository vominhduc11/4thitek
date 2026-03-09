'use client';

import { motion } from 'framer-motion';
import { MapPinIcon, PhoneIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/context/LanguageContext';
import { getStaggerTransition, ANIMATION_OFFSET } from '@/constants/animations';
import { usePublicContent } from '@/hooks/usePublicContent';
import type { ContactContent } from '@/types/content';

const infoIcons = {
    address: MapPinIcon,
    phone: PhoneIcon,
    email: EnvelopeIcon
};

const socialColorClasses = {
    facebook: 'bg-blue-600 hover:bg-blue-700',
    youtube: 'bg-red-600 hover:bg-red-700',
    tiktok: 'bg-black hover:bg-gray-900'
};

const renderSocialIcon = (key: string) => {
    switch (key) {
        case 'facebook':
            return (
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
            );
        case 'youtube':
            return (
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
            );
        default:
            return (
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
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
            {/* Contact Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6 mb-16">
                {(data?.infoCards ?? []).map((item, index) => {
                    const Icon = infoIcons[item.key as keyof typeof infoIcons] || EnvelopeIcon;
                    return (
                    <motion.div
                        key={item.key}
                        className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-6 hover:bg-gray-800/50 transition-all duration-300"
                        initial={{ opacity: 0, y: ANIMATION_OFFSET.small }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={getStaggerTransition(index)}
                        whileHover={{ y: -5 }}
                    >
                        <div className="flex items-center mb-4">
                            <Icon className="w-6 h-6 text-[#4FC8FF] mr-3" />
                            <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                        </div>
                        <div className="space-y-1">
                            {item.content.map((line, lineIndex) => (
                                <p key={lineIndex} className="text-gray-300 text-sm leading-normal">
                                    {line}
                                </p>
                            ))}
                        </div>
                    </motion.div>
                    );
                })}
            </div>
            {error && !data && (
                <p className="mb-10 text-center text-sm text-red-300">
                    {language === 'vi' ? 'Không thể tải thông tin liên hệ.' : 'Unable to load contact details.'}
                </p>
            )}

            {/* Social Media Section */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="text-center"
            >
                <h3 className="text-2xl font-bold text-white mb-8">
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
                            <div
                                className={`flex items-center justify-center w-16 h-16 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl ${socialColorClasses[item.key as keyof typeof socialColorClasses] || socialColorClasses.tiktok}`}
                            >
                                {renderSocialIcon(item.key)}
                            </div>
                            <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-sm text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                {item.label}
                            </span>
                        </motion.a>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
