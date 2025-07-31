'use client';

import { FiMapPin, FiPhone, FiMail, FiClock, FiStar } from 'react-icons/fi';

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

interface ResellerListProps {
    resellers: Reseller[];
    onResellerSelect: (reseller: Reseller) => void;
    selectedReseller?: Reseller;
}

export default function ResellerList({ resellers, onResellerSelect, selectedReseller }: ResellerListProps) {
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-semibold text-white">Kết quả tìm kiếm</h2>
                <span className="text-gray-300">Tìm thấy {resellers.length} đại lý</span>
            </div>

            {resellers.length === 0 ? (
                <div className="bg-[#1a2332] rounded-lg p-8 text-center">
                    <FiMapPin className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Không tìm thấy đại lý</h3>
                    <p className="text-gray-300">
                        Vui lòng thử tìm kiếm với từ khóa khác hoặc mở rộng khu vực tìm kiếm.
                    </p>
                </div>
            ) : (
                <div className="space-y-4 max-h-[700px] lg:max-h-[750px] overflow-y-auto pr-2 custom-scrollbar">
                    {resellers.map((reseller) => (
                        <div
                            key={reseller.id}
                            onClick={() => onResellerSelect(reseller)}
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
                                    <div className="flex items-center space-x-4 text-sm text-gray-300">
                                        <div className="flex items-center space-x-1">
                                            <FiStar className="w-4 h-4 text-yellow-400 fill-current" />
                                            <span>{reseller.rating}</span>
                                        </div>
                                        <span>•</span>
                                        <span>{reseller.distance}</span>
                                    </div>
                                </div>
                                <div className="flex-shrink-0 sm:text-right">
                                    <span className="bg-[#00d4ff] text-[#0c131d] px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap">
                                        Đại lý chính thức
                                    </span>
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                <div className="flex items-center space-x-3">
                                    <FiPhone className="w-4 h-4 text-[#00d4ff]" />
                                    <span className="text-gray-300 text-sm">{reseller.phone}</span>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <FiMail className="w-4 h-4 text-[#00d4ff]" />
                                    <span className="text-gray-300 text-sm">{reseller.email}</span>
                                </div>
                            </div>

                            {/* Hours */}
                            <div className="flex items-center space-x-3 mb-4">
                                <FiClock className="w-4 h-4 text-[#00d4ff]" />
                                <span className="text-gray-300 text-sm">{reseller.hours}</span>
                            </div>

                            {/* Specialties */}
                            <div className="flex flex-wrap gap-2">
                                {reseller.specialties.map((specialty, index) => (
                                    <span
                                        key={index}
                                        className="bg-[#0c131d] text-gray-300 px-3 py-1 rounded-full text-xs"
                                    >
                                        {specialty}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
