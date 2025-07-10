"use client";

import { useState } from "react";
import { FiChevronLeft, FiChevronRight, FiArrowUpRight } from "react-icons/fi";
import clsx from "clsx";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const seriesItems = [
  {
    id: 1,
    label: "SX SERIES",
    img: "/products/product1.png",
    thumbs: [
      { src: "/products/product1.png", label: "S8X Pro" },
      { src: "/products/product2.png", label: "S8X Elite" },
      { src: "/products/product3.png", label: "S8X Max" },
      { src: "/products/product1.png", label: "S8X Standard" },
      { src: "/products/product2.png", label: "S8X Sport" },
    ],
  },
  {
    id: 2,
    label: "S SERIES",
    img: "/products/product3.png",
    thumbs: [
      { src: "/products/product3.png", label: "S Pro" },
      { src: "/products/product1.png", label: "S Standard" },
      { src: "/products/product2.png", label: "S Plus" },
      { src: "/products/product3.png", label: "S Compact" },
    ],
  },
  {
    id: 3,
    label: "G SERIES",
    img: "/products/product1.png",
    thumbs: [
      { src: "/products/product1.png", label: "G Pro" },
      { src: "/products/product2.png", label: "G Elite" },
      { src: "/products/product3.png", label: "G Standard" },
      { src: "/products/product1.png", label: "G Tactical" },
    ],
  },
  {
    id: 4,
    label: "G+ SERIES",
    img: "/products/product2.png",
    thumbs: [
      { src: "/products/product2.png", label: "G+ Elite" },
      { src: "/products/product3.png", label: "G+ Max" },
      { src: "/products/product1.png", label: "G+ Pro" },
      { src: "/products/product2.png", label: "G+ Sport" },
      { src: "/products/product3.png", label: "G+ Tactical" },
    ],
  },
];

