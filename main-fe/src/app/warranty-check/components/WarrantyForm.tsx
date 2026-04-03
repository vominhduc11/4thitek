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
            className="brand-card mx-auto max-w-2xl rounded-[28px] p-4 sm:p-6 lg:p-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
        >
            <motion.h2
                className="mb-4 text-center font-serif text-xl font-bold text-[var(--text-primary)] sm:mb-6 sm:text-2xl"
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
                    <label htmlFor="serialNumber" className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
                        {t('warrantyCheck.form.serialNumberRequired')} <span className="text-[var(--destructive)]" aria-hidden="true">*</span>
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
                        className={`w-full transition-all duration-300 ${
                            validationError ? 'border-[var(--destructive)] focus:border-[var(--destructive)] focus:ring-[var(--destructive)]' : 'hover:border-[var(--brand-border-strong)]'
                        }`}
                    />
                    <AnimatePresence mode="wait">
                        {validationError ? (
                            <motion.p
                                id="serial-error"
                                role="alert"
                                key="error"
                                className="mt-1 flex items-center gap-1 text-xs text-[var(--destructive-text)] sm:text-sm"
                                initial={{ opacity: 0, y: -4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.2 }}
                            >
                                <span aria-hidden="true">⚠</span>
                                {validationError}
                            </motion.p>
                        ) : (
                            <p id="serial-helper" className="mt-1 text-xs text-[var(--text-muted)] sm:text-sm">
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
                        className="brand-button-primary w-full rounded-full py-2 text-base font-medium shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:translate-y-0 sm:py-3 sm:text-lg"
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
                className="mt-6 rounded-[24px] border border-[var(--brand-border)] bg-[rgba(7,17,27,0.72)] p-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
            >
                <h3 className="mb-2 font-serif font-semibold text-[var(--text-primary)]">{t('warrantyCheck.form.notes.title')}</h3>
                <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
                    <li>{t('warrantyCheck.form.notes.serialRequired')}</li>
                    <li>{t('warrantyCheck.form.notes.infoDisplay')}</li>
                    <li>{t('warrantyCheck.form.notes.contactSupport')}</li>
                </ul>
            </motion.div>
        </motion.div>
    );
};

export default WarrantyForm;
