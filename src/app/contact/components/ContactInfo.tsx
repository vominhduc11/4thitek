'use client';

import { motion } from 'framer-motion';
import { MapPinIcon, PhoneIcon, EnvelopeIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/contexts/LanguageContext';
import { getStaggerTransition, ANIMATION_OFFSET } from '@/constants/animations';

export default function ContactInfo() {
    const { t } = useLanguage();

    const contactData = [
        {
            icon: MapPinIcon,
            title: t('contact.info.address'),
            content: t('contact.info.addressContent')
        },
        {
            icon: PhoneIcon,
            title: t('contact.info.phone'),
            content: t('contact.info.phoneContent')
        },
        {
            icon: EnvelopeIcon,
            title: t('contact.info.email'),
            content: t('contact.info.emailContent')
        },
        {
            icon: ClockIcon,
            title: t('contact.info.hours'),
            content: t('contact.info.hoursContent')
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {contactData.map((item, index) => (
                <motion.div
                    key={index}
                    className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-6 hover:bg-gray-800/50 transition-all duration-300"
                    initial={{ opacity: 0, y: ANIMATION_OFFSET.small }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={getStaggerTransition(index)}
                    whileHover={{ y: -5 }}
                >
                    <div className="flex items-center mb-4">
                        <item.icon className="w-6 h-6 text-[#4FC8FF] mr-3" />
                        <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                    </div>
                    <div className="space-y-1">
                        {Array.isArray(item.content) ? item.content.map((line, lineIndex) => (
                            <p key={lineIndex} className="text-gray-300 text-sm leading-normal">
                                {line}
                            </p>
                        )) : (
                            <p className="text-gray-300 text-sm leading-normal">
                                {item.content}
                            </p>
                        )}
                    </div>
                </motion.div>
            ))}
        </div>
    );
}
