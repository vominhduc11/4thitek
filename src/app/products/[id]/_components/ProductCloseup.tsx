'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Product } from '../../_components/types';

interface ProductCloseupProps {
    product: Product;
}

const ProductCloseup = ({ product }: ProductCloseupProps) => {
    return (
        <div className="relative py-20 bg-[#0a0f1a]">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#4FC8FF]/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left - Product Closeup Image */}
                    <motion.div
                        className="relative order-2 lg:order-1"
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        {/* Main Product Image */}
                        <div className="relative w-full aspect-square max-w-lg mx-auto">
                            {/* Glow Background */}
                            <div className="absolute inset-0 bg-gradient-to-r from-[#4FC8FF]/20 to-[#00D4FF]/20 rounded-full blur-3xl scale-110"></div>

                            <Image
                                src={product.image}
                                alt={`${product.name} closeup`}
                                fill
                                className="object-contain z-10 relative drop-shadow-2xl"
                            />

                            {/* Technical Callouts */}
                            <motion.div
                                className="absolute top-1/4 -right-4 bg-[#4FC8FF] text-black px-3 py-2 rounded-lg text-sm font-bold"
                                initial={{ opacity: 0, scale: 0 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.6, delay: 0.5 }}
                                viewport={{ once: true }}
                            >
                                Bluetooth 5.0
                            </motion.div>

                            <motion.div
                                className="absolute bottom-1/3 -left-4 bg-white text-black px-3 py-2 rounded-lg text-sm font-bold"
                                initial={{ opacity: 0, scale: 0 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.6, delay: 0.7 }}
                                viewport={{ once: true }}
                            >
                                IP67 Waterproof
                            </motion.div>

                            <motion.div
                                className="absolute top-1/2 right-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-2 rounded-lg text-sm font-bold"
                                initial={{ opacity: 0, scale: 0 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.6, delay: 0.9 }}
                                viewport={{ once: true }}
                            >
                                HD Audio
                            </motion.div>
                        </div>

                        {/* Technical Specs Overlay */}
                        <motion.div
                            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-2xl"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            viewport={{ once: true }}
                        >
                            <div className="grid grid-cols-3 gap-4 text-center text-white">
                                <div>
                                    <div className="text-lg font-bold text-[#4FC8FF]">1000m</div>
                                    <div className="text-xs">Range</div>
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-[#4FC8FF]">15h</div>
                                    <div className="text-xs">Battery</div>
                                </div>
                                <div>
                                    <div className="text-lg font-bold text-[#4FC8FF]">85g</div>
                                    <div className="text-xs">Weight</div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>

                    {/* Right - Technical Content */}
                    <motion.div
                        className="text-white order-1 lg:order-2"
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        viewport={{ once: true }}
                    >
                        {/* Title */}
                        <motion.h2
                            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-8 leading-tight"
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            viewport={{ once: true }}
                        >
                            THIẾT KẾ
                            <br />
                            <span className="text-[#4FC8FF]">CÔNG HỌC</span>
                        </motion.h2>

                        {/* Description */}
                        <motion.p
                            className="text-xl text-gray-300 mb-8 leading-relaxed"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                            viewport={{ once: true }}
                        >
                            Mỗi chi tiết của {product.name} được thiết kế tỉ mỉ để mang đến trải nghiệm sử dụng tối ưu
                            và độ bền vượt trội.
                        </motion.p>

                        {/* Technical Features */}
                        <div className="space-y-6 mb-8">
                            {[
                                {
                                    title: 'Chất liệu cao cấp',
                                    description: 'Vỏ ngoài bằng nhựa ABS chống va đập, khung kim loại bên trong',
                                    icon: '🛡️'
                                },
                                {
                                    title: 'Thiết kế ergonomic',
                                    description: 'Phù hợp với mọi loại mũ bảo hiểm, không gây khó chịu khi sử dụng lâu',
                                    icon: '👤'
                                },
                                {
                                    title: 'Kết nối thông minh',
                                    description: 'Tự động kết nối và nhớ thiết bị, hỗ trợ kết nối đa điểm',
                                    icon: '🔗'
                                },
                                {
                                    title: 'Điều khiển dễ dàng',
                                    description: 'Nút bấm lớn, dễ thao tác ngay cả khi đeo găng tay',
                                    icon: '🎛️'
                                }
                            ].map((feature, index) => (
                                <motion.div
                                    key={feature.title}
                                    className="flex items-start space-x-4 p-4 bg-white/5 rounded-xl border border-white/10"
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                                    viewport={{ once: true }}
                                    whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.1)' }}
                                >
                                    <div className="text-2xl">{feature.icon}</div>
                                    <div>
                                        <h3 className="text-lg font-bold text-[#4FC8FF] mb-2">{feature.title}</h3>
                                        <p className="text-gray-300 text-sm leading-relaxed">{feature.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* CTA */}
                        <motion.button
                            className="bg-gradient-to-r from-[#4FC8FF] to-[#00D4FF] text-black font-bold px-8 py-4 rounded-full text-lg tracking-wider shadow-lg shadow-[#4FC8FF]/30"
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.8 }}
                            viewport={{ once: true }}
                        >
                            VIEW SPECIFICATIONS
                        </motion.button>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ProductCloseup;
