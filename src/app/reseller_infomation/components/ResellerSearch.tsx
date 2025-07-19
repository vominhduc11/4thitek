'use client';

import { useState } from 'react';
import { FiSearch, FiMapPin } from 'react-icons/fi';

export default function ResellerSearch({
    onSearch
}: {
    onSearch: (filters: { city: string; district: string; address: string }) => void;
}) {
    const [searchFilters, setSearchFilters] = useState({
        city: '',
        district: '',
        address: ''
    });

    const cities = ['Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng', 'Nha Trang', 'Huế', 'Vũng Tàu'];

    const districts = {
        'Hồ Chí Minh': [
            'Quận 1',
            'Quận 2',
            'Quận 3',
            'Quận 4',
            'Quận 5',
            'Quận 6',
            'Quận 7',
            'Quận 8',
            'Quận 9',
            'Quận 10',
            'Quận 11',
            'Quận 12',
            'Quận Bình Thạnh',
            'Quận Gò Vấp',
            'Quận Phú Nhuận',
            'Quận Tân Bình',
            'Quận Tân Phú',
            'Quận Thủ Đức'
        ],
        'Hà Nội': [
            'Quận Ba Đình',
            'Quận Hoàn Kiếm',
            'Quận Tây Hồ',
            'Quận Long Biên',
            'Quận Cầu Giấy',
            'Quận Đống Đa',
            'Quận Hai Bà Trưng',
            'Quận Hoàng Mai',
            'Quận Thanh Xuân'
        ],
        'Đà Nẵng': [
            'Quận Hải Châu',
            'Quận Thanh Khê',
            'Quận Sơn Trà',
            'Quận Ngũ Hành Sơn',
            'Quận Liên Chiểu',
            'Quận Cẩm Lệ'
        ]
    };

    const handleInputChange = (field: string, value: string) => {
        const newFilters = { ...searchFilters, [field]: value };
        if (field === 'city') {
            newFilters.district = ''; // Reset district when city changes
        }
        setSearchFilters(newFilters);
    };

    const handleSearch = () => {
        onSearch(searchFilters);
    };

    return (
        <section className="bg-[#0c131d] text-white pt-8 pb-8">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="max-w-5xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-bold mb-6 text-white text-center">
                        Tìm <span className="text-[#00d4ff]">Đại Lý</span> 4T
                    </h1>
                    <p className="text-lg text-gray-300 leading-relaxed mb-8 text-center max-w-3xl mx-auto">
                        Tìm kiếm đại lý 4T gần nhất để mua sản phẩm và nhận hỗ trợ kỹ thuật tốt nhất.
                    </p>

                    {/* Search Form */}
                    <div className="bg-[#1a2332] rounded-lg p-6 mb-8">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            {/* City Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    <FiMapPin className="inline w-4 h-4 mr-1" />
                                    Thành phố
                                </label>
                                <select
                                    value={searchFilters.city}
                                    onChange={(e) => handleInputChange('city', e.target.value)}
                                    className="w-full px-4 py-3 bg-[#0c131d] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#00d4ff] transition-colors"
                                >
                                    <option value="">Chọn thành phố</option>
                                    {cities.map((city) => (
                                        <option key={city} value={city}>
                                            {city}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* District Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Quận/Huyện</label>
                                <select
                                    value={searchFilters.district}
                                    onChange={(e) => handleInputChange('district', e.target.value)}
                                    disabled={!searchFilters.city}
                                    className="w-full px-4 py-3 bg-[#0c131d] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#00d4ff] transition-colors disabled:opacity-50"
                                >
                                    <option value="">Chọn quận/huyện</option>
                                    {searchFilters.city &&
                                        districts[searchFilters.city as keyof typeof districts]?.map((district) => (
                                            <option key={district} value={district}>
                                                {district}
                                            </option>
                                        ))}
                                </select>
                            </div>

                            {/* Address Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Địa chỉ cụ thể</label>
                                <input
                                    type="text"
                                    value={searchFilters.address}
                                    onChange={(e) => handleInputChange('address', e.target.value)}
                                    placeholder="Nhập địa chỉ..."
                                    className="w-full px-4 py-3 bg-[#0c131d] border border-gray-600 rounded-lg text-white focus:outline-none focus:border-[#00d4ff] transition-colors"
                                />
                            </div>

                            {/* Search Button */}
                            <div className="flex items-end">
                                <button
                                    onClick={handleSearch}
                                    className="w-full bg-[#00d4ff] text-[#0c131d] py-3 px-6 rounded-lg font-semibold hover:bg-[#00b8e6] transition-colors duration-300 flex items-center justify-center space-x-2"
                                >
                                    <FiSearch className="w-5 h-5" />
                                    <span>Tìm kiếm</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
