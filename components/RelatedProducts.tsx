import React from 'react';
import Image from 'next/image';
import { MdChevronRight } from 'react-icons/md';

const RelatedProducts = () => {
  const relatedProducts = [
    {
      id: 1,
      series: "SERIES A",
      title: "Mũ Bảo Hiểm Bluetooth Pro",
      description: "Kết nối không dây tiên tiến",
      image: "/api/placeholder/120/80"
    },
    {
      id: 2,
      series: "SERIES B", 
      title: "Intercom Wireless V5.0",
      description: "Âm thanh chất lượng cao",
      image: "/api/placeholder/120/80"
    },
    {
      id: 3,
      series: "SERIES C",
      title: "Smart Helmet Premium", 
      description: "Công nghệ thông minh",
      image: "/api/placeholder/120/80"
    },
    {
      id: 4,
      series: "SERIES D",
      title: "Racing Helmet Elite",
      description: "Dành cho tay đua chuyên nghiệp", 
      image: "/api/placeholder/120/80"
    }
  ];

  return (
    <section className="py-8 md:py-16 border-t border-gray-800">
      <div className="container mx-auto px-2 md:px-4">
        <h3 className="text-xl md:text-2xl font-bold text-white mb-6 md:mb-8 tracking-wider">
          RELATED PRODUCT
        </h3>
        
        {/* Desktop Grid */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-6">
          {relatedProducts.map((product) => (
            <RelatedProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Mobile/Tablet Carousel */}
        <div className="lg:hidden flex overflow-x-auto space-x-4 pb-4 scrollbar-hide">
          {relatedProducts.map((product) => (
            <div key={product.id} className="flex-shrink-0 w-64">
              <RelatedProductCard product={product} />
            </div>
          ))}
        </div>

        {/* Scroll Indicators for Mobile */}
        <div className="lg:hidden flex justify-center mt-4 space-x-2">
          {relatedProducts.map((_, index) => (
            <div 
              key={index}
              className="w-2 h-2 bg-gray-600 rounded-full"
            />
          ))}
        </div>
      </div>
    </section>
  );
};

// Related Product Card Component
interface RelatedProduct {
  id: number;
  series: string;
  title: string;
  description: string;
  image: string;
}

interface RelatedProductCardProps {
  product: RelatedProduct;
}

const RelatedProductCard = ({ product }: RelatedProductCardProps) => (
  <div className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-all duration-300 cursor-pointer group hover:transform hover:scale-105">
    <div className="flex items-start space-x-4">
      {/* Series Label - Rotated */}
      <div className="text-xs text-gray-400 transform -rotate-90 whitespace-nowrap mt-8 hidden sm:block">
        {product.series}
      </div>
      
      {/* Series Label - Normal for mobile */}
      <div className="text-xs text-gray-400 mb-2 sm:hidden">
        {product.series}
      </div>
      
      <div className="flex-1">
        {/* Product Image */}
        <div className="relative w-full h-20 mb-3 rounded overflow-hidden bg-gray-800">
          <Image
            src={product.image}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-300"
          />
        </div>
        
        {/* Product Info */}
        <h4 className="text-sm font-medium text-white mb-1 group-hover:text-blue-300 transition-colors">
          {product.title}
        </h4>
        <p className="text-xs text-gray-400 mb-2 line-clamp-2">
          {product.description}
        </p>
      </div>
      
      {/* Arrow Icon */}
      <MdChevronRight className="w-4 h-4 text-white/40 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
    </div>
  </div>
);

export default RelatedProducts;
