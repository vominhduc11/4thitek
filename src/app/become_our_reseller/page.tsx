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
    address: string;
    district: string;
    city: string;
    phone: string;
    email: string;
}

export default function BecomeOurReseller() {
    const { t } = useLanguage();

    // Memoized validation regexes for performance - matching backend validation
    const emailRegex = useMemo(() => /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/, []);
    const phoneRegex = useMemo(() => /^(0[0-9]{9})$/, []);

    // Centralized field validation - matching backend requirements
    const validateField = useCallback((name: string, value: string) => {
        let error = '';
        const trimmedValue = value.trim();
        
        switch (name) {
            case 'email':
                if (trimmedValue && !emailRegex.test(trimmedValue)) {
                    error = 'Email không hợp lệ';
                } else if (trimmedValue.length > 100) {
                    error = 'Email cannot exceed 100 characters';
                }
                break;
            case 'phone':
                if (trimmedValue && !phoneRegex.test(trimmedValue)) {
                    error = 'Số điện thoại không hợp lệ (phải bắt đầu bằng 0 và đủ 10 số)';
                }
                break;
            case 'name':
                if (trimmedValue.length > 0 && (trimmedValue.length < 2 || trimmedValue.length > 100)) {
                    error = 'Full name must be between 2 and 100 characters';
                }
                break;
            case 'address':
                if (trimmedValue.length > 255) {
                    error = 'Address cannot exceed 255 characters';
                }
                break;
            case 'district':
                if (trimmedValue.length > 100) {
                    error = 'District cannot exceed 100 characters';
                }
                break;
            case 'city':
                if (trimmedValue.length > 100) {
                    error = 'City cannot exceed 100 characters';
                }
                break;
        }
        
        setValidationErrors(prev => ({
            ...prev,
            [name]: error
        }));
    }, [emailRegex, phoneRegex]);

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
        address: '',
        district: '',
        city: '',
        phone: '',
        email: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
    const [errorMessage, setErrorMessage] = useState<string>('');


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        // Update form data
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
        
        // Clear general error message when user starts typing
        if (errorMessage) {
            setErrorMessage('');
            setSubmitStatus('idle');
        }

        // Debounced validation for better performance - will clear/set errors appropriately
        debouncedValidate(name, value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Prepare form data for validation and submission
        const formFields = {
            name: formData.name.trim(),
            address: formData.address.trim(),
            district: formData.district.trim(),
            city: formData.city.trim(),
            phone: formData.phone.trim(),
            email: formData.email.trim()
        };

        // Clear previous validation errors
        setValidationErrors({});
        const newErrors: {[key: string]: string} = {};

        // Check if required fields are empty - all fields are now required
        const requiredFields = {
            name: 'Tên công ty không được để trống',
            email: 'Email không được để trống',
            address: 'Địa chỉ không được để trống',
            phone: 'Số điện thoại không được để trống',
            district: 'Quận không được để trống',
            city: 'Thành phố không được để trống'
        };
        
        Object.entries(requiredFields).forEach(([fieldName, errorMessage]) => {
            if (!formFields[fieldName as keyof typeof formFields]) {
                newErrors[fieldName] = errorMessage;
            }
        });

        // Validate all fields with values according to backend requirements
        Object.entries(formFields).forEach(([key, value]) => {
            if (!value) return; // Skip validation if already handled by required field check
            
            // Validate each field according to backend rules
            switch (key) {
                case 'email':
                    if (!emailRegex.test(value)) {
                        newErrors.email = 'Email không hợp lệ';
                    } else if (value.length > 100) {
                        newErrors.email = 'Email cannot exceed 100 characters';
                    }
                    break;
                case 'phone':
                    if (!phoneRegex.test(value)) {
                        newErrors.phone = 'Số điện thoại không hợp lệ (phải bắt đầu bằng 0 và đủ 10 số)';
                    }
                    break;
                case 'name':
                    if (value.length < 2 || value.length > 100) {
                        newErrors.name = 'Full name must be between 2 and 100 characters';
                    }
                    break;
                case 'address':
                    if (value.length > 255) {
                        newErrors.address = 'Address cannot exceed 255 characters';
                    }
                    break;
                case 'district':
                    if (value.length > 100) {
                        newErrors.district = 'District cannot exceed 100 characters';
                    }
                    break;
                case 'city':
                    if (value.length > 100) {
                        newErrors.city = 'City cannot exceed 100 characters';
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
            const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/user/dealers`;
            
            const response = await axios.post(apiUrl, {
                companyName: formFields.name,
                address: formFields.address,
                district: formFields.district,
                city: formFields.city,
                phone: formFields.phone,
                email: formFields.email
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: TIMEOUTS.API_REQUEST,
            });

            if (response.status === 200 || response.status === 201) {
                setSubmitStatus('success');
                setValidationErrors({});
                setErrorMessage('');
                setFormData({
                    name: '',
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
                                            <div className="md:col-span-2">
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

                                            {/* Phone */}
                                            <div>
                                                <label htmlFor="phone" className="block text-sm font-medium text-gray-300 mb-2">
                                                    {t('becomeReseller.form.phoneRequired')}
                                                </label>
                                                <Input
                                                    id="phone"
                                                    name="phone"
                                                    type="tel"
                                                    value={formData.phone}
                                                    onChange={handleInputChange}
                                                    placeholder="0123456789"
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