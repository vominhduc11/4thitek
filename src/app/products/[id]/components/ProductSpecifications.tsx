'use client';

export default function ProductSpecifications() {
    return (
        <section id="product-details" className="relative z-[60]">
            <div className="container mx-auto max-w-[1800px] px-4 relative py-4 pb-2 pt-8 sm:-mt-8 md:-mt-8 z-[70]">
                <h2 className="text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl 3xl:text-6xl 4xl:text-7xl font-bold mb-4 md:mb-6 text-white">
                    THÔNG SỐ KỸ THUẬT
                </h2>

                {/* Main Specifications Table */}
                <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl p-4 md:p-6 lg:p-8 border border-gray-700/50 shadow-2xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                        {/* Left Column */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-blue-400 mb-6">Thông Số Chung</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-3 border-b border-gray-600/50">
                                    <span className="text-gray-300 font-medium text-sm sm:text-base md:text-lg lg:text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl">Model</span>
                                    <span className="text-white text-sm sm:text-base md:text-lg lg:text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl">SCS S-9</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-gray-600/50">
                                    <span className="text-gray-300 font-medium text-sm sm:text-base md:text-lg lg:text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl">Bluetooth Version</span>
                                    <span className="text-white text-sm sm:text-base md:text-lg lg:text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl">5.0</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-gray-600/50">
                                    <span className="text-gray-300 font-medium text-sm sm:text-base md:text-lg lg:text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl">Khoảng Cách Kết Nối</span>
                                    <span className="text-white text-sm sm:text-base md:text-lg lg:text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl">1000m</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-gray-600/50">
                                    <span className="text-gray-300 font-medium text-sm sm:text-base md:text-lg lg:text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl">Số Người Kết Nối</span>
                                    <span className="text-white text-sm sm:text-base md:text-lg lg:text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl">6 người</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-gray-600/50">
                                    <span className="text-gray-300 font-medium text-sm sm:text-base md:text-lg lg:text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl">Thời Gian Đàm Thoại</span>
                                    <span className="text-white text-sm sm:text-base md:text-lg lg:text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl">12 giờ</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-gray-600/50">
                                    <span className="text-gray-300 font-medium text-sm sm:text-base md:text-lg lg:text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl">Thời Gian Chờ</span>
                                    <span className="text-white text-sm sm:text-base md:text-lg lg:text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl">300 giờ</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-blue-400 mb-6">Thông Số Kỹ Thuật</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-3 border-b border-gray-600/50">
                                    <span className="text-gray-300 font-medium text-sm sm:text-base md:text-lg lg:text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl">Pin</span>
                                    <span className="text-white text-sm sm:text-base md:text-lg lg:text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl">Li-ion 900mAh</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-gray-600/50">
                                    <span className="text-gray-300 font-medium text-sm sm:text-base md:text-lg lg:text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl">Thời Gian Sạc</span>
                                    <span className="text-white text-sm sm:text-base md:text-lg lg:text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl">2.5 giờ</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-gray-600/50">
                                    <span className="text-gray-300 font-medium text-sm sm:text-base md:text-lg lg:text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl">Chống Nước</span>
                                    <span className="text-white text-sm sm:text-base md:text-lg lg:text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl">IPX6</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-gray-600/50">
                                    <span className="text-gray-300 font-medium text-sm sm:text-base md:text-lg lg:text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl">Nhiệt Độ Hoạt Động</span>
                                    <span className="text-white text-sm sm:text-base md:text-lg lg:text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl">-10°C ~ +55°C</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-gray-600/50">
                                    <span className="text-gray-300 font-medium text-sm sm:text-base md:text-lg lg:text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl">Trọng Lượng</span>
                                    <span className="text-white text-sm sm:text-base md:text-lg lg:text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl">85g</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-gray-600/50">
                                    <span className="text-gray-300 font-medium text-sm sm:text-base md:text-lg lg:text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl">Kích Thước</span>
                                    <span className="text-white text-sm sm:text-base md:text-lg lg:text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl">120 x 60 x 25mm</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
