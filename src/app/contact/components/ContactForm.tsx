'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import ContactMap from './ContactMap';
import { FiChevronDown, FiHelpCircle, FiTool, FiAlertTriangle, FiUsers, FiMoreHorizontal } from 'react-icons/fi';
import { useLanguage } from '@/context/LanguageContext';
import { typographyComponents } from '@/styles/typography';

interface FormData {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
}

export default function ContactForm() {
    const { t } = useLanguage();
    const [formData, setFormData] = useState<FormData>({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
    const subjectDropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (subjectDropdownRef.current && !subjectDropdownRef.current.contains(event.target as Node)) {
                setIsSubjectDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const subjectOptions = [
        { value: 'product-inquiry', label: t('contact.form.subjects.productInquiry'), icon: FiHelpCircle },
        { value: 'warranty', label: t('contact.form.subjects.warranty'), icon: FiTool },
        { value: 'complaint', label: t('contact.form.subjects.complaint'), icon: FiAlertTriangle },
        { value: 'partnership', label: t('contact.form.subjects.partnership'), icon: FiUsers },
        { value: 'other', label: t('contact.form.subjects.other'), icon: FiMoreHorizontal }
    ];

    const getSelectedSubject = () => {
        return subjectOptions.find((opt) => opt.value === formData.subject);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Simulate form submission
        await new Promise((resolve) => setTimeout(resolve, 2000));

        setIsSubmitting(false);

        // Reset form
        setFormData({
            name: '',
            email: '',
            phone: '',
            subject: '',
            message: ''
        });

        alert(t('contact.form.successMessage'));
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 2xl:gap-16 3xl:gap-20 4xl:gap-24">
            {/* Contact Form */}
            <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
            >
                <h2 className={`${typographyComponents.section.title} mb-6 2xl:mb-8 3xl:mb-10 4xl:mb-12 5xl:mb-16`}>{t('contact.form.title')}</h2>
                <form onSubmit={handleSubmit} className="space-y-6 2xl:space-y-8 3xl:space-y-10 4xl:space-y-12">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 2xl:gap-6 3xl:gap-8 4xl:gap-10">
                        <div>
                            <label htmlFor="name" className="block text-sm 2xl:text-base 3xl:text-lg 4xl:text-xl font-medium text-gray-300 mb-2 2xl:mb-3 3xl:mb-4 4xl:mb-5">
                                {t('contact.form.nameRequired')}
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                                className={`w-full px-4 py-3 2xl:px-6 2xl:py-4 3xl:px-8 3xl:py-5 4xl:px-10 4xl:py-6 5xl:px-12 5xl:py-8 bg-gray-800/50 border border-gray-600 rounded-lg 2xl:rounded-xl 3xl:rounded-2xl 5xl:rounded-3xl ${typographyComponents.form.input} placeholder-gray-400 focus:outline-none focus:border-[#4FC8FF] focus:ring-1 focus:ring-[#4FC8FF] transition-colors`}
                                placeholder={t('contact.form.namePlaceholder')}
                            />
                        </div>
                        <div>
                            <label htmlFor="phone" className="block text-sm 2xl:text-base 3xl:text-lg 4xl:text-xl font-medium text-gray-300 mb-2 2xl:mb-3 3xl:mb-4 4xl:mb-5">
                                {t('contact.form.phone')}
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 2xl:px-6 2xl:py-4 3xl:px-8 3xl:py-5 4xl:px-10 4xl:py-6 5xl:px-12 5xl:py-8 bg-gray-800/50 border border-gray-600 rounded-lg 2xl:rounded-xl 3xl:rounded-2xl 5xl:rounded-3xl ${typographyComponents.form.input} placeholder-gray-400 focus:outline-none focus:border-[#4FC8FF] focus:ring-1 focus:ring-[#4FC8FF] transition-colors`}
                                placeholder={t('contact.form.phonePlaceholder')}
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm 2xl:text-base 3xl:text-lg 4xl:text-xl font-medium text-gray-300 mb-2 2xl:mb-3 3xl:mb-4 4xl:mb-5">
                            {t('contact.form.emailRequired')}
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="w-full px-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-[#4FC8FF] focus:ring-1 focus:ring-[#4FC8FF] transition-colors"
                            placeholder={t('contact.form.emailPlaceholder')}
                        />
                    </div>

                    <div>
                        <label className="block text-sm 2xl:text-base 3xl:text-lg 4xl:text-xl font-medium text-gray-300 mb-2 2xl:mb-3 3xl:mb-4 4xl:mb-5">{t('contact.form.subject')}</label>
                        <div ref={subjectDropdownRef} className="relative">
                            <button
                                type="button"
                                onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                                className="w-full flex items-center justify-between gap-2 2xl:gap-3 3xl:gap-4 4xl:gap-5 px-4 py-3 2xl:px-6 2xl:py-4 3xl:px-8 3xl:py-5 4xl:px-10 4xl:py-6 bg-gray-800/50 border border-gray-600 rounded-lg 2xl:rounded-xl 3xl:rounded-2xl text-white text-base 2xl:text-lg 3xl:text-xl 4xl:text-2xl focus:outline-none focus:border-[#4FC8FF] focus:ring-1 focus:ring-[#4FC8FF] transition-all duration-300"
                            >
                                <div className="flex items-center gap-2">
                                    {(() => {
                                        const selected = getSelectedSubject();
                                        const Icon = selected?.icon || FiHelpCircle;
                                        return (
                                            <>
                                                <Icon className="w-4 h-4 2xl:w-5 2xl:h-5 3xl:w-6 3xl:h-6 4xl:w-7 4xl:h-7 text-gray-400" />
                                                <span className={formData.subject ? 'text-white' : 'text-gray-400'}>
                                                    {selected?.label || t('contact.form.selectSubject')}
                                                </span>
                                            </>
                                        );
                                    })()}
                                </div>
                                <FiChevronDown
                                    className={`w-4 h-4 2xl:w-5 2xl:h-5 3xl:w-6 3xl:h-6 4xl:w-7 4xl:h-7 text-gray-400 transition-transform duration-200 ${isSubjectDropdownOpen ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {isSubjectDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute top-full left-0 right-0 mt-1 2xl:mt-2 3xl:mt-3 4xl:mt-4 bg-gray-800 border border-gray-600 rounded-lg 2xl:rounded-xl 3xl:rounded-2xl shadow-xl z-50 overflow-hidden"
                                >
                                    {subjectOptions.map((option) => {
                                        const isSelected = formData.subject === option.value;
                                        const Icon = option.icon;
                                        return (
                                            <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => {
                                                    setFormData((prev) => ({ ...prev, subject: option.value }));
                                                    setIsSubjectDropdownOpen(false);
                                                }}
                                                className={`w-full flex items-center gap-3 2xl:gap-4 3xl:gap-5 4xl:gap-6 px-4 py-3 2xl:px-6 2xl:py-4 3xl:px-8 3xl:py-5 4xl:px-10 4xl:py-6 text-sm 2xl:text-base 3xl:text-lg 4xl:text-xl transition-all duration-200 ${
                                                    isSelected
                                                        ? 'bg-[#4FC8FF]/20 text-[#4FC8FF] border-l-2 border-[#4FC8FF]'
                                                        : 'text-white hover:bg-gray-700/50 hover:text-[#4FC8FF]'
                                                }`}
                                            >
                                                <Icon
                                                    className={`w-4 h-4 2xl:w-5 2xl:h-5 3xl:w-6 3xl:h-6 4xl:w-7 4xl:h-7 ${
                                                        isSelected ? 'text-[#4FC8FF]' : 'text-gray-400'
                                                    }`}
                                                />
                                                <span>{option.label}</span>
                                                {isSelected && (
                                                    <motion.div
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        className="ml-auto w-2 h-2 2xl:w-3 2xl:h-3 3xl:w-4 3xl:h-4 4xl:w-5 4xl:h-5 bg-[#4FC8FF] rounded-full"
                                                    />
                                                )}
                                            </button>
                                        );
                                    })}
                                </motion.div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label htmlFor="message" className="block text-sm 2xl:text-base 3xl:text-lg 4xl:text-xl font-medium text-gray-300 mb-2 2xl:mb-3 3xl:mb-4 4xl:mb-5">
                            {t('contact.form.messageRequired')}
                        </label>
                        <textarea
                            id="message"
                            name="message"
                            value={formData.message}
                            onChange={handleChange}
                            required
                            rows={6}
                            className="w-full px-4 py-3 2xl:px-6 2xl:py-4 3xl:px-8 3xl:py-5 4xl:px-10 4xl:py-6 bg-gray-800/50 border border-gray-600 rounded-lg 2xl:rounded-xl 3xl:rounded-2xl text-white text-base 2xl:text-lg 3xl:text-xl 4xl:text-2xl placeholder-gray-400 focus:outline-none focus:border-[#4FC8FF] focus:ring-1 focus:ring-[#4FC8FF] transition-colors resize-vertical"
                            placeholder={t('contact.form.messagePlaceholder')}
                        />
                    </div>

                    <motion.button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-[#4FC8FF] text-black font-semibold py-3 px-6 2xl:py-4 2xl:px-8 3xl:py-5 3xl:px-10 4xl:py-6 4xl:px-12 rounded-lg 2xl:rounded-xl 3xl:rounded-2xl text-base 2xl:text-lg 3xl:text-xl 4xl:text-2xl hover:bg-[#3BA8CC] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300"
                        whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
                        whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
                    >
                        {isSubmitting ? t('contact.form.sendingButton') : t('contact.form.sendButton')}
                    </motion.button>
                </form>
            </motion.div>

            {/* Map */}
            <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
            >
                <h2 className="text-2xl 2xl:text-3xl 3xl:text-4xl 4xl:text-5xl font-bold text-white mb-6 2xl:mb-8 3xl:mb-10 4xl:mb-12">{t('contact.map.title')}</h2>
                <ContactMap />

                {/* Additional Contact Methods */}
                <div className="mt-8 2xl:mt-10 3xl:mt-12 4xl:mt-16 space-y-4 2xl:space-y-6 3xl:space-y-8 4xl:space-y-10">
                    <h3 className="text-lg 2xl:text-xl 3xl:text-2xl 4xl:text-3xl font-semibold text-white mb-4 2xl:mb-6 3xl:mb-8 4xl:mb-10">{t('contact.map.connectTitle')}</h3>
                    <div className="flex space-x-4 2xl:space-x-6 3xl:space-x-8 4xl:space-x-10">
                        <a
                            href="#"
                            className="flex items-center justify-center w-12 h-12 2xl:w-14 2xl:h-14 3xl:w-16 3xl:h-16 4xl:w-20 4xl:h-20 bg-blue-600 hover:bg-blue-700 rounded-lg 2xl:rounded-xl 3xl:rounded-2xl transition-colors"
                        >
                            <svg className="w-6 h-6 2xl:w-7 2xl:h-7 3xl:w-8 3xl:h-8 4xl:w-10 4xl:h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                            </svg>
                        </a>
                        <a
                            href="#"
                            className="flex items-center justify-center w-12 h-12 bg-blue-800 hover:bg-blue-900 rounded-lg transition-colors"
                        >
                            <svg className="w-6 h-6 2xl:w-7 2xl:h-7 3xl:w-8 3xl:h-8 4xl:w-10 4xl:h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                        </a>
                        <a
                            href="#"
                            className="flex items-center justify-center w-12 h-12 bg-pink-600 hover:bg-pink-700 rounded-lg transition-colors"
                        >
                            <svg className="w-6 h-6 2xl:w-7 2xl:h-7 3xl:w-8 3xl:h-8 4xl:w-10 4xl:h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z" />
                            </svg>
                        </a>
                        <a
                            href="#"
                            className="flex items-center justify-center w-12 h-12 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                        >
                            <svg className="w-6 h-6 2xl:w-7 2xl:h-7 3xl:w-8 3xl:h-8 4xl:w-10 4xl:h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                            </svg>
                        </a>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
