'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AvoidSidebar from '@/components/ui/AvoidSidebar';
import { HeroSection, WarrantyForm, WarrantyResult } from './components';
import { WarrantyInfo } from '@/types/warranty';
import { apiService } from '@/services/apiService';
import { ERROR_MESSAGES, ErrorType } from '@/constants/warranty';
import { handleApiError } from '@/utils/errorHandler';
import { useLanguage } from '@/context/LanguageContext';
import { toWarrantyInfo } from '@/lib/warrantyLookup';

const WarrantyCheckPage = () => {
    const { locale } = useLanguage();
    const [warrantyInfo, setWarrantyInfo] = useState<WarrantyInfo | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [errorInfo, setErrorInfo] = useState<{ message: string; type: ErrorType } | null>(null);

    const handleFormSubmit = async (data: { serialNumber: string }) => {
        // Reset previous state
        setWarrantyInfo(null);
        setErrorInfo(null);

        try {
            const response = await apiService.checkWarranty(data.serialNumber);

            if (response.success && response.data) {
                const warrantyData = toWarrantyInfo(response.data, locale);
                if (warrantyData) {
                    setWarrantyInfo(warrantyData);
                    setErrorInfo(null);
                } else {
                    setWarrantyInfo(null);
                    setErrorInfo({
                        message: ERROR_MESSAGES.SERIAL_NOT_FOUND,
                        type: 'not_found'
                    });
                }
            } else {
                setWarrantyInfo(null);
                setErrorInfo({
                    message: response.error || ERROR_MESSAGES.SERIAL_NOT_FOUND,
                    type: 'not_found'
                });
            }
        } catch (error: unknown) {
            setWarrantyInfo(null);
            setErrorInfo(handleApiError(error));
        }

        setShowResult(true);
    };

    const handleReset = () => {
        setWarrantyInfo(null);
        setErrorInfo(null);
        setShowResult(false);
    };

    return (
        <div className="brand-section min-h-screen text-white flex flex-col">
            <HeroSection />

            <AvoidSidebar>
                <div className="brand-shell py-8 sm:py-12 md:py-16">
                    <AnimatePresence mode="wait">
                        {!showResult ? (
                            <motion.div
                                key="form"
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 50 }}
                                transition={{ duration: 0.5, ease: 'easeInOut' }}
                            >
                                <WarrantyForm onSubmit={handleFormSubmit} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="result"
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -50 }}
                                transition={{ duration: 0.5, ease: 'easeInOut' }}
                            >
                                <WarrantyResult
                                    warrantyInfo={warrantyInfo}
                                    errorInfo={errorInfo}
                                    onReset={handleReset}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </AvoidSidebar>
        </div>
    );
};

export default WarrantyCheckPage;
