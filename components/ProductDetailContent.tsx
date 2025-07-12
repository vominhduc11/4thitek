import React from 'react';
import Image from 'next/image';
import { MdChevronRight, MdCardGiftcard, MdHeadset, MdSecurity, MdStar } from 'react-icons/md';

const ProductDetailContent = () => {
  return (
    <div className="bg-black text-white">
      {/* 1. Sub-navigation */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center space-x-8 text-sm font-normal text-gray-400">
            <a href="#" className="border-b-2 border-blue-400 text-white pb-2">
              PRODUCT DETAILS
            </a>
            <a href="#" className="hover:text-white transition-colors">
              PRODUCT VIDEOS
            </a>
            <a href="#" className="hover:text-white transition-colors">
              SPECIALIST
            </a>
            <a href="#" className="hover:text-white transition-colors">
              CATEGORY3
            </a>
          </nav>
        </div>
      </div>

      {/* 2. Product Featured Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-white mb-8 tracking-wider">
            PRODUCT FEATURED
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Feature Card 1 */}
            <div className="bg-slate-800 rounded-2xl p-6 relative overflow-hidden">
              <div className="text-4xl font-bold text-white mb-2">1%</div>
              <div className="text-sm text-blue-300 mb-3">BATTERY CONSUMPTION</div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Tiết kiệm pin tối ưu với công nghệ tiên tiến
              </p>
              <MdHeadset className="w-8 h-8 text-white/20 absolute bottom-4 right-4" />
            </div>

            {/* Feature Card 2 */}
            <div className="bg-slate-800 rounded-2xl p-6 relative overflow-hidden">
              <div className="text-4xl font-bold text-white mb-2">10.5</div>
              <div className="text-sm text-blue-300 mb-3">HOURS TALK TIME</div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Thời gian đàm thoại liên tục lên đến 10.5 giờ
              </p>
              <MdSecurity className="w-8 h-8 text-white/20 absolute bottom-4 right-4" />
            </div>

            {/* Feature Card 3 */}
            <div className="bg-slate-800 rounded-2xl p-6 relative overflow-hidden">
              <div className="text-4xl font-bold text-white mb-2">FREE</div>
              <div className="text-sm text-blue-300 mb-3">SHIPPING</div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Miễn phí vận chuyển toàn quốc cho đơn hàng
              </p>
              <MdCardGiftcard className="w-8 h-8 text-white/20 absolute bottom-4 right-4" />
            </div>

            {/* Feature Card 4 */}
            <div className="bg-slate-800 rounded-2xl p-6 relative overflow-hidden">
              <div className="text-4xl font-bold text-white mb-2">5★</div>
              <div className="text-sm text-blue-300 mb-3">RATING</div>
              <p className="text-xs text-gray-300 leading-relaxed">
                Đánh giá 5 sao từ hàng nghìn khách hàng
              </p>
              <MdStar className="w-8 h-8 text-white/20 absolute bottom-4 right-4" />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Product Detail Information */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          {/* 3.1 Title and Description */}
          <div className="mb-12">
            <h3 className="text-3xl font-bold text-white mb-6 tracking-wider">
              MŨ BẢO HIỂM TÍCH HỢP INTERCOM CHUYÊN NGHIỆP
            </h3>
            <p className="text-base text-gray-300 leading-relaxed max-w-4xl">
              Sản phẩm mũ bảo hiểm tích hợp hệ thống intercom tiên tiến, được thiết kế đặc biệt 
              cho các biker chuyên nghiệp. Kết hợp hoàn hảo giữa tính năng bảo vệ an toàn và 
              khả năng liên lạc không dây hiện đại.
            </p>
          </div>

          {/* 3.2 Main Product Image */}
          <div className="mb-12">
            <div className="relative w-full h-96 md:h-[500px] rounded-lg overflow-hidden">
              <Image
                src="/api/placeholder/1200/500"
                alt="Mũ bảo hiểm tích hợp intercom"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* 3.3 Features List */}
          <div className="mb-12">
            <h4 className="text-2xl font-bold text-white mb-6 tracking-wider">
              THIẾT KẾ HOÀN HẢO
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-gray-300">
                  Vỏ ngoài bằng nhựa ABS cao cấp, chống va đập mạnh
                </span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-gray-300">
                  Đệm mút bên trong êm ái, thấm hút mồ hôi tốt
                </span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-gray-300">
                  Đạt chuẩn chất lượng DOT và ECE 22.05
                </span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-gray-300">
                  Hệ thống thông gió thông minh, giảm nhiệt hiệu quả
                </span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-gray-300">
                  Kính chắn gió chống tia UV, chống bám bụi
                </span>
              </li>
            </ul>
          </div>

          {/* 3.4 Secondary Image */}
          <div className="mb-12">
            <div className="relative w-full h-96 md:h-[400px] rounded-lg overflow-hidden shadow-lg">
              <Image
                src="/api/placeholder/1200/400"
                alt="Người lái moto với mũ bảo hiểm intercom"
                fill
                className="object-cover"
              />
            </div>
          </div>

          {/* 3.5 Detail Image */}
          <div className="mb-12">
            <div className="relative w-full h-80 md:h-[350px] rounded-lg overflow-hidden shadow-lg">
              <Image
                src="/api/placeholder/1200/350"
                alt="Cận cảnh hệ thống intercom"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. Related Products */}
      <section className="py-16 border-t border-gray-800">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-bold text-white mb-8 tracking-wider">
            RELATED PRODUCT
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Related Product 1 */}
            <div className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors cursor-pointer group">
              <div className="flex items-start space-x-4">
                <div className="text-xs text-gray-400 transform -rotate-90 whitespace-nowrap mt-8">
                  SERIES A
                </div>
                <div className="flex-1">
                  <div className="relative w-full h-20 mb-3 rounded overflow-hidden">
                    <Image
                      src="/api/placeholder/120/80"
                      alt="Related product 1"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <h4 className="text-sm font-medium text-white mb-1">
                    Mũ Bảo Hiểm Bluetooth Pro
                  </h4>
                  <p className="text-xs text-gray-400 mb-2">
                    Kết nối không dây tiên tiến
                  </p>
                </div>
                <MdChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
              </div>
            </div>

            {/* Related Product 2 */}
            <div className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors cursor-pointer group">
              <div className="flex items-start space-x-4">
                <div className="text-xs text-gray-400 transform -rotate-90 whitespace-nowrap mt-8">
                  SERIES B
                </div>
                <div className="flex-1">
                  <div className="relative w-full h-20 mb-3 rounded overflow-hidden">
                    <Image
                      src="/api/placeholder/120/80"
                      alt="Related product 2"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <h4 className="text-sm font-medium text-white mb-1">
                    Intercom Wireless V5.0
                  </h4>
                  <p className="text-xs text-gray-400 mb-2">
                    Âm thanh chất lượng cao
                  </p>
                </div>
                <MdChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
              </div>
            </div>

            {/* Related Product 3 */}
            <div className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors cursor-pointer group">
              <div className="flex items-start space-x-4">
                <div className="text-xs text-gray-400 transform -rotate-90 whitespace-nowrap mt-8">
                  SERIES C
                </div>
                <div className="flex-1">
                  <div className="relative w-full h-20 mb-3 rounded overflow-hidden">
                    <Image
                      src="/api/placeholder/120/80"
                      alt="Related product 3"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <h4 className="text-sm font-medium text-white mb-1">
                    Smart Helmet Premium
                  </h4>
                  <p className="text-xs text-gray-400 mb-2">
                    Công nghệ thông minh
                  </p>
                </div>
                <MdChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
              </div>
            </div>

            {/* Related Product 4 */}
            <div className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors cursor-pointer group">
              <div className="flex items-start space-x-4">
                <div className="text-xs text-gray-400 transform -rotate-90 whitespace-nowrap mt-8">
                  SERIES D
                </div>
                <div className="flex-1">
                  <div className="relative w-full h-20 mb-3 rounded overflow-hidden">
                    <Image
                      src="/api/placeholder/120/80"
                      alt="Related product 4"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <h4 className="text-sm font-medium text-white mb-1">
                    Racing Helmet Elite
                  </h4>
                  <p className="text-xs text-gray-400 mb-2">
                    Dành cho tay đua chuyên nghiệp
                  </p>
                </div>
                <MdChevronRight className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProductDetailContent;
