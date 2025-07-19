'use client';

import { motion } from 'framer-motion';
import { MapPinIcon, PhoneIcon, EnvelopeIcon, ClockIcon } from '@heroicons/react/24/outline';

const contactData = [
    {
        icon: MapPinIcon,
        title: 'Địa chỉ',
        content: ['123 Đường Lê Lợi, Quận 1', 'TP. Hồ Chí Minh, Việt Nam']
    },
    {
        icon: PhoneIcon,
        title: 'Điện thoại',
        content: ['Hotline: 0123 456 789', 'Zalo: 0987 654 321']
    },
    {
        icon: EnvelopeIcon,
        title: 'Email',
        content: ['contact@4thiteck.com']
    },
    {
        icon: ClockIcon,
        title: 'Giờ làm việc',
        content: ['Thứ 2 - Thứ 6: 8:00 - 18:00', 'Thứ 7 - Chủ nhật: 8:00 - 17:00']
    }
];

export default function ContactInfo() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {contactData.map((item, index) => (
                <motion.div
                    key={index}
                    className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-6 hover:bg-gray-800/50 transition-all duration-300"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                >
                    <div className="flex items-center mb-4">
                        <item.icon className="w-6 h-6 text-[#4FC8FF] mr-3" />
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
            ))}
        </div>
    );
}
