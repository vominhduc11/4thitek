'use client';

import { useState, useEffect } from 'react';
import { ResellerHero, ResellerSearch, ResellerResults } from './components';
import { apiService } from '@/services/apiService';

interface Reseller {
    id: number;
    name: string;
    address: string;
    city: string;
    district: string;
    phone: string;
    email: string;
}

interface ApiDealer {
    accountId: number;
    companyName: string;
    address: string;
    phone: string;
    email: string;
    district: string;
    city: string;
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
        },
        {
            id: 2,
            name: '4THITEK Pro Audio Le Loi',
            address: '456 Le Loi, Ben Thanh Ward',
            city: 'Ho Chi Minh City',
            district: 'District 1',
            phone: '028 3829 5678',
            email: 'le.loi@4tstore.com',
        },
        {
            id: 3,
            name: '4THITEK Tech Vo Van Tan',
            address: '789 Vo Van Tan, Ward 6',
            city: 'Ho Chi Minh City',
            district: 'District 3',
            phone: '028 3930 9012',
            email: 'vo.van.tan@4tstore.com',
        },
        {
            id: 4,
            name: '4THITEK Digital Cau Giay',
            address: '321 Cau Giay, Dich Vong Ward',
            city: 'Hanoi',
            district: 'Cau Giay District',
            phone: '024 3756 4321',
            email: 'cau.giay@4tstore.com',
        },
        {
            id: 5,
            name: '4THITEK Store Hai Ba Trung',
            address: '654 Ba Trieu, Le Dai Hanh Ward',
            city: 'Hanoi',
            district: 'Hai Ba Trung District',
            phone: '024 3974 8765',
            email: 'hai.ba.trung@4tstore.com',
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
                    
                    // Debug: Log the response structure
                    console.log('=== API RESPONSE DEBUG ===');
                    console.log('Full response:', response);
                    console.log('Response data:', response.data);
                    console.log('Response type:', typeof response.data);
                    console.log('Is array:', Array.isArray(response.data));
                    console.log('Data keys:', response.data ? Object.keys(response.data) : 'No data');
                    console.log('==========================')
                    
                    // Ensure response.data is an array
                    let dealersArray = response.data;

                    // Handle different response structures
                    if (!Array.isArray(dealersArray)) {
                        // If response.data has a property containing the array
                        if ((dealersArray as { dealers?: unknown }).dealers && Array.isArray((dealersArray as { dealers: unknown[] }).dealers)) {
                            dealersArray = (dealersArray as { dealers: unknown[] }).dealers as ApiDealer[];
                        } else if ((dealersArray as { data?: unknown }).data && Array.isArray((dealersArray as { data: unknown[] }).data)) {
                            dealersArray = (dealersArray as { data: unknown[] }).data as ApiDealer[];
                        } else if ((dealersArray as { items?: unknown }).items && Array.isArray((dealersArray as { items: unknown[] }).items)) {
                            dealersArray = (dealersArray as { items: unknown[] }).items as ApiDealer[];
                        } else {
                            console.error('Invalid response structure:', dealersArray);
                            throw new Error('Response data is not in expected format');
                        }
                    }
                    
                    // Convert API response to local Reseller format
                    const convertedResellers = dealersArray.map((dealer, index) => {
                        console.log(`Processing dealer ${index}:`, dealer);
                        const typedDealer = dealer as ApiDealer;

                        return {
                            id: typedDealer.accountId || (index + 1),
                            name: typedDealer.companyName || `Dealer ${index + 1}`,
                            address: typedDealer.address || '',
                            city: typedDealer.city || '',
                            district: typedDealer.district || '',
                            phone: typedDealer.phone || '',
                            email: typedDealer.email || ''
                        };
                    });

                    setResellers(convertedResellers);
                } else {
                    throw new Error(response.error || 'Failed to fetch resellers');
                }
            } catch (fetchError) {
                console.error('Error fetching resellers:', fetchError);
                setConnectionStatus('disconnected');
                
                // More specific error messages based on error type
                if (fetchError instanceof Error) {
                    if (fetchError.message.includes('fetch') || fetchError.message.includes('ERR_CONNECTION_REFUSED')) {
                        setError('Cannot connect to server. Showing cached information.');
                    } else if (fetchError.message.includes('timeout')) {
                        setError('Request timed out. Showing cached information.');
                    } else if (fetchError.message.includes('404')) {
                        setError('API endpoint not found. Please check server configuration.');
                    } else if (fetchError.message.includes('500')) {
                        setError('Server error occurred. Showing cached information.');
                    } else if (fetchError.message.includes('API returned unsuccessful response')) {
                        setError('Server returned error response. Showing cached information.');
                    } else if (fetchError.message.includes('Response data is not in expected format')) {
                        setError('Server response format changed. Please update application.');
                    } else {
                        setError(`Unable to load dealers: ${fetchError.message}. Showing cached information.`);
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

            {/* Status Indicators */}
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
            <div className="ml-16 sm:ml-20 pl-1 sm:pl-2 md:pl-2 lg:pl-3 xl:pl-4 2xl:pl-6 pr-1 sm:pr-2 md:pr-2 lg:pr-3 xl:pr-4 2xl:pr-6">
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
