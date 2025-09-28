'use client';

import { FiMapPin, FiPhone, FiMail } from 'react-icons/fi';
import { useLanguage } from '@/context/LanguageContext';

interface Reseller {
    id: number;
    name: string;
    address: string;
    city: string;
    district: string;
    phone: string;
    email: string;
}

interface ResellerListProps {
    resellers: Reseller[];
    onResellerSelect: (reseller: Reseller) => void;
    selectedReseller?: Reseller;
}

export default function ResellerList({ resellers, onResellerSelect, selectedReseller }: ResellerListProps) {
    const { t } = useLanguage();
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-white">{t('reseller.searchResults')}</h2>
                <span className="text-gray-300">{t('reseller.foundDealers').replace('{count}', resellers.length.toString())}</span>
            </div>

            {resellers.length === 0 ? (
                <div className="bg-[#1a2332] rounded-lg p-8 text-center">
                    <FiMapPin className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">{t('reseller.noResellersFound')}</h3>
                    <p className="text-gray-300">
                        {t('reseller.noResellersMessage')}
                    </p>
                </div>
            ) : (
                <div className="space-y-4 max-h-[400px] sm:max-h-[500px] lg:max-h-[600px] xl:max-h-[700px] overflow-y-auto pr-2 custom-scrollbar">
                    {resellers.map((reseller) => (
                        <div
                            key={reseller.id}
                            onClick={() => {
                                onResellerSelect(reseller);
                            }}
                            className={`bg-[#1a2332] rounded-lg p-6 cursor-pointer transition-all duration-300 hover:bg-[#243447] border-2 ${
                                selectedReseller?.id === reseller.id
                                    ? 'border-[#00d4ff] bg-[#243447]'
                                    : 'border-transparent'
                            }`}
                        >
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-3">
                                <div className="flex-1">
                                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-1">
                                        {reseller.name}
                                    </h3>
                                </div>
                            </div>

                            {/* Address */}
                            <div className="flex items-start space-x-3 mb-3">
                                <FiMapPin className="w-5 h-5 text-[#00d4ff] mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-white font-medium">{reseller.address}</p>
                                    <p className="text-gray-300 text-sm">
                                        {reseller.district}, {reseller.city}
                                    </p>
                                </div>
                            </div>

                            {/* Contact Info */}
                            <div className="space-y-3 mb-4">
                                <div className="flex items-center space-x-3">
                                    <FiPhone className="w-4 h-4 text-[#00d4ff]" />
                                    <span className="text-gray-300 text-sm">{reseller.phone}</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <FiMail className="w-4 h-4 text-[#00d4ff]" />
                                    <span className="text-gray-300 text-sm">{reseller.email}</span>
                                </div>
                            </div>


                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
