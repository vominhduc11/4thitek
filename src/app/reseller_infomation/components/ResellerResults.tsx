'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import ResellerList from './ResellerList';
import ResellerMap from './ResellerMap';

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

// Geocoding function to convert address to coordinates
const geocodeAddress = async (fullAddress: string): Promise<{ lat: number; lng: number } | null> => {
    try {
        // Add Vietnam to the address for better accuracy
        const searchQuery = `${fullAddress}, Vietnam`;
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
        );
        
        if (!response.ok) {
            throw new Error('Geocoding request failed');
        }
        
        const data = await response.json();
        
        if (data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
        }
    } catch (error) {
        console.error('Geocoding error:', error);
    }
    
    return null;
};

interface ResellerResultsProps {
    searchFilters: {
        city: string;
        district: string;
        address: string;
    };
    mockResellers: Reseller[];
    loading?: boolean;
    error?: string | null;
}

export default function ResellerResults({ searchFilters, mockResellers, loading: parentLoading, error: parentError }: ResellerResultsProps) {
    const { t } = useLanguage();
    const [resellers, setResellers] = useState<Reseller[]>([]);
    const [selectedReseller, setSelectedReseller] = useState<Reseller | undefined>();
    const [loading, setLoading] = useState(false);


    useEffect(() => {
        const processResellers = async () => {
            setLoading(true);
            
            try {
                // Simulate API call delay
                await new Promise(resolve => setTimeout(resolve, 500));
                
                let filteredResellers = mockResellers;

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

                // Geocode addresses to get coordinates
                const resellersWithCoordinates = await Promise.all(
                    filteredResellers.map(async (reseller) => {
                        // Skip if coordinates already exist
                        if (reseller.coordinates) {
                            return reseller;
                        }

                        // Create full address string
                        const fullAddress = `${reseller.address}, ${reseller.district}, ${reseller.city}`;
                        
                        // Add delay between requests to respect rate limiting (1 request per second for Nominatim)
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                        const coordinates = await geocodeAddress(fullAddress);
                        
                        return {
                            ...reseller,
                            coordinates: coordinates || { lat: 10.762622, lng: 106.660172 } // Default to Ho Chi Minh City center if geocoding fails
                        };
                    })
                );

                setResellers(resellersWithCoordinates);
                setSelectedReseller(undefined);
            } catch (error) {
                console.error('Error processing resellers:', error);
                setResellers([]);
            } finally {
                setLoading(false);
            }
        };

        processResellers();
    }, [searchFilters, mockResellers]);

    const handleResellerSelect = (reseller: Reseller) => {
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
        return (
            <section className="bg-[#0c131d] text-white py-8">
                <div className="w-full">
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                        {/* Loading for List */}
                        <div className="lg:col-span-3">
                            <div className="bg-[#1a2332] rounded-lg p-8">
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00d4ff]"></div>
                                    <span className="ml-4 text-lg">{t('reseller.searchingDealers')}</span>
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
