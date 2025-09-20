'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/context/LanguageContext';

interface WarrantyFormProps {
    onSubmit: (data: { serialNumber: string }) => void;
}

const WarrantyForm: React.FC<WarrantyFormProps> = ({ onSubmit }) => {
    const { t } = useLanguage();
    const [serialNumber, setSerialNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!serialNumber.trim()) {
            alert(t('warrantyCheck.form.alertSerial'));
            return;
        }

        setIsLoading(true);
        try {
            await onSubmit({ serialNumber });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            className="max-w-2xl mx-auto bg-[#1a2332] p-4 sm:p-6 lg:p-8 rounded-lg shadow-lg border border-gray-700"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
        >
            <motion.h2
                className="text-xl sm:text-2xl font-bold text-center mb-4 sm:mb-6 text-white"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
            >
                {t('warrantyCheck.form.title')}
            </motion.h2>

            <motion.form
                onSubmit={handleSubmit}
                className="space-y-4 sm:space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
            >
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-300 mb-2">
                        {t('warrantyCheck.form.serialNumberRequired')} <span className="text-red-500">*</span>
                    </label>
                    <Input
                        id="serialNumber"
                        type="text"
                        value={serialNumber}
                        onChange={(e) => setSerialNumber(e.target.value)}
                        placeholder={t('warrantyCheck.form.serialNumberPlaceholder')}
                        required
                        className="w-full transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400"
                    />
                    <p className="text-xs sm:text-sm text-gray-400 mt-1">
                        {t('warrantyCheck.form.serialNumberHelper')}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                >
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-[#4FC8FF] to-[#0EA5E9] hover:from-[#0EA5E9] hover:to-[#0284C7] text-white py-2 sm:py-3 text-base sm:text-lg font-medium rounded-lg border border-[#4FC8FF]/20 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] hover:-translate-y-0.5 disabled:transform-none disabled:hover:scale-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <motion.div
                                className="flex items-center justify-center gap-2"
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            >
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                {t('warrantyCheck.form.checkingButton')}
                            </motion.div>
                        ) : (
                            t('warrantyCheck.form.checkButton')
                        )}
                    </Button>
                </motion.div>
            </motion.form>

            <motion.div
                className="mt-6 p-4 bg-[#0c131d] rounded-lg border border-gray-600"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
            >
                <h3 className="font-semibold text-gray-300 mb-2">{t('warrantyCheck.form.notes.title')}</h3>
                <motion.ul
                    className="text-sm text-gray-400 space-y-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                >
                    <motion.li
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.8 }}
                    >
                        {t('warrantyCheck.form.notes.serialRequired')}
                    </motion.li>
                    <motion.li
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.9 }}
                    >
                        {t('warrantyCheck.form.notes.infoDisplay')}
                    </motion.li>
                    <motion.li
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 1.0 }}
                    >
                        {t('warrantyCheck.form.notes.contactSupport')}
                    </motion.li>
                </motion.ul>
            </motion.div>
        </motion.div>
    );
};

export default WarrantyForm;
