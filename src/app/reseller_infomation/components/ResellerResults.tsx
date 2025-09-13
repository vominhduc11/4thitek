'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import ResellerList from './ResellerList';
import ResellerMap from './ResellerMap';
import { geocodingService } from '@/services/geocodingService';

interface Reseller {
    id: number;
    name: string;
    address: string;
    city: string;
    district: string;
    phone: string;
    email: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
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
    const [loading, setLoading] = useState(false);
    const [geocodingProgress, setGeocodingProgress] = useState({ current: 0, total: 0 });


    useEffect(() => {
        const processResellers = async () => {
            setLoading(true);
            setGeocodingProgress({ current: 0, total: 0 });
            
            let filteredResellers = initialResellers;
            
            try {

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

                // Separate resellers that need geocoding from those that already have coordinates
                const resellersWithCoords = filteredResellers.filter(r => r.coordinates);
                const resellersNeedingGeocode = filteredResellers.filter(r => !r.coordinates);
                
                if (resellersNeedingGeocode.length === 0) {
                    // All resellers already have coordinates
                    setResellers(filteredResellers);
                    setSelectedReseller(undefined);
                    setLoading(false);
                    return;
                }

                // Set up progress tracking
                setGeocodingProgress({ 
                    current: 0, 
                    total: resellersNeedingGeocode.length 
                });

                // Prepare addresses for batch geocoding
                const addresses = resellersNeedingGeocode.map(reseller => 
                    `${reseller.address}, ${reseller.district}, ${reseller.city}`
                );

                // Batch geocode addresses
                const coordinates = await geocodingService.geocodeAddresses(addresses);

                // Combine results
                const geocodedResellers = resellersNeedingGeocode.map((reseller, index) => ({
                    ...reseller,
                    coordinates: coordinates[index] || { lat: 10.762622, lng: 106.660172 }
                }));

                // Combine all resellers and sort by name for consistent ordering
                const allResellers = [...resellersWithCoords, ...geocodedResellers]
                    .sort((a, b) => a.name.localeCompare(b.name));

                setResellers(allResellers);
                setSelectedReseller(undefined);
                setGeocodingProgress({ current: coordinates.length, total: coordinates.length });
                
            } catch (error) {
                console.error('Error processing resellers:', error);
                // In case of geocoding error, still show resellers with fallback coordinates
                const fallbackResellers = filteredResellers.map(reseller => ({
                    ...reseller,
                    coordinates: reseller.coordinates || { lat: 10.762622, lng: 106.660172 }
                }));
                setResellers(fallbackResellers);
                setSelectedReseller(undefined);
                
                // Show user-friendly error message
                console.warn('Some locations may not be accurately displayed due to geocoding issues');
            } finally {
                setLoading(false);
            }
        };

        processResellers();
    }, [searchFilters, initialResellers]);

    const handleResellerSelect = (reseller: Reseller) => {
        console.log('✅ Setting selected dealer:', reseller.name, 'Coordinates:', reseller.coordinates);
        setSelectedReseller(reseller);
    };

    // Show parent loading state when initially loading data from API
    if (parentLoading) {
        return (
            <section className="bg-[#0c131d] text-white py-8">
                <div className="w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* Loading for List */}
                        <div className="lg:col-span-3">
                            <div className="bg-[#1a2332] rounded-lg p-8">
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00d4ff]"></div>
                                    <span className="ml-4 text-lg">{t('reseller.loadingDealers')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Loading for Map */}
                        <div className="lg:col-span-2">
                            <div className="bg-[#1a2332] rounded-lg p-8 h-[600px] lg:h-[700px] flex items-center justify-center">
                                <div className="text-center">
                                    <div className="animate-pulse bg-gray-600 rounded-lg w-full h-32 mb-4"></div>
                                    <span className="text-gray-400">{t('reseller.loadingMap')}</span>
                                </div>
                            </div>
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

    // Show processing loading when filtering/geocoding
    if (loading) {
        const progressPercentage = geocodingProgress.total > 0 
            ? Math.round((geocodingProgress.current / geocodingProgress.total) * 100)
            : 0;

        return (
            <section className="bg-[#0c131d] text-white py-8">
                <div className="w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* Loading for List */}
                        <div className="lg:col-span-3">
                            <div className="bg-[#1a2332] rounded-lg p-8">
                                <div className="flex flex-col items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00d4ff] mb-4"></div>
                                    <span className="text-lg mb-2">
                                        {geocodingProgress.total > 0 ? t('reseller.processingLocations') : t('reseller.searchingDealers')}
                                    </span>
                                    {geocodingProgress.total > 0 && (
                                        <div className="w-full max-w-xs">
                                            <div className="flex justify-between text-sm text-gray-400 mb-1">
                                                <span>{geocodingProgress.current} / {geocodingProgress.total}</span>
                                                <span>{progressPercentage}%</span>
                                            </div>
                                            <div className="w-full bg-gray-700 rounded-full h-2">
                                                <div 
                                                    className="bg-[#00d4ff] h-2 rounded-full transition-all duration-300" 
                                                    style={{ width: `${progressPercentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Loading for Map */}
                        <div className="lg:col-span-2">
                            <div className="bg-[#1a2332] rounded-lg p-8 h-[600px] lg:h-[700px] flex items-center justify-center">
                                <div className="text-center">
                                    <div className="animate-pulse bg-gray-600 rounded-lg w-full h-32 mb-4"></div>
                                    <span className="text-gray-400">{t('reseller.loadingMap')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="bg-[#0c131d] text-white py-8">
            <div className="w-full">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Left Side - Reseller List (3/5 width) */}
                    <div className="lg:col-span-3">
                        <ResellerList
                            resellers={resellers}
                            onResellerSelect={handleResellerSelect}
                            selectedReseller={selectedReseller}
                        />
                    </div>

                    {/* Right Side - Map (2/5 width) */}
                    <div className="lg:col-span-2">
                        <div className="sticky top-8">
                            <ResellerMap resellers={resellers} selectedReseller={selectedReseller} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
