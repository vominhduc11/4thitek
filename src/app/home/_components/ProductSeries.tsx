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
    ],
  },
  {
    id: 3,
    label: "G SERIES",
    img: "/products/product1.png",
    thumbs: [
      { src: "/products/product1.png", label: "01" },
      { src: "/products/product2.png", label: "02" },
    ],
  },
  {
    id: 4,
    label: "G+ SERIES",
    img: "/products/product1.png",
    thumbs: [{ src: "/products/product1.png", label: "01" }],
  },
];

export default function ProductSeries() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [activeThumb, setActiveThumb] = useState(0);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const thumbs = seriesItems[activeIndex].thumbs || [];
  const handleThumbNav = (dir: "left" | "right") => {
    setActiveThumb((prev) => {
      if (dir === "left") return Math.max(prev - 1, 0);
      if (dir === "right") return Math.min(prev + 1, thumbs.length - 1);
      return prev;
    });
  };

  return (
    <motion.section 
      className="bg-[#0c131d] w-full pl-6 md:pl-24 pr-5 py-16 relative"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true, amount: 0.2 }}
    >
      {/* Divider with thumbnails interrupting it */}
      <motion.div 
        className="relative mb-10"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
        viewport={{ once: true }}
      >
        <div className="border-b border-gray-700/50"></div>
        {/* Thumbnails positioned to interrupt the divider */}
        <motion.div 
          className="absolute top-0 right-0 transform -translate-y-1/2"
          initial={{ x: 100, opacity: 0 }}
          whileInView={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-2 md:gap-3 overflow-x-auto bg-[#0c131d] px-4">
            <motion.button
              onClick={() => handleThumbNav("left")}
              className={clsx(
                "p-2 bg-white/10 hover:bg-white/20 transition rounded flex-shrink-0",
                activeThumb === 0 && "opacity-40 pointer-events-none"
              )}
              whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.3)" }}
              whileTap={{ scale: 0.9 }}
            >
              <FiChevronLeft size={20} color="white" />
            </motion.button>
            {thumbs.map((thumb, idx) => (
              <motion.div
                key={thumb.src}
                className={clsx(
                  "relative w-[80px] md:w-[100px] h-[50px] md:h-[70px] cursor-pointer border-2 transition-all rounded overflow-hidden flex-shrink-0 bg-[#0c131d]",
                  idx === activeThumb
                    ? "border-blue-400"
                    : "border-white/30 hover:border-white/60"
                )}
                onClick={() => setActiveThumb(idx)}
                initial={{ scale: 0, rotate: 180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  duration: 0.5, 
                  delay: 0.8 + idx * 0.1,
                  type: "spring",
                  stiffness: 200
                }}
                whileHover={{ 
                  scale: 1.05,
                  y: -5,
                  boxShadow: "0 10px 20px rgba(79, 200, 255, 0.3)"
                }}
                whileTap={{ scale: 0.95 }}
              >
                <Image
                  width={0}
                  height={0}
                  sizes="100vw"
                  priority
                  src={thumb.src}
                  alt={thumb.label}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-1 left-1 md:left-2 text-white text-xs md:text-sm font-bold">
                  {thumb.label}
                </span>
              </motion.div>
            ))}
            <motion.button
              onClick={() => handleThumbNav("right")}
              className={clsx(
                "p-2 bg-white/10 hover:bg-white/20 transition rounded flex-shrink-0",
                activeThumb === thumbs.length - 1 &&
                  "opacity-40 pointer-events-none"
              )}
              whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.3)" }}
              whileTap={{ scale: 0.9 }}
            >
              <FiChevronRight size={20} color="white" />
            </motion.button>
          </div>
        </motion.div>
      </motion.div>

      {/* Series Cards Grid - No gaps, with vertical dividers */}
      <div className="flex relative">
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
              stiffness: 100
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
                "relative bg-gray-900/30 hover:bg-gray-800/50 transition-all duration-300 cursor-pointer group overflow-hidden min-h-[500px] md:min-h-[600px] flex flex-col",
                idx === activeIndex && "bg-gray-800/50"
              )}
              onClick={() => setActiveIndex(idx)}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              whileHover={{ 
                y: -10,
                boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
                transition: { duration: 0.3 }
              }}
            >
              {/* Video background cho card được hover - Hiển thị ở dưới */}
              {hoveredIndex === idx && (
                <motion.video
                  src="/videos/futuristic-background-2022-08-04-19-57-56-utc.mp4"
                  className="absolute inset-0 w-full h-full object-cover opacity-20 -z-10"
                  autoPlay
                  loop
                  muted
                  initial={{ opacity: 0, scale: 1.1 }}
                  animate={{ opacity: 0.2, scale: 1 }}
                  transition={{ duration: 0.5 }}
                />
              )}

              {/* Vertical Label */}
              <motion.div
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 font-bold text-2xl md:text-3xl lg:text-4xl uppercase tracking-widest text-gray-400 z-10 font-sans"
                style={{
                  writingMode: "vertical-rl",
                  transform: "translateY(-50%) rotate(180deg)",
                }}
                whileHover={{ 
                  color: "#4FC8FF",
                  scale: 1.1,
                  transition: { duration: 0.3 }
                }}
              >
                {item.label}
              </motion.div>

              {/* Product Image */}
              <motion.div 
                className="flex justify-center items-center py-8 md:py-12 flex-1 z-10"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <Image
                  width={0}
                  height={0}
                  sizes="100vw"
                  priority={true}
                  src={item.thumbs?.[activeThumb]?.src || item.img}
                  alt={item.label}
                  className="w-[200px] md:w-[250px] h-[200px] md:h-[250px] object-contain transition-transform duration-300"
                />
              </motion.div>

              {/* Content */}
              <motion.div 
                className="px-4 md:px-6 pb-6 md:pb-8 pl-12 md:pl-16 z-10 relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <motion.h3 
                  className="text-white font-bold text-xl md:text-2xl mb-2 md:mb-3 font-sans"
                  whileHover={{ 
                    color: "#4FC8FF",
                    scale: 1.05,
                    transition: { duration: 0.3 }
                  }}
                >
                  {item.label.replace(" SERIES", " Series")}
                </motion.h3>
                <p className="text-gray-300 text-sm md:text-base leading-relaxed mb-3 md:mb-4 font-sans">
                  Advanced communication technology designed for professional
                  riders with superior audio quality and durability.
                </p>
                <div className="flex justify-end">
                  <motion.div
                    whileHover={{ 
                      scale: 1.2, 
                      rotate: 45,
                      color: "#4FC8FF"
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <FiArrowUpRight
                      size={20}
                      className={clsx(
                        "transition-colors md:w-6 md:h-6",
                        hoveredIndex === idx ? "text-blue-400" : "text-gray-500"
                      )}
                    />
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
