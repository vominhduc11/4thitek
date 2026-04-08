'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/context/LanguageContext';
import { apiService, type PublicDealerPayload } from '@/services/apiService';
import ResellerResults from './ResellerResults';
import ResellerSearch from './ResellerSearch';
import type { Reseller, ResellerSearchFilters } from './types';

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

                const dealersArray = response.data.dealers;
                if (!Array.isArray(dealersArray)) {
                    throw new Error('Dealer payload is invalid');
                }

                const mapped = dealersArray.map((dealer: PublicDealerPayload, index) => ({
                    id: dealer.id || index + 1,
                    name:
                        dealer.businessName ||
                        dealer.contactName ||
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
                <p className="brand-eyebrow mb-3">{t('reseller.title')}</p>
                <h2 className="font-serif text-3xl font-semibold text-[var(--brand-blue)] md:text-4xl">
                    {t('reseller.subtitle')}
                </h2>
            </motion.div>

            <div className="brand-card rounded-[32px] px-4 py-6 shadow-[0_30px_90px_rgba(2,8,23,0.35)] sm:px-6">
                <ResellerSearch onSearch={setSearchFilters} resellers={resellers} />
                <ResellerResults searchFilters={searchFilters} resellers={resellers} loading={loading} error={error} />
            </div>
        </section>
    );
}
