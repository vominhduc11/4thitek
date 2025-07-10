"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiArrowUpRight } from "react-icons/fi";
import Image from "next/image";
import clsx from "clsx";

// Mock data for products
const mockProducts = [
  {
    id: 1,
    name: "SCS S8X Pro",
    series: "SX SERIES",
    category: "Category1",
    image: "/products/product1.png",
    description:
      "Advanced communication device with Bluetooth 5.0 technology, waterproof design, and crystal clear audio quality for professional use.",
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
    description:
      "Premium series featuring enhanced noise cancellation, extended battery life, and seamless group communication capabilities.",
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
    description:
      "Reliable and durable communication solution designed for everyday use with superior sound quality and ergonomic design.",
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
    description:
      "Next-generation communication device with AI-powered noise reduction and ultra-long range connectivity.",
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
    description:
      "Professional grade communication system with military-standard durability and crystal clear transmission.",
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
    description:
      "Entry-level professional communication device with essential features and reliable performance.",
    price: 149,
    rating: 4.4,
    isNew: false,
    popularity: 78,
  },
];

export default function ProductsPage() {
  const [hoveredProductId, setHoveredProductId] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0c131d] to-[#001A35] text-white">
      {/* Enhanced Hero Video Section */}
      <section className="relative w-full h-[500px] sm:h-[600px] lg:h-[700px] overflow-hidden">
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

        {/* Enhanced Dark Overlay với gradient */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/60 to-black/80 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.5 }}
        />

        {/* Hero Content - Center */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center z-20"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.8 }}
        >
          <div className="text-center max-w-4xl px-6">
            <motion.h1 
              className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold font-mono mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1 }}
            >
              <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                PROFESSIONAL
              </span>
              <br />
              <span className="text-[#4FC8FF]">COMMUNICATION</span>
            </motion.h1>
            
            <motion.p 
              className="text-lg sm:text-xl text-gray-300 mb-8 leading-relaxed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
            >
              Khám phá công nghệ giao tiếp đỉnh cao dành cho người lái chuyên nghiệp
            </motion.p>
            
            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.4 }}
            >
              <motion.button 
                className="px-8 py-3 bg-[#4FC8FF] text-black font-semibold rounded-lg hover:bg-[#4FC8FF]/90 transition-all duration-300"
                whileHover={{ scale: 1.05, boxShadow: "0 8px 25px rgba(79, 200, 255, 0.3)" }}
                whileTap={{ scale: 0.95 }}
              >
                Khám Phá Ngay
              </motion.button>
              <motion.button 
                className="px-8 py-3 border border-white/30 text-white font-semibold rounded-lg hover:bg-white/10 transition-all duration-300"
                whileHover={{ scale: 1.05, boxShadow: "0 8px 25px rgba(255, 255, 255, 0.1)" }}
                whileTap={{ scale: 0.95 }}
              >
                Xem Catalog
              </motion.button>
            </motion.div>
          </div>
        </motion.div>

        {/* Stats Overlay - Top Right */}
        <motion.div
          className="absolute top-6 right-6 z-20 hidden lg:block"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 1.6 }}
        >
          <div className="bg-black/40 backdrop-blur-md rounded-lg p-4 border border-white/10">
            <div className="grid grid-cols-2 gap-4 text-center">
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-2xl font-bold text-[#4FC8FF]">4</div>
                <div className="text-xs text-gray-300">Series</div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-2xl font-bold text-white">12+</div>
                <div className="text-xs text-gray-300">Models</div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-2xl font-bold text-green-400">5★</div>
                <div className="text-xs text-gray-300">Rating</div>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                <div className="text-2xl font-bold text-yellow-400">Pro</div>
                <div className="text-xs text-gray-300">Grade</div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Feature Highlights - Bottom Center */}
        <motion.div
          className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-20 hidden md:block"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1.8 }}
        >
          <div className="flex space-x-8 text-center">
            <motion.div 
              className="flex flex-col items-center"
              whileHover={{ scale: 1.1, y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-12 h-12 bg-[#4FC8FF]/20 rounded-full flex items-center justify-center mb-2 border border-[#4FC8FF]/30">
                <span className="text-[#4FC8FF] text-xl">🔊</span>
              </div>
              <span className="text-white text-sm font-medium">Crystal Clear</span>
            </motion.div>
            <motion.div 
              className="flex flex-col items-center"
              whileHover={{ scale: 1.1, y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-12 h-12 bg-[#4FC8FF]/20 rounded-full flex items-center justify-center mb-2 border border-[#4FC8FF]/30">
                <span className="text-[#4FC8FF] text-xl">📡</span>
              </div>
              <span className="text-white text-sm font-medium">Long Range</span>
            </motion.div>
            <motion.div 
              className="flex flex-col items-center"
              whileHover={{ scale: 1.1, y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-12 h-12 bg-[#4FC8FF]/20 rounded-full flex items-center justify-center mb-2 border border-[#4FC8FF]/30">
                <span className="text-[#4FC8FF] text-xl">💧</span>
              </div>
              <span className="text-white text-sm font-medium">Waterproof</span>
            </motion.div>
            <motion.div 
              className="flex flex-col items-center"
              whileHover={{ scale: 1.1, y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-12 h-12 bg-[#4FC8FF]/20 rounded-full flex items-center justify-center mb-2 border border-[#4FC8FF]/30">
                <span className="text-[#4FC8FF] text-xl">🔋</span>
              </div>
              <span className="text-white text-sm font-medium">Long Battery</span>
            </motion.div>
          </div>
        </motion.div>

        {/* Enhanced Breadcrumb - Bottom Left */}
        <motion.div
          className="absolute bottom-6 left-20 sm:left-24 z-20"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          <nav className="flex items-center space-x-2 text-sm bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
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
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2 }}
        >
          <motion.div
            className="flex flex-col items-center text-white/60"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-xs mb-2 hidden sm:block">Scroll to explore</span>
            <div className="w-0.5 h-8 bg-white/30 rounded-full">
              <motion.div
                className="w-0.5 h-4 bg-[#4FC8FF] rounded-full"
                animate={{ y: [0, 16, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </motion.div>
        </motion.div>

        {/* Enhanced Gradient Overlay */}
        <motion.div
          className="
            absolute inset-x-0 bottom-0
            h-32 sm:h-48 md:h-64 lg:h-80
            bg-gradient-to-b
            from-transparent
            via-[#0a1523]/50
            to-[#0a1523]
            pointer-events-none
            z-15
          "
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2, delay: 1.5 }}
        />
      </section>

      {/* Enhanced Title & Description Section */}
      <section className="ml-16 sm:ml-20 py-8 sm:py-12 lg:py-16">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="grid lg:grid-cols-12 gap-8 lg:gap-12"
            >
              {/* Left Column - Title & Meta */}
              <div className="lg:col-span-5 space-y-6">
                <div className="space-y-4">
                  {/* Category Indicator */}
                  <motion.div 
                    className="flex items-center space-x-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                  >
                    <div className="w-12 h-0.5 bg-[#4FC8FF]"></div>
                    <span className="text-[#4FC8FF] text-sm font-medium uppercase tracking-wider">
                      Communication Series
                    </span>
                  </motion.div>
                  
                  {/* Enhanced Title */}
                  <motion.h1 
                    className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold font-mono leading-tight"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  >
                    <span className="bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
                      PRODUCT
                    </span>
                    <br />
                    <span className="text-[#4FC8FF]">COLLECTION</span>
                  </motion.h1>
                </div>
                
                {/* Stats/Highlights */}
                <motion.div 
                  className="flex flex-wrap gap-6 text-sm"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-[#4FC8FF] rounded-full"></div>
                    <span className="text-white font-semibold">4</span>
                    <span className="text-gray-400">Series</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-white font-semibold">12+</span>
                    <span className="text-gray-400">Models</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <span className="text-white font-semibold">Pro</span>
                    <span className="text-gray-400">Grade</span>
                  </div>
                </motion.div>
              </div>

              {/* Right Column - Description & Actions */}
              <div className="lg:col-span-7 space-y-6">
                <motion.div 
                  className="space-y-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.6 }}
                >
                  <p className="text-[#8390A5] text-base sm:text-lg leading-relaxed">
                    Khám phá bộ sưu tập Series của 4T Hiteck – nơi hội tụ công nghệ giao 
                    tiếp đỉnh cao dành riêng cho người lái chuyên nghiệp. Mỗi sản phẩm
                    trong dòng SX, S, G và G+ đều được thiết kế tỉ mỉ, mang đến âm thanh
                    rõ ràng, kết nối ổn định và độ bền vượt trội trên mọi hành trình.
                  </p>
                  
                  <p className="text-gray-400 text-sm sm:text-base leading-relaxed">
                    Dù bạn đang chinh phục những cung đường mạo hiểm hay di chuyển trong đô
                    thị, trải nghiệm tương tác liền mạch cùng bạn đồng hành của 4T
                    Hiteck sẽ giúp hành trình luôn an toàn, hứng khởi và đầy phong cách.
                  </p>
                </motion.div>

                {/* Feature Grid */}
                <motion.div 
                  className="grid grid-cols-2 gap-4 py-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                >
                  <motion.div 
                    className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50 hover:border-[#4FC8FF]/30 transition-all duration-300 cursor-pointer group"
                    whileHover={{ scale: 1.02, y: -2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-8 h-8 bg-[#4FC8FF]/20 rounded-full flex items-center justify-center group-hover:bg-[#4FC8FF]/30 transition-colors">
                        <span className="text-[#4FC8FF] text-sm">🔊</span>
                      </div>
                      <span className="text-white font-medium text-sm group-hover:text-[#4FC8FF] transition-colors">Crystal Clear Audio</span>
                    </div>
                    <p className="text-gray-400 text-xs leading-relaxed">Âm thanh rõ ràng trong mọi điều kiện thời tiết</p>
                  </motion.div>

                  <motion.div 
                    className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50 hover:border-green-400/30 transition-all duration-300 cursor-pointer group"
                    whileHover={{ scale: 1.02, y: -2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-8 h-8 bg-green-400/20 rounded-full flex items-center justify-center group-hover:bg-green-400/30 transition-colors">
                        <span className="text-green-400 text-sm">📡</span>
                      </div>
                      <span className="text-white font-medium text-sm group-hover:text-green-400 transition-colors">Long Range</span>
                    </div>
                    <p className="text-gray-400 text-xs leading-relaxed">Kết nối xa đến 1.5km trong điều kiện lý tưởng</p>
                  </motion.div>

                  <motion.div 
                    className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50 hover:border-blue-400/30 transition-all duration-300 cursor-pointer group"
                    whileHover={{ scale: 1.02, y: -2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-8 h-8 bg-blue-400/20 rounded-full flex items-center justify-center group-hover:bg-blue-400/30 transition-colors">
                        <span className="text-blue-400 text-sm">💧</span>
                      </div>
                      <span className="text-white font-medium text-sm group-hover:text-blue-400 transition-colors">Waterproof IP67</span>
                    </div>
                    <p className="text-gray-400 text-xs leading-relaxed">Chống nước hoàn toàn, an tâm trong mọi thời tiết</p>
                  </motion.div>

                  <motion.div 
                    className="bg-gray-800/30 rounded-lg p-4 border border-gray-700/50 hover:border-yellow-400/30 transition-all duration-300 cursor-pointer group"
                    whileHover={{ scale: 1.02, y: -2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="w-8 h-8 bg-yellow-400/20 rounded-full flex items-center justify-center group-hover:bg-yellow-400/30 transition-colors">
                        <span className="text-yellow-400 text-sm">🔋</span>
                      </div>
                      <span className="text-white font-medium text-sm group-hover:text-yellow-400 transition-colors">20H Battery</span>
                    </div>
                    <p className="text-gray-400 text-xs leading-relaxed">Pin bền bỉ cả ngày dài, sạc nhanh chỉ 2 giờ</p>
                  </motion.div>
                </motion.div>

                {/* Quick Series Filters */}
                <motion.div 
                  className="flex flex-wrap gap-3 pt-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                >
                  <motion.button 
                    className="px-4 py-2 bg-[#4FC8FF]/10 border border-[#4FC8FF]/30 rounded-lg text-[#4FC8FF] text-sm hover:bg-[#4FC8FF]/20 transition-all duration-300 font-medium"
                    whileHover={{ scale: 1.05, boxShadow: "0 4px 12px rgba(79, 200, 255, 0.2)" }}
                    whileTap={{ scale: 0.95 }}
                  >
                    SX Series
                  </motion.button>
                  <motion.button 
                    className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-300 text-sm hover:bg-gray-700/50 hover:text-white transition-all duration-300 font-medium"
                    whileHover={{ scale: 1.05, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)" }}
                    whileTap={{ scale: 0.95 }}
                  >
                    S Series
                  </motion.button>
                  <motion.button 
                    className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-300 text-sm hover:bg-gray-700/50 hover:text-white transition-all duration-300 font-medium"
                    whileHover={{ scale: 1.05, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)" }}
                    whileTap={{ scale: 0.95 }}
                  >
                    G Series
                  </motion.button>
                  <motion.button 
                    className="px-4 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-gray-300 text-sm hover:bg-gray-700/50 hover:text-white transition-all duration-300 font-medium"
                    whileHover={{ scale: 1.05, boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)" }}
                    whileTap={{ scale: 0.95 }}
                  >
                    G+ Series
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>

            {/* Mobile-Optimized Layout */}
            <motion.div 
              className="block lg:hidden mt-8 text-center space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.9 }}
            >
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-[#4FC8FF]/10 rounded-full">
                <span className="text-[#4FC8FF] text-xs font-medium">Hãy chọn Series phù hợp</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Product Grid - ProductSeries Style */}
      <div className="ml-16 sm:ml-20 mb-16">
        {/* Products Grid - Series Style Layout */}
        <div className="px-4 sm:px-6 lg:px-8">
          {/* First Row - 4 products */}
          <motion.div className="flex flex-col lg:flex-row relative" layout>
            <AnimatePresence>
              {mockProducts.slice(0, 4).map((product, index) => (
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
          {mockProducts.length > 4 && (
            <motion.div className="flex flex-col lg:flex-row relative" layout>
              <AnimatePresence>
                {mockProducts.slice(4).map((product, index) => (
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
                  { length: 4 - mockProducts.slice(4).length },
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
    </div>
  );
}
