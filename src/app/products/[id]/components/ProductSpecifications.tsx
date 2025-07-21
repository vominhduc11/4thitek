'use client';

export default function ProductSpecifications() {
    return (
        <section id="product-details" className="bg-[#0a0f1a] relative z-50 min-h-screen -mt-40">
            <div className="container mx-auto max-w-8xl relative py-8 pt-56">
                <h2 className="text-2xl md:text-3xl lg:text-3xl font-bold mb-6 md:mb-8 text-white">THÔNG SỐ KỸ THUẬT</h2>

                {/* Main Specifications Table */}
                <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl p-4 md:p-6 lg:p-8 border border-gray-700/50 shadow-2xl mb-8 md:mb-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                        {/* Left Column */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-blue-400 mb-6">Thông Số Chung</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-3 border-b border-gray-600/50">
                                    <span className="text-gray-300 font-medium">Model</span>
                                    <span className="text-white">SCS S-9</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-gray-600/50">
                                    <span className="text-gray-300 font-medium">Bluetooth Version</span>
                                    <span className="text-white">5.0</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-gray-600/50">
                                    <span className="text-gray-300 font-medium">Khoảng Cách Kết Nối</span>
                                    <span className="text-white">1000m</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-gray-600/50">
                                    <span className="text-gray-300 font-medium">Số Người Kết Nối</span>
                                    <span className="text-white">6 người</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-gray-600/50">
                                    <span className="text-gray-300 font-medium">Thời Gian Đàm Thoại</span>
                                    <span className="text-white">12 giờ</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-gray-600/50">
                                    <span className="text-gray-300 font-medium">Thời Gian Chờ</span>
                                    <span className="text-white">300 giờ</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            <h3 className="text-xl font-bold text-blue-400 mb-6">Thông Số Kỹ Thuật</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-3 border-b border-gray-600/50">
                                    <span className="text-gray-300 font-medium">Pin</span>
                                    <span className="text-white">Li-ion 900mAh</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-gray-600/50">
                                    <span className="text-gray-300 font-medium">Thời Gian Sạc</span>
                                    <span className="text-white">2.5 giờ</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-gray-600/50">
                                    <span className="text-gray-300 font-medium">Chống Nước</span>
                                    <span className="text-white">IPX6</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-gray-600/50">
                                    <span className="text-gray-300 font-medium">Nhiệt Độ Hoạt Động</span>
                                    <span className="text-white">-10°C ~ +55°C</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-gray-600/50">
                                    <span className="text-gray-300 font-medium">Trọng Lượng</span>
                                    <span className="text-white">85g</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-gray-600/50">
                                    <span className="text-gray-300 font-medium">Kích Thước</span>
                                    <span className="text-white">120 x 60 x 25mm</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional Features */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-12">
                    <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-gray-700/50">
                        <div className="text-center mb-4">
                            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <span className="text-2xl">🎵</span>
                            </div>
                            <h4 className="text-lg font-bold text-white">Chất Lượng Âm Thanh</h4>
                        </div>
                        <ul className="text-gray-300 text-sm space-y-2">
                            <li>• Hi-Fi stereo sound</li>
                            <li>• Noise cancellation</li>
                            <li>• Echo suppression</li>
                            <li>• Wind noise reduction</li>
                        </ul>
                    </div>

                    <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-gray-700/50">
                        <div className="text-center mb-4">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <span className="text-2xl">📱</span>
                            </div>
                            <h4 className="text-lg font-bold text-white">Tính Năng Kết Nối</h4>
                        </div>
                        <ul className="text-gray-300 text-sm space-y-2">
                            <li>• GPS navigation</li>
                            <li>• Music streaming</li>
                            <li>• Phone calls</li>
                            <li>• Voice commands</li>
                        </ul>
                    </div>

                    <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-gray-700/50">
                        <div className="text-center mb-4">
                            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                                <span className="text-2xl">🛡️</span>
                            </div>
                            <h4 className="text-lg font-bold text-white">Độ Bền & An Toàn</h4>
                        </div>
                        <ul className="text-gray-300 text-sm space-y-2">
                            <li>• Chống va đập</li>
                            <li>• Chống bụi IP65</li>
                            <li>• Chống rung động</li>
                            <li>• Thiết kế chắc chắn</li>
                        </ul>
                    </div>
                </div>

                {/* Compatibility */}
                <div className="bg-gray-800/70 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 shadow-2xl">
                    <h3 className="text-2xl font-bold text-white mb-6">Khả Năng Tương Thích</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="text-lg font-semibold text-blue-400 mb-4">Mũ Bảo Hiểm</h4>
                            <ul className="text-gray-300 space-y-2">
                                <li>✓ Tất cả loại mũ bảo hiểm</li>
                                <li>✓ Mũ fullface, 3/4, nửa đầu</li>
                                <li>✓ Dễ dàng lắp đặt</li>
                                <li>✓ Không cần dụng cụ đặc biệt</li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold text-blue-400 mb-4">Thiết Bị</h4>
                            <ul className="text-gray-300 space-y-2">
                                <li>✓ Smartphone iOS/Android</li>
                                <li>✓ GPS navigation</li>
                                <li>✓ MP3 player</li>
                                <li>✓ FM radio</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
