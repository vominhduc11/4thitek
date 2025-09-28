'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import ResellerList from './ResellerList';

interface Reseller {
    id: number;
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
        const sortedResellers = filteredResellers.sort((a, b) => a.name.localeCompare(b.name));

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
                    <div className="bg-[#1a2332] rounded-lg p-8">
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00d4ff]"></div>
                            <span className="ml-4 text-lg">{t('reseller.loadingDealers')}</span>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    // Show error state if API failed
    if (parentError) {
        return (
            <section className="bg-[#0c131d] text-white py-8">
                <div className="w-full">
                    <div className="bg-red-900/20 border border-red-600 rounded-lg p-6 text-center">
                        <h3 className="text-lg font-semibold text-red-400 mb-2">
                            {t('reseller.errorTitle') || 'Error Loading Resellers'}
                        </h3>
                        <p className="text-red-300 mb-4">
                            {parentError}
                        </p>
                        <p className="text-sm text-gray-400">
                            {t('reseller.fallbackMessage') || 'Showing fallback data instead.'}
                        </p>
                    </div>
                </div>
            </section>
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
