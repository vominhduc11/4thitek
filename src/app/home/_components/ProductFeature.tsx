"use client";

import { useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

const featuredItems = [
  {
    id: 1,
    title: "SCS S8X Pro",
    img: "/products/product1.png",
    description:
      "Advanced communication device with Bluetooth 5.0 technology, waterproof design, and crystal clear audio quality for professional use.",
  },
  {
    id: 2,
    title: "SCS G+ Elite",
    img: "/products/product1.png",
    description:
      "Premium series featuring enhanced noise cancellation, extended battery life, and seamless group communication capabilities.",
  },
  {
    id: 3,
    title: "SCS S Series",
    img: "/products/product1.png",
    description:
      "Reliable and durable communication solution designed for everyday use with superior sound quality and ergonomic design.",
  },
];

export default function ProductFeature() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const prev = () => {
    setDirection(-1);
    setActiveIndex((i) => (i > 0 ? i - 1 : featuredItems.length - 1));
  };

  const next = () => {
    setDirection(1);
    setActiveIndex((i) => (i + 1) % featuredItems.length);
  };

  const activeItem = featuredItems[activeIndex];

  // Animation variants for product image
  const imageVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.8,
      rotateY: direction > 0 ? 45 : -45,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      rotateY: 0,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 300 : -300,
      opacity: 0,
      scale: 0.8,
      rotateY: direction < 0 ? 45 : -45,
    }),
  };

  // Animation variants for product info
  const infoVariants = {
    enter: {
      y: 50,
      opacity: 0,
    },
    center: {
      y: 0,
      opacity: 1,
    },
    exit: {
      y: -50,
      opacity: 0,
    },
  };

  // Animation variants for title
  const titleVariants = {
    enter: {
      scale: 0.8,
      opacity: 0,
      y: 30,
    },
    center: {
      scale: 1,
      opacity: 1,
      y: 0,
    },
    exit: {
      scale: 1.2,
      opacity: 0,
      y: -30,
    },
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#0c131d] to-[#001A35] py-16 md:py-24 pl-6 md:pl-24 pr-6">
      {/* Diagonal Pattern */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `repeating-linear-gradient(
            30deg,
            rgba(255,255,255,0.05) 0,
            rgba(255,255,255,0.05) 1px,
            transparent 1px,
            transparent 80px
          )`,
        }}
      ></div>

      {/* Heading */}
      <motion.h2
        className="relative z-10 text-center text-3xl md:text-4xl font-medium text-white mb-12 font-sans"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        Our Featured Products
      </motion.h2>

      {/* Carousel */}
      <div className="relative flex items-center justify-center z-10">
        {/* Left Arrow - Original style, closer position */}
        <motion.button
          onClick={prev}
          className="absolute left-[500px] p-1 md:p-2 rounded-full z-20 bg-transparent hover:bg-transparent active:bg-transparent"
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.2 }}
          style={{ boxShadow: "none" }}
        >
          <FiChevronLeft size={42} color="white" />
        </motion.button>

        {/* Product Image with Animation */}
        <div className="w-[400px] h-[300px] relative group">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.img
              key={activeItem.id}
              src={activeItem.img}
              alt={activeItem.title}
              custom={direction}
              variants={imageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              whileHover={{ scale: 1.12 }}
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.3 },
                scale: { duration: 0.4 },
                rotateY: { duration: 0.4 },
              }}
              className="absolute inset-0 w-full h-full object-contain"
              style={{ perspective: "1000px" }}
            />
          </AnimatePresence>
        </div>

        {/* Right Arrow - Closer to product */}
        <motion.button
          onClick={next}
          className="absolute right-[500px] p-1 md:p-2 rounded-full z-20 bg-transparent hover:bg-transparent active:bg-transparent"
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.2 }}
          style={{ boxShadow: "none" }}
        >
          <FiChevronRight size={42} color="white" />
        </motion.button>
      </div>

      {/* Product Info with Animation */}
      <div className="mt-8 text-center z-10 max-w-xl mx-auto relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeItem.id}
            variants={infoVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <motion.h3
              className="text-3xl md:text-4xl font-bold text-[#4FC8FF] mb-4 font-sans"
              variants={titleVariants}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              {activeItem.title}
            </motion.h3>
            <motion.p
              className="text-base md:text-lg text-white/80 leading-relaxed mb-6 font-sans"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {activeItem.description}
            </motion.p>
            <motion.button
              className="px-6 py-2 border border-white text-white text-base font-medium font-sans hover:bg-white/10 rounded-full transition"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.4 }}
              whileHover={{
                scale: 1.05,
                backgroundColor: "rgba(255,255,255,0.1)",
                borderColor: "#4FC8FF",
                color: "#4FC8FF",
              }}
              whileTap={{ scale: 0.95 }}
            >
              DISCOVERY NOW
            </motion.button>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Dot Indicators */}
      <motion.div
        className="flex justify-center mt-8 space-x-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        {featuredItems.map((_, index) => (
          <motion.button
            key={index}
            onClick={() => {
              setDirection(index > activeIndex ? 1 : -1);
              setActiveIndex(index);
            }}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === activeIndex
                ? "bg-[#4FC8FF] scale-125"
                : "bg-white/40 hover:bg-white/60"
            }`}
            whileHover={{ scale: index === activeIndex ? 1.25 : 1.1 }}
            whileTap={{ scale: 0.9 }}
          />
        ))}
      </motion.div>
    </section>
  );
}
