'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeroSection, WarrantyForm, WarrantyResult, LoginForm } from './components';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';

interface WarrantyInfo {
    serialNumber: string;
    productName: string;
    purchaseDate: string;
    warrantyStatus: 'active' | 'expired' | 'invalid';
    warrantyEndDate: string;
    remainingDays: number;
    customerName?: string;
    dealerName?: string;
}

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

    // Mock data cho demo - trong thuc te se goi API
    const mockWarrantyData: Record<string, WarrantyInfo> = {
        ABC123456: {
            serialNumber: 'ABC123456',
            productName: 'Laptop Gaming 4T Pro',
            purchaseDate: '15/03/2023',
            warrantyStatus: 'active',
            warrantyEndDate: '15/03/2025',
            remainingDays: 245,
            customerName: 'Nguyen Van A',
            dealerName: 'Sieu thi dien may XYZ'
        },
        DEF789012: {
            serialNumber: 'DEF789012',
            productName: 'Man hinh Gaming 4T Ultra',
            purchaseDate: '10/01/2022',
            warrantyStatus: 'expired',
            warrantyEndDate: '10/01/2024',
            remainingDays: 0,
            customerName: 'Tran Thi B',
            dealerName: 'Cua hang cong nghe ABC'
        }
    };

    const handleFormSubmit = async (data: { serialNumber: string; invoiceNumber: string }) => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Mock warranty check
        const foundWarranty = mockWarrantyData[data.serialNumber.toUpperCase()];
        setWarrantyInfo(foundWarranty || null);
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
                            <p className="text-xs sm:text-sm font-mono mb-2 text-gray-300">{t('warrantyCheck.demo.active')}</p>
                            <p className="text-xs sm:text-sm font-mono text-gray-300">{t('warrantyCheck.demo.expired')}</p>
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
