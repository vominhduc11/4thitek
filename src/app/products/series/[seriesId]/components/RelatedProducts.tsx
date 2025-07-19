'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiArrowUpRight } from 'react-icons/fi';
import { useRouter } from 'next/navigation';

export default function RelatedProducts() {
    const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);
    const router = useRouter();

    const handleProductClick = (productId: string) => {
        router.push(`/products/${productId}`);
    };

    const relatedProducts = [
        {
            id: 'product-1',
            name: 'SCS S-1',
            description: 'Bluetooth Intercom Basic - Thiết bị intercom cơ bản cho mũ bảo hiểm',
            image: '/products/product1.png',
            series: 'S SERIES'
        },
        {
            id: 'product-2',
            name: 'SCS S-3',
            description: 'Bluetooth Intercom Advanced - Thiết bị intercom nâng cao với nhiều tính năng',
            image: '/products/product2.png',
            series: 'S SERIES'
        },
        {
            id: 'product-3',
            name: 'SCS S-6',
            description: 'Bluetooth Intercom Premium - Thiết bị intercom cao cấp với âm thanh chất lượng',
            image: '/products/product3.png',
            series: 'S SERIES'
        },
        {
            id: 'product-4',
            name: 'SCS S-12',
            description: 'Bluetooth Intercom Pro Max - Thiết bị intercom đỉnh cao với công nghệ tiên tiến',
            image: '/products/product4.png',
            series: 'S SERIES'
        }
    ];

    return (
        <section className="py-16 px-4 bg-[#0a0f1a]">
            <div className="container mx-auto max-w-8xl">
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-12 text-center">SẢN PHẨM LIÊN QUAN</h2>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-0">
                    {relatedProducts.map((product, index) => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 50, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ delay: index * 0.1, type: 'spring', stiffness: 120, damping: 20 }}
                            whileHover={{
                                y: -5,
                                boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                                borderColor: 'rgba(79, 200, 255, 0.3)'
                            }}
                            onMouseEnter={() => setHoveredProductId(product.id)}
                            onMouseLeave={() => setHoveredProductId(null)}
                            onClick={() => handleProductClick(product.id)}
                            className="relative bg-gray-900/30 hover:bg-gray-800/50 transition-all duration-300 cursor-pointer group overflow-hidden min-h-[320px] xs:min-h-[360px] sm:min-h-[400px] md:min-h-[450px] lg:min-h-[500px] xl:min-h-[600px] flex flex-col rounded-lg lg:rounded-none border-t border-gray-700/50 lg:border-r lg:border-gray-700/50"
                        >
                            {/* Background Video */}
                            {hoveredProductId === product.id && (
                                <div className="absolute inset-0 z-[1]">
                                    <video
                                        autoPlay
                                        loop
                                        muted
                                        playsInline
                                        className="w-full h-full object-cover opacity-20"
                                    >
                                        <source
                                            src="/videos/futuristic-background-2022-08-04-19-57-56-utc.mp4"
                                            type="video/mp4"
                                        />
                                    </video>
                                </div>
                            )}

                            {/* Series Label */}
                            <div className="absolute left-1 xs:left-2 sm:left-3 md:left-4 top-1/2 -translate-y-1/2 z-20">
                                <div
                                    className="font-bold text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl uppercase tracking-wider xs:tracking-widest text-gray-400 group-hover:text-[#4FC8FF] transition-colors duration-300"
                                    style={{
                                        writingMode: 'vertical-rl',
                                        transform: 'translateY(-50%) rotate(180deg)'
                                    }}
                                >
                                    {product.series}
                                </div>
                            </div>

                            {/* Product Image */}
                            <div className="flex justify-center items-center py-4 xs:py-6 sm:py-8 md:py-10 lg:py-12 flex-1">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-[120px] xs:w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px] xl:w-[250px] h-auto object-contain"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const fallback = document.createElement('div');
                                        fallback.className = 'text-6xl text-gray-500';
                                        fallback.textContent = '🎧';
                                        target.parentNode?.appendChild(fallback);
                                    }}
                                />
                            </div>

                            {/* Content */}
                            <div className="px-2 xs:px-3 sm:px-4 md:px-6 pb-3 xs:pb-4 sm:pb-6 md:pb-8 pl-6 xs:pl-8 sm:pl-10 md:pl-12 lg:pl-16">
                                <h3 className="text-white font-bold text-base xs:text-lg sm:text-xl md:text-2xl mb-1.5 xs:mb-2 md:mb-3 font-sans group-hover:text-[#4FC8FF] transition-colors duration-300">
                                    {product.name}
                                </h3>
                                <p className="text-gray-300 text-xs xs:text-sm sm:text-base leading-relaxed mb-2 xs:mb-3 md:mb-4 font-sans line-clamp-3 sm:line-clamp-none">
                                    {product.description}
                                </p>

                                <div className="flex justify-between items-center mb-2 xs:mb-3">
                                    <span className="text-[#4FC8FF] font-semibold text-sm xs:text-base">
                                        Contact for Information
                                    </span>
                                </div>

                                <div className="text-gray-400 text-xs mb-2 xs:mb-3">Distributor Product</div>

                                <div className="flex justify-between items-center">
                                    <span className="bg-gradient-to-r from-gray-700 to-gray-600 text-white text-xs font-medium px-2 py-1 rounded-full uppercase tracking-wide">
                                        Intercom
                                    </span>
                                    <div className="flex justify-end">
                                        <FiArrowUpRight className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-gray-400 group-hover:text-[#4FC8FF] group-hover:scale-110 group-hover:rotate-45 transition-all duration-300" />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
