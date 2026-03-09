'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import ResellerList from './ResellerList';
import { CardSkeleton } from '@/components/ui/SkeletonLoader';

interface Reseller {
    id: string | number;
    name: string;
    address: string;
    city: string;
    district: string;
    phone: string;
    email: string;
}


interface ResellerResultsProps {
    searchFilters: {
        city: string;
        district: string;
        address: string;
    };
    resellers: Reseller[];
    loading?: boolean;
    error?: string | null;
}

export default function ResellerResults({ searchFilters, resellers: initialResellers, loading: parentLoading, error: parentError }: ResellerResultsProps) {
    const { t } = useLanguage();
    const [resellers, setResellers] = useState<Reseller[]>([]);
    const [selectedReseller, setSelectedReseller] = useState<Reseller | undefined>();


    useEffect(() => {
        let filteredResellers = initialResellers;

        // Filter by city
        if (searchFilters.city) {
            filteredResellers = filteredResellers.filter((reseller) => reseller.city === searchFilters.city);
        }

        // Filter by district
        if (searchFilters.district) {
            filteredResellers = filteredResellers.filter(
                (reseller) => reseller.district === searchFilters.district
            );
        }

        // Filter by address (simple text search)
        if (searchFilters.address) {
            filteredResellers = filteredResellers.filter((reseller) =>
                reseller.address.toLowerCase().includes(searchFilters.address.toLowerCase())
            );
        }

        // Sort by name for consistent ordering
        const sortedResellers = [...filteredResellers].sort((a, b) => a.name.localeCompare(b.name));

        setResellers(sortedResellers);
        setSelectedReseller(undefined);
    }, [searchFilters, initialResellers]);

    const handleResellerSelect = (reseller: Reseller) => {
        setSelectedReseller(reseller);
    };

    // Show parent loading state when initially loading data from API
    if (parentLoading) {
        return (
            <section className="bg-[#0c131d] text-white py-8">
                <div className="w-full">
                    {/* Loading skeleton that matches the actual layout */}
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

    // Show error state if API failed
    if (parentError && initialResellers.length === 0) {
        const errorMessage = parentError ? t(parentError) : '';
        return (
            <motion.section
                className="bg-[#0c131d] text-white py-8 flex items-center justify-center min-h-[400px]"
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
                    <div className="bg-[#1e293b] rounded-lg border border-red-500/30 p-8 text-center">
                        <div className="text-red-500 text-5xl mb-4">⚠️</div>
                        <h3 className="text-lg font-semibold text-red-400 mb-2">
                            {t('errors.reseller.errorTitle')}
                        </h3>
                        <p className="text-gray-300 mb-4">
                            {errorMessage}
                        </p>
                        <p className="text-sm text-gray-400">
                            {t('errors.general.serverError')}
                        </p>
                    </div>
                </motion.div>
            </motion.section>
        );
    }

    return (
        <section className="bg-[#0c131d] text-white py-8">
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
