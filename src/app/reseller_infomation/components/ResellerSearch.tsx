'use client';

import { useState, useEffect, useRef } from 'react';
import { FiSearch, FiMapPin, FiChevronDown } from 'react-icons/fi';
import { useLanguage } from '@/context/LanguageContext';
import { motion } from 'framer-motion';

interface Reseller {
    id: number;
    name: string;
    address: string;
    city: string;
    district: string;
    phone: string;
    email: string;
}

// Function to extract unique locations from reseller data
const extractLocationsFromResellers = (resellers: Reseller[]) => {
    const cities = [...new Set(resellers.map(reseller => reseller.city))].sort();
    
    const districts: { [key: string]: string[] } = {};
    resellers.forEach(reseller => {
        if (!districts[reseller.city]) {
            districts[reseller.city] = [];
        }
        if (!districts[reseller.city].includes(reseller.district)) {
            districts[reseller.city].push(reseller.district);
        }
    });
    
    // Sort districts for each city
    Object.keys(districts).forEach(city => {
        districts[city] = districts[city].sort();
    });
    
    return { cities, districts };
};

export default function ResellerSearch({
    onSearch,
    resellers = []
}: {
    onSearch: (filters: { city: string; district: string; address: string }) => void;
    resellers?: Reseller[];
}) {
    const { t } = useLanguage();
    const [searchFilters, setSearchFilters] = useState({
        city: '',
        district: '',
        address: ''
    });

    // Dropdown states
    const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
    const [isDistrictDropdownOpen, setIsDistrictDropdownOpen] = useState(false);
    const cityDropdownRef = useRef<HTMLDivElement>(null);
    const districtDropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
                setIsCityDropdownOpen(false);
            }
            if (districtDropdownRef.current && !districtDropdownRef.current.contains(event.target as Node)) {
                setIsDistrictDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Extract dynamic location data from resellers
    const { cities, districts } = extractLocationsFromResellers(resellers);

    const handleInputChange = (field: string, value: string) => {
        const newFilters = { ...searchFilters, [field]: value };
        if (field === 'city') {
            newFilters.district = ''; // Reset district when city changes
            setIsDistrictDropdownOpen(false);
        }
        setSearchFilters(newFilters);
    };

    const getSelectedCity = () => {
        return cities.find((city) => city === searchFilters.city);
    };

    const getSelectedDistrict = () => {
        if (!searchFilters.city || !searchFilters.district) return null;
        const cityDistricts = districts[searchFilters.city as keyof typeof districts];
        return cityDistricts?.find((district) => district === searchFilters.district);
    };

    const getAvailableDistricts = () => {
        if (!searchFilters.city) return [];
        return districts[searchFilters.city as keyof typeof districts] || [];
    };

    const handleSearch = () => {
        onSearch(searchFilters);
    };

    return (
        <section className="bg-[#0c131d] text-white pt-8 pb-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-6 text-white text-center">
                    {t('reseller.title')}
                </h1>
                <p className="text-base sm:text-lg text-gray-300 leading-relaxed mb-8 text-center max-w-3xl mx-auto">
                    {t('reseller.subtitle')}
                </p>

                {/* Search Form */}
                <div className="bg-[#1a2332] rounded-lg p-4 sm:p-6 mb-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                            {/* City Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    <FiMapPin className="inline w-4 h-4 mr-1" />
                                    {t('reseller.city')}
                                </label>
                                <div ref={cityDropdownRef} className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                                        className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-[#0c131d] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#00d4ff] transition-all duration-300"
                                        suppressHydrationWarning
                                    >
                                        <div className="flex items-center gap-2">
                                            <FiMapPin className="w-4 h-4 text-gray-400" />
                                            <span className={searchFilters.city ? 'text-white' : 'text-gray-400'}>
                                                {getSelectedCity() || t('reseller.selectCity')}
                                            </span>
                                        </div>
                                        <FiChevronDown
                                            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isCityDropdownOpen ? 'rotate-180' : ''}`}
                                        />
                                    </button>

                                    {isCityDropdownOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute top-full left-0 right-0 mt-1 bg-[#0c131d] border border-gray-600 rounded-lg shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto"
                                        >
                                            {cities.map((city) => {
                                                const isSelected = searchFilters.city === city;
                                                return (
                                                    <button
                                                        key={city}
                                                        type="button"
                                                        onClick={() => {
                                                            handleInputChange('city', city);
                                                            setIsCityDropdownOpen(false);
                                                        }}
                                                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200 ${
                                                            isSelected
                                                                ? 'bg-[#00d4ff]/20 text-[#00d4ff] border-l-2 border-[#00d4ff]'
                                                                : 'text-white hover:bg-gray-700/50 hover:text-[#00d4ff]'
                                                        }`}
                                                    >
                                                        <FiMapPin
                                                            className={`w-4 h-4 ${
                                                                isSelected ? 'text-[#00d4ff]' : 'text-gray-400'
                                                            }`}
                                                        />
                                                        <span>{city}</span>
                                                        {isSelected && (
                                                            <motion.div
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                className="ml-auto w-2 h-2 bg-[#00d4ff] rounded-full"
                                                            />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            {/* District Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    {t('reseller.district')}
                                </label>
                                <div ref={districtDropdownRef} className="relative">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            searchFilters.city && setIsDistrictDropdownOpen(!isDistrictDropdownOpen)
                                        }
                                        disabled={!searchFilters.city}
                                        className={`w-full flex items-center justify-between gap-2 px-4 py-3 bg-[#0c131d] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#00d4ff] transition-all duration-300 ${
                                            !searchFilters.city ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <FiMapPin className="w-4 h-4 text-gray-400" />
                                            <span className={searchFilters.district ? 'text-white' : 'text-gray-400'}>
                                                {getSelectedDistrict() || t('reseller.selectDistrict')}
                                            </span>
                                        </div>
                                        <FiChevronDown
                                            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                                                isDistrictDropdownOpen ? 'rotate-180' : ''
                                            }`}
                                        />
                                    </button>

                                    {isDistrictDropdownOpen && searchFilters.city && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                            className="absolute top-full left-0 right-0 mt-1 bg-[#0c131d] border border-gray-600 rounded-lg shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto"
                                        >
                                            {getAvailableDistricts().map((district) => {
                                                const isSelected = searchFilters.district === district;
                                                return (
                                                    <button
                                                        key={district}
                                                        type="button"
                                                        onClick={() => {
                                                            handleInputChange('district', district);
                                                            setIsDistrictDropdownOpen(false);
                                                        }}
                                                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200 ${
                                                            isSelected
                                                                ? 'bg-[#00d4ff]/20 text-[#00d4ff] border-l-2 border-[#00d4ff]'
                                                                : 'text-white hover:bg-gray-700/50 hover:text-[#00d4ff]'
                                                        }`}
                                                    >
                                                        <FiMapPin
                                                            className={`w-4 h-4 ${
                                                                isSelected ? 'text-[#00d4ff]' : 'text-gray-400'
                                                            }`}
                                                        />
                                                        <span>{district}</span>
                                                        {isSelected && (
                                                            <motion.div
                                                                initial={{ scale: 0 }}
                                                                animate={{ scale: 1 }}
                                                                className="ml-auto w-2 h-2 bg-[#00d4ff] rounded-full"
                                                            />
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </motion.div>
                                    )}
                                </div>
                            </div>

                            {/* Address Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    {t('reseller.specificAddress')}
                                </label>
                                <input
                                    type="text"
                                    value={searchFilters.address}
                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                    placeholder={t('reseller.enterAddress')}
                                    className="w-full px-4 py-3 bg-[#0c131d] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#00d4ff] transition-colors"
                                    suppressHydrationWarning
                                />
                            </div>

                            {/* Search Button */}
                            <div className="flex items-end">
                                <button
                                    onClick={handleSearch}
                                    className="w-full bg-[#00d4ff] text-[#0c131d] py-3 px-6 rounded-lg font-semibold hover:bg-[#00b8e6] transition-colors duration-300 flex items-center justify-center space-x-2"
                                    suppressHydrationWarning
                                >
                                    <FiSearch className="w-5 h-5" />
                                    <span>{t('reseller.search')}</span>
                                </button>
                            </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
