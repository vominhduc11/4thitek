'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeroSection, WarrantyForm, WarrantyResult } from './components';
import { WarrantyInfo, WarrantyCheckData } from '@/types/warranty';
import { apiService } from '@/services/apiService';
import { ERROR_MESSAGES, ErrorType } from '@/constants/warranty';
import { handleApiError } from '@/utils/errorHandler';
import { parseImageUrl } from '@/utils/media';
import { useLanguage } from '@/context/LanguageContext';
import { formatWarrantyBoundaryDate, formatWarrantyPurchaseDate } from '@/lib/warrantyDate';

const WarrantyCheckPage = () => {
    const { locale } = useLanguage();
    const [warrantyInfo, setWarrantyInfo] = useState<WarrantyInfo | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [errorInfo, setErrorInfo] = useState<{ message: string; type: ErrorType } | null>(null);

    // Helper function to parse product image JSON
    const parseProductImage = (imageData: string): string | undefined => {
        const resolved = parseImageUrl(imageData);
        return resolved || undefined;
    };

    // Helper function to convert API data to UI format
    const convertApiDataToWarrantyInfo = (apiData: WarrantyCheckData): WarrantyInfo => {
        if (!apiData?.purchaseDate) {
            throw new Error(ERROR_MESSAGES.PURCHASE_DATE_MISSING);
        }
        if (!apiData?.warrantyEnd) {
            throw new Error(ERROR_MESSAGES.WARRANTY_END_MISSING);
        }
        if (!apiData?.productSerial) {
            throw new Error(ERROR_MESSAGES.SERIAL_MISSING);
        }

        const statusMapping: { [key: string]: 'active' | 'expired' | 'void' | 'invalid' } = {
            'ACTIVE': 'active',
            'EXPIRED': 'expired',
            'VOID': 'void'
        };

        return {
            serialNumber: apiData.productSerial.serialNumber,
            productName: apiData.productSerial.productName,
            purchaseDate: formatWarrantyPurchaseDate(apiData.purchaseDate, locale),
            warrantyStatus: statusMapping[apiData.status] || 'invalid',
            warrantyEndDate: formatWarrantyBoundaryDate(apiData.warrantyEnd, locale),
            remainingDays: Math.max(0, apiData.remainingDays ?? 0),
            warrantyCode: apiData.warrantyCode,
            productSku: apiData.productSerial.productSku,
            productImage: parseProductImage(apiData.productSerial.image)
        };
    };

    const handleFormSubmit = async (data: { serialNumber: string }) => {
        // Reset previous state
        setWarrantyInfo(null);
        setErrorInfo(null);

        try {
            const response = await apiService.checkWarranty(data.serialNumber);

            if (response.success && response.data) {
                const warrantyData = convertApiDataToWarrantyInfo(response.data);
                setWarrantyInfo(warrantyData);
                setErrorInfo(null);
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
        <div className="min-h-screen bg-[#0c131d] text-white flex flex-col">
            <HeroSection />

            <div className="ml-0 sm:ml-20 px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8 sm:py-12 md:py-16">
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
                            <WarrantyResult warrantyInfo={warrantyInfo} errorInfo={errorInfo} onReset={handleReset} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default WarrantyCheckPage;
