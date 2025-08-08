// src/app/global-error.tsx
'use client';

import Link from 'next/link';
import { FiAlertTriangle } from 'react-icons/fi';
import { motion, Variants } from 'framer-motion';

// Animation variants
const containerVariants: Variants = {
    hidden: { y: 50, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', duration: 0.8 } }
};
const iconVariants: Variants = {
    hidden: { rotate: 12, scale: 0.5, opacity: 0 },
    visible: { rotate: 0, scale: 1, opacity: 1, transition: { type: 'spring', stiffness: 150, delay: 0.1 } }
};
const titleVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { delay: 0.25 } }
};
const descVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { delay: 0.35 } }
};
const actionsVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { delay: 0.55 } }
};

export default function GlobalError({ reset }: { reset: () => void }) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#2c2327] via-[#21233b] to-[#151622] px-2 xs:px-4 sm:px-8 md:px-12 lg:px-20">
            <motion.div
                className="bg-[#1a1a23] rounded-2xl shadow-2xl px-4 py-8 xs:p-8 sm:p-10 md:p-12 lg:p-16 max-w-full xs:max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl flex flex-col items-center border border-[#23283c]"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.span
                    className="bg-red-900/70 p-3 xs:p-4 rounded-full mb-3 border border-red-700"
                    variants={iconVariants}
                >
                    <FiAlertTriangle size={32} className="xs:hidden text-red-400" />
                    <FiAlertTriangle size={44} className="hidden xs:block sm:hidden text-red-400" />
                    <FiAlertTriangle size={52} className="hidden sm:block md:hidden text-red-400" />
                    <FiAlertTriangle size={64} className="hidden md:block lg:hidden text-red-400" />
                    <FiAlertTriangle size={76} className="hidden lg:block text-red-400" />
                </motion.span>
                <motion.h1
                    className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl 2xl:text-7xl 3xl:text-8xl 4xl:text-9xl 5xl:text-[6rem] font-bold text-red-300 mb-2 text-center"
                    variants={titleVariants}
                >
                    Đã có lỗi xảy ra
                </motion.h1>
                <motion.p
                    className="text-gray-400 text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl 2xl:text-4xl 3xl:text-5xl 4xl:text-6xl 5xl:text-7xl text-center mb-5"
                    variants={descVariants}
                >
                    Xin lỗi, hệ thống vừa xảy ra sự cố. Vui lòng thử lại hoặc liên hệ nhà phân phối để được hỗ trợ.
                </motion.p>
                <motion.div
                    className="flex flex-col xs:flex-row gap-2 xs:gap-3 w-full mt-1 xs:mt-2 mb-1"
                    variants={actionsVariants}
                >
                    <button
                        onClick={() => reset()}
                        className="w-full xs:flex-1 py-2 xs:py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-center text-sm xs:text-base transition"
                    >
                        Thử lại
                    </button>
                    <Link
                        href="/home"
                        className="w-full xs:flex-1 py-2 xs:py-2.5 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-900/30 text-center font-semibold text-sm xs:text-base transition"
                    >
                        Về trang chủ
                    </Link>
                </motion.div>
            </motion.div>
        </div>
    );
}
