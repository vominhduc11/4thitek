'use client';

import Image from 'next/image';

interface Feature {
    title: string;
    subtitle?: string;
    description: string;
    value?: string;
}

interface ProductDetailsProps {
    features: Feature[];
    highlights: string[];
    description: string;
}

export default function ProductDetails({ features, highlights, description }: ProductDetailsProps) {
    return (
        <section className="bg-[#0a0f1a] relative z-50 -mt-20 min-h-screen">
            <div className="container mx-auto max-w-8xl relative -top-20 py-20">
                    <h2 className="text-2xl md:text-3xl lg:text-3xl font-bold mb-6 md:mb-8 text-white">PRODUCT FEATURED</h2>

                    {/* Top row - 3 cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-2xl"
                            >
                                <div className="mb-4">
                                    <span className="text-4xl font-bold text-blue-400">{feature.title}</span>
                                    {feature.subtitle && (
                                        <h3 className="text-lg font-semibold text-blue-400 mt-2">{feature.subtitle}</h3>
                                    )}
                                </div>
                                <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>

                    {/* Product Highlights */}
                    {highlights.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-12 md:mb-16">
                            {highlights.map((highlight, index) => (
                                <div
                                    key={index}
                                    className="bg-gray-800/70 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/50 shadow-2xl flex items-center gap-4"
                                >
                                    <div className="text-blue-400 text-3xl">✨</div>
                                    <p className="text-gray-300 text-sm">{highlight}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Product Description */}
                    <div className="mb-12 md:mb-16">
                        <h2 className="text-2xl md:text-3xl lg:text-3xl font-bold mb-6 md:mb-8 text-white">PRODUCT DESCRIPTION</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                            {/* Left column - Image */}
                            <div className="relative">
                                <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl p-8 border border-gray-700/50">
                                    <Image
                                        src="/products/helmet-detail.jpg"
                                        alt="Tai nghe Bluetooth intercom cho mũ bảo hiểm"
                                        width={1200}
                                        height={800}
                                        className="w-full h-auto rounded-lg"
                                        priority
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src =
                                                'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMTExIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyMCIgZmlsbD0iIzU1NSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkhlbG1ldCBEZXRhaWw8L3RleHQ+PC9zdmc+';
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Right column - Description */}
                            <div>
                                <h3 className="text-xl md:text-2xl font-bold text-white mb-4">TAI NGHE CHO MŨ BẢO HIỂM MÔ TÔ PHƯỢT BLUETOOTH INTERCOM SCS S-9</h3>
                                <div className="prose prose-sm prose-invert max-w-none">
                                    <p className="text-gray-300 mb-4">
                                        {description}
                                    </p>
                                    <p className="text-gray-300 mb-4">
                                        Tai nghe mũ bảo hiểm Bluetooth Intercom SCS S-9 là thiết bị liên lạc không dây hiện đại, được thiết kế đặc biệt cho người đi xe máy, mô tô và những người yêu thích phượt. Với khả năng kết nối Bluetooth, thiết bị cho phép người dùng giao tiếp với nhau trong khoảng cách lên đến 1000m, nghe nhạc, nhận cuộc gọi và điều khiển bằng giọng nói.
                                    </p>
                                    <p className="text-gray-300">
                                        Sản phẩm được trang bị công nghệ khử tiếng ồn tiên tiến, đảm bảo chất lượng âm thanh rõ ràng ngay cả khi di chuyển ở tốc độ cao. Pin lithium dung lượng cao cho thời gian sử dụng lên đến 12 giờ đàm thoại liên tục hoặc 8 giờ khi vừa đàm thoại vừa nghe nhạc.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
            </div>
        </section>
    );
}
