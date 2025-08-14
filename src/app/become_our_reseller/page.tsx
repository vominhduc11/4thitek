'use client';

import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Hero from '@/components/ui/Hero';
import { useLanguage } from '@/context/LanguageContext';
import axios from 'axios';
import {
    FiCheckCircle,
    FiMail
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import { TIMEOUTS } from '@/constants/timeouts';
import debounce from 'lodash.debounce';
import { ultraWideSpacing } from '@/styles/typography';

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

    // Memoized validation regexes for performance
    const emailRegex = useMemo(() => /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/, []);
    const phoneRegex = useMemo(() => /^\+84(3|5|7|8|9)\d{8}$/, []);
    const usernameRegex = useMemo(() => /^[a-zA-Z0-9_-]{3,20}$/, []);

    // Centralized field validation
    const validateField = useCallback((name: string, value: string) => {
        let error = '';
        
        switch (name) {
            case 'email':
                if (value.trim() && !emailRegex.test(value.trim())) {
                    error = t('becomeReseller.form.invalidEmail');
                }
                break;
            case 'phone':
                if (value.trim() && value !== '+84' && value !== '+' && !phoneRegex.test(value)) {
                    error = t('becomeReseller.form.invalidPhone');
                }
                break;
            case 'username':
                if (value.trim() && !usernameRegex.test(value.trim())) {
                    error = t('becomeReseller.form.invalidUsername');
                }
                break;
            case 'password':
                if (value.trim() && value.trim().length < 8) {
                    error = t('becomeReseller.form.invalidPassword');
                }
                break;
        }
        
        setValidationErrors(prev => ({
            ...prev,
            [name]: error
        }));
    }, [emailRegex, phoneRegex, usernameRegex, t]);

    // Debounced validation for better UX
    const debouncedValidate = useMemo(
        () => debounce((name: string, value: string) => {
            validateField(name, value);
        }, 300),
        [validateField]
    );

    // Improved error mapping utility
    const mapBackendError = useCallback((message: string): { field?: string; message: string } => {
        const errorPatterns = [
            {
                field: 'email',
                patterns: ['email', 'Email', '@'],
                keywords: ['exists', 'taken', 'already', 'tồn tại', 'đã sử dụng']
            },
            {
                field: 'phone',
                patterns: ['phone', 'Phone', 'điện thoại', 'số'],
                keywords: ['exists', 'taken', 'already', 'tồn tại', 'đã sử dụng']
            },
            {
                field: 'username',
                patterns: ['username', 'Username', 'đăng nhập', 'tên'],
                keywords: ['exists', 'taken', 'already', 'tồn tại', 'đã sử dụng']
            }
        ];

        const lowerMessage = message.toLowerCase();
        
        for (const error of errorPatterns) {
            const hasPattern = error.patterns.some(p => 
                lowerMessage.includes(p.toLowerCase())
            );
            const hasKeyword = error.keywords.some(k => 
                lowerMessage.includes(k.toLowerCase())
            );
            
            if (hasPattern && hasKeyword) {
                return { field: error.field, message };
            }
        }
        
        return { message };
    }, []);

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

    // Phone number formatting functions
    const handlePhoneChange = useCallback((value: string) => {
        // Always maintain +84 prefix
        let cleanValue = value.replace(/[^\d]/g, '');
        
        // If user tries to delete +84, reset to +84
        if (value.length < 3 || !value.startsWith('+84')) {
            cleanValue = cleanValue.replace(/^84/, ''); // Remove leading 84 if present
        } else {
            // Extract digits after +84
            cleanValue = value.substring(3).replace(/[^\d]/g, '');
        }
        
        // Limit to 9 digits after +84
        if (cleanValue.length > 9) {
            cleanValue = cleanValue.substring(0, 9);
        }
        
        return `+84${cleanValue}`;
    }, []);

    const formatPhoneDisplay = useCallback((value: string) => {
        if (value.length <= 3) return value;
        const digits = value.substring(3);
        if (digits.length === 0) return '+84 ';
        if (digits.length <= 3) return `+84 ${digits}`;
        if (digits.length <= 6) return `+84 ${digits.substring(0, 3)} ${digits.substring(3)}`;
        return `+84 ${digits.substring(0, 3)} ${digits.substring(3, 6)} ${digits.substring(6)}`;
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        // Special handling for phone input
        if (name === 'phone') {
            const formattedPhone = handlePhoneChange(value);
            setFormData((prev) => ({ ...prev, [name]: formattedPhone }));
            
            // Clear validation error when user starts typing
            if (validationErrors.phone) {
                setValidationErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.phone;
                    return newErrors;
                });
            }
            return;
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

        // Debounced validation for better performance
        debouncedValidate(name, value);
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
        const emptyFields = Object.entries(requiredFields).filter(([key, value]) => {
            if (key === 'phone') {
                return !value || value === '+84' || value === '+';
            }
            return !value;
        });
        
        if (emptyFields.length > 0) {
            emptyFields.forEach(([key]) => {
                newErrors[key] = t('becomeReseller.form.fieldRequired');
            });
        }

        // Use centralized validation for submit
        Object.entries(requiredFields).forEach(([key, value]) => {
            if (key === 'phone' && (value === '+84' || value === '+')) return;
            
            // Validate format using centralized logic
            switch (key) {
                case 'email':
                    if (value && !emailRegex.test(value)) {
                        newErrors.email = t('becomeReseller.form.invalidEmail');
                    }
                    break;
                case 'phone':
                    if (value && !phoneRegex.test(value)) {
                        newErrors.phone = t('becomeReseller.form.invalidPhone');
                    }
                    break;
                case 'username':
                    if (value && !usernameRegex.test(value)) {
                        newErrors.username = t('becomeReseller.form.invalidUsername');
                    }
                    break;
                case 'password':
                    if (value && value.length < 8) {
                        newErrors.password = t('becomeReseller.form.invalidPassword');
                    }
                    break;
            }
        });

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
                    phone: '+84',
                    email: ''
                });
            } else {
                throw new Error('Unexpected response status');
            }
        } catch (error) {
            
            // Handle specific error responses from backend
            if (axios.isAxiosError(error) && error.response) {
                const responseData = error.response.data;
                
                // Debug: Log response to understand backend format
                console.log('Backend Error Response:', {
                    status: error.response.status,
                    data: responseData
                });
                
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
                    if (responseData.message || (responseData.error && typeof responseData.error === 'string')) {
                        const message = responseData.message || responseData.error || '';
                        const backendErrors: {[key: string]: string} = {};
                        
                        // Use improved error mapping
                        const mappedError = mapBackendError(message);
                        if (mappedError.field) {
                            backendErrors[mappedError.field] = mappedError.message;
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
                    } else if (responseData.error && typeof responseData.error === 'string') {
                        setErrorMessage(responseData.error);
                    } else if (responseData.detail) {
                        setErrorMessage(responseData.detail);
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

    return (
        <div className="min-h-screen bg-[#0c131d]">
            {/* Hero Section */}
            <Hero breadcrumbItems={breadcrumbItems} />

            {/* Application Form Section */}
            <section className="ml-16 sm:ml-20 py-16 px-4 sm:px-12 md:px-16 lg:px-20">
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

                                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                                    {/* Reseller Registration Form */}
                                    <div className="space-y-6">
                                        <h3 className="text-2xl font-semibold text-white border-b border-gray-700 pb-3">
                                            {t('becomeReseller.form.resellerRegistration')}
                                        </h3>
                                        
                                        <div className={`grid grid-cols-1 md:grid-cols-2 ${ultraWideSpacing['grid-gap-md']}`}>
                                            {/* Name */}
                                            <div>
                                                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                                                    {t('becomeReseller.form.nameRequired')}
                                                </label>
                                                <Input
                                                    id="name"
                                                    name="name"
                                                    type="text"
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
                                                    value={formatPhoneDisplay(formData.phone)}
                                                    onChange={handleInputChange}
                                                    placeholder="+84 123 456 789"
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
        </div>
    );
}