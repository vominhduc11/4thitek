'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HeroSection, WarrantyForm, WarrantyResult, LoginForm } from './components';
import { useAuth } from '@/context/AuthContext';

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
    const [warrantyInfo, setWarrantyInfo] = useState<WarrantyInfo | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [showLogin, setShowLogin] = useState(false);
    const { isAuthenticated, isLoading, user } = useAuth();

    // Debug authentication state
    console.log('WarrantyCheckPage - isAuthenticated:', isAuthenticated);
    console.log('WarrantyCheckPage - isLoading:', isLoading);
    console.log('WarrantyCheckPage - user:', user);
    console.log(
        'WarrantyCheckPage - localStorage:',
        typeof window !== 'undefined' ? localStorage.getItem('4thitek_user') : 'server-side'
    );

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

            <div className="container mx-auto px-4 py-12">
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
                className="container mx-auto px-4 py-8"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
            >
                <div className="max-w-4xl mx-auto">
                    <motion.h2
                        className="text-2xl font-bold text-center mb-8 text-white"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        Huong dan kiem tra bao hanh
                    </motion.h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                            <h3 className="text-lg font-semibold mb-2 text-white">Buoc 1</h3>
                            <p className="text-gray-300">Tim so serial tren san pham hoac hop dung</p>
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
                            <h3 className="text-lg font-semibold mb-2 text-white">Buoc 2</h3>
                            <p className="text-gray-300">Nhap so serial vao form kiem tra</p>
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
                            <h3 className="text-lg font-semibold mb-2 text-white">Buoc 3</h3>
                            <p className="text-gray-300">Xem ket qua va thong tin bao hanh</p>
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
                <div className="container mx-auto px-4">
                    <div className="max-w-2xl mx-auto text-center">
                        <h3 className="text-xl font-semibold mb-4 text-white">Thu nghiem voi so serial mau</h3>
                        <p className="text-gray-300 mb-4">
                            Ban co the thu nghiem tinh nang kiem tra bao hanh voi cac so serial sau:
                        </p>
                        <div className="bg-[#0c131d] p-4 rounded-lg border border-gray-600">
                            <p className="text-sm font-mono mb-2 text-gray-300">ABC123456 - San pham con bao hanh</p>
                            <p className="text-sm font-mono text-gray-300">DEF789012 - San pham het bao hanh</p>
                        </div>

                        <div className="mt-4 text-center">
                            {/* Debug info */}
                            <div className="text-xs text-gray-500 mb-2">
                                Debug: isLoading={isLoading.toString()}, isAuthenticated={isAuthenticated.toString()},
                                user={user ? 'exists' : 'null'}
                            </div>

                            {isLoading ? (
                                <div className="text-gray-400">Dang kiem tra trang thai...</div>
                            ) : !isAuthenticated ? (
                                <button
                                    onClick={() => setShowLogin(true)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-all duration-300 hover:scale-105"
                                >
                                    Dang nhap de xem san pham da mua
                                </button>
                            ) : (
                                <div className="space-y-2">
                                    <div className="text-green-400 font-medium">
                                        Da dang nhap thanh cong -{' '}
                                        <a href="/account/user" className="text-blue-400 hover:underline">
                                            Xem tai khoan
                                        </a>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (typeof window !== 'undefined') {
                                                localStorage.removeItem('4thitek_user');
                                                document.cookie =
                                                    '4thitek_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                                                window.location.reload();
                                            }
                                        }}
                                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded text-sm transition-all duration-300"
                                    >
                                        Dang xuat
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Login Modal */}
            <AnimatePresence>
                {showLogin && (
                    <motion.div
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
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
