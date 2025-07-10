"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowUpRight } from "react-icons/fi";
import Image from "next/image";
import clsx from "clsx";

// Types
interface Product {
  id: number;
  name: string;
  series: string;
  category: string;
  image: string;
  description: string;
  price: number;
  rating: number;
  isNew: boolean;
  popularity: number;
}

// Constants
const ITEMS_PER_PAGE = 8;

// Mock data for products
const mockProducts: Product[] = [
  {
    id: 1,
    name: "SCS S8X Pro",
    series: "SX SERIES",
    category: "Category1",
    image: "/products/product1.png",
    description: "Advanced communication device with Bluetooth 5.0 technology, waterproof design, and crystal clear audio quality for professional use.",
    price: 299,
    rating: 4.8,
    isNew: true,
    popularity: 95,
  },
  {
    id: 2,
    name: "SCS S8X Elite",
    series: "SX SERIES",
    category: "Category1",
    image: "/products/product2.png",
    description: "Premium series featuring enhanced noise cancellation, extended battery life, and seamless group communication capabilities.",
    price: 399,
    rating: 4.9,
    isNew: true,
    popularity: 88,
  },
  {
    id: 3,
    name: "SCS S Series Pro",
    series: "S SERIES",
    category: "Category2",
    image: "/products/product3.png",
    description: "Reliable and durable communication solution designed for everyday use with superior sound quality and ergonomic design.",
    price: 199,
    rating: 4.6,
    isNew: false,
    popularity: 92,
  },
  {
    id: 4,
    name: "SCS G+ Elite",
    series: "G+ SERIES",
    category: "Category2",
    image: "/products/product1.png",
    description: "Next-generation communication device with AI-powered noise reduction and ultra-long range connectivity.",
    price: 499,
    rating: 4.9,
    isNew: true,
    popularity: 85,
  },
  {
    id: 5,
    name: "SCS G Pro",
    series: "G SERIES",
    category: "Category3",
    image: "/products/product2.png",
    description: "Professional grade communication system with military-standard durability and crystal clear transmission.",
    price: 349,
    rating: 4.7,
    isNew: false,
    popularity: 90,
  },
  {
    id: 6,
    name: "SCS S Standard",
    series: "S SERIES",
    category: "Category2",
    image: "/products/product3.png",
    description: "Entry-level professional communication device with essential features and reliable performance.",
    price: 149,
    rating: 4.4,
    isNew: false,
    popularity: 78,
  },
];

