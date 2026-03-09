'use client';

import { useState, useEffect } from 'react';
import { ResellerHero, ResellerSearch, ResellerResults } from './components';
import { apiService } from '@/services/apiService';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import { useLanguage } from '@/context/LanguageContext';

interface Reseller {
    id: string | number;
    name: string;
    address: string;
    city: string;
    district: string;
    phone: string;
    email: string;
}

interface ApiDealer {
    accountId?: number;
    id?: number;
    companyName?: string;
    name?: string;
    storeName?: string;
    dealerName?: string;
    address?: string;
    phone?: string;
    email?: string;
    district?: string;
    city?: string;
}

const DEALER_ARRAY_KEYS = [
    'dealers',
    'dealer',
    'resellers',
    'reseller',
    'data',
    'items',
    'results',
    'rows',
    'list',
    'records',
    'content',
    'payload'
] as const;

const isDealerLike = (value: Record<string, unknown>) =>
    'companyName' in value || 'accountId' in value || 'name' in value || 'address' in value;

const extractDealersArray = (payload: unknown): ApiDealer[] | null => {
    if (Array.isArray(payload)) return payload as ApiDealer[];
    if (!payload || typeof payload !== 'object') return null;

    const payloadObj = payload as Record<string, unknown>;

    for (const key of DEALER_ARRAY_KEYS) {
        const value = payloadObj[key];
        if (Array.isArray(value)) return value as ApiDealer[];
    }

    for (const key of DEALER_ARRAY_KEYS) {
        const value = payloadObj[key];
        if (value && typeof value === 'object') {
            const nested = value as Record<string, unknown>;
            for (const nestedKey of DEALER_ARRAY_KEYS) {
                const nestedValue = nested[nestedKey];
                if (Array.isArray(nestedValue)) return nestedValue as ApiDealer[];
            }
        }
    }

    const queue: Record<string, unknown>[] = [payloadObj];
    const visited = new Set<Record<string, unknown>>();

    while (queue.length > 0) {
        const current = queue.shift();
        if (!current || visited.has(current)) continue;
        visited.add(current);

        for (const value of Object.values(current)) {
            if (Array.isArray(value)) {
                const firstObject = value.find((item) => item && typeof item === 'object') as Record<string, unknown> | undefined;
                if (firstObject && isDealerLike(firstObject)) {
                    return value as ApiDealer[];
                }
            } else if (value && typeof value === 'object') {
                queue.push(value as Record<string, unknown>);
            }
        }
    }

    if (isDealerLike(payloadObj)) return [payloadObj as ApiDealer];
    return null;
};

export default function ResellerInformationPage() {
    const { t } = useLanguage();
    const [searchFilters, setSearchFilters] = useState({
        city: '',
        district: '',
        address: ''
    });

    const [resellers, setResellers] = useState<Reseller[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

    const resolveErrorKey = (fetchError: unknown): string => {
        if (!(fetchError instanceof Error)) return 'errors.general.unexpectedError';
        const message = fetchError.message;

        if (message.includes('Response data is not in expected format')) {
            return 'errors.reseller.responseFormatError';
        }
        if (message.includes('fetch') || message.includes('ERR_CONNECTION_REFUSED')) {
            return 'errors.reseller.connectionError';
        }
        if (message.includes('timeout')) {
            return 'errors.general.timeoutError';
        }
        if (message.includes('404')) {
            return 'errors.general.notFoundError';
        }
        if (message.includes('500') || message.includes('API returned unsuccessful response')) {
            return 'errors.general.serverError';
        }

        return 'errors.reseller.loadFailed';
    };

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
                    const dealersArray = extractDealersArray(response.data);
                    if (!dealersArray) {
                        console.error('Invalid response structure:', response.data);
                        throw new Error('Response data is not in expected format');
                    }

                    // Convert API response to local Reseller format
                    const convertedResellers = dealersArray.map((dealer, index) => {
                        const typedDealer = dealer as ApiDealer;
                        const name =
                            typedDealer.companyName ||
                            typedDealer.name ||
                            typedDealer.storeName ||
                            typedDealer.dealerName ||
                            t('reseller.dealerFallback').replace('{index}', String(index + 1));
                        const id = typedDealer.accountId || typedDealer.id || (index + 1);

                        return {
                            id,
                            name,
                            address: typedDealer.address || '',
                            city: typedDealer.city || '',
                            district: typedDealer.district || '',
                            phone: typedDealer.phone || '',
                            email: typedDealer.email || ''
                        };
                    });

                    setResellers(convertedResellers);
                    setConnectionStatus('connected');
                } else {
                    throw new Error(response.error || 'Failed to fetch resellers');
                }
            } catch (fetchError) {
                console.error('Error fetching resellers:', fetchError);
                const errorKey = resolveErrorKey(fetchError);
                const isFormatError = errorKey === 'errors.reseller.responseFormatError';
                setConnectionStatus(isFormatError ? 'connected' : 'disconnected');
                setResellers([]);
                setError(errorKey);
            } finally {
                setLoading(false);
            }
        };

        fetchResellers();
    }, [t]);

    const handleSearch = (filters: { city: string; district: string; address: string }) => {
        setSearchFilters(filters);
    };

    return (
        <ErrorBoundary>
            <div className="min-h-screen bg-[#0c131d] text-white flex flex-col"
                 style={{ animation: 'fadeIn 0.5s ease-in' }}
            >
            {/* Hero Section with Breadcrumb */}
            <ResellerHero />

            {/* Search Section */}
            <div className="ml-0 sm:ml-20 px-1 sm:px-2 md:px-2 lg:px-3 xl:px-4 2xl:px-6">
                <ResellerSearch onSearch={handleSearch} resellers={resellers} />
            </div>

            {/* Status Indicators */}
            {connectionStatus !== 'connected' && !loading && (
                <div className="ml-0 sm:ml-20 px-1 sm:px-2 md:px-2 lg:px-3 xl:px-4 2xl:px-6 pb-4">
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
                                ? t('reseller.status.unavailable')
                                : t('reseller.status.checking')
                            }
                        </span>
                    </div>
                </div>
            )}

            {/* Results Section */}
            <div className="ml-0 sm:ml-20 px-1 sm:px-2 md:px-2 lg:px-3 xl:px-4 2xl:px-6">
                <ResellerResults 
                    searchFilters={searchFilters} 
                    resellers={resellers}
                    loading={loading}
                    error={error}
                />
            </div>
            </div>
        </ErrorBoundary>
    );
}
