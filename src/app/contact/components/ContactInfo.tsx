'use client';

import { motion } from 'framer-motion';
import { MapPinIcon, PhoneIcon, EnvelopeIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useLanguage } from '@/context/LanguageContext';
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
        <div>
            {/* Contact Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
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

            {/* Social Media Section */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="text-center"
            >
                <h3 className="text-2xl font-bold text-white mb-8">
                    Kết nối với chúng tôi
                </h3>
                <div className="flex justify-center space-x-6">
                    {/* Facebook */}
                    <motion.a
                        href="#"
                        className="group relative"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <div className="flex items-center justify-center w-16 h-16 bg-blue-600 hover:bg-blue-700 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl">
                            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                        </div>
                        <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-sm text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            Facebook
                        </span>
                    </motion.a>

                    {/* Zalo */}
                    <motion.a
                        href="#"
                        className="group relative"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <div className="flex items-center justify-center w-16 h-16 bg-blue-500 hover:bg-blue-600 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl">
                            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.568 8.16c-.169-.78-.96-1.332-1.768-1.225-.808.107-1.411.812-1.342 1.573l.028.316c.053.633-.43 1.186-1.075 1.225-.645.04-1.225-.472-1.286-1.135l-.051-.548c-.108-1.173-1.133-2.063-2.284-1.982-1.151.08-2.018 1.126-1.931 2.329l.049.697c.064 1.04-.708 1.94-1.718 2.001-1.01.062-1.94-.734-2.065-1.769l-.09-1.042c-.192-2.208.52-4.333 1.996-5.96 1.476-1.626 3.517-2.534 5.73-2.546 2.213-.013 4.267.854 5.767 2.432 1.5 1.578 2.26 3.69 2.133 5.922l-.084 1.481c-.089 1.565-1.428 2.772-2.978 2.688-1.55-.084-2.739-1.448-2.642-3.036l.046-.752c.074-1.187-.796-2.222-1.936-2.302-1.14-.08-2.181.818-2.313 2l-.079 1.146c-.196 2.838 2.015 5.356 4.921 5.605 2.906.249 5.487-1.727 5.739-4.394l.048-.508z"/>
                            </svg>
                        </div>
                        <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-sm text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            Zalo
                        </span>
                    </motion.a>

                    {/* YouTube */}
                    <motion.a
                        href="#"
                        className="group relative"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <div className="flex items-center justify-center w-16 h-16 bg-red-600 hover:bg-red-700 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl">
                            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                            </svg>
                        </div>
                        <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-sm text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            YouTube
                        </span>
                    </motion.a>
                </div>
            </motion.div>
        </div>
    );
}
