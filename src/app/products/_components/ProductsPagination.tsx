'use client';

import { motion } from 'framer-motion';
import {
    MdKeyboardArrowDown,
    MdKeyboardDoubleArrowLeft,
    MdKeyboardArrowLeft,
    MdKeyboardArrowRight,
    MdKeyboardDoubleArrowRight
} from 'react-icons/md';

interface ProductsPaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    currentItemsCount: number;
    onPageChange: (page: number) => void;
}

const ProductsPagination = ({
    currentPage,
    totalPages,
    totalItems,
    currentItemsCount,
    onPageChange
}: ProductsPaginationProps) => {
    return (
        <div className="ml-16 sm:ml-20 py-8 sm:py-12">
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

                    {/* Left Side - Show Count with Background */}
                    <div className="flex items-center space-x-4 bg-[#0c131d] pr-4 relative z-10">
                        {/* Short Divider Line */}
                        <motion.div
                            className="w-12 sm:w-16 h-px bg-gray-600/50"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 0.8, delay: 0.7 }}
                        />

                        {/* Show Count Dropdown */}
                        <motion.div
                            className="flex items-center space-x-2 cursor-pointer group"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, delay: 0.6 }}
                        >
                            <span className="text-white/70 group-hover:text-white transition-colors duration-300 font-sans text-sm">
                                Show
                            </span>
                            <span className="text-white font-medium text-sm">{currentItemsCount}</span>
                            <span className="text-white/70 group-hover:text-white transition-colors duration-300 font-sans text-sm">
                                /{totalItems}
                            </span>
                            <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }}>
                                <MdKeyboardArrowDown className="w-4 h-4 text-white/70 group-hover:text-white transition-colors duration-300" />
                            </motion.div>
                        </motion.div>
                    </div>

                    {/* Right Side - Pagination Controls with Background */}
                    <motion.div
                        className="flex items-center space-x-2 bg-[#0c131d] pl-4 relative z-10"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.7 }}
                    >
                        {/* First Page */}
                        <motion.button
                            className="p-2 text-white/40 hover:text-white/70 transition-colors duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            disabled={currentPage === 1}
                            onClick={() => onPageChange(1)}
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
                        >
                            <MdKeyboardArrowLeft className="w-4 h-4" />
                        </motion.button>

                        {/* Page Numbers */}
                        <div className="flex items-center space-x-1 px-4">
                            {/* Current Page */}
                            <motion.span
                                className="px-3 py-1.5 bg-[#4FC8FF]/20 border border-[#4FC8FF]/50 rounded text-[#4FC8FF] font-medium text-sm min-w-[32px] text-center"
                                whileHover={{ scale: 1.05 }}
                            >
                                {currentPage}
                            </motion.span>

                            <span className="text-white/50 px-1">/</span>

                            <span className="text-white/70 font-medium text-sm">{totalPages}</span>
                        </div>

                        {/* Next Page */}
                        <motion.button
                            className="p-2 text-white/40 hover:text-white/70 transition-colors duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            disabled={currentPage === totalPages}
                            onClick={() => onPageChange(currentPage + 1)}
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
                        >
                            <MdKeyboardDoubleArrowRight className="w-4 h-4" />
                        </motion.button>
                    </motion.div>

                    {/* Mobile Responsive Version */}
                    <motion.div
                        className="flex lg:hidden items-center justify-between w-full"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.8 }}
                    >
                        {/* Mobile Show Count */}
                        <div className="flex items-center space-x-2">
                            <span className="text-white/70 text-sm">Showing</span>
                            <span className="text-white font-medium text-sm">
                                {currentItemsCount} of {totalItems}
                            </span>
                        </div>

                        {/* Mobile Pagination */}
                        <div className="flex items-center space-x-3">
                            <motion.button
                                className="p-2 text-white/40 disabled:opacity-30"
                                whileTap={{ scale: 0.9 }}
                                disabled={currentPage === 1}
                                onClick={() => onPageChange(currentPage - 1)}
                            >
                                <MdKeyboardArrowLeft className="w-4 h-4" />
                            </motion.button>

                            <span className="text-white/70 text-sm font-medium">
                                {currentPage} of {totalPages}
                            </span>

                            <motion.button
                                className="p-2 text-white/40 disabled:opacity-30"
                                whileTap={{ scale: 0.9 }}
                                disabled={currentPage === totalPages}
                                onClick={() => onPageChange(currentPage + 1)}
                            >
                                <MdKeyboardArrowRight className="w-4 h-4" />
                            </motion.button>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default ProductsPagination;
