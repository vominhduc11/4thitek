'use client';

import { motion } from 'framer-motion';
import {
    MdKeyboardDoubleArrowLeft,
    MdKeyboardArrowLeft,
    MdKeyboardArrowRight,
    MdKeyboardDoubleArrowRight
} from 'react-icons/md';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    showCount?: boolean; // Option to show/hide count display
    countLabel?: string; // Custom label for count (e.g., "sản phẩm", "bài viết")
}

export default function Pagination({
    currentPage,
    totalPages,
    totalItems,
    onPageChange,
    showCount = false,
    countLabel = 'items'
}: PaginationProps) {
    // Don't render if there's only one page or no items
    if (totalPages <= 1 || totalItems === 0) {
        return null;
    }

    const itemsPerPage = Math.ceil(totalItems / totalPages);
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="ml-16 sm:ml-20 mr-4 sm:mr-12 md:mr-16 lg:mr-20 py-8 sm:py-12">
            <div className="px-4 sm:px-6 lg:px-8">
                <motion.div
                    className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 lg:gap-8 relative"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                >
                    {/* Horizontal Divider Line - Full Width */}
                    <motion.div
                        className="absolute left-0 right-0 top-1/2 h-px bg-gradient-to-r from-gray-500/40 via-gray-500/70 to-gray-500/40 z-0 hidden lg:block"
                        initial={{ scaleX: 0, opacity: 0 }}
                        animate={{ scaleX: 1, opacity: 1 }}
                        transition={{ duration: 1.2, delay: 0.5 }}
                        style={{ transform: 'translateY(-0.5px)' }}
                    />

                    {/* Left Side - Count Display (Optional) */}
                    {showCount && (
                        <div className="flex items-center space-x-4 bg-[#0c131d] pr-4 relative z-10">
                            {/* Short Divider Line */}
                            <motion.div
                                className="w-12 sm:w-16 h-px bg-gray-600/50"
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ duration: 0.8, delay: 0.6 }}
                            />

                            {/* Count Display */}
                            <motion.div
                                className="group flex items-center space-x-2"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.6, delay: 0.4 }}
                            >
                                <span className="text-[#4FC8FF] font-bold text-lg sm:text-xl font-mono">
                                    {startItem}
                                </span>
                                <span className="text-white/70 font-sans text-sm">/{totalItems}</span>
                            </motion.div>
                        </div>
                    )}

                    {/* Navigation Controls */}
                    <motion.div
                        className={`flex items-center space-x-2 bg-[#0c131d] px-4 relative z-10 ${
                            showCount ? '' : 'mx-auto'
                        }`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.7 }}
                    >
                        {/* First Page */}
                        <motion.button
                            className="p-2 text-white/40 hover:text-white/70 transition-colors duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            disabled={currentPage === 1}
                            onClick={() => onPageChange(1)}
                            aria-label="First page"
                        >
                            <MdKeyboardDoubleArrowLeft className="w-4 h-4" />
                        </motion.button>

                        {/* Previous Page */}
                        <motion.button
                            className="p-2 text-white/40 hover:text-white/70 transition-colors duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            disabled={currentPage === 1}
                            onClick={() => onPageChange(currentPage - 1)}
                            aria-label="Previous page"
                        >
                            <MdKeyboardArrowLeft className="w-4 h-4" />
                        </motion.button>

                        {/* Page Numbers */}
                        <div className="flex items-center space-x-1 px-4">
                            <motion.span
                                className="px-3 py-1 bg-[#4FC8FF]/20 border border-[#4FC8FF]/50 rounded text-[#4FC8FF] font-bold text-sm min-w-[2rem] text-center"
                                key={currentPage}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.3 }}
                            >
                                {currentPage}
                            </motion.span>
                            <span className="text-white/50 text-sm mx-2">of</span>
                            <span className="text-white/70 font-medium text-sm">{totalPages}</span>
                        </div>

                        {/* Next Page */}
                        <motion.button
                            className="p-2 text-white/40 hover:text-white/70 transition-colors duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            disabled={currentPage === totalPages}
                            onClick={() => onPageChange(currentPage + 1)}
                            aria-label="Next page"
                        >
                            <MdKeyboardArrowRight className="w-4 h-4" />
                        </motion.button>

                        {/* Last Page */}
                        <motion.button
                            className="p-2 text-white/40 hover:text-white/70 transition-colors duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            disabled={currentPage === totalPages}
                            onClick={() => onPageChange(totalPages)}
                            aria-label="Last page"
                        >
                            <MdKeyboardDoubleArrowRight className="w-4 h-4" />
                        </motion.button>
                    </motion.div>
                </motion.div>

                {/* Mobile Responsive Version */}
                <motion.div
                    className="flex lg:hidden items-center justify-center mt-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                >
                    <div className="flex items-center space-x-2">
                        <motion.button
                            className="p-2 text-white/40 disabled:opacity-30"
                            whileTap={{ scale: 0.9 }}
                            disabled={currentPage === 1}
                            onClick={() => onPageChange(currentPage - 1)}
                            aria-label="Previous page"
                        >
                            <MdKeyboardArrowLeft className="w-4 h-4" />
                        </motion.button>

                        <span className="text-white/70 text-sm font-medium px-4">
                            {currentPage} of {totalPages}
                        </span>

                        <motion.button
                            className="p-2 text-white/40 disabled:opacity-30"
                            whileTap={{ scale: 0.9 }}
                            disabled={currentPage === totalPages}
                            onClick={() => onPageChange(currentPage + 1)}
                            aria-label="Next page"
                        >
                            <MdKeyboardArrowRight className="w-4 h-4" />
                        </motion.button>
                    </div>
                </motion.div>

                {/* Count Summary (Optional) */}
                {showCount && (
                    <motion.div
                        className="text-center mt-8 pt-6 border-t border-white/10"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.9 }}
                    >
                        <p className="text-gray-400 text-sm">
                            Hiển thị <span className="text-[#4FC8FF] font-semibold">{startItem}</span> đến{' '}
                            <span className="text-[#4FC8FF] font-semibold">{endItem}</span> trong tổng số{' '}
                            <span className="text-white font-semibold">{totalItems}</span> {countLabel}
                        </p>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
