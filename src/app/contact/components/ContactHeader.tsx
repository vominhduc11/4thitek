'use client';

import { motion } from 'framer-motion';

export default function ContactHeader() {
    return (
        <div className="ml-16 sm:ml-20 -mt-16 sm:-mt-20 lg:-mt-24 relative z-20 py-4 sm:py-6 lg:py-8">
            <div className="px-12 sm:px-16 lg:px-20">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                >
                    <motion.h1
                        className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 font-mono text-[#4FC8FF]"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    >
                        CONTACT US
                    </motion.h1>

                    <motion.p
                        className="text-gray-300 text-sm sm:text-base lg:text-lg mb-8 leading-relaxed max-w-4xl"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        Liên hệ với chúng tôi để được tư vấn và hỗ trợ tốt nhất. Đội ngũ chuyên viên của TuneZone luôn
                        sẵn sàng giải đáp mọi thắc mắc và hỗ trợ bạn tìm được sản phẩm phù hợp nhất.
                    </motion.p>
                </motion.div>
            </div>
        </div>
    );
}
