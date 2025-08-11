'use client';

import { useState, useEffect } from 'react';
import { ResellerHero, ResellerSearch, ResellerResults } from './components';
import axios from 'axios';
import { TIMEOUTS } from '@/constants/timeouts';

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

    // Fetch resellers from API
    useEffect(() => {
        const fetchResellers = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/user/resellers`, {
                    timeout: TIMEOUTS.GEOCODING_REQUEST,
                });

                if (response.status === 200) {
                    setResellers(response.data);
                } else {
                    throw new Error('Failed to fetch resellers');
                }
            } catch {
                setError('Failed to load resellers. Please try again later.');
                
                // Fallback to mock data when API fails
                setResellers([
                    {
                        id: 1,
                        name: '4THITEK Audio Center Nguyen Hue',
                        address: '123 Nguyen Hue, Ben Nghe Ward',
                        city: 'Ho Chi Minh City',
                        district: 'District 1',
                        phone: '028 3822 1234',
                        email: 'nguyen.hue@4tstore.com'
                    },
                    {
                        id: 2,
                        name: '4THITEK Pro Audio Le Loi',
                        address: '456 Le Loi, Ben Thanh Ward',
                        city: 'Ho Chi Minh City',
                        district: 'District 1',
                        phone: '028 3829 5678',
                        email: 'le.loi@4tstore.com'
                    },
                    {
                        id: 3,
                        name: '4THITEK Tech Vo Van Tan',
                        address: '789 Vo Van Tan, Ward 6',
                        city: 'Ho Chi Minh City',
                        district: 'District 3',
                        phone: '028 3930 9012',
                        email: 'vo.van.tan@4tstore.com'
                    },
                    {
                        id: 4,
                        name: '4THITEK Digital Cau Giay',
                        address: '321 Cau Giay, Dich Vong Ward',
                        city: 'Hanoi',
                        district: 'Cau Giay District',
                        phone: '024 3756 4321',
                        email: 'cau.giay@4tstore.com'
                    },
                    {
                        id: 5,
                        name: '4THITEK Store Hai Ba Trung',
                        address: '654 Ba Trieu, Le Dai Hanh Ward',
                        city: 'Hanoi',
                        district: 'Hai Ba Trung District',
                        phone: '024 3974 8765',
                        email: 'hai.ba.trung@4tstore.com'
                    }
                ]);
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

            {/* Results Section */}
            <div className="ml-16 sm:ml-20 pl-1 sm:pl-2 md:pl-2 lg:pl-3 xl:pl-4 2xl:pl-6 pr-1 sm:pr-2 md:pr-2 lg:pr-3 xl:pr-4 2xl:pl-6">
                <ResellerResults 
                    searchFilters={searchFilters} 
                    mockResellers={resellers}
                    loading={loading}
                    error={error}
                />
            </div>
        </div>
    );
}
