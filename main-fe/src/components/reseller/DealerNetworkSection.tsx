'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { apiService } from '@/services/apiService';
import { useLanguage } from '@/context/LanguageContext';
import ResellerResults from './ResellerResults';
import ResellerSearch from './ResellerSearch';
import type { Reseller, ResellerSearchFilters } from './types';

type ApiDealer = {
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
};

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

export default function DealerNetworkSection() {
    const { t } = useLanguage();
    const [searchFilters, setSearchFilters] = useState<ResellerSearchFilters>({
        city: '',
        district: '',
        address: ''
    });
    const [resellers, setResellers] = useState<Reseller[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchResellers = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await apiService.fetchResellers();

                if (!response.success || !response.data) {
                    throw new Error(response.error || 'Failed to load dealer network');
                }

                const dealersArray = extractDealersArray(response.data);
                if (!dealersArray) {
                    throw new Error('Dealer payload is invalid');
                }

                const mapped = dealersArray.map((dealer, index) => ({
                    id: dealer.accountId || dealer.id || index + 1,
                    name:
                        dealer.companyName ||
                        dealer.name ||
                        dealer.storeName ||
                        dealer.dealerName ||
                        t('reseller.dealerFallback').replace('{index}', String(index + 1)),
                    address: dealer.address || '',
                    city: dealer.city || '',
                    district: dealer.district || '',
                    phone: dealer.phone || '',
                    email: dealer.email || ''
                }));

                if (isMounted) {
                    setResellers(mapped);
                }
            } catch {
                if (isMounted) {
                    setResellers([]);
                    setError('errors.reseller.loadFailed');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchResellers();
        return () => {
            isMounted = false;
        };
    }, [t]);

    return (
        <section id="dealer-network" className="py-16">
            <motion.div
                className="mb-8 text-center"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                viewport={{ once: true }}
            >
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300/80">
                    {t('reseller.title')}
                </p>
                <h2 className="text-3xl font-bold text-white md:text-4xl">
                    {t('reseller.subtitle')}
                </h2>
            </motion.div>

            <div className="rounded-[28px] border border-white/10 bg-[#101926]/70 px-4 py-6 shadow-[0_30px_90px_rgba(2,8,23,0.35)] backdrop-blur sm:px-6">
                <ResellerSearch onSearch={setSearchFilters} resellers={resellers} />
                <ResellerResults
                    searchFilters={searchFilters}
                    resellers={resellers}
                    loading={loading}
                    error={error}
                />
            </div>
        </section>
    );
}
