'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { CardSkeleton } from '@/components/ui/SkeletonLoader';
import ResellerList from './ResellerList';
import type { Reseller, ResellerSearchFilters } from './types';

interface ResellerResultsProps {
    searchFilters: ResellerSearchFilters;
    resellers: Reseller[];
    loading?: boolean;
    error?: string | null;
}

export default function ResellerResults({
    searchFilters,
    resellers: initialResellers,
    loading: parentLoading,
    error: parentError
}: ResellerResultsProps) {
    const { t } = useLanguage();
    const [resellers, setResellers] = useState<Reseller[]>([]);
    const [selectedReseller, setSelectedReseller] = useState<Reseller | undefined>();

    useEffect(() => {
        let filteredResellers = initialResellers;

        if (searchFilters.city) {
            filteredResellers = filteredResellers.filter((reseller) => reseller.city === searchFilters.city);
        }

        if (searchFilters.district) {
            filteredResellers = filteredResellers.filter((reseller) => reseller.district === searchFilters.district);
        }

        if (searchFilters.address) {
            filteredResellers = filteredResellers.filter((reseller) =>
                reseller.address.toLowerCase().includes(searchFilters.address.toLowerCase())
            );
        }

        const sortedResellers = [...filteredResellers].sort((a, b) => a.name.localeCompare(b.name));

        setResellers(sortedResellers);
        setSelectedReseller(undefined);
    }, [searchFilters, initialResellers]);

    const handleResellerSelect = (reseller: Reseller) => {
        setSelectedReseller(reseller);
    };

    if (parentLoading) {
        return (
            <section className="py-8 text-white">
                <div className="w-full space-y-4">
                    <CardSkeleton height={150} backgroundColor="#152332" foregroundColor="#28445c" />
                    <CardSkeleton height={150} backgroundColor="#152332" foregroundColor="#28445c" />
                    <CardSkeleton height={150} backgroundColor="#152332" foregroundColor="#28445c" />
                    <CardSkeleton height={150} backgroundColor="#152332" foregroundColor="#28445c" />
                </div>
            </section>
        );
    }

    if (parentError && initialResellers.length === 0) {
        const errorMessage = parentError ? t(parentError) : '';

        return (
            <motion.section
                className="flex min-h-[400px] items-center justify-center py-8 text-white"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <motion.div
                    className="w-full max-w-md px-4"
                    initial={{ scale: 0.95, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div className="brand-card w-full rounded-[28px] border border-[rgba(239,95,120,0.28)] p-8 text-center">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(239,95,120,0.14)] text-[var(--destructive)]">
                            !
                        </div>
                        <h3 className="mb-2 font-serif text-lg font-semibold text-[var(--destructive-text)]">
                            {t('errors.reseller.errorTitle')}
                        </h3>
                        <p className="mb-4 text-[var(--text-secondary)]">{errorMessage}</p>
                        <p className="text-sm text-[var(--text-muted)]">{t('errors.general.serverError')}</p>
                    </div>
                </motion.div>
            </motion.section>
        );
    }

    return (
        <section className="py-8 text-white">
            <div className="w-full">
                <ResellerList
                    resellers={resellers}
                    onResellerSelect={handleResellerSelect}
                    selectedReseller={selectedReseller}
                />
            </div>
        </section>
    );
}
