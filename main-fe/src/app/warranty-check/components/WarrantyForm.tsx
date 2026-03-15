'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/context/LanguageContext';
import { ButtonSpinner } from '@/components/ui/Spinner';

interface WarrantyFormProps {
    onSubmit: (data: { serialNumber: string }) => void;
}

const WarrantyForm: React.FC<WarrantyFormProps> = ({ onSubmit }) => {
    const { t } = useLanguage();
    const [serialNumber, setSerialNumber] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!serialNumber.trim()) {
            setValidationError(t('warrantyCheck.form.alertSerial'));
            return;
        }

        setValidationError(null);
        setIsLoading(true);
        try {
            await onSubmit({ serialNumber });
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSerialNumber(e.target.value);
        if (validationError) setValidationError(null);
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
                noValidate
            >
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    <label htmlFor="serialNumber" className="block text-sm font-medium text-gray-300 mb-2">
                        {t('warrantyCheck.form.serialNumberRequired')} <span className="text-red-500" aria-hidden="true">*</span>
                    </label>
                    <Input
                        id="serialNumber"
                        type="text"
                        value={serialNumber}
                        onChange={handleChange}
                        placeholder={t('warrantyCheck.form.serialNumberPlaceholder')}
                        required
                        aria-required="true"
                        aria-invalid={validationError ? 'true' : 'false'}
                        aria-describedby={validationError ? 'serial-error' : 'serial-helper'}
                        className={`w-full transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-400 ${
                            validationError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
                        }`}
                    />
                    <AnimatePresence mode="wait">
                        {validationError ? (
                            <motion.p
                                id="serial-error"
                                role="alert"
                                key="error"
                                className="text-xs sm:text-sm text-red-400 mt-1 flex items-center gap-1"
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.2 }}
                            >
                                <span aria-hidden="true">⚠</span>
                                {validationError}
                            </motion.p>
                        ) : (
                            <p id="serial-helper" className="text-xs sm:text-sm text-gray-400 mt-1">
                                {t('warrantyCheck.form.serialNumberHelper')}
                            </p>
                        )}
                    </AnimatePresence>
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
                            <div className="flex items-center justify-center gap-2">
                                <ButtonSpinner />
                                {t('warrantyCheck.form.checkingButton')}
                            </div>
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
                <ul className="text-sm text-gray-400 space-y-1">
                    <li>{t('warrantyCheck.form.notes.serialRequired')}</li>
                    <li>{t('warrantyCheck.form.notes.infoDisplay')}</li>
                    <li>{t('warrantyCheck.form.notes.contactSupport')}</li>
                </ul>
            </motion.div>
        </motion.div>
    );
};

export default WarrantyForm;
