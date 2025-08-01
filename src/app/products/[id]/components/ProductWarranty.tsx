'use client';

export default function ProductWarranty() {
    return (
        <section id="product-details" className="relative z-[60] min-h-screen">
            <div className="container mx-auto max-w-[1800px] px-4 relative py-4 pb-2 pt-8 sm:-mt-8 md:-mt-8 z-[70]">
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl 3xl:text-6xl 4xl:text-7xl font-bold mb-6 md:mb-8 text-white">
                    CHÍNH SÁCH BẢO HÀNH
                </h2>

                {/* Warranty Overview */}
                <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl p-4 md:p-6 lg:p-8 border border-gray-700/50 mb-8 md:mb-12">
                    <div className="text-center mb-8">
                        <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-4xl">🛡️</span>
                        </div>
                        <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl 3xl:text-5xl 4xl:text-6xl font-bold text-white mb-2">BẢO HÀNH 24 THÁNG</h3>
                        <p className="text-gray-300 text-sm sm:text-base md:text-lg lg:text-lg xl:text-xl 2xl:text-2xl 3xl:text-3xl 4xl:text-4xl">Cam kết chất lượng và dịch vụ hậu mãi tốt nhất</p>
                    </div>
                </div>

                {/* Warranty Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12">
                    {/* What's Covered */}
                    <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl p-4 md:p-6 lg:p-8 border border-gray-700/50">
                        <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-green-400 mb-4 md:mb-6 flex items-center gap-2">
                            <span>✅</span>
                            Được Bảo Hành
                        </h3>
                        <ul className="space-y-3 text-gray-300 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl">
                            <li className="flex items-start gap-3">
                                <span className="text-green-400 mt-1">•</span>
                                <span className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl">Lỗi kỹ thuật từ nhà sản xuất</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-green-400 mt-1">•</span>
                                <span className="text-xs sm:text-sm md:text-base lg:text-base xl:text-lg 2xl:text-xl 3xl:text-2xl 4xl:text-3xl">Hỏng hóc trong quá trình sử dụng bình thường</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-green-400 mt-1">•</span>
                                <span className="text-xs sm:text-sm md:text-base lg:text-base xl:text-lg 2xl:text-xl 3xl:text-2xl 4xl:text-3xl">Sửa chữa miễn phí hoặc thay thế mới</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-green-400 mt-1">•</span>
                                <span className="text-xs sm:text-sm md:text-base lg:text-base xl:text-lg 2xl:text-xl 3xl:text-2xl 4xl:text-3xl">Kiểm tra và bảo dưỡng định kỳ</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-green-400 mt-1">•</span>
                                <span className="text-xs sm:text-sm md:text-base lg:text-base xl:text-lg 2xl:text-xl 3xl:text-2xl 4xl:text-3xl">Hỗ trợ kỹ thuật 24/7</span>
                            </li>
                        </ul>
                    </div>

                    {/* What's Not Covered */}
                    <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl p-4 md:p-6 lg:p-8 border border-gray-700/50">
                        <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-red-400 mb-4 md:mb-6 flex items-center gap-2">
                            <span>❌</span>
                            Không Được Bảo Hành
                        </h3>
                        <ul className="space-y-3 text-gray-300 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl">
                            <li className="flex items-start gap-3">
                                <span className="text-red-400 mt-1">•</span>
                                <span className="text-xs sm:text-sm md:text-base lg:text-base xl:text-lg 2xl:text-xl 3xl:text-2xl 4xl:text-3xl">Hư hỏng do tác động vật lý mạnh</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-red-400 mt-1">•</span>
                                <span className="text-xs sm:text-sm md:text-base lg:text-base xl:text-lg 2xl:text-xl 3xl:text-2xl 4xl:text-3xl">Ngấm nước do không tuân thủ IP rating</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-red-400 mt-1">•</span>
                                <span className="text-xs sm:text-sm md:text-base lg:text-base xl:text-lg 2xl:text-xl 3xl:text-2xl 4xl:text-3xl">Tự ý sửa chữa hoặc can thiệp</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-red-400 mt-1">•</span>
                                <span className="text-xs sm:text-sm md:text-base lg:text-base xl:text-lg 2xl:text-xl 3xl:text-2xl 4xl:text-3xl">Hao mòn tự nhiên theo thời gian</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-red-400 mt-1">•</span>
                                <span className="text-xs sm:text-sm md:text-base lg:text-base xl:text-lg 2xl:text-xl 3xl:text-2xl 4xl:text-3xl">Mất mát hoặc bị đánh cắp</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Warranty Process */}
                <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 mb-12">
                    <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-6 md:mb-8 text-center">
                        QUY TRÌNH BẢO HÀNH
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl font-bold text-blue-400">1</span>
                            </div>
                            <h4 className="font-bold text-white mb-2 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl">Liên Hệ</h4>
                            <p className="text-gray-400 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl">Gọi hotline hoặc mang sản phẩm đến cửa hàng</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl font-bold text-green-400">2</span>
                            </div>
                            <h4 className="font-bold text-white mb-2">Kiểm Tra</h4>
                            <p className="text-gray-400 text-sm">Kỹ thuật viên kiểm tra và xác định lỗi</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl font-bold text-purple-400">3</span>
                            </div>
                            <h4 className="font-bold text-white mb-2">Xử Lý</h4>
                            <p className="text-gray-400 text-sm">Sửa chữa hoặc thay thế trong 3-7 ngày</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl font-bold text-orange-400">4</span>
                            </div>
                            <h4 className="font-bold text-white mb-2">Nhận Lại</h4>
                            <p className="text-gray-400 text-sm">Nhận sản phẩm đã được sửa chữa</p>
                        </div>
                    </div>
                </div>

                {/* Contact Information */}
                <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
                    <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-4 md:mb-6 text-center">
                        THÔNG TIN BẢO HÀNH
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">📞</span>
                            </div>
                            <h4 className="font-bold text-white mb-2 text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl">Hotline Bảo Hành</h4>
                            <p className="text-blue-400 font-semibold text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl">1900-xxxx</p>
                            <p className="text-gray-400 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl">24/7 - Miễn phí</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">📧</span>
                            </div>
                            <h4 className="font-bold text-white mb-2">Email Hỗ Trợ</h4>
                            <p className="text-green-400 font-semibold">warranty@4thitek.com</p>
                            <p className="text-gray-400 text-sm">Phản hồi trong 24h</p>
                        </div>
                        <div className="text-center">
                            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">🏪</span>
                            </div>
                            <h4 className="font-bold text-white mb-2">Trung Tâm Bảo Hành</h4>
                            <p className="text-purple-400 font-semibold">50+ cửa hàng</p>
                            <p className="text-gray-400 text-sm">Toàn quốc</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
