'use client';

import { useState, useEffect } from 'react';
import { ResellerHero, ResellerSearch, ResellerResults } from './components';
import { apiService } from '@/services/apiService';
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

export default function ResellerInformationPage() {
    const [searchFilters, setSearchFilters] = useState({
        city: '',
        district: '',
        address: ''
    });

    const [resellers, setResellers] = useState<Reseller[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

    // Fallback mock data - moved inside useEffect to avoid dependency warning
    const getMockResellers = (): Reseller[] => [
        {
            id: 1,
            name: '4THITEK Audio Center Nguyen Hue',
            address: '123 Nguyen Hue, Ben Nghe Ward',
            city: 'Ho Chi Minh City',
            district: 'District 1',
            phone: '028 3822 1234',
            email: 'nguyen.hue@4tstore.com',
            coordinates: { lat: 10.774208, lng: 106.701736 }
        },
        {
            id: 2,
            name: '4THITEK Pro Audio Le Loi',
            address: '456 Le Loi, Ben Thanh Ward',
            city: 'Ho Chi Minh City',
            district: 'District 1',
            phone: '028 3829 5678',
            email: 'le.loi@4tstore.com',
            coordinates: { lat: 10.772461, lng: 106.698055 }
        },
        {
            id: 3,
            name: '4THITEK Tech Vo Van Tan',
            address: '789 Vo Van Tan, Ward 6',
            city: 'Ho Chi Minh City',
            district: 'District 3',
            phone: '028 3930 9012',
            email: 'vo.van.tan@4tstore.com',
            coordinates: { lat: 10.786049, lng: 106.691943 }
        },
        {
            id: 4,
            name: '4THITEK Digital Cau Giay',
            address: '321 Cau Giay, Dich Vong Ward',
            city: 'Hanoi',
            district: 'Cau Giay District',
            phone: '024 3756 4321',
            email: 'cau.giay@4tstore.com',
            coordinates: { lat: 21.034234, lng: 105.791107 }
        },
        {
            id: 5,
            name: '4THITEK Store Hai Ba Trung',
            address: '654 Ba Trieu, Le Dai Hanh Ward',
            city: 'Hanoi',
            district: 'Hai Ba Trung District',
            phone: '024 3974 8765',
            email: 'hai.ba.trung@4tstore.com',
            coordinates: { lat: 21.014682, lng: 105.842117 }
        }
    ];

    // Fetch resellers from API with improved error handling
    useEffect(() => {
        const fetchResellers = async () => {
            try {
                setLoading(true);
                setError(null);
                setConnectionStatus('checking');
                
                // Fetch resellers directly with retry logic
                const response = await apiService.fetchResellers();
                
                if (response.success && response.data) {
                    setConnectionStatus('connected');
                    
                    // Convert ResellerLocation to local Reseller format
                    const convertedResellers = response.data.map(location => ({
                        id: parseInt(location.id) || 0,
                        name: location.name,
                        address: location.address?.street || '',
                        city: location.address?.city || '',
                        district: location.address?.street || '',
                        phone: location.contactInfo?.phone || '',
                        email: location.contactInfo?.email || '',
                        coordinates: location.coordinates || { lat: 10.762622, lng: 106.660172 }
                    }));
                    
                    setResellers(convertedResellers);
                } else {
                    throw new Error(response.error || 'Failed to fetch resellers');
                }
            } catch (fetchError) {
                console.error('Error fetching resellers:', fetchError);
                setConnectionStatus('disconnected');
                
                // More specific error messages based on error type
                if (fetchError instanceof Error) {
                    if (fetchError.message.includes('fetch')) {
                        setError('Network connection failed. Showing cached information.');
                    } else if (fetchError.message.includes('timeout')) {
                        setError('Request timed out. Showing cached information.');
                    } else {
                        setError('Unable to load latest reseller data. Showing cached information.');
                    }
                } else {
                    setError('An unexpected error occurred. Showing cached information.');
                }
                
                setResellers(getMockResellers());
            } finally {
                setLoading(false);
            }
        };

        fetchResellers();
        
        // Clean up expired geocoding cache on mount
        geocodingService.clearExpiredCache();
    }, []);

    const handleSearch = (filters: { city: string; district: string; address: string }) => {
        setSearchFilters(filters);
    };

    return (
        <div className="min-h-screen bg-[#0c131d] text-white flex flex-col">
            {/* Hero Section with Breadcrumb */}
            <ResellerHero />

            {/* Search Section */}
            <div className="ml-16 sm:ml-20 pl-1 sm:pl-2 md:pl-2 lg:pl-3 xl:pl-4 2xl:pl-6 pr-1 sm:pr-2 md:pr-2 lg:pr-3 xl:pr-4 2xl:pr-6">
                <ResellerSearch onSearch={handleSearch} resellers={resellers} />
            </div>

            {/* Connection Status Indicator */}
            {connectionStatus !== 'connected' && !loading && (
                <div className="ml-16 sm:ml-20 pl-1 sm:pl-2 md:pl-2 lg:pl-3 xl:pl-4 2xl:pl-6 pr-1 sm:pr-2 md:pr-2 lg:pr-3 xl:pr-4 2xl:pr-6 pb-4">
                    <div className={`rounded-lg p-3 text-sm flex items-center gap-3 ${
                        connectionStatus === 'disconnected' 
                            ? 'bg-yellow-900/20 border border-yellow-600 text-yellow-300'
                            : 'bg-gray-700/20 border border-gray-600 text-gray-300'
                    }`}>
                        <div className={`w-2 h-2 rounded-full ${
                            connectionStatus === 'disconnected' ? 'bg-yellow-500' : 'bg-gray-500'
                        }`}></div>
                        <span>
                            {connectionStatus === 'disconnected' 
                                ? 'Using cached data - API temporarily unavailable'
                                : 'Checking connection...'
                            }
                        </span>
                    </div>
                </div>
            )}

            {/* Results Section */}
            <div className="ml-16 sm:ml-20 pl-1 sm:pl-2 md:pl-2 lg:pl-3 xl:pl-4 2xl:pl-6 pr-1 sm:pr-2 md:pr-2 lg:pr-3 xl:pr-4 2xl:pl-6">
                <ResellerResults 
                    searchFilters={searchFilters} 
                    resellers={resellers}
                    loading={loading}
                    error={error}
                />
            </div>
        </div>
    );
}
