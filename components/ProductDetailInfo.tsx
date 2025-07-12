import React from 'react';
import Image from 'next/image';

const ProductDetailInfo = () => {
  return (
    <section className="py-8 md:py-16">
      <div className="container mx-auto px-2 md:px-4">
        {/* 3.1 Title and Description */}
        <div className="mb-8 md:mb-12">
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-4 md:mb-6 tracking-wider">
            MŨ BẢO HIỂM TÍCH HỢP INTERCOM CHUYÊN NGHIỆP
          </h3>
          <p className="text-sm md:text-base text-gray-300 leading-relaxed max-w-4xl">
            Sản phẩm mũ bảo hiểm tích hợp hệ thống intercom tiên tiến, được thiết kế đặc biệt 
            cho các biker chuyên nghiệp. Kết hợp hoàn hảo giữa tính năng bảo vệ an toàn và 
            khả năng liên lạc không dây hiện đại.
          </p>
        </div>

        {/* 3.2 Main Product Image */}
        <div className="mb-8 md:mb-12">
          <div className="relative w-full h-64 md:h-96 lg:h-[500px] rounded-lg overflow-hidden">
            <Image
              src="/api/placeholder/1200/500"
              alt="Mũ bảo hiểm tích hợp intercom"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* 3.3 Features List */}
        <div className="mb-8 md:mb-12">
          <h4 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6 tracking-wider">
            THIẾT KẾ HOÀN HẢO
          </h4>
          <ul className="space-y-3">
            {[
              "Vỏ ngoài bằng nhựa ABS cao cấp, chống va đập mạnh",
              "Đệm mút bên trong êm ái, thấm hút mồ hôi tốt",
              "Đạt chuẩn chất lượng DOT và ECE 22.05",
              "Hệ thống thông gió thông minh, giảm nhiệt hiệu quả",
              "Kính chắn gió chống tia UV, chống bám bụi"
            ].map((feature, index) => (
              <li key={index} className="flex items-start space-x-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                <span className="text-sm text-gray-300">
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* 3.4 Secondary Image */}
        <div className="mb-8 md:mb-12">
          <div className="relative w-full h-64 md:h-96 lg:h-[400px] rounded-lg overflow-hidden shadow-lg">
            <Image
              src="/api/placeholder/1200/400"
              alt="Người lái moto với mũ bảo hiểm intercom"
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* 3.5 Detail Image */}
        <div className="mb-8 md:mb-12">
          <div className="relative w-full h-64 md:h-80 lg:h-[350px] rounded-lg overflow-hidden shadow-lg">
            <Image
              src="/api/placeholder/1200/350"
              alt="Cận cảnh hệ thống intercom"
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Additional Technical Specs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          <div>
            <h4 className="text-lg font-bold text-white mb-4">THÔNG SỐ KỸ THUẬT</h4>
            <div className="space-y-2">
              <div className="flex justify-between border-b border-gray-700 pb-2">
                <span className="text-gray-400">Trọng lượng:</span>
                <span className="text-white">1.2kg</span>
              </div>
              <div className="flex justify-between border-b border-gray-700 pb-2">
                <span className="text-gray-400">Kết nối:</span>
                <span className="text-white">Bluetooth 5.0</span>
              </div>
              <div className="flex justify-between border-b border-gray-700 pb-2">
                <span className="text-gray-400">Pin:</span>
                <span className="text-white">Li-ion 1000mAh</span>
              </div>
              <div className="flex justify-between border-b border-gray-700 pb-2">
                <span className="text-gray-400">Tầm kết nối:</span>
                <span className="text-white">1000m</span>
              </div>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-bold text-white mb-4">TÍNH NĂNG NỔI BẬT</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm text-gray-300">Chống nước IPX6</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm text-gray-300">Khử tiếng ồn DSP</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm text-gray-300">Điều khiển giọng nói</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span className="text-sm text-gray-300">Kết nối đa thiết bị</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProductDetailInfo;
