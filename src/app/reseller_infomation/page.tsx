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

            <AvoidSidebar>
                {/* Search Section */}
                <ResellerSearch onSearch={handleSearch} />

                {/* Results Section */}
                <ResellerResults searchFilters={searchFilters} />
            </AvoidSidebar>
        </div>
    );
}
