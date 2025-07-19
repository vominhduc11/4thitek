'use client';

interface Feature {
    title: string;
    subtitle: string;
    description: string;
    value?: string;
}

interface AdditionalFeature {
    icon: string;
    description: string;
}

interface ProductDetailsProps {
    features: Feature[];
    additionalFeatures: AdditionalFeature[];
}

export default function ProductDetails({ features, additionalFeatures }: ProductDetailsProps) {
    return (
        <section id="product-details" className="bg-[#0a0f1a] relative z-50 -mt-20 min-h-screen">
            <div className="container mx-auto max-w-8xl relative -top-48 py-20">
                <h2 className="text-3xl font-bold mb-8 text-white">PRODUCT FEATURED</h2>

                {/* Top row - 3 cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-2xl"
                        >
                            <div className="mb-4">
                                <span className="text-4xl font-bold text-blue-400">{feature.title}</span>
                                <h3 className="text-lg font-semibold text-blue-400 mt-2">{feature.subtitle}</h3>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                        </div>
                    ))}
                </div>

                {/* Bottom row - 2 cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                    {additionalFeatures.map((feature, index) => (
                        <div
                            key={index}
                            className="bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-2xl flex items-center gap-4"
                        >
                            <div className="text-blue-400 text-3xl">{feature.icon}</div>
                            <div className="flex-1">
                                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Product Details Content */}
                <div className="space-y-12">
                    {/* Title */}
                    <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                        TAI NGHE CHO MŨ BẢO HIỂM MÔ TÔ PHƯỢT BLUETOOTH INTERCOM SCS S-9. GẮN KẾT ANH EM CÙNG PHƯỢT
                    </h2>

                    {/* Image */}
                    <div className="relative">
                        <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl p-8 border border-gray-700/50">
                            <img
                                src="/products/helmet-detail.jpg"
                                alt="Tai nghe Bluetooth intercom cho mũ bảo hiểm"
                                className="w-full h-auto rounded-lg"
                                onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src =
                                        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMTExIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyMCIgZmlsbD0iIzU1NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkhlbG1ldCBEZXRhaWw8L3RleHQ+PC9zdmc+';
                                }}
                            />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="space-y-4 text-gray-300 leading-relaxed">
                        <p>
                            Tai nghe Bluetooth được thiết kế chuyên dụng cho mũ bảo hiểm mô tô với công nghệ âm thanc
                            tiên tiến giúp bạn duy trì liên lạc trong quá trình di chuyển với mũ bảo hiểm mô tô SCS S-9
                            lần này.
                        </p>
                        <p>
                            Thiết kế chắc chắn, gọn nhẹ, có thể tháo rời dễ dàng. Khoảng cách nói chuyện lên tới 1km,
                            chức năng ghi âm hoàn hảo, cho phần mềm cài đặt trên smartphone để quản lý và sử dụng một
                            cách thuận tiện và hiệu quả.
                        </p>
                        <p>
                            Cố gắng kết nối tối đa 6 người. Hỗ trợ kết nối GPS, nghe nhạc, gọi điện, chuyển chế độ theo
                            các tùy chọn, hỗ trợ giảm tiếng ồn, dễ dàng lắp đặt trên mũ bảo hiểm.
                        </p>
                    </div>

                    {/* Perfect Design Section */}
                    <div className="space-y-8">
                        {/* Title */}
                        <h2 className="text-2xl md:text-3xl font-bold text-white leading-tight">THIẾT KẾ HOÀN HẢO</h2>

                        {/* Bullet Points */}
                        <div className="space-y-4 text-gray-300 leading-relaxed">
                            <div className="flex items-start gap-3">
                                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                                <p>
                                    Bạn có thể mua một bên tai nghe hoặc cùng lúc cả hai bên, sẽ rất thoải mái khi có
                                    cặp của bạn cùng với các dung cư khác như có điều.
                                </p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                                <p>Mặt khít lướng công nghệ cần được kỹ thuật nhất kiểm. Thông cảm hiểu lý bạn.</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                                <p>
                                    Mặt được con tên và thông tin hoạt động khác trên thiết bị cần nạp sực tái dồn
                                    khoảng đoạn.
                                </p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                                <p>Sản phẩm sẽ phù hợp với tất cả mũ bảo hiểm.</p>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                                <p>
                                    Chức năng tai nghe là trung tâm với điều kiện tốt nhất không cần Chức năng ghi âm
                                    hoàn hảo không chỉ là các thiết bị kỹ thuật cao cấp khi có 2 điều t 3.5mm
                                </p>
                            </div>
                        </div>

                        {/* Image */}
                        <div className="relative">
                            <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl p-8 border border-gray-700/50">
                                <img
                                    src="/products/mt-helmets-detail.jpg"
                                    alt="MT Helmets với tai nghe Bluetooth"
                                    className="w-full h-auto rounded-lg"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src =
                                            'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMTExIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyMCIgZmlsbD0iIzU1NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk1UIEhlbG1ldHMgRGV0YWlsPC90ZXh0Pjwvc3ZnPg==';
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
