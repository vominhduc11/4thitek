'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Product } from '../../_components/types';

interface ProductDescriptionProps {
    product: Product;
}

const ProductDescription = ({ product }: ProductDescriptionProps) => {
    return (
        <div className="relative py-20 bg-gradient-to-br from-[#4FC8FF] via-[#00D4FF] to-[#4FC8FF]">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute top-10 left-10 w-32 h-32 border-2 border-white rounded-full"></div>
                <div className="absolute bottom-10 right-10 w-24 h-24 border border-white rounded-full"></div>
                <div className="absolute top-1/2 left-1/4 w-16 h-16 border border-white rounded-full"></div>
                <div className="absolute top-1/4 right-1/4 w-20 h-20 border border-white rounded-full"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left Content */}
                    <motion.div
                        className="text-white"
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        {/* Title */}
                        <motion.h2
                            className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-8 leading-tight"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            viewport={{ once: true }}
                        >
                            ONLINE CHUYÊN NGHIỆP
                            <br />
                            <span className="text-black">THIẾT BỊ GIAO TIẾP</span>
                            <br />
                            DÀNH CHO XE MÁY
                        </motion.h2>

                        {/* Description */}
                        <motion.div
                            className="space-y-6 text-lg leading-relaxed"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            viewport={{ once: true }}
                        >
                            <p className="text-white/90">
                                {product.name} là giải pháp giao tiếp hàng đầu được thiết kế đặc biệt cho người lái xe
                                máy chuyên nghiệp. Với công nghệ Bluetooth tiên tiến và chất lượng âm thanh vượt trội.
                            </p>

                            <p className="text-white/90">
                                Sản phẩm mang đến trải nghiệm giao tiếp liền mạch, độ bền cao và khả năng chống nước
                                tuyệt vời, đáp ứng mọi nhu cầu sử dụng trong điều kiện khắc nghiệt.
                            </p>

                            {/* Features List */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                                {[
                                    'Bluetooth 5.0 Technology',
                                    'Waterproof IP67 Rating',
                                    'Crystal Clear Audio',
                                    'Extended Battery Life',
                                    'Easy Installation',
                                    'Professional Support'
                                ].map((feature, index) => (
                                    <motion.div
                                        key={feature}
                                        className="flex items-center space-x-3"
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                                        viewport={{ once: true }}
                                    >
                                        <div className="w-2 h-2 bg-white rounded-full flex-shrink-0"></div>
                                        <span className="text-white/90 text-sm sm:text-base">{feature}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>

                        {/* CTA Button */}
                        <motion.button
                            className="mt-8 bg-black text-white px-8 py-4 rounded-full font-bold text-lg tracking-wider hover:bg-gray-900 transition-colors shadow-lg"
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.8 }}
                            viewport={{ once: true }}
                        >
                            LEARN MORE
                        </motion.button>
                    </motion.div>

                    {/* Right Product Image */}
                    <motion.div
                        className="relative"
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.3 }}
                        viewport={{ once: true }}
                    >
                        {/* Background Glow */}
                        <div className="absolute inset-0 bg-white/20 rounded-full blur-3xl scale-110"></div>

                        {/* Product Image */}
                        <div className="relative w-full aspect-square max-w-md mx-auto">
                            <Image
                                src={product.image}
                                alt={product.name}
                                fill
                                className="object-contain z-10 relative drop-shadow-2xl"
                            />
                        </div>

                        {/* Floating Elements */}
                        <motion.div
                            className="absolute -top-8 -right-8 w-16 h-16 border-2 border-white/30 rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                        />
                        <motion.div
                            className="absolute -bottom-8 -left-8 w-12 h-12 border border-white/30 rounded-full"
                            animate={{ rotate: -360 }}
                            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                        />

                        {/* Series Badge */}
                        <motion.div
                            className="absolute top-4 right-4 bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full"
                            initial={{ opacity: 0, scale: 0 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.6, delay: 0.6 }}
                            viewport={{ once: true }}
                        >
                            <span className="text-white font-bold text-sm tracking-wider">{product.series}</span>
                        </motion.div>
                    </motion.div>
                </div>

                {/* Bottom Stats */}
                <motion.div
                    className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-16 border-t border-white/20"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    viewport={{ once: true }}
                >
                    {[
                        { number: '1000+', label: 'Happy Customers' },
                        { number: '50+', label: 'Distributors' },
                        { number: '24/7', label: 'Support' },
                        { number: '2Y', label: 'Warranty' }
                    ].map((stat, index) => (
                        <motion.div
                            key={stat.label}
                            className="text-center text-white"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                            viewport={{ once: true }}
                        >
                            <div className="text-3xl sm:text-4xl font-bold mb-2">{stat.number}</div>
                            <div className="text-white/80 text-sm uppercase tracking-wider">{stat.label}</div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </div>
    );
};

export default ProductDescription;
