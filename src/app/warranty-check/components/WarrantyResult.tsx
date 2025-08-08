import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';

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

interface WarrantyResultProps {
    warrantyInfo: WarrantyInfo | null;
    onReset: () => void;
}

const WarrantyResult: React.FC<WarrantyResultProps> = ({ warrantyInfo, onReset }) => {
    const { t } = useLanguage();
    if (!warrantyInfo) {
        return (
            <motion.div
                className="max-w-2xl mx-auto bg-[#1a2332] p-4 sm:p-6 lg:p-8 rounded-lg shadow-lg border border-gray-700"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
            >
                <div className="text-center">
                    <motion.div
                        className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.2, type: 'spring' }}
                    >
                        <motion.svg
                            className="w-8 h-8 text-red-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            initial={{ rotate: 0 }}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 0.8, delay: 0.5 }}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </motion.svg>
                    </motion.div>
                    <motion.h2
                        className="text-xl sm:text-2xl font-bold text-white mb-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        {t('warrantyCheck.result.notFound')}
                    </motion.h2>
                    <motion.p
                        className="text-gray-300 mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        {t('warrantyCheck.result.notFoundMessage')}
                    </motion.p>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                    >
                        <Button
                            onClick={onReset}
                            variant="outline"
                            className="transition-all duration-300 hover:scale-105 hover:shadow-lg"
                        >
                            {t('warrantyCheck.result.backButton')}
                        </Button>
                    </motion.div>
                </div>
            </motion.div>
        );
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'text-green-400 bg-green-900/30';
            case 'expired':
                return 'text-red-400 bg-red-900/30';
            case 'invalid':
                return 'text-gray-400 bg-gray-800/30';
            default:
                return 'text-gray-400 bg-gray-800/30';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'active':
                return t('warrantyCheck.result.status.active');
            case 'expired':
                return t('warrantyCheck.result.status.expired');
            case 'invalid':
                return t('warrantyCheck.result.status.invalid');
            default:
                return t('warrantyCheck.result.status.invalid');
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active':
                return (
                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                );
            case 'expired':
                return (
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                );
            default:
                return (
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                );
        }
    };

    return (
        <motion.div
            className="max-w-2xl mx-auto bg-[#1a2332] p-4 sm:p-6 lg:p-8 rounded-lg shadow-lg border border-gray-700"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
        >
            <div className="text-center mb-6">
                <motion.div
                    className="w-16 h-16 bg-gray-800/30 rounded-full flex items-center justify-center mx-auto mb-4"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, type: 'spring' }}
                >
                    {getStatusIcon(warrantyInfo.warrantyStatus)}
                </motion.div>
                <motion.h2
                    className="text-xl sm:text-2xl font-bold text-white mb-2"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    Ket qua kiem tra bao hanh
                </motion.h2>
                <motion.div
                    className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(warrantyInfo.warrantyStatus)}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.4, type: 'spring' }}
                >
                    {getStatusText(warrantyInfo.warrantyStatus)}
                </motion.div>
            </div>

            <motion.div
                className="space-y-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <motion.div
                        className="bg-[#0c131d] p-3 sm:p-4 rounded-lg border border-gray-600 transition-all duration-300 hover:border-gray-500 hover:shadow-lg"
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                    >
                        <h3 className="font-semibold text-gray-300 mb-2 text-sm sm:text-base">Thong tin san pham</h3>
                        <p className="text-sm text-gray-400 mb-1">
                            <span className="font-medium">So serial:</span> {warrantyInfo.serialNumber}
                        </p>
                        <p className="text-sm text-gray-400">
                            <span className="font-medium">Ten san pham:</span> {warrantyInfo.productName}
                        </p>
                    </motion.div>

                    <motion.div
                        className="bg-[#0c131d] p-3 sm:p-4 rounded-lg border border-gray-600 transition-all duration-300 hover:border-gray-500 hover:shadow-lg"
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.7 }}
                    >
                        <h3 className="font-semibold text-gray-300 mb-2 text-sm sm:text-base">Thong tin bao hanh</h3>
                        <p className="text-sm text-gray-400 mb-1">
                            <span className="font-medium">Ngay mua:</span> {warrantyInfo.purchaseDate}
                        </p>
                        <p className="text-sm text-gray-400">
                            <span className="font-medium">Het han:</span> {warrantyInfo.warrantyEndDate}
                        </p>
                    </motion.div>
                </div>

                {warrantyInfo.warrantyStatus === 'active' && (
                    <motion.div
                        className="bg-green-900/20 p-3 sm:p-4 rounded-lg border border-green-700 transition-all duration-300 hover:bg-green-900/30 hover:border-green-600"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.8 }}
                    >
                        <h3 className="font-semibold text-green-400 mb-2">Thong tin chi tiet</h3>
                        <motion.p
                            className="text-sm text-green-300"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.9 }}
                        >
                            San pham con <span className="font-bold">{warrantyInfo.remainingDays} ngay</span> bao hanh
                        </motion.p>
                        <motion.p
                            className="text-sm text-green-400 mt-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 1.0 }}
                        >
                            Ban co the mang san pham den trung tam bao hanh de duoc ho tro mien phi
                        </motion.p>
                    </motion.div>
                )}

                {warrantyInfo.warrantyStatus === 'expired' && (
                    <motion.div
                        className="bg-red-900/20 p-3 sm:p-4 rounded-lg border border-red-700 transition-all duration-300 hover:bg-red-900/30 hover:border-red-600"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.8 }}
                    >
                        <h3 className="font-semibold text-red-400 mb-2">Bao hanh da het han</h3>
                        <motion.p
                            className="text-sm text-red-300"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.9 }}
                        >
                            San pham da het bao hanh tu ngay {warrantyInfo.warrantyEndDate}
                        </motion.p>
                        <motion.p
                            className="text-sm text-red-400 mt-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 1.0 }}
                        >
                            Ban van co the su dung dich vu sua chua tra phi tai trung tam bao hanh
                        </motion.p>
                    </motion.div>
                )}

                {(warrantyInfo.customerName || warrantyInfo.dealerName) && (
                    <motion.div
                        className="bg-blue-900/20 p-3 sm:p-4 rounded-lg border border-blue-700 transition-all duration-300 hover:bg-blue-900/30 hover:border-blue-600"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.8 }}
                    >
                        <h3 className="font-semibold text-blue-400 mb-2">Thong tin khach hang</h3>
                        {warrantyInfo.customerName && (
                            <motion.p
                                className="text-sm text-blue-300 mb-1"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: 0.9 }}
                            >
                                <span className="font-medium">Ten khach hang:</span> {warrantyInfo.customerName}
                            </motion.p>
                        )}
                        {warrantyInfo.dealerName && (
                            <motion.p
                                className="text-sm text-blue-300"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: 1.0 }}
                            >
                                <span className="font-medium">Dai ly ban:</span> {warrantyInfo.dealerName}
                            </motion.p>
                        )}
                    </motion.div>
                )}
            </motion.div>

            <motion.div
                className="mt-6 flex flex-col sm:flex-row gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.1 }}
            >
                <Button
                    onClick={onReset}
                    variant="outline"
                    className="flex-1 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                >
                    Kiem tra so serial khac
                </Button>
                <Button className="flex-1 bg-gradient-to-r from-[#4FC8FF] to-[#0EA5E9] hover:from-[#0EA5E9] hover:to-[#0284C7] text-white font-medium rounded-lg border border-[#4FC8FF]/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-0.5">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                    Tai xuong thong tin
                </Button>
            </motion.div>

            <motion.div
                className="mt-6 p-3 sm:p-4 bg-[#0c131d] rounded-lg border border-gray-600 transition-all duration-300 hover:border-gray-500"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1.2 }}
            >
                <motion.h3
                    className="font-semibold text-gray-300 mb-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 1.3 }}
                >
                    Can ho tro?
                </motion.h3>
                <motion.p
                    className="text-sm text-gray-400 mb-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 1.4 }}
                >
                    Lien he trung tam bao hanh de duoc ho tro tot nhat
                </motion.p>
                <motion.div
                    className="flex flex-col sm:flex-row gap-2 text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 1.5 }}
                >
                    <span className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer">
                        📞 Hotline: 1900-xxxx
                    </span>
                    <span className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer">
                        ✉️ Email: warranty@4thitek.com
                    </span>
                </motion.div>
            </motion.div>
        </motion.div>
    );
};

export default WarrantyResult;
