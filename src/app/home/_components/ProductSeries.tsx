"use client";

import { useState } from "react";
import { FiChevronLeft, FiChevronRight, FiArrowUpRight } from "react-icons/fi";
import clsx from "clsx";
import Image from "next/image";
import { motion } from "framer-motion";

const seriesItems = [
  {
    id: 1,
    label: "SX SERIES",
    img: "/products/product1.png",
    thumbs: [
      { src: "/products/product1.png", label: "01" },
      { src: "/products/product2.png", label: "02" },
      { src: "/products/product3.png", label: "03" },
      { src: "/products/product1.png", label: "04" },
      { src: "/products/product2.png", label: "05" },
    ],
  },
  {
    id: 2,
    label: "S SERIES",
    img: "/products/product1.png",
    thumbs: [
      { src: "/products/product1.png", label: "01" },
      { src: "/products/product2.png", label: "02" },
      { src: "/products/product3.png", label: "03" },
      { src: "/products/product1.png", label: "04" },
    ],
  },
  {
    id: 3,
    label: "G SERIES",
    img: "/products/product1.png",
    thumbs: [
      { src: "/products/product1.png", label: "01" },
      { src: "/products/product2.png", label: "02" },
      { src: "/products/product3.png", label: "03" },
    ],
  },
  {
    id: 4,
    label: "G+ SERIES",
    img: "/products/product1.png",
    thumbs: [
      { src: "/products/product1.png", label: "01" },
      { src: "/products/product2.png", label: "02" },
    ],
  },
];

