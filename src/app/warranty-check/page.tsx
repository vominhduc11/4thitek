'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeroSection, WarrantyForm, WarrantyResult } from './components';
import { WarrantyInfo, WarrantyCheckData } from '@/types/warranty';
import { apiService } from '@/services/apiService';
import { WARRANTY_CONSTANTS, ERROR_MESSAGES, ErrorType } from '@/constants/warranty';
import { handleApiError } from '@/utils/errorHandler';

const WarrantyCheckPage = () => {
    const [warrantyInfo, setWarrantyInfo] = useState<WarrantyInfo | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [errorInfo, setErrorInfo] = useState<{ message: string; type: ErrorType } | null>(null);

    // Login functionality removed


    // Helper function to parse product image JSON
    const parseProductImage = (imageData: string): string | undefined => {
        try {
            const parsed = JSON.parse(imageData);
            return parsed.imageUrl;
        } catch {
            return undefined;
        }
    };

    // Helper function to convert API data to UI format
    const convertApiDataToWarrantyInfo = (apiData: WarrantyCheckData): WarrantyInfo => {
        // Check if required fields exist
        if (!apiData?.purchaseDate) {
            throw new Error(ERROR_MESSAGES.PURCHASE_DATE_MISSING);
        }
        if (!apiData?.productSerial) {
            throw new Error(ERROR_MESSAGES.SERIAL_MISSING);
        }
        if (!apiData?.customer) {
            throw new Error(ERROR_MESSAGES.CUSTOMER_MISSING);
        }

        const purchaseDate = new Date(apiData.purchaseDate);
        const now = new Date();

        // Calculate warranty period (assuming standard warranty periods)
        // This should ideally come from product warranty configuration
        const warrantyPeriodMonths = WARRANTY_CONSTANTS.DEFAULT_WARRANTY_PERIOD_MONTHS;
        const expirationDate = new Date(purchaseDate);
        expirationDate.setMonth(expirationDate.getMonth() + warrantyPeriodMonths);

        // Calculate remaining days
        const remainingMs = expirationDate.getTime() - now.getTime();
        const remainingDays = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));

        // Map API status to UI status
        const statusMapping: { [key: string]: 'active' | 'expired' | 'invalid' } = {
            'ACTIVE': 'active',
            'EXPIRED': 'expired',
            'INVALID': 'invalid'
        };

        return {
            serialNumber: apiData.productSerial.serialNumber,
            productName: apiData.productSerial.productName,
            purchaseDate: purchaseDate.toLocaleDateString('vi-VN'),
            warrantyStatus: statusMapping[apiData.status] || 'invalid',
            warrantyEndDate: expirationDate.toLocaleDateString('vi-VN'),
            remainingDays,
            customerName: apiData.customer.name,
            customerPhone: apiData.customer.phone,
            customerEmail: apiData.customer.email,
            customerAddress: apiData.customer.address,
            warrantyCode: apiData.warrantyCode,
            warrantyPeriodMonths,
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
                // API now returns single object, not array
                const warrantyData = convertApiDataToWarrantyInfo(response.data as unknown as WarrantyCheckData);
                setWarrantyInfo(warrantyData);
                setErrorInfo(null);
            } else {
                // API returned unsuccessful response or no data
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
        <div className="min-h-screen bg-[#0c131d]">
            <HeroSection />

            <div className="ml-16 sm:ml-20 pl-1 sm:pl-2 md:pl-2 lg:pl-3 xl:pl-4 2xl:pl-6 pr-1 sm:pr-2 md:pr-2 lg:pr-3 xl:pr-4 2xl:pr-6 py-12">
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
