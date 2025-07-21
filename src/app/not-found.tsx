// src/app/not-found.tsx
'use client';

import Link from 'next/link';
import { FiBox } from 'react-icons/fi';
import { motion, Variants } from 'framer-motion';
import { useHydration } from '@/hooks/useHydration';

// Animation variants
const containerVariants: Variants = {
    hidden: { y: 40, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', duration: 0.7 } }
};
const iconVariants: Variants = {
    hidden: { rotate: -10, scale: 0.7, opacity: 0 },
    visible: { rotate: 0, scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 120, delay: 0.15 } }
};
const textBlockVariants: Variants = {
    hidden: { scale: 0.7, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { type: 'spring', delay: 0.2 } }
};
const titleVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { delay: 0.35 } }
};
const descVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { delay: 0.45 } }
};
const actionsVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { delay: 0.6 } }
};
const copyrightVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { delay: 0.9 } }
};

export default function NotFound() {
    const isHydrated = useHydration();
    const currentYear = isHydrated ? new Date().getFullYear() : 2024;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#111827] via-[#23283c] to-[#141820] px-2 xs:px-4 sm:px-8 md:px-12 lg:px-20">
            <motion.div
                className="bg-[#181C2A] rounded-2xl shadow-2xl px-4 py-8 xs:p-8 sm:p-10 md:p-12 lg:p-16 max-w-full xs:max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl flex flex-col items-center border border-[#23283c]"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div
                    className="flex flex-col items-center gap-2 xs:gap-3 mb-4 xs:mb-6"
                    variants={textBlockVariants}
                >
                    <motion.span
                        className="bg-blue-950/60 p-3 xs:p-4 rounded-full mb-1 xs:mb-2 border border-blue-900"
                        variants={iconVariants}
                    >
                        {/* Icon size theo từng màn hình */}
                        <FiBox size={28} className="xs:hidden text-blue-400" />
                        <FiBox size={40} className="hidden xs:block sm:hidden text-blue-400" />
                        <FiBox size={48} className="hidden sm:block md:hidden text-blue-400" />
                        <FiBox size={56} className="hidden md:block lg:hidden text-blue-400" />
                        <FiBox size={64} className="hidden lg:block text-blue-400" />
                    </motion.span>
                    <motion.h1
                        className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-gray-50 mb-1 xs:mb-2 text-center"
                        variants={titleVariants}
                    >
                        Không tìm thấy trang
                    </motion.h1>
                    <motion.p
                        className="text-gray-400 text-sm xs:text-base sm:text-lg md:text-xl text-center"
                        variants={descVariants}
                    >
                        Có thể sản phẩm hoặc trang bạn tìm kiếm đã bị xoá hoặc tạm thời không có trên hệ thống nhà phân
                        phối.
                    </motion.p>
                </motion.div>
                <motion.div
                    className="flex flex-col xs:flex-row gap-2 xs:gap-3 w-full mt-3 xs:mt-4 mb-1 xs:mb-2"
                    variants={actionsVariants}
                >
                    <Link
                        href="/home"
                        className="w-full xs:flex-1 py-2 xs:py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-center text-sm xs:text-base transition"
                    >
                        Về trang chủ
                    </Link>
                    <Link
                        href="/products"
                        className="w-full xs:flex-1 py-2 xs:py-2.5 rounded-lg border border-blue-500 text-blue-400 hover:bg-blue-900/30 text-center font-semibold text-sm xs:text-base transition"
                    >
                        Xem sản phẩm
                    </Link>
                </motion.div>
                <motion.p
                    className="text-xs xs:text-sm text-gray-600 mt-4 xs:mt-6 text-center"
                    variants={copyrightVariants}
                >
                    © {currentYear} Nhà phân phối sản phẩm
                </motion.p>
            </motion.div>
        </div>
    );
}
