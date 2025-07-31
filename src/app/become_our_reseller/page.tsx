'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Hero from '@/components/ui/Hero';
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
    const businessTypeOptions = [
        { value: 'retailer', label: 'Retailer', icon: FiBriefcase },
        { value: 'distributor', label: 'Distributor', icon: FiTrendingUp },
        { value: 'online-store', label: 'Online Store', icon: FiUsers },
        { value: 'system-integrator', label: 'System Integrator', icon: FiAward },
        { value: 'other', label: 'Other', icon: FiBriefcase }
    ];

    const experienceOptions = [
        { value: '0-2', label: '0-2 years', icon: FiClock },
        { value: '3-5', label: '3-5 years', icon: FiClock },
        { value: '6-10', label: '6-10 years', icon: FiClock },
        { value: '10+', label: '10+ years', icon: FiClock }
    ];

    const volumeOptions = [
        { value: '1-10', label: '1-10 units', icon: FiBarChart },
        { value: '11-50', label: '11-50 units', icon: FiBarChart },
        { value: '51-100', label: '51-100 units', icon: FiBarChart },
        { value: '100+', label: '100+ units', icon: FiBarChart }
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
        { label: 'Home', href: '/' },
        { label: 'Become Our Reseller', active: true }
    ];

    const benefits = [
        {
            icon: <FiTrendingUp className="w-8 h-8 text-[#4FC8FF]" />,
            title: 'Competitive Margins',
            description:
                'Enjoy attractive profit margins on all our products with flexible pricing structures and volume discounts.',
            highlight: 'Up to 40% margin'
        },
        {
            icon: <FiHeadphones className="w-8 h-8 text-[#4FC8FF]" />,
            title: 'Marketing Support',
            description:
                'Access to comprehensive marketing materials, product training, and co-marketing opportunities.',
            highlight: 'Full marketing kit'
        },
        {
            icon: <FiUsers className="w-8 h-8 text-[#4FC8FF]" />,
            title: 'Technical Support',
            description:
                'Dedicated technical support team to help you and your customers with any questions or issues.',
            highlight: '24/7 support'
        },
        {
            icon: <FiAward className="w-8 h-8 text-[#4FC8FF]" />,
            title: 'Premium Products',
            description:
                'Access to our complete range of high-quality audio products with exclusive early access to new releases.',
            highlight: 'Exclusive access'
        }
    ];

    const requirements = [
        'Established business with proven track record',
        'Minimum 2 years experience in audio/electronics',
        'Committed to monthly volume targets',
        'Professional sales and support capabilities',
        'Adherence to brand guidelines and standards'
    ];

    return (
        <div className="min-h-screen bg-[#0c131d]">
            {/* Hero Section */}
            <Hero breadcrumbItems={breadcrumbItems} />

            {/* Main Content */}
            <div className="relative">
                {/* Header Section */}
                <section className="ml-16 sm:ml-20 mr-4 sm:mr-12 md:mr-16 lg:mr-20 py-16 px-4 sm:px-12 md:px-16 lg:px-20">
                    <div className="max-w-6xl mx-auto text-center">
                        <motion.h1
                            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                        >
                            Become Our <span className="text-[#4FC8FF]">Reseller</span>
                        </motion.h1>
                        <motion.p
                            className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto mb-8 leading-relaxed"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                        >
                            Join our network of trusted partners and grow your business with our premium audio products.
                            We offer competitive pricing, marketing support, and comprehensive training.
                        </motion.p>
                        <motion.div
                            className="flex flex-col sm:flex-row gap-4 justify-center"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
                        >
                            <Button className="bg-[#4FC8FF] hover:bg-[#4FC8FF]/90 text-white px-8 py-3 text-lg">
                                Apply Now
                            </Button>
                            <Button
                                variant="outline"
                                className="border-[#4FC8FF] text-[#4FC8FF] hover:bg-[#4FC8FF] hover:text-white px-8 py-3 text-lg"
                            >
                                Download Brochure
                            </Button>
                        </motion.div>
                    </div>
                </section>

                {/* Benefits Section */}
                <section className="ml-16 sm:ml-20 mr-4 sm:mr-12 md:mr-16 lg:mr-20 py-16 px-4 sm:px-12 md:px-16 lg:px-20 bg-gray-900/30">
                    <div className="max-w-6xl mx-auto">
                        <motion.div
                            className="text-center mb-12"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
                                Why Partner With Us?
                            </h2>
                            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto">
                                Join hundreds of successful partners worldwide and unlock your business potential
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

                {/* Requirements Section */}
                <section className="ml-16 sm:ml-20 mr-4 sm:mr-12 md:mr-16 lg:mr-20 py-16 px-4 sm:px-12 md:px-16 lg:px-20">
                    <div className="max-w-4xl mx-auto">
                        <motion.div
                            className="text-center mb-12"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Partner Requirements</h2>
                            <p className="text-xl text-gray-300">
                                We&apos;re looking for committed partners who share our vision of excellence
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                            viewport={{ once: true }}
                        >
                            <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all duration-300">
                                <CardContent className="p-8">
                                    <div className="space-y-4">
                                        {requirements.map((requirement, index) => (
                                            <motion.div
                                                key={index}
                                                className="flex items-center gap-4"
                                                initial={{ opacity: 0, x: -20 }}
                                                whileInView={{ opacity: 1, x: 0 }}
                                                transition={{ duration: 0.5, delay: 0.1 * index, ease: 'easeOut' }}
                                                viewport={{ once: true }}
                                            >
                                                <motion.div
                                                    whileHover={{ scale: 1.2, rotate: 360 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    <FiCheckCircle className="w-6 h-6 text-[#4FC8FF] flex-shrink-0" />
                                                </motion.div>
                                                <span className="text-gray-300 text-lg">{requirement}</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </section>

                {/* Application Form Section */}
                <section className="ml-16 sm:ml-20 mr-4 sm:mr-12 md:mr-16 lg:mr-20 py-16 px-4 sm:px-12 md:px-16 lg:px-20 bg-gray-900/30">
                    <div className="max-w-4xl mx-auto">
                        <motion.div
                            className="text-center mb-12"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Submit Your Application</h2>
                            <p className="text-xl text-gray-300">
                                Ready to join our partner network? Fill out the form below and we&apos;ll get back to
                                you within 24 hours.
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
                                                        Application Submitted Successfully!
                                                    </h3>
                                                    <p className="text-sm opacity-90">
                                                        We&apos;ll review your application and get back to you within 24
                                                        hours.
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
                                                    <h3 className="font-semibold">Submission Failed</h3>
                                                    <p className="text-sm opacity-90">
                                                        There was an error submitting your application. Please try
                                                        again.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <form onSubmit={handleSubmit} className="space-y-8">
                                        {/* Company Information */}
                                        <div className="space-y-6">
                                            <h3 className="text-2xl font-semibold text-white border-b border-gray-700 pb-3">
                                                Company Information
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label
                                                        htmlFor="companyName"
                                                        className="block text-sm font-medium text-gray-300 mb-2"
                                                    >
                                                        Company Name *
                                                    </label>
                                                    <Input
                                                        id="companyName"
                                                        name="companyName"
                                                        type="text"
                                                        required
                                                        value={formData.companyName}
                                                        onChange={handleInputChange}
                                                        placeholder="Your company name"
                                                        className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-[#4FC8FF] focus:ring-[#4FC8FF]"
                                                    />
                                                </div>

                                                <div>
                                                    <label
                                                        htmlFor="website"
                                                        className="block text-sm font-medium text-gray-300 mb-2"
                                                    >
                                                        Website
                                                    </label>
                                                    <Input
                                                        id="website"
                                                        name="website"
                                                        type="url"
                                                        value={formData.website}
                                                        onChange={handleInputChange}
                                                        placeholder="https://yourwebsite.com"
                                                        className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-[#4FC8FF] focus:ring-[#4FC8FF]"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Contact Information */}
                                        <div className="space-y-6">
                                            <h3 className="text-2xl font-semibold text-white border-b border-gray-700 pb-3">
                                                Contact Information
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label
                                                        htmlFor="contactName"
                                                        className="block text-sm font-medium text-gray-300 mb-2"
                                                    >
                                                        Contact Name *
                                                    </label>
                                                    <Input
                                                        id="contactName"
                                                        name="contactName"
                                                        type="text"
                                                        required
                                                        value={formData.contactName}
                                                        onChange={handleInputChange}
                                                        placeholder="Your full name"
                                                        className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-[#4FC8FF] focus:ring-[#4FC8FF]"
                                                    />
                                                </div>

                                                <div>
                                                    <label
                                                        htmlFor="email"
                                                        className="block text-sm font-medium text-gray-300 mb-2"
                                                    >
                                                        Email Address *
                                                    </label>
                                                    <Input
                                                        id="email"
                                                        name="email"
                                                        type="email"
                                                        required
                                                        value={formData.email}
                                                        onChange={handleInputChange}
                                                        placeholder="your@email.com"
                                                        className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-[#4FC8FF] focus:ring-[#4FC8FF]"
                                                    />
                                                </div>

                                                <div>
                                                    <label
                                                        htmlFor="phone"
                                                        className="block text-sm font-medium text-gray-300 mb-2"
                                                    >
                                                        Phone Number *
                                                    </label>
                                                    <Input
                                                        id="phone"
                                                        name="phone"
                                                        type="tel"
                                                        required
                                                        value={formData.phone}
                                                        onChange={handleInputChange}
                                                        placeholder="+1 (555) 123-4567"
                                                        className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-[#4FC8FF] focus:ring-[#4FC8FF]"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Business Address */}
                                        <div className="space-y-6">
                                            <h3 className="text-2xl font-semibold text-white border-b border-gray-700 pb-3">
                                                Business Address
                                            </h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <label
                                                        htmlFor="address"
                                                        className="block text-sm font-medium text-gray-300 mb-2"
                                                    >
                                                        Street Address *
                                                    </label>
                                                    <Input
                                                        id="address"
                                                        name="address"
                                                        type="text"
                                                        required
                                                        value={formData.address}
                                                        onChange={handleInputChange}
                                                        placeholder="123 Business Street"
                                                        className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-[#4FC8FF] focus:ring-[#4FC8FF]"
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    <div>
                                                        <label
                                                            htmlFor="city"
                                                            className="block text-sm font-medium text-gray-300 mb-2"
                                                        >
                                                            City *
                                                        </label>
                                                        <Input
                                                            id="city"
                                                            name="city"
                                                            type="text"
                                                            required
                                                            value={formData.city}
                                                            onChange={handleInputChange}
                                                            placeholder="Your city"
                                                            className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-[#4FC8FF] focus:ring-[#4FC8FF]"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label
                                                            htmlFor="country"
                                                            className="block text-sm font-medium text-gray-300 mb-2"
                                                        >
                                                            Country *
                                                        </label>
                                                        <Input
                                                            id="country"
                                                            name="country"
                                                            type="text"
                                                            required
                                                            value={formData.country}
                                                            onChange={handleInputChange}
                                                            placeholder="Your country"
                                                            className="bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-[#4FC8FF] focus:ring-[#4FC8FF]"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Business Details */}
                                        <div className="space-y-6">
                                            <h3 className="text-2xl font-semibold text-white border-b border-gray-700 pb-3">
                                                Business Details
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-300 mb-2">
                                                        Business Type *
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
                                                                                    'Select business type'}
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
                                                        Years of Experience *
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
                                                                                {selected?.label || 'Select experience'}
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
                                                        Expected Monthly Volume *
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
                                                                                    'Select expected volume'}
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
                                                Additional Information
                                            </h3>
                                            <div>
                                                <label
                                                    htmlFor="message"
                                                    className="block text-sm font-medium text-gray-300 mb-2"
                                                >
                                                    Tell us about your business
                                                </label>
                                                <textarea
                                                    id="message"
                                                    name="message"
                                                    rows={5}
                                                    value={formData.message}
                                                    onChange={handleInputChange}
                                                    placeholder="Tell us about your business, target markets, or any specific requirements..."
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
                                                {isSubmitting ? 'Submitting...' : 'Submit Application'}
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </motion.div>
                    </div>
                </section>

                {/* Contact Information */}
                <section className="ml-16 sm:ml-20 mr-4 sm:mr-12 md:mr-16 lg:mr-20 py-16 px-4 sm:px-12 md:px-16 lg:px-20">
                    <div className="max-w-4xl mx-auto">
                        <motion.div
                            className="text-center mb-12"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: 'easeOut' }}
                            viewport={{ once: true }}
                        >
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Have Questions?</h2>
                            <p className="text-xl text-gray-300">
                                Our partnership team is here to help you get started
                            </p>
                        </motion.div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                            {[
                                {
                                    icon: <FiMail className="w-6 h-6 text-[#4FC8FF]" />,
                                    title: 'Email Us',
                                    content: 'reseller@tunezonehifi.com'
                                },
                                {
                                    icon: <FiPhone className="w-6 h-6 text-[#4FC8FF]" />,
                                    title: 'Call Us',
                                    content: '+1 (555) 123-4567'
                                },
                                {
                                    icon: <FiMapPin className="w-6 h-6 text-[#4FC8FF]" />,
                                    title: 'Visit Us',
                                    content: 'Business hours: Mon-Fri 9AM-6PM'
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
