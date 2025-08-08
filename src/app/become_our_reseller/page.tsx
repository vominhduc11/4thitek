'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Hero from '@/components/ui/Hero';
import { useLanguage } from '@/context/LanguageContext';
import {
    FiTrendingUp,
    FiHeadphones,
    FiUsers,
    FiAward,
    FiCheckCircle,
    FiMail,
    FiPhone,
    FiMapPin,
    FiChevronDown,
    FiBriefcase,
    FiClock,
    FiBarChart
} from 'react-icons/fi';
import { motion } from 'framer-motion';

interface FormData {
    companyName: string;
    contactName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    country: string;
    businessType: string;
    experience: string;
    expectedVolume: string;
    website: string;
    message: string;
}

export default function BecomeOurReseller() {
    const { t, getTranslation } = useLanguage();
    const formSectionRef = useRef<HTMLElement>(null);

    // Scroll to form function
    const scrollToForm = () => {
        formSectionRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    };

    // Dropdown states
    const [isBusinessTypeDropdownOpen, setIsBusinessTypeDropdownOpen] = useState(false);
    const [isExperienceDropdownOpen, setIsExperienceDropdownOpen] = useState(false);
    const [isVolumeDropdownOpen, setIsVolumeDropdownOpen] = useState(false);
    const businessTypeDropdownRef = useRef<HTMLDivElement>(null);
    const experienceDropdownRef = useRef<HTMLDivElement>(null);
    const volumeDropdownRef = useRef<HTMLDivElement>(null);

    const [formData, setFormData] = useState<FormData>({
        companyName: '',
        contactName: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: '',
        businessType: '',
        experience: '',
        expectedVolume: '',
        website: '',
        message: ''
    });

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (businessTypeDropdownRef.current && !businessTypeDropdownRef.current.contains(event.target as Node)) {
                setIsBusinessTypeDropdownOpen(false);
            }
            if (experienceDropdownRef.current && !experienceDropdownRef.current.contains(event.target as Node)) {
                setIsExperienceDropdownOpen(false);
            }
            if (volumeDropdownRef.current && !volumeDropdownRef.current.contains(event.target as Node)) {
                setIsVolumeDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Options data
    const businessTypesData = getTranslation('becomeReseller.form.businessTypes') as Record<string, string> | null;
    const businessTypeOptions = [
        { value: 'retailer', label: businessTypesData?.retailer || 'Retailer', icon: FiBriefcase },
        { value: 'distributor', label: businessTypesData?.distributor || 'Distributor', icon: FiTrendingUp },
        { value: 'online-store', label: businessTypesData?.onlineStore || 'Online Store', icon: FiUsers },
        { value: 'system-integrator', label: businessTypesData?.systemIntegrator || 'System Integrator', icon: FiAward },
        { value: 'other', label: businessTypesData?.other || 'Other', icon: FiBriefcase }
    ];

    const experienceOptionsData = getTranslation('becomeReseller.form.experienceOptions') as Record<string, string> | null;
    const experienceOptions = [
        { value: '0-2', label: experienceOptionsData?.['0-2'] || '0-2 years', icon: FiClock },
        { value: '3-5', label: experienceOptionsData?.['3-5'] || '3-5 years', icon: FiClock },
        { value: '6-10', label: experienceOptionsData?.['6-10'] || '6-10 years', icon: FiClock },
        { value: '10+', label: experienceOptionsData?.['10+'] || '10+ years', icon: FiClock }
    ];

    const volumeOptionsData = getTranslation('becomeReseller.form.volumeOptions') as Record<string, string> | null;
    const volumeOptions = [
        { value: '1-10', label: volumeOptionsData?.['1-10'] || '1-10 units', icon: FiBarChart },
        { value: '11-50', label: volumeOptionsData?.['11-50'] || '11-50 units', icon: FiBarChart },
        { value: '51-100', label: volumeOptionsData?.['51-100'] || '51-100 units', icon: FiBarChart },
        { value: '100+', label: volumeOptionsData?.['100+'] || '100+ units', icon: FiBarChart }
    ];

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // TODO: Implement API call to submit reseller application
            await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulate API call
            setSubmitStatus('success');
            setFormData({
                companyName: '',
                contactName: '',
                email: '',
                phone: '',
                address: '',
                city: '',
                country: '',
                businessType: '',
                experience: '',
                expectedVolume: '',
                website: '',
                message: ''
            });
        } catch {
            setSubmitStatus('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const breadcrumbItems = [
        { label: t('nav.home'), href: '/' },
        { label: t('becomeReseller.title'), active: true }
    ];

    const benefits = [
        {
            icon: <FiTrendingUp className="w-8 h-8 text-[#4FC8FF]" />,
            title: t('becomeReseller.benefits.competitiveMargins.title'),
            description: t('becomeReseller.benefits.competitiveMargins.description'),
            highlight: t('becomeReseller.benefits.competitiveMargins.highlight')
        },
        {
            icon: <FiHeadphones className="w-8 h-8 text-[#4FC8FF]" />,
            title: t('becomeReseller.benefits.marketingSupport.title'),
            description: t('becomeReseller.benefits.marketingSupport.description'),
            highlight: t('becomeReseller.benefits.marketingSupport.highlight')
        },
        {
            icon: <FiUsers className="w-8 h-8 text-[#4FC8FF]" />,
            title: t('becomeReseller.benefits.technicalSupport.title'),
            description: t('becomeReseller.benefits.technicalSupport.description'),
            highlight: t('becomeReseller.benefits.technicalSupport.highlight')
        },
        {
            icon: <FiAward className="w-8 h-8 text-[#4FC8FF]" />,
            title: t('becomeReseller.benefits.premiumProducts.title'),
            description: t('becomeReseller.benefits.premiumProducts.description'),
            highlight: t('becomeReseller.benefits.premiumProducts.highlight')
        }
    ];


    return (
        <div className="min-h-screen bg-[#0c131d]">
            {/* Hero Section */}
            <Hero breadcrumbItems={breadcrumbItems} />

            {/* Main Content */}
            <div className="relative">
                {/* Header Section */}
                <section className="ml-16 sm:ml-20 py-16 px-4 sm:px-12 md:px-16 lg:px-20">
                    <div className="max-w-6xl mx-auto text-center">
                        <motion.h1
                            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                        >
                            {t('becomeReseller.title')}
                        </motion.h1>
                        <motion.p
                            className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto mb-8 leading-relaxed"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                        >
                            {t('becomeReseller.subtitle')}
                        </motion.p>
                        <motion.div
                            className="flex flex-col sm:flex-row gap-4 justify-center"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
                        >
                            <Button
                                onClick={scrollToForm}
                                className="bg-[#4FC8FF] hover:bg-[#4FC8FF]/90 text-white px-8 py-3 text-lg"
                            >
                                {t('becomeReseller.applyNow')}
                            </Button>
                        </motion.div>
                    </div>
                </section>

                {/* Benefits Section */}
                <section className="ml-16 sm:ml-20 py-16 px-4 sm:px-12 md:px-16 lg:px-20 bg-gray-900/30">
                    <div className="max-w-6xl mx-auto">
                        <motion.div
                            className="text-center mb-12"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
                                {t('becomeReseller.whyPartner.title')}
                            </h2>
                            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto">
                                {t('becomeReseller.whyPartner.subtitle')}
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {benefits.map((benefit, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: index * 0.2, ease: 'easeOut' }}
                                    viewport={{ once: true }}
                                >
                                    <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all duration-300 hover:border-[#4FC8FF]/30 hover:scale-105">
                                        <CardContent className="p-8">
                                            <div className="flex items-start gap-6">
                                                <motion.div
                                                    className="p-3 bg-[#4FC8FF]/10 rounded-lg"
                                                    whileHover={{ scale: 1.1, rotate: 5 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    {benefit.icon}
                                                </motion.div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h3 className="text-xl font-semibold text-white">
                                                            {benefit.title}
                                                        </h3>
                                                        <motion.span
                                                            className="text-sm text-[#4FC8FF] font-medium bg-[#4FC8FF]/10 px-3 py-1 rounded-full"
                                                            whileHover={{ scale: 1.05 }}
                                                        >
                                                            {benefit.highlight}
                                                        </motion.span>
                                                    </div>
                                                    <p className="text-gray-300 leading-relaxed">
                                                        {benefit.description}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>


                {/* Application Form Section */}
                <section ref={formSectionRef} className="ml-16 sm:ml-20 py-16 px-4 sm:px-12 md:px-16 lg:px-20 bg-gray-900/30">
                    <div className="max-w-4xl mx-auto">
                        <motion.div
                            className="text-center mb-12"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t('becomeReseller.form.title')}</h2>
                            <p className="text-xl text-gray-300">
                                {t('becomeReseller.form.subtitle')}
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                            viewport={{ once: true }}
                        >
                            <Card className="bg-gray-800/50 border-gray-700 shadow-2xl hover:shadow-3xl transition-all duration-300">
                                <CardContent className="p-8">
                                    {submitStatus === 'success' && (
                                        <div className="mb-8 p-6 bg-green-900/50 border border-green-600 text-green-300 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <FiCheckCircle className="w-6 h-6" />
                                                <div>
                                                    <h3 className="font-semibold">
                                                        {t('becomeReseller.form.successTitle')}
                                                    </h3>
                                                    <p className="text-sm opacity-90">
                                                        {t('becomeReseller.form.successMessage')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {submitStatus === 'error' && (
                                        <div className="mb-8 p-6 bg-red-900/50 border border-red-600 text-red-300 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <FiMail className="w-6 h-6" />
                                                <div>
                                                    <h3 className="font-semibold">{t('becomeReseller.form.errorTitle')}</h3>
                                                    <p className="text-sm opacity-90">
                                                        {t('becomeReseller.form.errorMessage')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <form onSubmit={handleSubmit} className="space-y-8">
                                        {/* Company Information */}
                                        <div className="space-y-6">
                                            <h3 className="text-2xl font-semibold text-white border-b border-gray-700 pb-3">
                                                {t('becomeReseller.form.companyInfo')}
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label
                                                        htmlFor="companyName"
                                                        className="block text-sm font-medium text-gray-300 mb-2"
                                                    >
                                                        {t('becomeReseller.form.companyNameRequired')}
                                                    </label>
                                                    <Input
                                                        id="companyName"
                                                        name="companyName"
                                                        type="text"
                                                        required
                                                        value={formData.companyName}
                                                        onChange={handleInputChange}
                                                        placeholder={t('becomeReseller.form.companyNamePlaceholder')}
                                                        className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-[#4FC8FF] focus:ring-[#4FC8FF]"
                                                    />
                                                </div>

                                                <div>
                                                    <label
                                                        htmlFor="website"
                                                        className="block text-sm font-medium text-gray-300 mb-2"
                                                    >
                                                        {t('becomeReseller.form.website')}
                                                    </label>
                                                    <Input
                                                        id="website"
                                                        name="website"
                                                        type="url"
                                                        value={formData.website}
                                                        onChange={handleInputChange}
                                                        placeholder={t('becomeReseller.form.websitePlaceholder')}
                                                        className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-[#4FC8FF] focus:ring-[#4FC8FF]"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Contact Information */}
                                        <div className="space-y-6">
                                            <h3 className="text-2xl font-semibold text-white border-b border-gray-700 pb-3">
                                                {t('becomeReseller.form.contactInfo')}
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label
                                                        htmlFor="contactName"
                                                        className="block text-sm font-medium text-gray-300 mb-2"
                                                    >
                                                        {t('becomeReseller.form.contactNameRequired')}
                                                    </label>
                                                    <Input
                                                        id="contactName"
                                                        name="contactName"
                                                        type="text"
                                                        required
                                                        value={formData.contactName}
                                                        onChange={handleInputChange}
                                                        placeholder={t('becomeReseller.form.contactNamePlaceholder')}
                                                        className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-[#4FC8FF] focus:ring-[#4FC8FF]"
                                                    />
                                                </div>

                                                <div>
                                                    <label
                                                        htmlFor="email"
                                                        className="block text-sm font-medium text-gray-300 mb-2"
                                                    >
                                                        {t('becomeReseller.form.emailRequired')}
                                                    </label>
                                                    <Input
                                                        id="email"
                                                        name="email"
                                                        type="email"
                                                        required
                                                        value={formData.email}
                                                        onChange={handleInputChange}
                                                        placeholder={t('becomeReseller.form.emailPlaceholder')}
                                                        className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-[#4FC8FF] focus:ring-[#4FC8FF]"
                                                    />
                                                </div>

                                                <div>
                                                    <label
                                                        htmlFor="phone"
                                                        className="block text-sm font-medium text-gray-300 mb-2"
                                                    >
                                                        {t('becomeReseller.form.phoneRequired')}
                                                    </label>
                                                    <Input
                                                        id="phone"
                                                        name="phone"
                                                        type="tel"
                                                        required
                                                        value={formData.phone}
                                                        onChange={handleInputChange}
                                                        placeholder={t('becomeReseller.form.phonePlaceholder')}
                                                        className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-[#4FC8FF] focus:ring-[#4FC8FF]"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Business Address */}
                                        <div className="space-y-6">
                                            <h3 className="text-2xl font-semibold text-white border-b border-gray-700 pb-3">
                                                {t('becomeReseller.form.businessAddress')}
                                            </h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <label
                                                        htmlFor="address"
                                                        className="block text-sm font-medium text-gray-300 mb-2"
                                                    >
                                                        {t('becomeReseller.form.streetAddressRequired')}
                                                    </label>
                                                    <Input
                                                        id="address"
                                                        name="address"
                                                        type="text"
                                                        required
                                                        value={formData.address}
                                                        onChange={handleInputChange}
                                                        placeholder={t('becomeReseller.form.streetAddressPlaceholder')}
                                                        className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-[#4FC8FF] focus:ring-[#4FC8FF]"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label
                                                            htmlFor="city"
                                                            className="block text-sm font-medium text-gray-300 mb-2"
                                                        >
                                                            {t('becomeReseller.form.cityRequired')}
                                                        </label>
                                                        <Input
                                                            id="city"
                                                            name="city"
                                                            type="text"
                                                            required
                                                            value={formData.city}
                                                            onChange={handleInputChange}
                                                            placeholder={t('becomeReseller.form.cityPlaceholder')}
                                                            className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-[#4FC8FF] focus:ring-[#4FC8FF]"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label
                                                            htmlFor="country"
                                                            className="block text-sm font-medium text-gray-300 mb-2"
                                                        >
                                                            {t('becomeReseller.form.countryRequired')}
                                                        </label>
                                                        <Input
                                                            id="country"
                                                            name="country"
                                                            type="text"
                                                            required
                                                            value={formData.country}
                                                            onChange={handleInputChange}
                                                            placeholder={t('becomeReseller.form.countryPlaceholder')}
                                                            className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-[#4FC8FF] focus:ring-[#4FC8FF]"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Business Details */}
                                        <div className="space-y-6">
                                            <h3 className="text-2xl font-semibold text-white border-b border-gray-700 pb-3">
                                                {t('becomeReseller.form.businessDetails')}
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                                        {t('becomeReseller.form.businessTypeRequired')}
                                                    </label>
                                                    <div ref={businessTypeDropdownRef} className="relative">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setIsBusinessTypeDropdownOpen(
                                                                    !isBusinessTypeDropdownOpen
                                                                )
                                                            }
                                                            className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-gray-600 bg-gray-700/50 px-3 py-2 text-white focus:border-[#4FC8FF] focus:ring-[#4FC8FF] transition-all duration-300"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                {(() => {
                                                                    const selected = businessTypeOptions.find(
                                                                        (opt) => opt.value === formData.businessType
                                                                    );
                                                                    const Icon = selected?.icon || FiBriefcase;
                                                                    return (
                                                                        <>
                                                                            <Icon className="w-4 h-4 text-gray-400" />
                                                                            <span
                                                                                className={
                                                                                    formData.businessType
                                                                                        ? 'text-white'
                                                                                        : 'text-gray-400'
                                                                                }
                                                                            >
                                                                                {selected?.label ||
                                                                                    t('becomeReseller.form.selectBusinessType')}
                                                                            </span>
                                                                        </>
                                                                    );
                                                                })()}
                                                            </div>
                                                            <FiChevronDown
                                                                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isBusinessTypeDropdownOpen ? 'rotate-180' : ''}`}
                                                            />
                                                        </button>

                                                        {isBusinessTypeDropdownOpen && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                                transition={{ duration: 0.2 }}
                                                                className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-xl z-50 overflow-hidden"
                                                            >
                                                                {businessTypeOptions.map((option) => {
                                                                    const isSelected =
                                                                        formData.businessType === option.value;
                                                                    const Icon = option.icon;
                                                                    return (
                                                                        <button
                                                                            key={option.value}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setFormData((prev) => ({
                                                                                    ...prev,
                                                                                    businessType: option.value
                                                                                }));
                                                                                setIsBusinessTypeDropdownOpen(false);
                                                                            }}
                                                                            className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-all duration-200 ${
                                                                                isSelected
                                                                                    ? 'bg-[#4FC8FF]/20 text-[#4FC8FF] border-l-2 border-[#4FC8FF]'
                                                                                    : 'text-white hover:bg-gray-600/50 hover:text-[#4FC8FF]'
                                                                            }`}
                                                                        >
                                                                            <Icon
                                                                                className={`w-4 h-4 ${
                                                                                    isSelected
                                                                                        ? 'text-[#4FC8FF]'
                                                                                        : 'text-gray-400'
                                                                                }`}
                                                                            />
                                                                            <span>{option.label}</span>
                                                                            {isSelected && (
                                                                                <motion.div
                                                                                    initial={{ scale: 0 }}
                                                                                    animate={{ scale: 1 }}
                                                                                    className="ml-auto w-2 h-2 bg-[#4FC8FF] rounded-full"
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
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                                        {t('becomeReseller.form.experienceRequired')}
                                                    </label>
                                                    <div ref={experienceDropdownRef} className="relative">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setIsExperienceDropdownOpen(!isExperienceDropdownOpen)
                                                            }
                                                            className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-gray-600 bg-gray-700/50 px-3 py-2 text-white focus:border-[#4FC8FF] focus:ring-[#4FC8FF] transition-all duration-300"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                {(() => {
                                                                    const selected = experienceOptions.find(
                                                                        (opt) => opt.value === formData.experience
                                                                    );
                                                                    return (
                                                                        <>
                                                                            <FiClock className="w-4 h-4 text-gray-400" />
                                                                            <span
                                                                                className={
                                                                                    formData.experience
                                                                                        ? 'text-white'
                                                                                        : 'text-gray-400'
                                                                                }
                                                                            >
                                                                                {selected?.label || t('becomeReseller.form.selectExperience')}
                                                                            </span>
                                                                        </>
                                                                    );
                                                                })()}
                                                            </div>
                                                            <FiChevronDown
                                                                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isExperienceDropdownOpen ? 'rotate-180' : ''}`}
                                                            />
                                                        </button>

                                                        {isExperienceDropdownOpen && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                                transition={{ duration: 0.2 }}
                                                                className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-xl z-50 overflow-hidden"
                                                            >
                                                                {experienceOptions.map((option) => {
                                                                    const isSelected =
                                                                        formData.experience === option.value;
                                                                    return (
                                                                        <button
                                                                            key={option.value}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setFormData((prev) => ({
                                                                                    ...prev,
                                                                                    experience: option.value
                                                                                }));
                                                                                setIsExperienceDropdownOpen(false);
                                                                            }}
                                                                            className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-all duration-200 ${
                                                                                isSelected
                                                                                    ? 'bg-[#4FC8FF]/20 text-[#4FC8FF] border-l-2 border-[#4FC8FF]'
                                                                                    : 'text-white hover:bg-gray-600/50 hover:text-[#4FC8FF]'
                                                                            }`}
                                                                        >
                                                                            <FiClock
                                                                                className={`w-4 h-4 ${
                                                                                    isSelected
                                                                                        ? 'text-[#4FC8FF]'
                                                                                        : 'text-gray-400'
                                                                                }`}
                                                                            />
                                                                            <span>{option.label}</span>
                                                                            {isSelected && (
                                                                                <motion.div
                                                                                    initial={{ scale: 0 }}
                                                                                    animate={{ scale: 1 }}
                                                                                    className="ml-auto w-2 h-2 bg-[#4FC8FF] rounded-full"
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
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                                        {t('becomeReseller.form.expectedVolumeRequired')}
                                                    </label>
                                                    <div ref={volumeDropdownRef} className="relative">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setIsVolumeDropdownOpen(!isVolumeDropdownOpen)
                                                            }
                                                            className="flex h-10 w-full items-center justify-between gap-2 rounded-md border border-gray-600 bg-gray-700/50 px-3 py-2 text-white focus:border-[#4FC8FF] focus:ring-[#4FC8FF] transition-all duration-300"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                {(() => {
                                                                    const selected = volumeOptions.find(
                                                                        (opt) => opt.value === formData.expectedVolume
                                                                    );
                                                                    return (
                                                                        <>
                                                                            <FiBarChart className="w-4 h-4 text-gray-400" />
                                                                            <span
                                                                                className={
                                                                                    formData.expectedVolume
                                                                                        ? 'text-white'
                                                                                        : 'text-gray-400'
                                                                                }
                                                                            >
                                                                                {selected?.label ||
                                                                                    t('becomeReseller.form.selectExpectedVolume')}
                                                                            </span>
                                                                        </>
                                                                    );
                                                                })()}
                                                            </div>
                                                            <FiChevronDown
                                                                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isVolumeDropdownOpen ? 'rotate-180' : ''}`}
                                                            />
                                                        </button>

                                                        {isVolumeDropdownOpen && (
                                                            <motion.div
                                                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                                                transition={{ duration: 0.2 }}
                                                                className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-xl z-50 overflow-hidden"
                                                            >
                                                                {volumeOptions.map((option) => {
                                                                    const isSelected =
                                                                        formData.expectedVolume === option.value;
                                                                    return (
                                                                        <button
                                                                            key={option.value}
                                                                            type="button"
                                                                            onClick={() => {
                                                                                setFormData((prev) => ({
                                                                                    ...prev,
                                                                                    expectedVolume: option.value
                                                                                }));
                                                                                setIsVolumeDropdownOpen(false);
                                                                            }}
                                                                            className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-all duration-200 ${
                                                                                isSelected
                                                                                    ? 'bg-[#4FC8FF]/20 text-[#4FC8FF] border-l-2 border-[#4FC8FF]'
                                                                                    : 'text-white hover:bg-gray-600/50 hover:text-[#4FC8FF]'
                                                                            }`}
                                                                        >
                                                                            <FiBarChart
                                                                                className={`w-4 h-4 ${
                                                                                    isSelected
                                                                                        ? 'text-[#4FC8FF]'
                                                                                        : 'text-gray-400'
                                                                                }`}
                                                                            />
                                                                            <span>{option.label}</span>
                                                                            {isSelected && (
                                                                                <motion.div
                                                                                    initial={{ scale: 0 }}
                                                                                    animate={{ scale: 1 }}
                                                                                    className="ml-auto w-2 h-2 bg-[#4FC8FF] rounded-full"
                                                                                />
                                                                            )}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </motion.div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Additional Information */}
                                        <div className="space-y-6">
                                            <h3 className="text-2xl font-semibold text-white border-b border-gray-700 pb-3">
                                                {t('becomeReseller.form.additionalInfo')}
                                            </h3>
                                            <div>
                                                <label
                                                    htmlFor="message"
                                                    className="block text-sm font-medium text-gray-300 mb-2"
                                                >
                                                    {t('becomeReseller.form.message')}
                                                </label>
                                                <textarea
                                                    id="message"
                                                    name="message"
                                                    rows={5}
                                                    value={formData.message}
                                                    onChange={handleInputChange}
                                                    placeholder={t('becomeReseller.form.messagePlaceholder')}
                                                    className="flex w-full rounded-md border border-gray-600 bg-gray-700/50 px-3 py-2 text-white ring-offset-background placeholder:text-gray-400 focus:border-[#4FC8FF] focus:ring-[#4FC8FF] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-4 justify-end pt-6">
                                            <Button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="bg-[#4FC8FF] hover:bg-[#4FC8FF]/90 text-white px-12 py-3 text-lg font-semibold"
                                            >
                                                {isSubmitting ? t('becomeReseller.form.submittingButton') : t('becomeReseller.form.submitButton')}
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </section>

                {/* Contact Information */}
                <section className="ml-16 sm:ml-20 py-16 px-4 sm:px-12 md:px-16 lg:px-20">
                    <div className="max-w-4xl mx-auto">
                        <motion.div
                            className="text-center mb-12"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">{t('becomeReseller.contact.title')}</h2>
                            <p className="text-xl text-gray-300">
                                {t('becomeReseller.contact.subtitle')}
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                            {[
                                {
                                    icon: <FiMail className="w-6 h-6 text-[#4FC8FF]" />,
                                    title: t('becomeReseller.contact.email'),
                                    content: t('becomeReseller.contact.emailContent')
                                },
                                {
                                    icon: <FiPhone className="w-6 h-6 text-[#4FC8FF]" />,
                                    title: t('becomeReseller.contact.phone'),
                                    content: t('becomeReseller.contact.phoneContent')
                                },
                                {
                                    icon: <FiMapPin className="w-6 h-6 text-[#4FC8FF]" />,
                                    title: t('becomeReseller.contact.visit'),
                                    content: t('becomeReseller.contact.visitContent')
                                }
                            ].map((contact, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 30 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: index * 0.2, ease: 'easeOut' }}
                                    viewport={{ once: true }}
                                >
                                    <Card className="bg-gray-800/50 border-gray-700 text-center hover:bg-gray-800/70 hover:border-[#4FC8FF]/30 transition-all duration-300 hover:scale-105 h-full">
                                        <CardContent className="p-6">
                                            <div className="mb-4">
                                                <motion.div
                                                    className="w-12 h-12 bg-[#4FC8FF]/10 rounded-full flex items-center justify-center mx-auto mb-3"
                                                    whileHover={{ scale: 1.1, rotate: 10 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    {contact.icon}
                                                </motion.div>
                                                <h3 className="font-semibold text-white mb-2">{contact.title}</h3>
                                                <p className="text-gray-300">{contact.content}</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