export default function ProductSeries() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeThumb, setActiveThumb] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const router = useRouter();

  const thumbs = seriesItems[activeIndex].thumbs || [];
  
  // Navigate to products page with selected series
  const handleViewProducts = (seriesLabel: string) => {
    const seriesParam = encodeURIComponent(seriesLabel);
    router.push(`/products?series=${seriesParam}`);
  };
  
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
      className="bg-[#0c131d] w-full py-8 xs:py-10 sm:py-12 md:py-16 relative"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true, amount: 0.2 }}
    >
      <div className="sidebar-aware-container">
        {/* Divider with thumbnails interrupting it */}
        <motion.div
          className="relative mb-4 xs:mb-6 sm:mb-8 md:mb-10"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
          viewport={{ once: true }}
        >
          <div className="border-b border-gray-700/50"></div>
          {/* Thumbnails positioned to interrupt the divider */}
          <motion.div
            className="absolute top-0 right-0 xs:right-2 sm:right-0 transform -translate-y-1/2 z-30 max-w-[90%] xs:max-w-none"
            style={{ paddingTop: '8px' }}
            initial={{ x: 100, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 md:gap-3 overflow-x-auto overflow-y-visible scrollbar-hide bg-[#0c131d] px-1.5 xs:px-2 sm:px-4 py-2 xs:py-2.5 sm:py-3 scroll-smooth shadow-lg border border-gray-700/30 rounded-lg">
              {/* Left Navigation Button */}
              <button
                onClick={() => handleThumbNav("left")}
                className={clsx(
                  "p-1 xs:p-1.5 sm:p-2 bg-white/10 hover:bg-white/20 transition-colors rounded flex-shrink-0 z-20 min-w-[32px] xs:min-w-[36px] sm:min-w-[40px] min-h-[32px] xs:min-h-[36px] sm:min-h-[40px] flex items-center justify-center",
                  activeThumb === 0 ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                )}
                disabled={activeThumb === 0}
              >
                <FiChevronLeft
                  size={14}
                  className="xs:w-4 xs:h-4 sm:w-5 sm:h-5"
                  color="white"
                />
              </button>
              {thumbs.map((thumb, idx) => (
                <motion.div
                  key={`${activeIndex}-${idx}-${thumb.label}`}
                  className={clsx(
                    "relative w-[45px] xs:w-[55px] sm:w-[70px] md:w-[90px] lg:w-[100px] h-[28px] xs:h-[35px] sm:h-[45px] md:h-[60px] lg:h-[70px] cursor-pointer border-2 rounded overflow-hidden flex-shrink-0 bg-[#0c131d] z-10",
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
                    scale: 1.05,
                    zIndex: 50,
                    boxShadow: "0 4px 15px rgba(79, 200, 255, 0.4)",
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
                      sizes="(max-width: 475px) 45px, (max-width: 640px) 55px, (max-width: 768px) 70px, (max-width: 1024px) 90px, 100px"
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
                  
                  <span className="absolute top-0.5 xs:top-1 left-0.5 xs:left-1 md:left-2 text-white text-[10px] xs:text-xs font-bold z-10 drop-shadow-sm">
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
                  "p-1 xs:p-1.5 sm:p-2 bg-white/10 hover:bg-white/20 transition-colors rounded flex-shrink-0 z-20 min-w-[32px] xs:min-w-[36px] sm:min-w-[40px] min-h-[32px] xs:min-h-[36px] sm:min-h-[40px] flex items-center justify-center",
                  activeThumb === thumbs.length - 1 ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                )}
                disabled={activeThumb === thumbs.length - 1}
              >
                <FiChevronRight
                  size={14}
                  className="xs:w-4 xs:h-4 sm:w-5 sm:h-5"
                  color="white"
                />
              </button>
              
              {/* Thumbnail Counter */}
              {thumbs.length > 1 && (
                <div className="px-1.5 xs:px-2 py-1 bg-black/50 backdrop-blur-sm rounded-full text-white text-[10px] xs:text-xs font-medium flex-shrink-0 min-w-[2rem] xs:min-w-[2.5rem] text-center z-20">
                  {activeThumb + 1}/{thumbs.length}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>

        {/* Series Cards Grid - Responsive layout */}
        <div className="flex flex-col lg:flex-row relative gap-2 sm:gap-0">
          {seriesItems.map((item, idx) => (
            <motion.div
              key={item.id}
              className="relative flex-1"
              initial={{ opacity: 0, y: 100 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                delay: idx * 0.15,
                type: "spring",
                stiffness: 100,
              }}
              viewport={{ once: true, amount: 0.3 }}
            >
              {/* Vertical Divider - except for last item on desktop */}
              {idx < seriesItems.length - 1 && (
                <motion.div
                  className="absolute top-0 right-0 h-full border-r border-gray-700/50 z-10 hidden lg:block"
                  initial={{ scaleY: 0 }}
                  whileInView={{ scaleY: 1 }}
                  transition={{ duration: 0.8, delay: 1 + idx * 0.1 }}
                  viewport={{ once: true }}
                />
              )}

              <motion.div
                className={clsx(
                  "relative bg-gray-900/30 hover:bg-gray-800/50 transition-all duration-300 cursor-pointer group overflow-hidden min-h-[320px] xs:min-h-[360px] sm:min-h-[400px] md:min-h-[450px] lg:min-h-[500px] xl:min-h-[600px] flex flex-col rounded-lg lg:rounded-none",
                  idx === activeIndex && "bg-gray-800/50"
                )}
                onClick={() => handleSeriesChange(idx)}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                whileHover={{
                  y: -5,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                  transition: { duration: 0.3 },
                }}
              >
                {/* Video background cho card được hover - Chỉ hiển thị trên desktop */}
                {hoveredIndex === idx && (
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

                {/* Vertical Label - Responsive positioning */}
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
                  {item.label}
                </motion.div>

                {/* Product Image - Responsive sizing */}
                <motion.div
                  className="flex justify-center items-center py-4 xs:py-6 sm:py-8 md:py-10 lg:py-12 flex-1 z-10 relative"
                  whileHover={{ scale: 1.03 }}
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
                        className="w-6 xs:w-7 sm:w-8 h-6 xs:h-7 sm:h-8 border-2 border-blue-400 border-t-transparent rounded-full"
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
                      sizes="(max-width: 475px) 120px, (max-width: 640px) 150px, (max-width: 768px) 180px, (max-width: 1024px) 200px, 250px"
                      priority={true}
                      src={
                        idx === activeIndex 
                          ? (item.thumbs?.[activeThumb]?.src || item.img)
                          : (item.thumbs?.[0]?.src || item.img)
                      }
                      alt={item.label}
                      className="w-[120px] xs:w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px] xl:w-[250px] h-[120px] xs:h-[140px] sm:h-[160px] md:h-[180px] lg:h-[200px] xl:h-[250px] object-contain transition-opacity duration-200 ease-out"
                    />
                    
                    {/* Subtle active indicators */}
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
                          className="absolute top-2 xs:top-3 right-2 xs:right-3 w-1.5 xs:w-2 h-1.5 xs:h-2 bg-blue-400 rounded-full"
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

                {/* Content - Responsive typography and spacing */}
                <motion.div
                  className="px-2 xs:px-3 sm:px-4 md:px-6 pb-3 xs:pb-4 sm:pb-6 md:pb-8 pl-6 xs:pl-8 sm:pl-10 md:pl-12 lg:pl-16 z-10 relative"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  <motion.h3
                    className="text-white font-bold text-base xs:text-lg sm:text-xl md:text-2xl mb-1.5 xs:mb-2 md:mb-3 font-sans"
                    whileHover={{
                      color: "#4FC8FF",
                      scale: 1.02,
                      transition: { duration: 0.3 },
                    }}
                  >
                    {item.label.replace(" SERIES", " Series")}
                  </motion.h3>
                  <p className="text-gray-300 text-xs xs:text-sm sm:text-base leading-relaxed mb-2 xs:mb-3 md:mb-4 font-sans line-clamp-3 sm:line-clamp-none">
                    Advanced communication technology designed for professional
                    riders with superior audio quality and durability.
                  </p>
                  <div className="flex justify-end">
                    <motion.button
                      onClick={() => handleViewProducts(item.label)}
                      whileHover={{
                        scale: 1.15,
                        rotate: 45,
                        color: "#4FC8FF",
                      }}
                      transition={{ duration: 0.3 }}
                      className="p-1 xs:p-1.5 sm:p-2 rounded-full hover:bg-white/10 transition-colors"
                      aria-label={`View ${item.label} products`}
                    >
                      <FiArrowUpRight
                        size={16}
                        className={clsx(
                          "transition-colors w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6",
                          hoveredIndex === idx
                            ? "text-blue-400"
                            : "text-gray-500"
                        )}
                      />
                    </motion.button>
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
