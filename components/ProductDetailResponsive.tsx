import React from 'react';
import { MdCardGiftcard, MdHeadset, MdSecurity, MdStar } from 'react-icons/md';

const ProductDetailResponsive = () => {
  return (
    <div className="bg-black text-white">
      {/* 1. Sub-navigation - Responsive */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-2 md:px-4 py-4">
          <nav className="flex items-center space-x-4 md:space-x-8 text-xs md:text-sm font-normal text-gray-400 overflow-x-auto scrollbar-hide">
            <a href="#" className="border-b-2 border-blue-400 text-white pb-2 whitespace-nowrap">
              PRODUCT DETAILS
            </a>
            <a href="#" className="hover:text-white transition-colors whitespace-nowrap">
              PRODUCT VIDEOS
            </a>
            <a href="#" className="hover:text-white transition-colors whitespace-nowrap">
              SPECIALIST
            </a>
            <a href="#" className="hover:text-white transition-colors whitespace-nowrap">
              CATEGORY3
            </a>
          </nav>
        </div>
      </div>

      {/* 2. Product Featured Section - Responsive */}
      <section className="py-8 md:py-16">
        <div className="container mx-auto px-2 md:px-4">
          <h2 className="text-xl md:text-2xl font-bold text-white mb-6 md:mb-8 tracking-wider">
            PRODUCT FEATURED
          </h2>
          
          {/* Desktop Grid */}
          <div className="hidden lg:grid lg:grid-cols-4 gap-4">
            <FeatureCard 
              number="1%" 
              subtitle="BATTERY CONSUMPTION" 
              description="Tiết kiệm pin tối ưu với công nghệ tiên tiến"
              icon={<MdHeadset className="w-8 h-8 text-white/20 absolute bottom-4 right-4" />}
            />
            <FeatureCard 
              number="10.5" 
              subtitle="HOURS TALK TIME" 
              description="Thời gian đàm thoại liên tục lên đến 10.5 giờ"
              icon={<MdSecurity className="w-8 h-8 text-white/20 absolute bottom-4 right-4" />}
            />
            <FeatureCard 
              number="FREE" 
              subtitle="SHIPPING" 
              description="Miễn phí vận chuyển toàn quốc cho đơn hàng"
              icon={<MdCardGiftcard className="w-8 h-8 text-white/20 absolute bottom-4 right-4" />}
            />
            <FeatureCard 
              number="5★" 
              subtitle="RATING" 
              description="Đánh giá 5 sao từ hàng nghìn khách hàng"
              icon={<MdStar className="w-8 h-8 text-white/20 absolute bottom-4 right-4" />}
            />
          </div>

          {/* Mobile/Tablet Carousel */}
          <div className="lg:hidden flex overflow-x-auto space-x-4 pb-4 scrollbar-hide">
            <div className="flex-shrink-0 w-72">
              <FeatureCard 
                number="1%" 
                subtitle="BATTERY CONSUMPTION" 
                description="Tiết kiệm pin tối ưu với công nghệ tiên tiến"
                icon={<MdHeadset className="w-8 h-8 text-white/20 absolute bottom-4 right-4" />}
              />
            </div>
            <div className="flex-shrink-0 w-72">
              <FeatureCard 
                number="10.5" 
                subtitle="HOURS TALK TIME" 
                description="Thời gian đàm thoại liên tục lên đến 10.5 giờ"
                icon={<MdSecurity className="w-8 h-8 text-white/20 absolute bottom-4 right-4" />}
              />
            </div>
            <div className="flex-shrink-0 w-72">
              <FeatureCard 
                number="FREE" 
                subtitle="SHIPPING" 
                description="Miễn phí vận chuyển toàn quốc cho đơn hàng"
                icon={<MdCardGiftcard className="w-8 h-8 text-white/20 absolute bottom-4 right-4" />}
              />
            </div>
            <div className="flex-shrink-0 w-72">
              <FeatureCard 
                number="5★" 
                subtitle="RATING" 
                description="Đánh giá 5 sao từ hàng nghìn khách hàng"
                icon={<MdStar className="w-8 h-8 text-white/20 absolute bottom-4 right-4" />}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// Feature Card Component
interface FeatureCardProps {
  number: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
}

const FeatureCard = ({ number, subtitle, description, icon }: FeatureCardProps) => (
  <div className="bg-slate-800 rounded-2xl p-6 relative overflow-hidden hover:transform hover:scale-105 transition-all duration-300">
    <div className="text-3xl md:text-4xl font-bold text-white mb-2">{number}</div>
    <div className="text-sm text-blue-300 mb-3">{subtitle}</div>
    <p className="text-xs text-gray-300 leading-relaxed">
      {description}
    </p>
    {icon}
  </div>
);

export default ProductDetailResponsive;
