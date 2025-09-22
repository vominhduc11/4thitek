'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeroSection, WarrantyForm, WarrantyResult, LoginForm } from './components';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { WarrantyInfo, WarrantyCheckData } from '@/types/warranty';
import { apiService } from '@/services/apiService';

const WarrantyCheckPage = () => {
    const { t } = useLanguage();
    const [warrantyInfo, setWarrantyInfo] = useState<WarrantyInfo | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    // Auto-redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated && !isLoading) {
            router.push('/account/user');
        }
    }, [isAuthenticated, isLoading, router]);

    // Helper function to convert API data to UI format
    const convertApiDataToWarrantyInfo = (apiData: WarrantyCheckData, serialNumber: string): WarrantyInfo => {
        const purchaseDate = new Date(apiData.purchaseDate);
        const expirationDate = new Date(apiData.expirationDate);
        const now = new Date();

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
            serialNumber,
            productName: `Product ID ${apiData.productId}`, // This would need to be fetched separately or included in API
            purchaseDate: purchaseDate.toLocaleDateString('vi-VN'),
            warrantyStatus: statusMapping[apiData.status] || 'invalid',
            warrantyEndDate: expirationDate.toLocaleDateString('vi-VN'),
            remainingDays,
            customerName: apiData.customerName,
            warrantyCode: apiData.warrantyCode,
            warrantyPeriodMonths: apiData.warrantyPeriodMonths
        };
    };

    const handleFormSubmit = async (data: { serialNumber: string }) => {
        try {
            const response = await apiService.checkWarranty(data.serialNumber);

            if (response.success && response.data) {
                const warrantyData = convertApiDataToWarrantyInfo(response.data.data, data.serialNumber);
                setWarrantyInfo(warrantyData);
            } else {
                // API returned unsuccessful response or no data
                setWarrantyInfo(null);
            }
        } catch (error) {
            console.error('Error checking warranty:', error);
            setWarrantyInfo(null);
        }

        setShowResult(true);
    };

    const handleReset = () => {
        setWarrantyInfo(null);
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
                            <WarrantyResult warrantyInfo={warrantyInfo} onReset={handleReset} />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Instructions section */}
            <motion.div
                className="ml-16 sm:ml-20 pl-1 sm:pl-2 md:pl-2 lg:pl-3 xl:pl-4 2xl:pl-6 pr-1 sm:pr-2 md:pr-2 lg:pr-3 xl:pr-4 2xl:pr-6 py-8"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
            >
                <div className="max-w-4xl mx-auto">
                    <motion.h2
                        className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-6 sm:mb-8 text-white"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        {t('warrantyCheck.instructions.title')}
                    </motion.h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        <motion.div
                            className="bg-[#1a2332] p-6 rounded-lg shadow-md text-center border border-gray-700 transition-all duration-300 hover:border-gray-500 hover:shadow-lg hover:scale-105"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                        >
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg
                                    className="w-8 h-8 text-blue-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-base sm:text-lg font-semibold mb-2 text-white">{t('warrantyCheck.instructions.step1.title')}</h3>
                            <p className="text-sm sm:text-base text-gray-300">{t('warrantyCheck.instructions.step1.description')}</p>
                        </motion.div>

                        <motion.div
                            className="bg-[#1a2332] p-6 rounded-lg shadow-md text-center border border-gray-700 transition-all duration-300 hover:border-gray-500 hover:shadow-lg hover:scale-105"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.5 }}
                        >
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg
                                    className="w-8 h-8 text-green-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-base sm:text-lg font-semibold mb-2 text-white">{t('warrantyCheck.instructions.step2.title')}</h3>
                            <p className="text-sm sm:text-base text-gray-300">{t('warrantyCheck.instructions.step2.description')}</p>
                        </motion.div>

                        <motion.div
                            className="bg-[#1a2332] p-6 rounded-lg shadow-md text-center border border-gray-700 transition-all duration-300 hover:border-gray-500 hover:shadow-lg hover:scale-105"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.6 }}
                        >
                            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg
                                    className="w-8 h-8 text-purple-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                            <h3 className="text-base sm:text-lg font-semibold mb-2 text-white">{t('warrantyCheck.instructions.step3.title')}</h3>
                            <p className="text-sm sm:text-base text-gray-300">{t('warrantyCheck.instructions.step3.description')}</p>
                        </motion.div>
                    </div>
                </div>
            </motion.div>

            {/* Demo section */}
            <motion.div
                className="bg-[#1a2332] py-8 border-t border-gray-700"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
            >
                <div className="ml-16 sm:ml-20 pl-1 sm:pl-2 md:pl-2 lg:pl-3 xl:pl-4 2xl:pl-6 pr-1 sm:pr-2 md:pr-2 lg:pr-3 xl:pr-4 2xl:pr-6">
                    <div className="max-w-4xl mx-auto text-center">
                        <h3 className="text-lg sm:text-xl font-semibold mb-4 text-white">{t('warrantyCheck.demo.title')}</h3>
                        <p className="text-sm sm:text-base text-gray-300 mb-4">
                            {t('warrantyCheck.demo.description')}
                        </p>
                        <div className="bg-[#0c131d] p-3 sm:p-4 rounded-lg border border-gray-600 max-w-md mx-auto">
                            <p className="text-xs sm:text-sm font-mono mb-2 text-gray-300">
                                Enter your product's serial number above to check warranty status
                            </p>
                            <p className="text-xs sm:text-sm font-mono text-gray-300">
                                Real-time warranty information from our database
                            </p>
                        </div>

                        <div className="mt-4 text-center">
                            {isLoading ? (
                                <div className="text-gray-400">{t('common.loading')}</div>
                            ) : (
                                <button
                                    onClick={() => setShowLogin(true)}
                                    className="group bg-gradient-to-r from-[#4FC8FF] to-[#0EA5E9] hover:from-[#0EA5E9] hover:to-[#0284C7] text-white px-6 py-3 rounded-lg font-medium border border-[#4FC8FF]/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-0.5 flex items-center justify-center gap-2 mx-auto"
                                >
                                    <svg
                                        className="w-5 h-5 transition-transform group-hover:rotate-12"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                        />
                                    </svg>
                                    {t('warrantyCheck.demo.loginButton')}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Login Modal */}
            <AnimatePresence>
                {showLogin && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 pl-16 sm:pl-20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowLogin(false)}
                    >
                        <div onClick={(e) => e.stopPropagation()}>
                            <LoginForm onClose={() => setShowLogin(false)} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default WarrantyCheckPage;
