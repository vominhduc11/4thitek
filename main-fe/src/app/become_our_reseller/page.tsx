'use client';

import { useState, useCallback, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Hero from '@/components/ui/Hero';
import { useLanguage } from '@/context/LanguageContext';
import {
    FiCheckCircle,
    FiMail
} from 'react-icons/fi';
import { motion } from 'framer-motion';
import debounce from 'lodash.debounce';
import { ultraWideSpacing } from '@/styles/typography';
import { API_BASE_URL } from '@/constants/api';
import { usePublicContent } from '@/hooks/usePublicContent';
import DealerNetworkSection from '@/components/reseller/DealerNetworkSection';
import type { ResellerLocationsContent } from '@/types/content';

interface FormData {
    name: string;
    fullName: string;
    taxCode: string;
    address: string;
    district: string;
    city: string;
    phone: string;
    email: string;
    password: string;
    confirmPassword: string;
}

type FormFieldName = keyof FormData;

const DEALER_NAME_MAX_LENGTH = 150;
const DEALER_CONTACT_NAME_MAX_LENGTH = 150;
const DEALER_EMAIL_MAX_LENGTH = 100;
const DEALER_PASSWORD_MIN_LENGTH = 8;


export default function BecomeOurReseller() {
    const { t, language } = useLanguage();
    const { data: resellerContent, error: resellerContentError } = usePublicContent<ResellerLocationsContent>('become-reseller');
    const locationMap = useMemo(() => resellerContent?.locations.districtsByCity ?? {}, [resellerContent]);
    const allCities = useMemo(() => resellerContent?.locations.cities ?? [], [resellerContent]);

    // Get districts for selected city
    const getDistrictsForCity = useCallback((cityName: string): string[] => {
        return locationMap[cityName] || [];
    }, [locationMap]);

    // Memoized validation regexes for performance - matching backend validation
    const emailRegex = useMemo(() => /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/, []);
    const phoneRegex = useMemo(() => /^(0[0-9]{9})$/, []);
    const hasUppercaseRegex = useMemo(() => /[A-Z]/, []);
    const hasLowercaseRegex = useMemo(() => /[a-z]/, []);
    const hasDigitRegex = useMemo(() => /\d/, []);
    const isStrongPassword = useCallback((value: string) => {
        return value.length >= DEALER_PASSWORD_MIN_LENGTH
            && hasUppercaseRegex.test(value)
            && hasLowercaseRegex.test(value)
            && hasDigitRegex.test(value);
    }, [hasDigitRegex, hasLowercaseRegex, hasUppercaseRegex]);

    // Centralized field validation - matching backend requirements
    const validateField = useCallback((name: FormFieldName, value: string, values: FormData) => {
        let error = '';
        const trimmedValue = value.trim();
        
        switch (name) {
            case 'email':
                if (trimmedValue && !emailRegex.test(trimmedValue)) {
                    error = t('becomeReseller.form.errors.invalidEmail');
                } else if (trimmedValue.length > DEALER_EMAIL_MAX_LENGTH) {
                    error = t('becomeReseller.form.errors.emailMax');
                }
                break;
            case 'phone':
                if (trimmedValue && !phoneRegex.test(trimmedValue)) {
                    error = t('becomeReseller.form.errors.invalidPhone');
                }
                break;
            case 'name':
                if (trimmedValue.length > 0 && (trimmedValue.length < 2 || trimmedValue.length > DEALER_NAME_MAX_LENGTH)) {
                    error = t('becomeReseller.form.errors.companyNameLength');
                }
                break;
            case 'fullName':
                if (trimmedValue.length > DEALER_CONTACT_NAME_MAX_LENGTH) {
                    error = t('becomeReseller.form.errors.fullNameMax');
                }
                break;
            case 'taxCode':
                if (trimmedValue.length > 50) {
                    error = t('becomeReseller.form.errors.taxCodeMax');
                }
                break;
            case 'address':
                if (trimmedValue.length > 255) {
                    error = t('becomeReseller.form.errors.addressMax');
                }
                break;
            case 'district':
                if (trimmedValue.length > 100) {
                    error = t('becomeReseller.form.errors.districtMax');
                }
                break;
            case 'city':
                if (trimmedValue.length > 100) {
                    error = t('becomeReseller.form.errors.cityMax');
                }
                break;
            case 'password':
                if (value && !isStrongPassword(value)) {
                    error = t('becomeReseller.form.errors.passwordMin');
                }
                break;
            case 'confirmPassword':
                if (value && value !== values.password) {
                    error = t('becomeReseller.form.errors.passwordMismatch');
                }
                break;
        }
        
        setValidationErrors(prev => ({
            ...prev,
            [name]: error
        }));
    }, [emailRegex, isStrongPassword, phoneRegex, t]);

    // Debounced validation for better UX
    const debouncedValidate = useMemo(
        () => debounce((name: FormFieldName, value: string, values: FormData) => {
            validateField(name, value, values);
        }, 300),
        [validateField]
    );

    // Improved error mapping utility
    const mapBackendError = useCallback((message: string): { field?: string; message: string } => {
        const errorPatterns = [
            {
                field: 'email',
                patterns: ['email', 'Email', '@', 'username', 'Username'],
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
        fullName: '',
        taxCode: '',
        address: '',
        district: '',
        city: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
    const [errorMessage, setErrorMessage] = useState<string>('');


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const fieldName = name as FormFieldName;
        const nextData: FormData = {
            ...formData,
            [fieldName]: value
        };

        if (fieldName === 'city') {
            nextData.district = '';
        }

        // Update form data
        setFormData(nextData);

        if (fieldName === 'city') {
            // Clear district validation error when city changes.
            setValidationErrors(prevErrors => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { district, ...rest } = prevErrors;
                return rest;
            });
        }

        // Clear general error message when user starts typing
        if (errorMessage) {
            setErrorMessage('');
            setSubmitStatus('idle');
        }

        if (fieldName === 'password' || fieldName === 'confirmPassword') {
            validateField(fieldName, value, nextData);
            if (fieldName === 'password' && nextData.confirmPassword) {
                validateField('confirmPassword', nextData.confirmPassword, nextData);
            }
            return;
        }

        // Debounced validation for better performance - will clear/set errors appropriately
        debouncedValidate(fieldName, value, nextData);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Prepare form data for validation and submission
        const formFields = {
            name: formData.name.trim(),
            fullName: formData.fullName.trim(),
            taxCode: formData.taxCode.trim(),
            address: formData.address.trim(),
            district: formData.district.trim(),
            city: formData.city.trim(),
            phone: formData.phone.trim(),
            email: formData.email.trim(),
            password: formData.password,
            confirmPassword: formData.confirmPassword
        };

        // Clear previous validation errors
        setValidationErrors({});
        const newErrors: {[key: string]: string} = {};

        // Check if required fields are empty - all fields are now required
        const requiredFields = {
            name: t('becomeReseller.form.errors.nameRequired'),
            email: t('becomeReseller.form.errors.emailRequired'),
            address: t('becomeReseller.form.errors.addressRequired'),
            phone: t('becomeReseller.form.errors.phoneRequired'),
            district: t('becomeReseller.form.errors.districtRequired'),
            city: t('becomeReseller.form.errors.cityRequired'),
            password: t('becomeReseller.form.errors.passwordRequired'),
            confirmPassword: t('becomeReseller.form.errors.confirmPasswordRequired')
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
                        newErrors.email = t('becomeReseller.form.errors.invalidEmail');
                    } else if (value.length > DEALER_EMAIL_MAX_LENGTH) {
                        newErrors.email = t('becomeReseller.form.errors.emailMax');
                    }
                    break;
                case 'phone':
                    if (!phoneRegex.test(value)) {
                        newErrors.phone = t('becomeReseller.form.errors.invalidPhone');
                    }
                    break;
                case 'name':
                    if (value.length < 2 || value.length > DEALER_NAME_MAX_LENGTH) {
                        newErrors.name = t('becomeReseller.form.errors.companyNameLength');
                    }
                    break;
                case 'fullName':
                    if (value.length > DEALER_CONTACT_NAME_MAX_LENGTH) {
                        newErrors.fullName = t('becomeReseller.form.errors.fullNameMax');
                    }
                    break;
                case 'taxCode':
                    if (value.length > 50) {
                        newErrors.taxCode = t('becomeReseller.form.errors.taxCodeMax');
                    }
                    break;
                case 'address':
                    if (value.length > 255) {
                        newErrors.address = t('becomeReseller.form.errors.addressMax');
                    }
                    break;
                case 'district':
                    if (value.length > 100) {
                        newErrors.district = t('becomeReseller.form.errors.districtMax');
                    }
                    break;
                case 'city':
                    if (value.length > 100) {
                        newErrors.city = t('becomeReseller.form.errors.cityMax');
                    }
                    break;
                case 'password':
                    if (!isStrongPassword(value)) {
                        newErrors.password = t('becomeReseller.form.errors.passwordMin');
                    }
                    break;
                case 'confirmPassword':
                    if (value !== formFields.password) {
                        newErrors.confirmPassword = t('becomeReseller.form.errors.passwordMismatch');
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
            const normalizedEmail = formFields.email.toLowerCase();
            const response = await fetch(`${API_BASE_URL}/auth/register-dealer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    username: normalizedEmail,
                    password: formFields.password,
                    businessName: formFields.name,
                    contactName: formFields.fullName,
                    taxCode: formFields.taxCode,
                    phone: formFields.phone,
                    email: normalizedEmail,
                    addressLine: formFields.address,
                    district: formFields.district,
                    city: formFields.city,
                    country: 'Vietnam'
                })
            });

            const payload = await response.json().catch(() => null) as {
                success?: boolean;
                error?: string;
            } | null;

            if (!response.ok || payload?.success === false) {
                throw new Error(payload?.error || 'Registration failed');
            }

            setSubmitStatus('success');
            setValidationErrors({});
            setErrorMessage('');
            setFormData({
                name: '',
                fullName: '',
                taxCode: '',
                address: '',
                district: '',
                city: '',
                phone: '',
                email: '',
                password: '',
                confirmPassword: ''
            });
        } catch (error) {
            const mappedError = mapBackendError(error instanceof Error ? error.message : '');
            if (mappedError.field) {
                setValidationErrors({ [mappedError.field]: mappedError.message });
            } else {
                setErrorMessage(mappedError.message || t('becomeReseller.form.errorMessage'));
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
        <div className="min-h-screen bg-[#0c131d] text-white flex flex-col">
            {/* Hero Section */}
            <Hero
                breadcrumbItems={breadcrumbItems}
                breadcrumbWrapperClassName="ml-0 sm:ml-16 md:ml-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20"
            />

            {/* Application Form Section */}
            <section className="ml-0 sm:ml-16 md:ml-20 py-8 sm:py-12 md:py-16 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
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
                        className="mb-8 rounded-[28px] border border-cyan-400/25 bg-cyan-400/10 p-6 text-left shadow-[0_24px_80px_rgba(34,211,238,0.12)] backdrop-blur"
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.75, delay: 0.1, ease: 'easeOut' }}
                        viewport={{ once: true }}
                    >
                        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200/85">
                            {t('becomeReseller.form.portalBadge')}
                        </p>
                        <h3 className="mt-3 text-xl font-semibold text-white md:text-2xl">
                            {t('becomeReseller.form.portalTitle')}
                        </h3>
                        <p className="mt-3 text-sm leading-7 text-slate-200 md:text-base">
                            {t('becomeReseller.form.portalDescription')}
                        </p>
                        <p className="mt-4 text-sm font-medium leading-6 text-cyan-100 md:text-base">
                            {t('becomeReseller.form.portalFootnote')}
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
                                        {resellerContentError && (
                                            <p className="text-sm text-red-300">
                                                {language === 'vi' ? 'Không thể tải danh sách tỉnh/thành từ hệ thống.' : 'Unable to load the city list from the server.'}
                                            </p>
                                        )}
                                        
                                        <div className={`grid grid-cols-1 sm:grid-cols-2 ${ultraWideSpacing['grid-gap-md']}`}>
                                            {/* Company Name */}
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

                                            {/* Full Name */}
                                            <div>
                                                <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-2">
                                                    {t('becomeReseller.form.fullName')}
                                                </label>
                                                <Input
                                                    id="fullName"
                                                    name="fullName"
                                                    type="text"
                                                    value={formData.fullName}
                                                    onChange={handleInputChange}
                                                    placeholder={t('becomeReseller.form.fullNamePlaceholder')}
                                                    className={`bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-[#4FC8FF] focus:ring-[#4FC8FF] ${
                                                        validationErrors.fullName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                                                    }`}
                                                />
                                                {validationErrors.fullName && (
                                                    <p className="text-red-400 text-sm mt-1">{validationErrors.fullName}</p>
                                                )}
                                            </div>

                                            {/* Tax Code */}
                                            <div>
                                                <label htmlFor="taxCode" className="block text-sm font-medium text-gray-300 mb-2">
                                                    {t('becomeReseller.form.taxCode')}
                                                </label>
                                                <Input
                                                    id="taxCode"
                                                    name="taxCode"
                                                    type="text"
                                                    value={formData.taxCode}
                                                    onChange={handleInputChange}
                                                    placeholder={t('becomeReseller.form.taxCodePlaceholder')}
                                                    className={`bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-[#4FC8FF] focus:ring-[#4FC8FF] ${
                                                        validationErrors.taxCode ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                                                    }`}
                                                />
                                                {validationErrors.taxCode && (
                                                    <p className="text-red-400 text-sm mt-1">{validationErrors.taxCode}</p>
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

                                            <div>
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
                                                    autoComplete="new-password"
                                                    className={`bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-[#4FC8FF] focus:ring-[#4FC8FF] ${
                                                        validationErrors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                                                    }`}
                                                />
                                                {validationErrors.password && (
                                                    <p className="text-red-400 text-sm mt-1">{validationErrors.password}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                                                    {t('becomeReseller.form.confirmPasswordRequired')}
                                                </label>
                                                <Input
                                                    id="confirmPassword"
                                                    name="confirmPassword"
                                                    type="password"
                                                    value={formData.confirmPassword}
                                                    onChange={handleInputChange}
                                                    placeholder={t('becomeReseller.form.confirmPasswordPlaceholder')}
                                                    autoComplete="new-password"
                                                    className={`bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-[#4FC8FF] focus:ring-[#4FC8FF] ${
                                                        validationErrors.confirmPassword ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                                                    }`}
                                                />
                                                {validationErrors.confirmPassword && (
                                                    <p className="text-red-400 text-sm mt-1">{validationErrors.confirmPassword}</p>
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
                                                <select
                                                    id="district"
                                                    name="district"
                                                    value={formData.district}
                                                    onChange={handleInputChange}
                                                    disabled={!formData.city}
                                                    className={`w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4FC8FF] focus:border-[#4FC8FF] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                                                        validationErrors.district ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                                                    }`}
                                                >
                                                    <option value="" className="bg-gray-700">
                                                        {formData.city
                                                            ? t('becomeReseller.form.districtPlaceholder')
                                                            : t('becomeReseller.form.citySelectFirst')
                                                        }
                                                    </option>
                                                    {formData.city && getDistrictsForCity(formData.city).map((district) => (
                                                        <option key={district} value={district} className="bg-gray-700">
                                                            {district}
                                                        </option>
                                                    ))}
                                                </select>
                                                {validationErrors.district && (
                                                    <p className="text-red-400 text-sm mt-1">{validationErrors.district}</p>
                                                )}
                                            </div>

                                            {/* City */}
                                            <div>
                                                <label htmlFor="city" className="block text-sm font-medium text-gray-300 mb-2">
                                                    {t('becomeReseller.form.cityRequired')}
                                                </label>
                                                <select
                                                    id="city"
                                                    name="city"
                                                    value={formData.city}
                                                    onChange={handleInputChange}
                                                    className={`w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4FC8FF] focus:border-[#4FC8FF] transition-colors ${
                                                        validationErrors.city ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                                                    }`}
                                                >
                                                    <option value="" className="bg-gray-700">
                                                        {t('becomeReseller.form.cityPlaceholder')}
                                                    </option>
                                                    {allCities.map((city) => (
                                                        <option key={city} value={city} className="bg-gray-700">
                                                            {city}
                                                        </option>
                                                    ))}
                                                </select>
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

            <section className="ml-0 sm:ml-16 md:ml-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
                <div className="mx-auto max-w-6xl">
                    <DealerNetworkSection />
                </div>
            </section>
        </div>
    );
}

