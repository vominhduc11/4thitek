'use client';

export default function ProductWarranty() {
    return (
        <section id="product-details" className="bg-[#0a0f1a] relative z-50 -mt-20 min-h-screen">
            <div className="container mx-auto max-w-8xl relative -top-20 py-20">
                <h2 className="text-2xl md:text-3xl lg:text-3xl font-bold mb-6 md:mb-8 text-white">CHÍNH SÁCH BẢO HÀNH</h2>

                {/* Warranty Overview */}
                <div className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl p-4 md:p-6 lg:p-8 border border-gray-700/50 mb-8 md:mb-12">
                    <div className="text-center mb-8">
                        <div className="w-24 h-24 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-4xl">🛡️</span>
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold text-white mb-2">BẢO HÀNH 24 THÁNG</h3>
                        <p className="text-gray-300">Cam kết chất lượng và dịch vụ hậu mãi tốt nhất</p>
                    </div>
                </div>

                {/* Warranty Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12">
                    {/* What's Covered */}
                    <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl p-4 md:p-6 lg:p-8 border border-gray-700/50">
                        <h3 className="text-lg md:text-xl font-bold text-green-400 mb-4 md:mb-6 flex items-center gap-2">
                            <span>✅</span>
                            Được Bảo Hành
                        </h3>
                        <ul className="space-y-3 text-gray-300">
                            <li className="flex items-start gap-3">
                                <span className="text-green-400 mt-1">•</span>
                                <span>Lỗi kỹ thuật từ nhà sản xuất</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-green-400 mt-1">•</span>
                                <span>Hỏng hóc trong quá trình sử dụng bình thường</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-green-400 mt-1">•</span>
                                <span>Sửa chữa miễn phí hoặc thay thế mới</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-green-400 mt-1">•</span>
                                <span>Kiểm tra và bảo dưỡng định kỳ</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-green-400 mt-1">•</span>
                                <span>Hỗ trợ kỹ thuật 24/7</span>
                            </li>
                        </ul>
                    </div>

                    {/* What's Not Covered */}
                    <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl p-4 md:p-6 lg:p-8 border border-gray-700/50">
                        <h3 className="text-lg md:text-xl font-bold text-red-400 mb-4 md:mb-6 flex items-center gap-2">
                            <span>❌</span>
                            Không Được Bảo Hành
                        </h3>
                        <ul className="space-y-3 text-gray-300">
                            <li className="flex items-start gap-3">
                                <span className="text-red-400 mt-1">•</span>
                                <span>Hư hỏng do tác động vật lý mạnh</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-red-400 mt-1">•</span>
                                <span>Ngấm nước do không tuân thủ IP rating</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-red-400 mt-1">•</span>
                                <span>Tự ý sửa chữa hoặc can thiệp</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-red-400 mt-1">•</span>
                                <span>Hao mòn tự nhiên theo thời gian</span>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="text-red-400 mt-1">•</span>
                                <span>Mất mát hoặc bị đánh cắp</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Warranty Process */}
                <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 mb-12">
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-6 md:mb-8 text-center">QUY TRÌNH BẢO HÀNH</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl font-bold text-blue-400">1</span>
                            </div>
                            <h4 className="font-bold text-white mb-2">Liên Hệ</h4>
                            <p className="text-gray-400 text-sm">Gọi hotline hoặc mang sản phẩm đến cửa hàng</p>
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
                    <h3 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6 text-center">THÔNG TIN BẢO HÀNH</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">📞</span>
                            </div>
                            <h4 className="font-bold text-white mb-2">Hotline Bảo Hành</h4>
                            <p className="text-blue-400 font-semibold">1900-xxxx</p>
                            <p className="text-gray-400 text-sm">24/7 - Miễn phí</p>
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
