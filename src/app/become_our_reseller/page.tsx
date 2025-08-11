'use client';

import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Hero from '@/components/ui/Hero';
import { useLanguage } from '@/context/LanguageContext';
import axios from 'axios';
import {
    FiTrendingUp,
    FiHeadphones,
    FiUsers,
    FiAward,
    FiCheckCircle,
    FiMail,
    FiPhone,
    FiMapPin
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { TIMEOUTS } from '@/constants/timeouts';

interface FormData {
    name: string;
    username: string;
    password: string;
    address: string;
    district: string;
    city: string;
    phone: string;
    email: string;
}

export default function BecomeOurReseller() {
    const { t } = useLanguage();
    const formSectionRef = useRef<HTMLElement>(null);

    // Scroll to form function
    const scrollToForm = () => {
        formSectionRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    };

    const [formData, setFormData] = useState<FormData>({
        name: '',
        username: '',
        password: '',
        address: '',
        district: '',
        city: '',
        phone: '+84',
        email: ''
    });


    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
    const [errorMessage, setErrorMessage] = useState<string>('');

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        // Handle phone input to ensure +84 prefix
        if (name === 'phone') {
            if (value === '' || value === '+') {
                setFormData((prev) => ({ ...prev, [name]: '+84' }));
                return;
            } else if (!value.startsWith('+84')) {
                // If user tries to type something that doesn't start with +84, prepend it
                const cleanValue = value.replace(/^\+?84?/, '');
                setFormData((prev) => ({ ...prev, [name]: '+84' + cleanValue }));
                return;
            }
        }
        
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
        
        // Clear validation error when user starts typing
        if (validationErrors[name]) {
            setValidationErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
        
        // Clear general error message when user starts typing
        if (errorMessage) {
            setErrorMessage('');
            setSubmitStatus('idle');
        }

        // Real-time validation for email and phone
        if (name === 'email' && value.trim()) {
            const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
            if (!emailRegex.test(value.trim())) {
                setValidationErrors(prev => ({
                    ...prev,
                    email: t('becomeReseller.form.invalidEmail')
                }));
            }
        }

        if (name === 'phone' && value.trim()) {
            // Updated phone regex for +84 format
            const phoneRegex = /^\+84(3|5|7|8|9)\d{8}$/;
            if (!phoneRegex.test(value)) {
                setValidationErrors(prev => ({
                    ...prev,
                    phone: t('becomeReseller.form.invalidPhone')
                }));
            }
        }

        if (name === 'username' && value.trim()) {
            // Username validation: alphanumeric, underscore, hyphen, 3-20 characters
            const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
            if (!usernameRegex.test(value.trim())) {
                setValidationErrors(prev => ({
                    ...prev,
                    username: t('becomeReseller.form.invalidUsername')
                }));
            }
        }

        if (name === 'password' && value.trim()) {
            // Password validation: minimum 8 characters
            if (value.trim().length < 8) {
                setValidationErrors(prev => ({
                    ...prev,
                    password: t('becomeReseller.form.invalidPassword')
                }));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate all required fields are filled
        const requiredFields = {
            name: formData.name.trim(),
            username: formData.username.trim(),
            password: formData.password.trim(),
            address: formData.address.trim(),
            district: formData.district.trim(),
            city: formData.city.trim(),
            phone: formData.phone.trim(),
            email: formData.email.trim()
        };

        // Clear previous validation errors
        setValidationErrors({});
        const newErrors: {[key: string]: string} = {};

        // Check if any required field is empty
        const emptyFields = Object.entries(requiredFields).filter(([, value]) => !value);
        
        if (emptyFields.length > 0) {
            emptyFields.forEach(([key]) => {
                newErrors[key] = t('becomeReseller.form.fieldRequired');
            });
        }

        // Enhanced email validation
        const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
        if (requiredFields.email && !emailRegex.test(requiredFields.email)) {
            newErrors.email = t('becomeReseller.form.invalidEmail');
        }

        // Enhanced phone validation for Vietnamese phone numbers with +84 prefix
        // Format: +84 followed by 9 digits starting with 3,5,7,8,9
        // Example: +84987654321
        const phoneRegex = /^\+84(3|5|7|8|9)\d{8}$/;
        if (requiredFields.phone && !phoneRegex.test(requiredFields.phone)) {
            newErrors.phone = t('becomeReseller.form.invalidPhone');
        }

        // Username validation
        const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
        if (requiredFields.username && !usernameRegex.test(requiredFields.username)) {
            newErrors.username = t('becomeReseller.form.invalidUsername');
        }

        // Password validation
        if (requiredFields.password && requiredFields.password.length < 8) {
            newErrors.password = t('becomeReseller.form.invalidPassword');
        }

        // If there are validation errors, set them and focus on first error field
        if (Object.keys(newErrors).length > 0) {
            setValidationErrors(newErrors);
            const firstErrorField = Object.keys(newErrors)[0];
            const fieldElement = document.getElementById(firstErrorField);
            if (fieldElement) {
                fieldElement.focus();
                fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return; // Don't submit if validation fails
        }

        setIsSubmitting(true);

        try {
            // Submit reseller application via API
            const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/register-reseller`;
            
            const response = await axios.post(apiUrl, {
                name: requiredFields.name,
                username: requiredFields.username,
                password: requiredFields.password,
                address: requiredFields.address,
                district: requiredFields.district,
                city: requiredFields.city,
                phone: requiredFields.phone,
                email: requiredFields.email
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: TIMEOUTS.API_REQUEST,
            });

            if (response.status === 200 || response.status === 201) {
                setSubmitStatus('success');
                setFormData({
                    name: '',
                    username: '',
                    password: '',
                    address: '',
                    district: '',
                    city: '',
                    phone: '',
                    email: ''
                });
            } else {
                throw new Error('Unexpected response status');
            }
        } catch (error) {
            
            // Handle specific error responses from backend
            if (axios.isAxiosError(error) && error.response) {
                const responseData = error.response.data;
                
                // Check if error response has specific error messages
                if (responseData && typeof responseData === 'object') {
                    // Handle validation errors from backend
                    if (responseData.errors) {
                        const backendErrors: {[key: string]: string} = {};
                        
                        // Map backend field errors to frontend validation errors
                        if (responseData.errors.email) {
                            backendErrors.email = responseData.errors.email;
                        }
                        if (responseData.errors.phone) {
                            backendErrors.phone = responseData.errors.phone;
                        }
                        if (responseData.errors.name) {
                            backendErrors.name = responseData.errors.name;
                        }
                        if (responseData.errors.username) {
                            backendErrors.username = responseData.errors.username;
                        }
                        if (responseData.errors.password) {
                            backendErrors.password = responseData.errors.password;
                        }
                        
                        if (Object.keys(backendErrors).length > 0) {
                            setValidationErrors(backendErrors);
                            setSubmitStatus('idle'); // Keep form available for correction
                            return;
                        }
                    }
                    
                    // Handle specific validation error messages from backend
                    if (responseData.error === 'VALIDATION_ERROR' && responseData.message) {
                        const message = responseData.message;
                        const backendErrors: {[key: string]: string} = {};
                        
                        
                        // Check for email duplicate error
                        if (message.includes('Account already exists with email:')) {
                            backendErrors.email = message;
                        }
                        // Check for phone duplicate error - be more flexible with the text
                        if (message.includes('Phone number already exists:') || 
                            message.includes('phone number already exists') ||
                            (message.toLowerCase().includes('phone') && message.toLowerCase().includes('exists'))) {
                            backendErrors.phone = message;
                        }
                        
                        
                        // If we have field-specific errors, show them on the fields
                        if (Object.keys(backendErrors).length > 0) {
                            setValidationErrors(backendErrors);
                            setSubmitStatus('idle'); // Keep form available for correction
                            return;
                        }
                    }
                    
                    // Handle general error message
                    if (responseData.message) {
                        setErrorMessage(responseData.message);
                    } else if (responseData.error) {
                        setErrorMessage(responseData.error);
                    } else {
                        setErrorMessage(t('becomeReseller.form.errorMessage'));
                    }
                } else {
                    setErrorMessage(t('becomeReseller.form.errorMessage'));
                }
            } else {
                setErrorMessage(t('becomeReseller.form.errorMessage'));
            }
            
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
                                                        {errorMessage || t('becomeReseller.form.errorMessage')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        {/* Reseller Registration Form */}
                                        <div className="space-y-6">
                                            <h3 className="text-2xl font-semibold text-white border-b border-gray-700 pb-3">
                                                {t('becomeReseller.form.resellerRegistration')}
                                            </h3>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Name */}
                                                <div>
                                                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                                                        {t('becomeReseller.form.nameRequired')}
                                                    </label>
                                                    <Input
                                                        id="name"
                                                        name="name"
                                                        type="text"
                                                        required
                                                        value={formData.name}
                                                        onChange={handleInputChange}
                                                        placeholder={t('becomeReseller.form.namePlaceholder')}
                                                        className={`bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-[#4FC8FF] focus:ring-[#4FC8FF] ${
                                                            validationErrors.name ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                                                        }`}
                                                    />
                                                    {validationErrors.name && (
                                                        <p className="text-red-400 text-sm mt-1">{validationErrors.name}</p>
                                                    )}
                                                </div>

                                                {/* Username */}
                                                <div>
                                                    <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                                                        {t('becomeReseller.form.usernameRequired')}
                                                    </label>
                                                    <Input
                                                        id="username"
                                                        name="username"
                                                        type="text"
                                                        required
                                                        value={formData.username}
                                                        onChange={handleInputChange}
                                                        placeholder={t('becomeReseller.form.usernamePlaceholder')}
                                                        className={`bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-[#4FC8FF] focus:ring-[#4FC8FF] ${
                                                            validationErrors.username ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                                                        }`}
                                                    />
                                                    {validationErrors.username && (
                                                        <p className="text-red-400 text-sm mt-1">{validationErrors.username}</p>
                                                    )}
                                                </div>

                                                {/* Password */}
                                                <div className="md:col-span-2">
                                                    <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                                        {t('becomeReseller.form.passwordRequired')}
                                                    </label>
                                                    <Input
                                                        id="password"
                                                        name="password"
                                                        type="password"
                                                        required
                                                        value={formData.password}
                                                        onChange={handleInputChange}
                                                        placeholder={t('becomeReseller.form.passwordPlaceholder')}
                                                        className={`bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-[#4FC8FF] focus:ring-[#4FC8FF] ${
                                                            validationErrors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                                                        }`}
                                                    />
                                                    {validationErrors.password && (
                                                        <p className="text-red-400 text-sm mt-1">{validationErrors.password}</p>
                                                    )}
                                                </div>

                                                {/* Phone */}
                                                <div>
                                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
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
                                                        className={`bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-[#4FC8FF] focus:ring-[#4FC8FF] ${
                                                            validationErrors.phone ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                                                        }`}
                                                    />
                                                    {validationErrors.phone && (
                                                        <p className="text-red-400 text-sm mt-1">{validationErrors.phone}</p>
                                                    )}
                                                </div>

                                                {/* Email */}
                                                <div className="md:col-span-2">
                                                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
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
                                                        className={`bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-[#4FC8FF] focus:ring-[#4FC8FF] ${
                                                            validationErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                                                        }`}
                                                    />
                                                    {validationErrors.email && (
                                                        <p className="text-red-400 text-sm mt-1">{validationErrors.email}</p>
                                                    )}
                                                </div>

                                                {/* Address */}
                                                <div className="md:col-span-2">
                                                    <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-2">
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
                                                        className={`bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-[#4FC8FF] focus:ring-[#4FC8FF] ${
                                                            validationErrors.address ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                                                        }`}
                                                    />
                                                    {validationErrors.address && (
                                                        <p className="text-red-400 text-sm mt-1">{validationErrors.address}</p>
                                                    )}
                                                </div>

                                                {/* District */}
                                                <div>
                                                    <label htmlFor="district" className="block text-sm font-medium text-gray-300 mb-2">
                                                        {t('becomeReseller.form.districtRequired')}
                                                    </label>
                                                    <Input
                                                        id="district"
                                                        name="district"
                                                        type="text"
                                                        required
                                                        value={formData.district}
                                                        onChange={handleInputChange}
                                                        placeholder={t('becomeReseller.form.districtPlaceholder')}
                                                        className={`bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-[#4FC8FF] focus:ring-[#4FC8FF] ${
                                                            validationErrors.district ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                                                        }`}
                                                    />
                                                    {validationErrors.district && (
                                                        <p className="text-red-400 text-sm mt-1">{validationErrors.district}</p>
                                                    )}
                                                </div>

                                                {/* City */}
                                                <div>
                                                    <label htmlFor="city" className="block text-sm font-medium text-gray-300 mb-2">
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
                                                        className={`bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-[#4FC8FF] focus:ring-[#4FC8FF] ${
                                                            validationErrors.city ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                                                        }`}
                                                    />
                                                    {validationErrors.city && (
                                                        <p className="text-red-400 text-sm mt-1">{validationErrors.city}</p>
                                                    )}
                                                </div>
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
