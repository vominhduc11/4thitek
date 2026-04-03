'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FiChevronDown, FiMapPin, FiSearch } from 'react-icons/fi';
import { useLanguage } from '@/context/LanguageContext';
import type { Reseller, ResellerSearchFilters } from './types';

const extractLocationsFromResellers = (resellers: Reseller[]) => {
    const normalizedResellers = resellers
        .map((reseller) => ({
            city: reseller.city?.trim(),
            district: reseller.district?.trim()
        }))
        .filter((reseller) => reseller.city);

    const cities = [...new Set(normalizedResellers.map((reseller) => reseller.city as string))].sort();

    const districts: Record<string, string[]> = {};
    normalizedResellers.forEach((reseller) => {
        if (!reseller.district) return;
        if (!districts[reseller.city as string]) {
            districts[reseller.city as string] = [];
        }
        if (!districts[reseller.city as string].includes(reseller.district)) {
            districts[reseller.city as string].push(reseller.district);
        }
    });

    Object.keys(districts).forEach((city) => {
        districts[city] = districts[city].sort();
    });

    return { cities, districts };
};

export default function ResellerSearch({
    onSearch,
    resellers = []
}: {
    onSearch: (filters: ResellerSearchFilters) => void;
    resellers?: Reseller[];
}) {
    const { t } = useLanguage();
    const [searchFilters, setSearchFilters] = useState<ResellerSearchFilters>({
        city: '',
        district: '',
        address: ''
    });
    const [isCityDropdownOpen, setIsCityDropdownOpen] = useState(false);
    const [isDistrictDropdownOpen, setIsDistrictDropdownOpen] = useState(false);
    const cityDropdownRef = useRef<HTMLDivElement>(null);
    const districtDropdownRef = useRef<HTMLDivElement>(null);

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

    const { cities, districts } = extractLocationsFromResellers(resellers);

    const handleInputChange = (field: keyof ResellerSearchFilters, value: string) => {
        const nextFilters = { ...searchFilters, [field]: value };
        if (field === 'city') {
            nextFilters.district = '';
            setIsDistrictDropdownOpen(false);
        }
        setSearchFilters(nextFilters);
    };

    const getSelectedCity = () => cities.find((city) => city === searchFilters.city);

    const getSelectedDistrict = () => {
        if (!searchFilters.city || !searchFilters.district) return null;
        const cityDistricts = districts[searchFilters.city];
        return cityDistricts?.find((district) => district === searchFilters.district);
    };

    const getAvailableDistricts = () => {
        if (!searchFilters.city) return [];
        return districts[searchFilters.city] || [];
    };

    const handleSearch = () => {
        onSearch(searchFilters);
    };

    return (
        <section className="pb-8 pt-4 text-white">
            <div className="mx-auto max-w-6xl">
                <h1 className="mb-4 text-center font-serif text-3xl font-semibold text-[var(--text-primary)] sm:text-4xl md:text-5xl">
                    {t('reseller.title')}
                </h1>
                <p className="mx-auto mb-8 max-w-3xl text-center text-base leading-relaxed text-[var(--text-secondary)] sm:text-lg">
                    {t('reseller.subtitle')}
                </p>

                <div className="brand-card-muted rounded-[28px] p-4 sm:p-6">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
                                <FiMapPin className="mr-1 inline h-4 w-4" />
                                {t('reseller.city')}
                            </label>
                            <div ref={cityDropdownRef} className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsCityDropdownOpen(!isCityDropdownOpen)}
                                    className="brand-input flex w-full items-center justify-between gap-2 rounded-2xl px-4 py-3 text-white transition-all duration-300 focus:border-[var(--brand-blue)] focus:outline-none"
                                    suppressHydrationWarning
                                >
                                    <div className="flex items-center gap-2">
                                        <FiMapPin className="h-4 w-4 text-[var(--text-muted)]" />
                                        <span
                                            className={searchFilters.city ? 'text-white' : 'text-[var(--text-muted)]'}
                                        >
                                            {getSelectedCity() || t('reseller.selectCity')}
                                        </span>
                                    </div>
                                    <FiChevronDown
                                        className={`h-4 w-4 text-[var(--text-muted)] transition-transform duration-200 ${isCityDropdownOpen ? 'rotate-180' : ''}`}
                                    />
                                </button>

                                {isCityDropdownOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                        transition={{ duration: 0.2 }}
                                        className="brand-card absolute left-0 right-0 top-full z-50 mt-2 max-h-60 overflow-hidden overflow-y-auto rounded-[24px] border border-[var(--brand-border)] shadow-xl"
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
                                                    className={`flex w-full items-center gap-3 px-4 py-3 text-sm transition-all duration-200 ${
                                                        isSelected
                                                            ? 'border-l-2 border-[var(--brand-blue)] bg-[rgba(41,171,226,0.16)] text-[var(--brand-blue)]'
                                                            : 'text-white hover:bg-[rgba(41,171,226,0.08)] hover:text-[var(--brand-blue)]'
                                                    }`}
                                                >
                                                    <FiMapPin
                                                        className={`h-4 w-4 ${isSelected ? 'text-[var(--brand-blue)]' : 'text-[var(--text-muted)]'}`}
                                                    />
                                                    <span>{city}</span>
                                                    {isSelected && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="ml-auto h-2 w-2 rounded-full bg-[var(--brand-blue)]"
                                                        />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
                                {t('reseller.district')}
                            </label>
                            <div ref={districtDropdownRef} className="relative">
                                <button
                                    type="button"
                                    onClick={() =>
                                        searchFilters.city && setIsDistrictDropdownOpen(!isDistrictDropdownOpen)
                                    }
                                    disabled={!searchFilters.city}
                                    className={`brand-input flex w-full items-center justify-between gap-2 rounded-2xl px-4 py-3 text-white transition-all duration-300 focus:border-[var(--brand-blue)] focus:outline-none ${
                                        !searchFilters.city ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <FiMapPin className="h-4 w-4 text-[var(--text-muted)]" />
                                        <span
                                            className={
                                                searchFilters.district ? 'text-white' : 'text-[var(--text-muted)]'
                                            }
                                        >
                                            {getSelectedDistrict() || t('reseller.selectDistrict')}
                                        </span>
                                    </div>
                                    <FiChevronDown
                                        className={`h-4 w-4 text-[var(--text-muted)] transition-transform duration-200 ${
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
                                        className="brand-card absolute left-0 right-0 top-full z-50 mt-2 max-h-60 overflow-hidden overflow-y-auto rounded-[24px] border border-[var(--brand-border)] shadow-xl"
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
                                                    className={`flex w-full items-center gap-3 px-4 py-3 text-sm transition-all duration-200 ${
                                                        isSelected
                                                            ? 'border-l-2 border-[var(--brand-blue)] bg-[rgba(41,171,226,0.16)] text-[var(--brand-blue)]'
                                                            : 'text-white hover:bg-[rgba(41,171,226,0.08)] hover:text-[var(--brand-blue)]'
                                                    }`}
                                                >
                                                    <FiMapPin
                                                        className={`h-4 w-4 ${isSelected ? 'text-[var(--brand-blue)]' : 'text-[var(--text-muted)]'}`}
                                                    />
                                                    <span>{district}</span>
                                                    {isSelected && (
                                                        <motion.div
                                                            initial={{ scale: 0 }}
                                                            animate={{ scale: 1 }}
                                                            className="ml-auto h-2 w-2 rounded-full bg-[var(--brand-blue)]"
                                                        />
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </motion.div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
                                {t('reseller.specificAddress')}
                            </label>
                            <input
                                type="text"
                                value={searchFilters.address}
                                onChange={(event) => handleInputChange('address', event.target.value)}
                                placeholder={t('reseller.enterAddress')}
                                className="brand-input w-full rounded-2xl px-4 py-3 text-white transition-colors focus:border-[var(--brand-blue)] focus:outline-none"
                                suppressHydrationWarning
                            />
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={handleSearch}
                                className="brand-button-primary flex w-full items-center justify-center space-x-2 rounded-2xl px-6 py-3 font-semibold text-[var(--text-primary)] transition-colors duration-300 hover:brightness-110"
                                suppressHydrationWarning
                            >
                                <FiSearch className="h-5 w-5" />
                                <span>{t('reseller.search')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
