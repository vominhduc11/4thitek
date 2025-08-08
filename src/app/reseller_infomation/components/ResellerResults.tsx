'use client';

import { useState, useEffect, useMemo } from 'react';
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
    hours: string;
    rating: number;
    distance: string;
    specialties: string[];
    coordinates: {
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
}

export default function ResellerResults({ searchFilters }: ResellerResultsProps) {
    const { t } = useLanguage();
    const [resellers, setResellers] = useState<Reseller[]>([]);
    const [selectedReseller, setSelectedReseller] = useState<Reseller | undefined>();
    const [loading, setLoading] = useState(false);

    // Mock data for demonstration
    const mockResellers: Reseller[] = useMemo(
        () => [
            {
                id: 1,
                name: '4THITEK Audio Center Nguyen Hue',
                address: '123 Nguyen Hue, Ben Nghe Ward',
                city: 'Ho Chi Minh City',
                district: 'District 1',
                phone: '028 3822 1234',
                email: 'nguyen.hue@4tstore.com',
                hours: '8:00 - 22:00 (Mon - Sun)',
                rating: 4.8,
                distance: '0.5 km',
                specialties: ['Bluetooth Headsets', 'Motorcycle Intercom', 'Audio Accessories'],
                coordinates: { lat: 10.7769, lng: 106.7009 }
            },
            {
                id: 2,
                name: '4THITEK Pro Audio Le Loi',
                address: '456 Le Loi, Ben Thanh Ward',
                city: 'Ho Chi Minh City',
                district: 'District 1',
                phone: '028 3829 5678',
                email: 'le.loi@4tstore.com',
                hours: '9:00 - 21:00 (Mon - Sun)',
                rating: 4.6,
                distance: '0.8 km',
                specialties: ['Professional Audio', 'Accessories', 'Warranty Service'],
                coordinates: { lat: 10.7756, lng: 106.7019 }
            },
            {
                id: 3,
                name: '4THITEK Tech Vo Van Tan',
                address: '789 Vo Van Tan, Ward 6',
                city: 'Ho Chi Minh City',
                district: 'District 3',
                phone: '028 3930 9012',
                email: 'vo.van.tan@4tstore.com',
                hours: '8:30 - 21:30 (Mon - Sun)',
                rating: 4.7,
                distance: '1.2 km',
                specialties: ['Motorcycle Communication', 'Installation Service', 'Technical Consulting'],
                coordinates: { lat: 10.7829, lng: 106.6934 }
            },
            {
                id: 4,
                name: '4THITEK Digital Cau Giay',
                address: '321 Cau Giay, Dich Vong Ward',
                city: 'Hanoi',
                district: 'Cau Giay District',
                phone: '024 3756 4321',
                email: 'cau.giay@4tstore.com',
                hours: '8:00 - 21:00 (Mon - Sun)',
                rating: 4.5,
                distance: '2.1 km',
                specialties: ['Wireless Audio', 'Bluetooth Devices', 'Corporate Solutions'],
                coordinates: { lat: 21.0285, lng: 105.8542 }
            },
            {
                id: 5,
                name: '4THITEK Store Hai Ba Trung',
                address: '654 Ba Trieu, Le Dai Hanh Ward',
                city: 'Hanoi',
                district: 'Hai Ba Trung District',
                phone: '024 3974 8765',
                email: 'hai.ba.trung@4tstore.com',
                hours: '9:00 - 20:00 (Mon - Sun)',
                rating: 4.4,
                distance: '1.8 km',
                specialties: ['Audio Equipment', 'Sound Systems', 'Office Solutions'],
                coordinates: { lat: 21.0167, lng: 105.8621 }
            }
        ],
        []
    );

    useEffect(() => {
        // Simulate API call
        setLoading(true);
        setTimeout(() => {
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

            setResellers(filteredResellers);
            setSelectedReseller(undefined);
            setLoading(false);
        }, 1000);
    }, [searchFilters, mockResellers]);

    const handleResellerSelect = (reseller: Reseller) => {
        setSelectedReseller(reseller);
    };

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