export default function ProductsPage() {
  // State management - optimized
  const [hoveredProductId, setHoveredProductId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(ITEMS_PER_PAGE);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Memoized calculations for better performance
  const { currentProducts, totalPages } = useMemo(() => {
    const total = mockProducts.length;
    const pages = Math.ceil(total / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const products = mockProducts.slice(startIndex, endIndex);

    return {
      currentProducts: products,
      totalPages: pages,
      totalItems: total
    };
  }, [currentPage, itemsPerPage]);

  // // Event handlers - optimized
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleFilterToggle = () => setIsFilterOpen(prev => !prev);

  return (
    <div className="min-h-screen bg-[#0c131d] text-white">
      {/* Hero Video Section - Like HeroSection */}
      <section className="relative w-full h-[400px] overflow-hidden">
        {/* Background Video */}
        <motion.video
          src="/videos/motorbike-road-trip-2022-07-26-01-49-02-utc.mp4"
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
        />

        {/* Dark Overlay */}
        <motion.div
          className="absolute inset-0 bg-black/60 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.5 }}
        />

        {/* Breadcrumb - Bottom Left (after sidebar) - Moved higher for better spacing */}
        <motion.div
          className="absolute bottom-16 sm:bottom-20 lg:bottom-24 left-20 sm:left-24 z-20"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          <div className="px-12 sm:px-16 lg:px-20">
            <nav className="flex items-center space-x-2 text-sm">
              <motion.a
                href="/home"
                className="text-gray-300 hover:text-[#4FC8FF] transition-colors duration-300"
                whileHover={{ scale: 1.05 }}
              >
                Home
              </motion.a>
              <span className="text-gray-500">/</span>
              <span className="text-white font-medium">Products</span>
            </nav>
          </div>
        </motion.div>

        {/* Gradient Overlay - Transition to content below */}
        <motion.div
          className="
            absolute inset-x-0 bottom-0
            h-24 xs:h-32 sm:h-48 md:h-64
            bg-gradient-to-b
            from-transparent
            to-[#0c131d]
            pointer-events-none
            z-10
          "
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 1.5 }}
        />
      </section>

      {/* Title & Description Section - Moved to gradient transition area */}
      <div className="ml-16 sm:ml-20 -mt-16 sm:-mt-20 lg:-mt-24 relative z-20 py-6 sm:py-8 lg:py-10">
        <div className="px-12 sm:px-16 lg:px-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 font-mono">
              PRODUCT LIST
            </h1>

            {/* Breadcrumb & Filter Section */}
            <motion.div
              className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-8 mb-8 relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              {/* Decorative horizontal line cutting through - Extended to edges */}
              <motion.div
                className="absolute -left-12 sm:-left-16 lg:-left-20 -right-12 sm:-right-16 lg:-right-20 top-1/2 h-px bg-gradient-to-r from-gray-500/40 via-gray-500/70 to-gray-500/40 z-0 hidden lg:block"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ duration: 1.2, delay: 0.8 }}
                style={{ transform: 'translateY(-0.5px)' }}
              />

              {/* Breadcrumb / Category Navigation - Left Side */}
              <div className="flex items-center space-x-1 text-sm font-sans uppercase tracking-wider bg-[#0c131d] pr-4 relative z-10">
                <motion.button
                  className="text-white font-medium relative pb-1 border-b-2 border-[#4FC8FF] hover:text-[#4FC8FF] transition-colors duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ALL
                </motion.button>
                
                <span className="text-gray-500 mx-2">/</span>
                
                <motion.button
                  className="text-gray-400 hover:text-white transition-colors duration-300 relative group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  SX SERIES
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#4FC8FF] group-hover:w-full transition-all duration-300"></span>
                </motion.button>
                
                <span className="text-gray-500 mx-2">/</span>
                
                <motion.button
                  className="text-gray-400 hover:text-white transition-colors duration-300 relative group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  S SERIES
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#4FC8FF] group-hover:w-full transition-all duration-300"></span>
                </motion.button>
                
                <span className="text-gray-500 mx-2">/</span>
                
                <motion.button
                  className="text-gray-400 hover:text-white transition-colors duration-300 relative group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  G SERIES
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#4FC8FF] group-hover:w-full transition-all duration-300"></span>
                </motion.button>
                
                <span className="text-gray-500 mx-2">/</span>
                
                <motion.button
                  className="text-gray-400 hover:text-white transition-colors duration-300 relative group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  G+ SERIES
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#4FC8FF] group-hover:w-full transition-all duration-300"></span>
                </motion.button>
              </div>

              {/* Filter & Sort By Button - Right Side */}
              <motion.button
                className="flex items-center space-x-3 px-6 py-3 border border-gray-600 rounded-lg text-white font-sans uppercase tracking-wider text-sm hover:border-[#4FC8FF] hover:text-[#4FC8FF] transition-all duration-300 group min-w-[180px] justify-center lg:justify-start bg-[#0c131d] relative z-10"
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: "0 4px 12px rgba(79, 200, 255, 0.2)"
                }}
                whileTap={{ scale: 0.98 }}
                onClick={handleFilterToggle}
              >
                {/* Slider/Filter Icon */}
                <motion.div
                  className="flex flex-col space-y-1"
                  whileHover={{ rotate: 90 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex space-x-1">
                    <div className="w-3 h-0.5 bg-current rounded-full"></div>
                    <div className="w-2 h-0.5 bg-current rounded-full opacity-60"></div>
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-2 h-0.5 bg-current rounded-full opacity-60"></div>
                    <div className="w-3 h-0.5 bg-current rounded-full"></div>
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-3 h-0.5 bg-current rounded-full"></div>
                    <div className="w-1 h-0.5 bg-current rounded-full opacity-40"></div>
                  </div>
                </motion.div>
                
                <span className="font-medium">FILTER & SORT BY</span>
                
                {/* Arrow indicator */}
                <motion.div
                  className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  animate={{ x: [0, 3, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.div>
              </motion.button>
            </motion.div>

            {/* Mobile Responsive Version */}
            <motion.div
              className="block lg:hidden mb-6 space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              {/* Mobile Categories */}
              <div className="flex flex-wrap gap-2">
                <motion.button
                  className="px-3 py-1.5 bg-[#4FC8FF]/20 border border-[#4FC8FF]/50 rounded text-[#4FC8FF] text-xs font-sans uppercase tracking-wide"
                  whileTap={{ scale: 0.95 }}
                >
                  ALL
                </motion.button>
                <motion.button
                  className="px-3 py-1.5 border border-gray-600 rounded text-gray-400 text-xs font-sans uppercase tracking-wide hover:text-white hover:border-gray-500 transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  SX
                </motion.button>
                <motion.button
                  className="px-3 py-1.5 border border-gray-600 rounded text-gray-400 text-xs font-sans uppercase tracking-wide hover:text-white hover:border-gray-500 transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  S
                </motion.button>
                <motion.button
                  className="px-3 py-1.5 border border-gray-600 rounded text-gray-400 text-xs font-sans uppercase tracking-wide hover:text-white hover:border-gray-500 transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  G
                </motion.button>
                <motion.button
                  className="px-3 py-1.5 border border-gray-600 rounded text-gray-400 text-xs font-sans uppercase tracking-wide hover:text-white hover:border-gray-500 transition-colors"
                  whileTap={{ scale: 0.95 }}
                >
                  G+
                </motion.button>
              </div>
            </motion.div>

            <p 
              style={{ color: "#8390A5" }}
            >
              Khám phá bộ sưu tập Series của 4T Hiteck – nơi hội tụ công nghệ giao 
              tiếp đỉnh cao dành riêng cho người lái chuyên nghiệp. Mỗi sản phẩm
              trong dòng SX, S, G và G+ đều được thiết kế tỉ mỉ, mang đến âm thanh
              rõ ràng, kết nối ổn định và độ bền vượt trội trên mọi hành trình. Dù
              bạn đang chinh phục những cung đường mạo hiểm hay di chuyển trong đô
              thị, trải nghiệm tương tác liền mạch cùng bạn đồng hành của 4T
              Hiteck sẽ giúp hành trình luôn an toàn, hứng khởi và đầy phong cách.
              Hãy chọn ngay Series phù hợp để nâng tầm kết nối và tận hưởng tự do
              bứt phá mọi giới hạn!
            </p>
          </motion.div>
        </div>
      </div>

      {/* Product Grid - ProductSeries Style */}
      <div className="ml-16 sm:ml-20 mb-16">
        {/* Products Grid - Series Style Layout */}
        <div className="px-4 sm:px-6 lg:px-8">
          {/* First Row - 4 products */}
          <motion.div className="flex flex-col lg:flex-row relative" layout>
            <AnimatePresence>
              {currentProducts.slice(0, 4).map((product, index) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, y: 100 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  transition={{
                    duration: 0.8,
                    delay: index * 0.15,
                    type: "spring",
                    stiffness: 100,
                  }}
                  className="relative flex-1"
                >
                  {/* Vertical Divider - except for last item in row */}
                  {index < 3 && (
                    <motion.div
                      className="absolute top-0 right-0 h-full border-r border-gray-700/50 z-10 hidden lg:block"
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.8, delay: 1 + index * 0.1 }}
                    />
                  )}

                  <motion.div
                    className="relative border-t border-gray-700/50 bg-gray-900/30 hover:bg-gray-800/50 transition-all duration-300 cursor-pointer group overflow-hidden min-h-[320px] xs:min-h-[360px] sm:min-h-[400px] md:min-h-[450px] lg:min-h-[500px] xl:min-h-[600px] flex flex-col rounded-lg lg:rounded-none"
                    onMouseEnter={() => setHoveredProductId(product.id)}
                    onMouseLeave={() => setHoveredProductId(null)}
                    whileHover={{
                      y: -5,
                      boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                      transition: { duration: 0.3 },
                    }}
                  >
                    {/* Video background on hover - Only show on desktop */}
                    {hoveredProductId === product.id && (
                      <motion.video
                        src="/videos/futuristic-background-2022-08-04-19-57-56-utc.mp4"
                        className="absolute inset-0 w-full h-full object-cover -z-10 hidden sm:block"
                        autoPlay
                        loop
                        muted
                        playsInline
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 0.4, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                      />
                    )}

                    {/* Vertical Series Label - Responsive positioning */}
                    <motion.div
                      className="absolute left-1 xs:left-2 sm:left-3 md:left-4 top-1/2 -translate-y-1/2 font-bold text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl uppercase tracking-wider xs:tracking-widest text-gray-400 z-10 font-sans"
                      style={{
                        writingMode: "vertical-rl",
                        transform: "translateY(-50%) rotate(180deg)",
                      }}
                      whileHover={{
                        color: "#4FC8FF",
                        scale: 1.05,
                        transition: { duration: 0.3 },
                      }}
                    >
                      {product.series}
                    </motion.div>

                    {/* Product Image - Centered - Responsive sizing */}
                    <motion.div
                      className="flex justify-center items-center py-4 xs:py-6 sm:py-8 md:py-10 lg:py-12 flex-1 z-10 relative"
                      whileHover={{ scale: 1.03 }}
                      transition={{ duration: 0.3 }}
                    >
                      <motion.div
                        key={`product-${product.id}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          duration: 0.3,
                          ease: "easeOut",
                        }}
                        className="relative"
                      >
                        <Image
                          src={product.image}
                          alt={product.name}
                          width={0}
                          height={0}
                          sizes="(max-width: 475px) 120px, (max-width: 640px) 150px, (max-width: 768px) 180px, (max-width: 1024px) 200px, 250px"
                          priority={true}
                          className="w-[120px] xs:w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px] xl:w-[250px] h-[120px] xs:h-[140px] sm:h-[160px] md:h-[180px] lg:h-[200px] xl:h-[250px] object-contain transition-opacity duration-200 ease-out"
                        />
                      </motion.div>
                    </motion.div>

                    {/* Content - Responsive typography and spacing - Exactly like ProductSeries */}
                    <motion.div
                      className="px-2 xs:px-3 sm:px-4 md:px-6 pb-3 xs:pb-4 sm:pb-6 md:pb-8 pl-6 xs:pl-8 sm:pl-10 md:pl-12 lg:pl-16 z-10 relative"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.3 + index * 0.05 }}
                    >
                      <motion.h3
                        className="text-white font-bold text-base xs:text-lg sm:text-xl md:text-2xl mb-1.5 xs:mb-2 md:mb-3 font-sans"
                        whileHover={{
                          color: "#4FC8FF",
                          scale: 1.02,
                          transition: { duration: 0.3 },
                        }}
                      >
                        {product.series.replace(" SERIES", " Series")}
                      </motion.h3>
                      <p className="text-gray-300 text-xs xs:text-sm sm:text-base leading-relaxed mb-2 xs:mb-3 md:mb-4 font-sans line-clamp-3 sm:line-clamp-none">
                        Advanced communication technology designed for
                        professional riders with superior audio quality and
                        durability.
                      </p>
                      <div className="flex justify-end">
                        <motion.div
                          whileHover={{
                            scale: 1.15,
                            rotate: 45,
                            color: "#4FC8FF",
                          }}
                          transition={{ duration: 0.3 }}
                          className="p-1 xs:p-1.5 sm:p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          <FiArrowUpRight
                            size={16}
                            className={clsx(
                              "transition-colors w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6",
                              hoveredProductId === product.id
                                ? "text-blue-400"
                                : "text-gray-500"
                            )}
                          />
                        </motion.div>
                      </div>
                    </motion.div>

                    {/* Hover border effect */}
                    <motion.div
                      className="absolute inset-0 border-2 border-transparent group-hover:border-[#4FC8FF]/30 rounded-lg lg:rounded-none transition-all duration-500 pointer-events-none"
                      whileHover={{
                        boxShadow: "inset 0 0 20px rgba(79, 200, 255, 0.1)",
                      }}
                    />
                  </motion.div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {/* Second Row - Remaining products with same width as first row */}
          {currentProducts.length > 4 && (
            <motion.div className="flex flex-col lg:flex-row relative" layout>
              <AnimatePresence>
                {currentProducts.slice(4).map((product, index) => (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -50 }}
                    transition={{
                      duration: 0.8,
                      delay: (index + 4) * 0.15,
                      type: "spring",
                      stiffness: 100,
                    }}
                    className="relative border-t border-r border-gray-700/50"
                    style={{ flex: "0 0 25%" }} // Same width as first row (25% each)
                  >
                    {/* No vertical dividers for second row to avoid connecting lines */}

                    <motion.div
                      className="relative bg-gray-900/30 hover:bg-gray-800/50 transition-all duration-300 cursor-pointer group overflow-hidden min-h-[320px] xs:min-h-[360px] sm:min-h-[400px] md:min-h-[450px] lg:min-h-[500px] xl:min-h-[600px] flex flex-col rounded-lg lg:rounded-none"
                      onMouseEnter={() => setHoveredProductId(product.id)}
                      onMouseLeave={() => setHoveredProductId(null)}
                      whileHover={{
                        y: -5,
                        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                        transition: { duration: 0.3 },
                      }}
                    >
                      {/* Video background on hover - Only show on desktop */}
                      {hoveredProductId === product.id && (
                        <motion.video
                          src="/videos/futuristic-background-2022-08-04-19-57-56-utc.mp4"
                          className="absolute inset-0 w-full h-full object-cover -z-10 hidden sm:block"
                          autoPlay
                          loop
                          muted
                          playsInline
                          initial={{ opacity: 0, scale: 1.1 }}
                          animate={{ opacity: 0.4, scale: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.5 }}
                        />
                      )}

                      {/* Vertical Series Label - Responsive positioning */}
                      <motion.div
                        className="absolute left-1 xs:left-2 sm:left-3 md:left-4 top-1/2 -translate-y-1/2 font-bold text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl uppercase tracking-wider xs:tracking-widest text-gray-400 z-10 font-sans"
                        style={{
                          writingMode: "vertical-rl",
                          transform: "translateY(-50%) rotate(180deg)",
                        }}
                        whileHover={{
                          color: "#4FC8FF",
                          scale: 1.05,
                          transition: { duration: 0.3 },
                        }}
                      >
                        {product.series}
                      </motion.div>

                      {/* Product Image - Centered - Responsive sizing */}
                      <motion.div
                        className="flex justify-center items-center py-4 xs:py-6 sm:py-8 md:py-10 lg:py-12 flex-1 z-10 relative"
                        whileHover={{ scale: 1.03 }}
                        transition={{ duration: 0.3 }}
                      >
                        <motion.div
                          key={`product-${product.id}`}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{
                            duration: 0.3,
                            ease: "easeOut",
                          }}
                          className="relative"
                        >
                          <Image
                            src={product.image}
                            alt={product.name}
                            width={0}
                            height={0}
                            sizes="(max-width: 475px) 120px, (max-width: 640px) 150px, (max-width: 768px) 180px, (max-width: 1024px) 200px, 250px"
                            priority={true}
                            className="w-[120px] xs:w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px] xl:w-[250px] h-[120px] xs:h-[140px] sm:h-[160px] md:h-[180px] lg:h-[200px] xl:h-[250px] object-contain transition-opacity duration-200 ease-out"
                          />
                        </motion.div>
                      </motion.div>

                      {/* Content - Responsive typography and spacing - Exactly like ProductSeries */}
                      <motion.div
                        className="px-2 xs:px-3 sm:px-4 md:px-6 pb-3 xs:pb-4 sm:pb-6 md:pb-8 pl-6 xs:pl-8 sm:pl-10 md:pl-12 lg:pl-16 z-10 relative"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.6,
                          delay: 0.3 + (index + 4) * 0.05,
                        }}
                      >
                        <motion.h3
                          className="text-white font-bold text-base xs:text-lg sm:text-xl md:text-2xl mb-1.5 xs:mb-2 md:mb-3 font-sans"
                          whileHover={{
                            color: "#4FC8FF",
                            scale: 1.02,
                            transition: { duration: 0.3 },
                          }}
                        >
                          {product.series.replace(" SERIES", " Series")}
                        </motion.h3>
                        <p className="text-gray-300 text-xs xs:text-sm sm:text-base leading-relaxed mb-2 xs:mb-3 md:mb-4 font-sans line-clamp-3 sm:line-clamp-none">
                          Advanced communication technology designed for
                          professional riders with superior audio quality and
                          durability.
                        </p>
                        <div className="flex justify-end">
                          <motion.div
                            whileHover={{
                              scale: 1.15,
                              rotate: 45,
                              color: "#4FC8FF",
                            }}
                            transition={{ duration: 0.3 }}
                            className="p-1 xs:p-1.5 sm:p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            <FiArrowUpRight
                              size={16}
                              className={clsx(
                                "transition-colors w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6",
                                hoveredProductId === product.id
                                  ? "text-blue-400"
                                  : "text-gray-500"
                              )}
                            />
                          </motion.div>
                        </div>
                      </motion.div>

                      {/* Hover border effect */}
                      <motion.div
                        className="absolute inset-0 border-2 border-transparent group-hover:border-[#4FC8FF]/30 rounded-lg lg:rounded-none transition-all duration-500 pointer-events-none"
                        whileHover={{
                          boxShadow: "inset 0 0 20px rgba(79, 200, 255, 0.1)",
                        }}
                      />
                    </motion.div>
                  </motion.div>
                ))}

                {/* Empty spaces to maintain layout consistency */}
                {Array.from(
                  { length: 4 - currentProducts.slice(4).length },
                  (_, index) => (
                    <div
                      key={`empty-${index}`}
                      className="relative"
                      style={{ flex: "0 0 25%" }}
                    />
                  )
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      {/* Pagination Section */}
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
                <span className="text-white font-medium text-sm">
                  6
                </span>
                <span className="text-white/70 group-hover:text-white transition-colors duration-300 font-sans text-sm">
                  /6
                </span>
                <motion.svg
                  className="w-4 h-4 text-white/70 group-hover:text-white transition-colors duration-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  whileHover={{ rotate: 180 }}
                  transition={{ duration: 0.3 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </motion.svg>
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
                onClick={() => handlePageChange(1)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </motion.button>

              {/* Previous Page */}
              <motion.button
                className="p-2 text-white/40 hover:text-white/70 transition-colors duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </motion.button>

              {/* Page Numbers */}
              <div className="flex items-center space-x-1 px-4">
                {/* Current Page */}
                <motion.span
                  className="px-3 py-1.5 bg-[#4FC8FF]/20 border border-[#4FC8FF]/50 rounded text-[#4FC8FF] font-medium text-sm min-w-[32px] text-center"
                  whileHover={{ scale: 1.05 }}
                >
                  1
                </motion.span>
                
                <span className="text-white/50 px-1">/</span>
                
                <span className="text-white/70 font-medium text-sm">1</span>
              </div>

              {/* Next Page */}
              <motion.button
                className="p-2 text-white/40 hover:text-white/70 transition-colors duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>

              {/* Last Page */}
              <motion.button
                className="p-2 text-white/40 hover:text-white/70 transition-colors duration-300 disabled:opacity-30 disabled:cursor-not-allowed"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(totalPages)}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
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
                <span className="text-white font-medium text-sm">6 of 6</span>
              </div>

              {/* Mobile Pagination */}
              <div className="flex items-center space-x-3">
                <motion.button
                  className="p-2 text-white/40 disabled:opacity-30"
                  whileTap={{ scale: 0.9 }}
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </motion.button>
                
                <span className="text-white/70 text-sm font-medium">{currentPage} of {totalPages}</span>
                
                <motion.button
                  className="p-2 text-white/40 disabled:opacity-30"
                  whileTap={{ scale: 0.9 }}
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Filter Sidebar - Re-added */}
      <AnimatePresence>
        {isFilterOpen && (
          <>
            {/* Backdrop Overlay */}
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleFilterToggle}
            />

            {/* Filter Sidebar */}
            <motion.div
              className="fixed top-0 right-0 h-full w-80 sm:w-96 bg-[#0c131d] border-l border-gray-700 z-50 overflow-y-auto"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white font-mono">FILTER & SORT</h2>
                <motion.button
                  onClick={handleFilterToggle}
                  className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>

              {/* Filter Content */}
              <div className="p-6 space-y-8">
                {/* Series Filter */}
                <div>
                  <h3 className="text-white font-semibold mb-4 uppercase tracking-wider text-sm">Series</h3>
                  <div className="space-y-3">
                    {['SX SERIES', 'S SERIES', 'G SERIES', 'G+ SERIES'].map((series) => (
                      <motion.label
                        key={series}
                        className="flex items-center space-x-3 cursor-pointer group"
                        whileHover={{ x: 4 }}
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-[#4FC8FF] bg-gray-800 border-gray-600 rounded focus:ring-[#4FC8FF] focus:ring-2"
                        />
                        <span className="text-gray-300 group-hover:text-white transition-colors text-sm">
                          {series}
                        </span>
                      </motion.label>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <h3 className="text-white font-semibold mb-4 uppercase tracking-wider text-sm">Price Range</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <input
                        type="number"
                        placeholder="Min"
                        className="w-20 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:border-[#4FC8FF] focus:ring-1 focus:ring-[#4FC8FF]"
                      />
                      <span className="text-gray-400">-</span>
                      <input
                        type="number"
                        placeholder="Max"
                        className="w-20 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white text-sm focus:border-[#4FC8FF] focus:ring-1 focus:ring-[#4FC8FF]"
                      />
                    </div>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <h3 className="text-white font-semibold mb-4 uppercase tracking-wider text-sm">Features</h3>
                  <div className="space-y-3">
                    {['Bluetooth 5.0', 'Waterproof IP67', 'Noise Cancellation', 'Long Battery Life'].map((feature) => (
                      <motion.label
                        key={feature}
                        className="flex items-center space-x-3 cursor-pointer group"
                        whileHover={{ x: 4 }}
                      >
                        <input
                          type="checkbox"
                          className="w-4 h-4 text-[#4FC8FF] bg-gray-800 border-gray-600 rounded focus:ring-[#4FC8FF] focus:ring-2"
                        />
                        <span className="text-gray-300 group-hover:text-white transition-colors text-sm">
                          {feature}
                        </span>
                      </motion.label>
                    ))}
                  </div>
                </div>

                {/* Sort By */}
                <div>
                  <h3 className="text-white font-semibold mb-4 uppercase tracking-wider text-sm">Sort By</h3>
                  <div className="space-y-3">
                    {[
                      { value: 'popularity', label: 'Popularity' },
                      { value: 'price-low', label: 'Price: Low to High' },
                      { value: 'price-high', label: 'Price: High to Low' },
                      { value: 'newest', label: 'Newest First' },
                      { value: 'rating', label: 'Highest Rated' }
                    ].map((option) => (
                      <motion.label
                        key={option.value}
                        className="flex items-center space-x-3 cursor-pointer group"
                        whileHover={{ x: 4 }}
                      >
                        <input
                          type="radio"
                          name="sortBy"
                          value={option.value}
                          defaultChecked={option.value === 'popularity'}
                          className="w-4 h-4 text-[#4FC8FF] bg-gray-800 border-gray-600 focus:ring-[#4FC8FF] focus:ring-2"
                        />
                        <span className="text-gray-300 group-hover:text-white transition-colors text-sm">
                          {option.label}
                        </span>
                      </motion.label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-6 border-t border-gray-700 flex space-x-4">
                <motion.button
                  className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium text-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Clear All
                </motion.button>
                <motion.button
                  className="flex-1 px-4 py-3 bg-[#4FC8FF] text-black font-semibold rounded-lg hover:bg-[#4FC8FF]/90 transition-colors text-sm"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleFilterToggle}
                >
                  Apply Filters
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
