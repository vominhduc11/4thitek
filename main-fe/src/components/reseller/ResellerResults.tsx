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
            <section className="bg-[#0c131d] py-8 text-white">
                <div className="w-full">
                    <div className="space-y-4">
                        <CardSkeleton height={150} backgroundColor="#1e293b" foregroundColor="#334155" />
                        <CardSkeleton height={150} backgroundColor="#1e293b" foregroundColor="#334155" />
                        <CardSkeleton height={150} backgroundColor="#1e293b" foregroundColor="#334155" />
                        <CardSkeleton height={150} backgroundColor="#1e293b" foregroundColor="#334155" />
                    </div>
                </div>
            </section>
        );
    }

    if (parentError && initialResellers.length === 0) {
        const errorMessage = parentError ? t(parentError) : '';

        return (
            <motion.section
                className="flex min-h-[400px] items-center justify-center bg-[#0c131d] py-8 text-white"
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
                    <div className="rounded-lg border border-red-500/30 bg-[#1e293b] p-8 text-center">
                        <div className="mb-4 text-5xl text-red-500">⚠️</div>
                        <h3 className="mb-2 text-lg font-semibold text-red-400">{t('errors.reseller.errorTitle')}</h3>
                        <p className="mb-4 text-gray-300">{errorMessage}</p>
                        <p className="text-sm text-gray-400">{t('errors.general.serverError')}</p>
                    </div>
                </motion.div>
            </motion.section>
        );
    }

    return (
        <section className="bg-[#0c131d] py-8 text-white">
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
