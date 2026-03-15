import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';
import { WarrantyInfo } from '@/types/warranty';
import { useHydration } from '@/hooks/useHydration';
import Image from 'next/image';

interface WarrantyResultProps {
    warrantyInfo: WarrantyInfo | null;
    errorInfo: { message: string; type: 'not_found' | 'network' | 'server' | 'unknown' } | null;
    onReset: () => void;
}

const WarrantyResult: React.FC<WarrantyResultProps> = ({ warrantyInfo, errorInfo, onReset }) => {
    const { t, locale, getTranslation } = useLanguage();
    const isHydrated = useHydration();

    const handleDownloadInfo = () => {
        if (!warrantyInfo) return;

        const statusText = getStatusText(warrantyInfo.warrantyStatus);
        const lines = [
            `=== ${t('warrantyCheck.export.title')} ===`,
            '',
            `${t('warrantyCheck.export.productInfoTitle')}:`,
            `- ${t('warrantyCheck.export.serialLabel')}: ${warrantyInfo.serialNumber}`,
            `- ${t('warrantyCheck.export.productNameLabel')}: ${warrantyInfo.productName}`,
            ...(warrantyInfo.productSku ? [`- ${t('warrantyCheck.export.productSkuLabel')}: ${warrantyInfo.productSku}`] : []),
            '',
            `${t('warrantyCheck.export.warrantyInfoTitle')}:`,
            `- ${t('warrantyCheck.export.purchaseDateLabel')}: ${warrantyInfo.purchaseDate}`,
            `- ${t('warrantyCheck.export.warrantyEndDateLabel')}: ${warrantyInfo.warrantyEndDate}`,
            ...(warrantyInfo.warrantyCode ? [`- ${t('warrantyCheck.export.warrantyCodeLabel')}: ${warrantyInfo.warrantyCode}`] : []),
            `- ${t('warrantyCheck.export.statusLabel')}: ${statusText}`,
            ...(warrantyInfo.warrantyStatus === 'active'
                ? [`- ${t('warrantyCheck.export.remainingDaysLabel')}: ${t('warrantyCheck.export.remainingDaysValue').replace('{days}', String(warrantyInfo.remainingDays))}`]
                : []),
            '',
            `${t('warrantyCheck.export.supportTitle')}:`,
            `- ${t('warrantyCheck.export.hotlineLabel')}: ${t('warrantyCheck.export.hotlineValue')}`,
            `- ${t('warrantyCheck.export.supportEmailLabel')}: ${t('warrantyCheck.export.supportEmailValue')}`,
            '',
            `${t('warrantyCheck.export.exportTimestampLabel')}: ${isHydrated ? new Date().toLocaleString(locale) : ''}`
        ];

        const content = lines.filter(Boolean).join('\n');

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${t('warrantyCheck.export.fileNamePrefix')}-${warrantyInfo.serialNumber}-${isHydrated ? new Date().toISOString().split('T')[0] : 'export'}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    };
    if (!warrantyInfo) {
        const getErrorIcon = () => {
            switch (errorInfo?.type) {
                case 'not_found':
                    return (
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    );
                case 'network':
                    return (
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
                        />
                    );
                case 'server':
                    return (
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                        />
                    );
                default:
                    return (
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    );
            }
        };

        const getErrorColor = () => {
            switch (errorInfo?.type) {
                case 'not_found':
                    return 'text-yellow-500 bg-yellow-900/20';
                case 'network':
                    return 'text-blue-500 bg-blue-900/20';
                case 'server':
                    return 'text-orange-500 bg-orange-900/20';
                default:
                    return 'text-red-500 bg-red-900/20';
            }
        };

        const getErrorTitle = () => {
            switch (errorInfo?.type) {
                case 'not_found':
                    return t('warrantyCheck.errors.notFoundTitle');
                case 'network':
                    return t('warrantyCheck.errors.networkTitle');
                case 'server':
                    return t('warrantyCheck.errors.serverTitle');
                default:
                    return t('warrantyCheck.errors.unknownTitle');
            }
        };

        const getErrorMessage = () => {
            switch (errorInfo?.type) {
                case 'not_found':
                    return t('warrantyCheck.errors.notFoundMessage');
                case 'network':
                    return t('warrantyCheck.errors.networkMessage');
                case 'server':
                    return t('warrantyCheck.errors.serverMessage');
                default:
                    return errorInfo?.message || t('warrantyCheck.errors.unknownMessage');
            }
        };

        const tips = (getTranslation('warrantyCheck.errors.tips.items') as string[]) || [];

        return (
            <motion.div
                className="max-w-2xl mx-auto bg-[#1a2332] p-4 sm:p-6 lg:p-8 rounded-lg shadow-lg border border-gray-700"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
            >
                <div className="text-center">
                    <motion.div
                        className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${getErrorColor()}`}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5, delay: 0.2, type: 'spring' }}
                    >
                        <motion.svg
                            className={`w-8 h-8 ${getErrorColor().split(' ')[0]}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            initial={{ rotate: 0 }}
                            animate={{ rotate: errorInfo?.type === 'network' ? 0 : 360 }}
                            transition={{ duration: 0.8, delay: 0.5 }}
                        >
                            {getErrorIcon()}
                        </motion.svg>
                    </motion.div>
                    <motion.h2
                        className="text-xl sm:text-2xl font-bold text-white mb-2"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3 }}
                    >
                        {getErrorTitle()}
                    </motion.h2>
                    <motion.p
                        className="text-gray-300 mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        {getErrorMessage()}
                    </motion.p>

                    <motion.div
                        className="bg-gray-800/30 p-4 sm:p-5 rounded-lg border border-gray-600 mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.5 }}
                    >
                        <div className="flex items-center mb-3">
                            <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                            <h3 className="font-semibold text-gray-200">{t('warrantyCheck.errors.tips.title')}</h3>
                        </div>
                        <ul className="text-sm text-gray-300 space-y-2">
                            {tips.map((tip) => (
                                <li key={tip} className="flex items-start">
                                    <span className="text-blue-400 mr-2 mt-0.5">&bull;</span>
                                    <span>{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    <motion.div
                        className="flex justify-center"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                    >
                        <Button
                            onClick={onReset}
                            className="bg-gradient-to-r from-[#4FC8FF] to-[#0EA5E9] hover:from-[#0EA5E9] hover:to-[#0284C7] text-white px-8 py-3 font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-0.5 flex items-center gap-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                            </svg>
                            {t('warrantyCheck.result.actions.checkAnother')}
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
            case 'void':
                return 'text-amber-400 bg-amber-900/30';
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
            case 'void':
                return t('warrantyCheck.result.status.void');
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
            case 'void':
                return (
                    <svg className="w-8 h-8 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
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
                    {t('warrantyCheck.result.title')}
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <motion.div
                        className="bg-[#0c131d] p-3 sm:p-4 rounded-lg border border-gray-600 transition-all duration-300 hover:border-gray-500 hover:shadow-lg"
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                    >
                        <h3 className="font-semibold text-gray-300 mb-2 text-sm sm:text-base">
                            {t('warrantyCheck.result.sections.productInfo')}
                        </h3>
                        <p className="text-sm text-gray-400 mb-1">
                            <span className="font-medium">{t('warrantyCheck.result.fields.serialNumber')}:</span> {warrantyInfo.serialNumber}
                        </p>
                        <p className="text-sm text-gray-400 mb-1">
                            <span className="font-medium">{t('warrantyCheck.result.fields.productName')}:</span> {warrantyInfo.productName}
                        </p>
                        {warrantyInfo.productSku && (
                            <p className="text-sm text-gray-400">
                                <span className="font-medium">{t('warrantyCheck.result.fields.productSku')}:</span> {warrantyInfo.productSku}
                            </p>
                        )}
                    </motion.div>

                    {warrantyInfo.productImage && (
                        <motion.div
                            className="bg-[#0c131d] p-3 sm:p-4 rounded-lg border border-gray-600 transition-all duration-300 hover:border-gray-500 hover:shadow-lg"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.65 }}
                        >
                            <h3 className="font-semibold text-gray-300 mb-2 text-sm sm:text-base">
                                {t('warrantyCheck.result.sections.productImage')}
                            </h3>
                            <div className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-800">
                                <Image
                                    src={warrantyInfo.productImage}
                                    alt={warrantyInfo.productName}
                                    fill
                                    className="object-cover transition-transform duration-300 hover:scale-105"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = '/images/product-placeholder.jpg'; // Fallback image
                                    }}
                                />
                            </div>
                        </motion.div>
                    )}

                    <motion.div
                        className="bg-[#0c131d] p-3 sm:p-4 rounded-lg border border-gray-600 transition-all duration-300 hover:border-gray-500 hover:shadow-lg"
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.7 }}
                    >
                        <h3 className="font-semibold text-gray-300 mb-2 text-sm sm:text-base">
                            {t('warrantyCheck.result.sections.warrantyInfo')}
                        </h3>
                        <p className="text-sm text-gray-400 mb-1">
                            <span className="font-medium">{t('warrantyCheck.result.fields.purchaseDate')}:</span> {warrantyInfo.purchaseDate}
                        </p>
                        <p className="text-sm text-gray-400 mb-1">
                            <span className="font-medium">{t('warrantyCheck.result.fields.warrantyEndDate')}:</span> {warrantyInfo.warrantyEndDate}
                        </p>
                        {warrantyInfo.warrantyCode && (
                            <p className="text-sm text-gray-400">
                                <span className="font-medium">{t('warrantyCheck.result.fields.warrantyCode')}:</span> {warrantyInfo.warrantyCode}
                            </p>
                        )}
                    </motion.div>
                </div>

                {warrantyInfo.warrantyStatus === 'active' && (
                    <motion.div
                        className="bg-green-900/20 p-3 sm:p-4 rounded-lg border border-green-700 transition-all duration-300 hover:bg-green-900/30 hover:border-green-600"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.8 }}
                    >
                        <h3 className="font-semibold text-green-400 mb-2">{t('warrantyCheck.result.active.title')}</h3>
                        <motion.p
                            className="text-sm text-green-300"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.9 }}
                        >
                            {t('warrantyCheck.result.active.message')
                                .replace('{days}', String(warrantyInfo.remainingDays))}
                        </motion.p>
                        <motion.p
                            className="text-sm text-green-400 mt-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 1.0 }}
                        >
                            {t('warrantyCheck.result.active.support')}
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
                        <h3 className="font-semibold text-red-400 mb-2">{t('warrantyCheck.result.expired.title')}</h3>
                        <motion.p
                            className="text-sm text-red-300"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.9 }}
                        >
                            {t('warrantyCheck.result.expired.message').replace('{date}', warrantyInfo.warrantyEndDate)}
                        </motion.p>
                        <motion.p
                            className="text-sm text-red-400 mt-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 1.0 }}
                        >
                            {t('warrantyCheck.result.expired.support')}
                        </motion.p>
                    </motion.div>
                )}

                {warrantyInfo.warrantyStatus === 'void' && (
                    <motion.div
                        className="bg-amber-900/20 p-3 sm:p-4 rounded-lg border border-amber-700 transition-all duration-300 hover:bg-amber-900/30 hover:border-amber-600"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.8 }}
                    >
                        <h3 className="font-semibold text-amber-400 mb-2">
                            {locale === 'vi' ? 'Bao hanh vo hieu' : 'Warranty voided'}
                        </h3>
                        <motion.p
                            className="text-sm text-amber-300"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.9 }}
                        >
                            {locale === 'vi'
                                ? 'Bao hanh nay da bi vo hieu va khong con duoc ap dung.'
                                : 'This warranty has been voided and is no longer eligible for coverage.'}
                        </motion.p>
                        <motion.p
                            className="text-sm text-amber-400 mt-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 1.0 }}
                        >
                            {locale === 'vi'
                                ? 'Lien he ho tro neu ban can xac minh them.'
                                : 'Contact support if you believe this is incorrect.'}
                        </motion.p>
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
                    {t('warrantyCheck.result.actions.checkAnother')}
                </Button>
                <Button
                    onClick={handleDownloadInfo}
                    className="flex-1 bg-gradient-to-r from-[#4FC8FF] to-[#0EA5E9] hover:from-[#0EA5E9] hover:to-[#0284C7] text-white font-medium rounded-lg border border-[#4FC8FF]/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-0.5"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                    {t('warrantyCheck.result.actions.download')}
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
                    {t('warrantyCheck.result.support.title')}
                </motion.h3>
                <motion.p
                    className="text-sm text-gray-400 mb-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 1.4 }}
                >
                    {t('warrantyCheck.result.support.description')}
                </motion.p>
                <motion.div
                    className="flex flex-col sm:flex-row gap-2 text-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 1.5 }}
                >
                    <span className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer">
                        {t('warrantyCheck.result.support.hotlineLabel')}: {t('warrantyCheck.result.support.hotlineValue')}
                    </span>
                    <span className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer">
                        {t('warrantyCheck.result.support.emailLabel')}: {t('warrantyCheck.result.support.emailValue')}
                    </span>
                </motion.div>
            </motion.div>
        </motion.div>
    );
};

export default WarrantyResult;
