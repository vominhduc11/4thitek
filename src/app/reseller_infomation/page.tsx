'use client';

import { useState } from 'react';
import { ResellerHero, ResellerSearch, ResellerResults } from './components';
import AvoidSidebar from '@/components/layout/AvoidSidebar';

export default function ResellerInformationPage() {
    const [searchFilters, setSearchFilters] = useState({
        city: '',
        district: '',
        address: ''
    });

    const handleSearch = (filters: { city: string; district: string; address: string }) => {
        setSearchFilters(filters);
    };

    return (
        <div className="min-h-screen bg-[#0c131d] text-white flex flex-col">
            {/* Hero Section with Breadcrumb */}
            <ResellerHero />

            {/* Search Section */}
            <div className="ml-16 sm:ml-20 px-4 sm:px-12 md:px-16 lg:px-20">
                <ResellerSearch onSearch={handleSearch} />
            </div>

            {/* Results Section */}
            <div className="ml-16 sm:ml-20 px-4 sm:px-12 md:px-16 lg:px-20">
                <ResellerResults searchFilters={searchFilters} />
            </div>
        </div>
    );
}
