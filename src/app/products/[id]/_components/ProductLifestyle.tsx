'use client';

import { motion } from 'framer-motion';
import { Product } from '../../_components/types';

interface ProductLifestyleProps {
    product: Product;
}

const ProductLifestyle = ({ product }: ProductLifestyleProps) => {
    return (
        <div className="relative py-20 bg-gradient-to-b from-gray-900 to-[#0a0f1a]">
            {/* Background Image Overlay */}
            <div className="absolute inset-0 bg-[url('/images/motorcycle-lifestyle.jpg')] bg-cover bg-center opacity-20"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/80"></div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-8">
                <div className="text-center">
                    {/* Title */}
                    <motion.h2
                        className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-8"
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                    >
                        TRẢI NGHIỆM THỰC TẾ
                    </motion.h2>

                    {/* Subtitle */}
                    <motion.p
                        className="text-xl sm:text-2xl text-gray-300 mb-16 max-w-3xl mx-auto leading-relaxed"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        viewport={{ once: true }}
                    >
                        Khám phá cách {product.name} hoạt động trong môi trường thực tế, mang đến trải nghiệm giao tiếp
                        hoàn hảo cho mọi hành trình.
                    </motion.p>

                    {/* Lifestyle Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
                        {[
                            {
                                title: 'URBAN RIDING',
                                description:
                                    'Hoàn hảo cho việc di chuyển trong thành phố với chất lượng âm thanh rõ ràng',
                                icon: '🏙️'
                            },
                            {
                                title: 'LONG DISTANCE',
                                description: 'Pin bền bỉ và kết nối ổn định cho những chuyến đi dài',
                                icon: '🛣️'
                            },
                            {
                                title: 'GROUP RIDING',
                                description: 'Giao tiếp nhóm mượt mà với nhiều người lái cùng lúc',
                                icon: '👥'
                            }
                        ].map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
                                initial={{ opacity: 0, y: 50 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.4 + index * 0.2 }}
                                viewport={{ once: true }}
                                whileHover={{ y: -10, scale: 1.02 }}
                            >
                                <div className="text-4xl mb-4">{feature.icon}</div>
                                <h3 className="text-xl font-bold text-white mb-3 tracking-wider">{feature.title}</h3>
                                <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Call to Action */}
                    <motion.div
                        className="bg-gradient-to-r from-[#4FC8FF]/20 to-[#00D4FF]/20 backdrop-blur-sm rounded-2xl p-8 border border-[#4FC8FF]/30"
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        viewport={{ once: true }}
                    >
                        <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4">Sẵn sàng trải nghiệm?</h3>
                        <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                            Liên hệ với chúng tôi để được tư vấn và trải nghiệm {product.name}
                            trong môi trường thực tế.
                        </p>
                        <motion.button
                            className="bg-gradient-to-r from-[#4FC8FF] to-[#00D4FF] text-black font-bold px-8 py-4 rounded-full text-lg tracking-wider shadow-lg shadow-[#4FC8FF]/30"
                            whileHover={{ scale: 1.05, y: -2 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            CONTACT US
                        </motion.button>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ProductLifestyle;
