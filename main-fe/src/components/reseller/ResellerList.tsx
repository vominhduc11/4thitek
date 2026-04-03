'use client';

import { FiMail, FiMapPin, FiPhone } from 'react-icons/fi';
import { useLanguage } from '@/context/LanguageContext';
import type { Reseller } from './types';

interface ResellerListProps {
    resellers: Reseller[];
    onResellerSelect: (reseller: Reseller) => void;
    selectedReseller?: Reseller;
}

export default function ResellerList({ resellers, onResellerSelect, selectedReseller }: ResellerListProps) {
    const { t } = useLanguage();

    return (
        <div className="space-y-4">
            <div className="mb-6 flex items-center justify-between gap-4">
                <h2 className="font-serif text-2xl font-semibold text-[var(--brand-blue)]">
                    {t('reseller.searchResults')}
                </h2>
                <span className="brand-badge-muted text-sm">
                    {t('reseller.foundDealers').replace('{count}', resellers.length.toString())}
                </span>
            </div>

            {resellers.length === 0 ? (
                <div className="brand-card-muted rounded-[26px] p-8 text-center">
                    <FiMapPin className="mx-auto mb-4 h-12 w-12 text-[var(--text-muted)]" />
                    <h3 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">
                        {t('reseller.noResellersFound')}
                    </h3>
                    <p className="text-[var(--text-secondary)]">{t('reseller.noResellersMessage')}</p>
                </div>
            ) : (
                <div className="custom-scrollbar max-h-[400px] space-y-4 overflow-y-auto pr-2 sm:max-h-[500px] lg:max-h-[600px] xl:max-h-[700px]">
                    {resellers.map((reseller) => (
                        <div
                            key={reseller.id}
                            onClick={() => {
                                onResellerSelect(reseller);
                            }}
                            className={`brand-card-muted cursor-pointer rounded-[26px] border p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[var(--brand-border-strong)] ${
                                selectedReseller?.id === reseller.id
                                    ? 'border-[var(--brand-blue)] bg-[rgba(41,171,226,0.08)]'
                                    : 'border-[var(--brand-border)]'
                            }`}
                        >
                            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex-1">
                                    <h3 className="mb-1 text-lg font-semibold text-[var(--text-primary)] sm:text-xl">
                                        {reseller.name}
                                    </h3>
                                </div>
                            </div>

                            <div className="mb-3 flex items-start space-x-3">
                                <FiMapPin className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--brand-blue)]" />
                                <div>
                                    <p className="font-medium text-[var(--text-primary)]">{reseller.address}</p>
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        {reseller.district}, {reseller.city}
                                    </p>
                                </div>
                            </div>

                            <div className="mb-4 space-y-3">
                                <div className="flex items-center space-x-3">
                                    <FiPhone className="h-4 w-4 text-[var(--brand-blue)]" />
                                    <span className="text-sm text-[var(--text-secondary)]">{reseller.phone}</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <FiMail className="h-4 w-4 text-[var(--brand-blue)]" />
                                    <span className="text-sm text-[var(--text-secondary)]">{reseller.email}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