export default function ProductSeries() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeThumb, setActiveThumb] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const thumbs = seriesItems[activeIndex].thumbs || [];
  
  // Reset active thumb when changing series with smooth transition
  const handleSeriesChange = (index: number) => {
    if (index === activeIndex) return; // Không làm gì nếu click vào series đang active
    
    setIsTransitioning(true);
    
    // Smooth transition với timing tối ưu
    setTimeout(() => {
      setActiveIndex(index);
      setActiveThumb(0); // Reset to first thumbnail
    }, 150); // Giảm từ 200ms xuống 150ms
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300); // Tổng thời gian transition 300ms
  };

  const handleThumbNav = (dir: "left" | "right") => {
    setActiveThumb((prev) => {
      if (dir === "left") return Math.max(prev - 1, 0);
      if (dir === "right") return Math.min(prev + 1, thumbs.length - 1);
      return prev;
    });
  };

  return (
    <motion.section
      className="bg-[#0c131d] w-full py-12 sm:py-16 relative"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true, amount: 0.2 }}
    >
      <div className="sidebar-aware-container">
        {/* Divider with thumbnails interrupting it */}
        <motion.div
          className="relative mb-6 sm:mb-8 md:mb-10"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <div className="border-b border-gray-700/50"></div>
          {/* Thumbnails positioned to interrupt the divider */}
          <motion.div
            className="absolute top-0 right-0 transform -translate-y-1/2 z-30"
            style={{ paddingTop: '8px' }} // Thêm padding để tránh bị clip khi hover
            initial={{ x: 100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-1 sm:gap-2 md:gap-3 overflow-x-auto overflow-y-visible scrollbar-hide bg-[#0c131d] px-2 sm:px-4 py-3 scroll-smooth shadow-lg border border-gray-700/30 rounded-lg">
              {/* Left Navigation Button */}
              <button
                onClick={() => handleThumbNav("left")}
                className={clsx(
                  "p-1 sm:p-2 bg-white/10 hover:bg-white/20 transition-colors rounded flex-shrink-0 z-20",
                  activeThumb === 0 ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                )}
                disabled={activeThumb === 0}
              >
                <FiChevronLeft
                  size={16}
                  className="sm:w-5 sm:h-5"
                  color="white"
                />
              </button>
              {thumbs.map((thumb, idx) => (
                <motion.div
                  key={`${activeIndex}-${idx}-${thumb.label}`}
                  className={clsx(
                    "relative w-[60px] sm:w-[80px] md:w-[100px] h-[35px] sm:h-[50px] md:h-[70px] cursor-pointer border-2 rounded overflow-hidden flex-shrink-0 bg-[#0c131d] z-10",
                    idx === activeThumb
                      ? "border-blue-400 shadow-lg shadow-blue-400/30"
                      : "border-white/30 hover:border-white/60"
                  )}
                  onClick={() => setActiveThumb(idx)}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    duration: 0.4,
                    delay: idx * 0.05,
                    ease: "easeOut"
                  }}
                  whileHover={{
                    scale: 1.08,
                    zIndex: 50,
                    boxShadow: "0 8px 25px rgba(79, 200, 255, 0.4)",
                    transition: { duration: 0.2, ease: "easeOut" }
                  }}
                  whileTap={{ 
                    scale: 0.98,
                    transition: { duration: 0.1, ease: "easeInOut" }
                  }}
                >
                  <div className="w-full h-full relative overflow-hidden">
                    <Image
                      width={0}
                      height={0}
                      sizes="100vw"
                      priority
                      src={thumb.src}
                      alt={thumb.label}
                      className="w-full h-full object-cover transition-transform duration-200 ease-out"
                    />
                    
                    {/* Subtle active indicator cho thumbnail */}
                    {idx === activeThumb && (
                      <motion.div
                        className="absolute inset-0 bg-blue-400/10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      />
                    )}
                  </div>
                  
                  <span className="absolute top-0.5 sm:top-1 left-0.5 sm:left-1 md:left-2 text-white text-xs font-bold z-10 drop-shadow-sm">
                    {thumb.label}
                  </span>
                  
                  {/* Subtle click feedback */}
                  <motion.div
                    className="absolute inset-0 bg-white/10 rounded pointer-events-none"
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileTap={{
                      opacity: [0, 0.6, 0],
                      scale: [0.8, 1, 1],
                      transition: { duration: 0.25, ease: "easeOut" }
                    }}
                  />
                </motion.div>
              ))}
              <button
                onClick={() => handleThumbNav("right")}
                className={clsx(
                  "p-1 sm:p-2 bg-white/10 hover:bg-white/20 transition-colors rounded flex-shrink-0 z-20",
                  activeThumb === thumbs.length - 1 ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                )}
                disabled={activeThumb === thumbs.length - 1}
              >
                <FiChevronRight
                  size={16}
                  className="sm:w-5 sm:h-5"
                  color="white"
                />
              </button>
              
              {/* Thumbnail Counter */}
              {thumbs.length > 1 && (
                <div className="px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-xs font-medium flex-shrink-0 min-w-[2.5rem] text-center z-20">
                  {activeThumb + 1}/{thumbs.length}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Series Cards Grid - No gaps, with vertical dividers */}
        <div className="flex flex-col sm:flex-row relative">
          {seriesItems.map((item, idx) => (
            <motion.div
              key={item.id}
              className="relative flex-1"
              initial={{ opacity: 0, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: idx * 0.2,
                type: "spring",
                stiffness: 100,
              }}
              viewport={{ once: true, amount: 0.3 }}
            >
              {/* Vertical Divider - except for last item */}
              {idx < seriesItems.length - 1 && (
                <motion.div
                  className="absolute top-0 right-0 h-full border-r border-gray-700/50 z-10"
                  initial={{ scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  transition={{ duration: 0.8, delay: 1 + idx * 0.1 }}
                  viewport={{ once: true }}
                />
              )}

              <motion.div
                className={clsx(
                  "relative bg-gray-900/30 hover:bg-gray-800/50 transition-all duration-300 cursor-pointer group overflow-hidden min-h-[400px] sm:min-h-[500px] md:min-h-[600px] flex flex-col",
                  idx === activeIndex && "bg-gray-800/50"
                )}
                onClick={() => handleSeriesChange(idx)}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                whileHover={{
                  y: -10,
                  boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
                  transition: { duration: 0.3 },
                }}
              >
                {/* Video background cho card được hover - Hiển thị ở dưới */}
                {hoveredIndex === idx && (
                  <motion.video
                    src="/videos/futuristic-background-2022-08-04-19-57-56-utc.mp4"
                    className="absolute inset-0 w-full h-full object-cover -z-10"
                    autoPlay
                    loop
                    muted
                    initial={{ opacity: 0, scale: 1.1 }}
                    animate={{ opacity: 0.6, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  />
                )}

                {/* Vertical Label */}
                <motion.div
                  className="absolute left-1 sm:left-2 md:left-4 top-1/2 -translate-y-1/2 font-bold text-lg sm:text-2xl md:text-3xl lg:text-4xl uppercase tracking-widest text-gray-400 z-10 font-sans"
                  style={{
                    writingMode: "vertical-rl",
                    transform: "translateY(-50%) rotate(180deg)",
                  }}
                  whileHover={{
                    color: "#4FC8FF",
                    scale: 1.1,
                    transition: { duration: 0.3 },
                  }}
                >
                  {item.label}
                </motion.div>

                {/* Product Image */}
                <motion.div
                  className="flex justify-center items-center py-6 sm:py-8 md:py-12 flex-1 z-10 relative"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Transition Loading Overlay */}
                  {isTransitioning && idx === activeIndex && (
                    <motion.div
                      className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-20 rounded-lg"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <motion.div
                        className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    </motion.div>
                  )}
                  
                  <motion.div
                    key={`${idx}-${idx === activeIndex ? activeThumb : 0}`}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ 
                      opacity: isTransitioning && idx === activeIndex ? 0.3 : 1, 
                      scale: 1
                    }}
                    transition={{
                      duration: 0.3,
                      ease: "easeOut",
                      opacity: { duration: 0.2 },
                      scale: { duration: 0.3, ease: "easeOut" }
                    }}
                    className="relative"
                  >
                    <Image
                      width={0}
                      height={0}
                      sizes="100vw"
                      priority={true}
                      src={
                        idx === activeIndex 
                          ? (item.thumbs?.[activeThumb]?.src || item.img)  // Series active dùng activeThumb
                          : (item.thumbs?.[0]?.src || item.img)            // Series khác dùng ảnh đầu tiên
                      }
                      alt={item.label}
                      className="w-[150px] sm:w-[200px] md:w-[250px] h-[150px] sm:h-[200px] md:h-[250px] object-contain transition-opacity duration-200 ease-out"
                    />
                    
                    {/* Subtle active indicators thay vì glow effect lòe loẹt */}
                    {idx === activeIndex && !isTransitioning && (
                      <>
                        {/* Subtle border highlight */}
                        <motion.div
                          className="absolute inset-0 border border-blue-400/30 rounded-lg pointer-events-none"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                        />
                        
                        {/* Small corner indicator */}
                        <motion.div
                          className="absolute top-3 right-3 w-2 h-2 bg-blue-400 rounded-full"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 0.9 }}
                          transition={{ duration: 0.3, delay: 0.1, type: "spring", stiffness: 300 }}
                        />
                        
                        {/* Subtle background tint */}
                        <motion.div
                          className="absolute inset-0 bg-blue-400/5 rounded-lg pointer-events-none"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                        />
                      </>
                    )}
                  </motion.div>
                </motion.div>

                {/* Content */}
                <motion.div
                  className="px-3 sm:px-4 md:px-6 pb-4 sm:pb-6 md:pb-8 pl-8 sm:pl-12 md:pl-16 z-10 relative"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  <motion.h3
                    className="text-white font-bold text-lg sm:text-xl md:text-2xl mb-2 md:mb-3 font-sans"
                    whileHover={{
                      color: "#4FC8FF",
                      scale: 1.05,
                      transition: { duration: 0.3 },
                    }}
                  >
                    {item.label.replace(" SERIES", " Series")}
                  </motion.h3>
                  <p className="text-gray-300 text-xs sm:text-sm md:text-base leading-relaxed mb-2 sm:mb-3 md:mb-4 font-sans">
                    Advanced communication technology designed for professional
                    riders with superior audio quality and durability.
                  </p>
                  <div className="flex justify-end">
                    <motion.div
                      whileHover={{
                        scale: 1.2,
                        rotate: 45,
                        color: "#4FC8FF",
                      }}
                      transition={{ duration: 0.3 }}
                    >
                      <FiArrowUpRight
                        size={20}
                        className={clsx(
                          "transition-colors w-5 h-5 sm:w-6 sm:h-6",
                          hoveredIndex === idx
                            ? "text-blue-400"
                            : "text-gray-500"
                        )}
                      />
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
