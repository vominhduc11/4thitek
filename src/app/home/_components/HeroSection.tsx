"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <section className="relative w-full h-[500px] sm:h-[600px] md:h-[700px] overflow-hidden">
      {/* Background Video */}
      <motion.video
        src="/videos/motorbike-road-trip-2022-07-26-01-49-02-utc.mp4"
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        loop
        muted
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

      {/* Title (behind image) */}
      <motion.h1 
        className="absolute top-[15%] sm:top-[18%] left-1/2 transform -translate-x-1/2 text-white text-[60px] sm:text-[80px] md:text-[120px] lg:text-[200px] font-sans leading-none z-20"
        initial={{ y: -100, opacity: 0, scale: 0.8 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ 
          duration: 1.5, 
          delay: 1,
          type: "spring",
          stiffness: 100,
          damping: 15
        }}
        whileHover={{ 
          scale: 1.05,
          textShadow: "0 0 30px rgba(79, 200, 255, 0.5)",
          transition: { duration: 0.3 }
        }}
      >
        SCS S8X
      </motion.h1>

      {/* Product Image (on top of title but below description) */}
      <motion.div 
        className="absolute top-[18%] sm:top-[20%] left-1/2 transform -translate-x-1/2 z-25"
        initial={{ scale: 0, rotate: -180, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ 
          duration: 1.8, 
          delay: 1.5,
          type: "spring",
          stiffness: 80,
          damping: 12
        }}
        whileHover={{ 
          scale: 1.1,
          rotate: 5,
          y: -10,
          transition: { duration: 0.4, type: "spring", stiffness: 300 }
        }}
      >
        <Image
          src="/products/product1.png"
          alt="SCS S8X"
          width={384}
          height={216}
          className="object-contain drop-shadow-2xl w-[250px] sm:w-[300px] md:w-[384px] h-auto"
        />
      </motion.div>

      {/* Description & Button (above image) */}
      <motion.div 
        className="absolute bottom-[4%] sm:bottom-[6%] left-1/2 transform -translate-x-1/2 text-center px-4 sm:px-6 z-20"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.2, delay: 2.2 }}
      >
        <motion.p 
          className="text-white text-sm sm:text-base md:text-lg max-w-xl sm:max-w-2xl mb-4 sm:mb-6 font-sans"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2.5 }}
        >
          SCSETC latest S8X&apos;s unique appearance and a variety of functions
          allow users to have a better product experience. S8X has a unique rain
          proof structure, Bluetooth 5.0 communication technology, group
          intercom connection, advanced noise control, stereo music playback,
          GPS navigation, etc.
        </motion.p>
        <motion.button 
          className="px-4 sm:px-6 py-2 sm:py-3 border border-white text-white text-sm sm:text-base font-medium font-sans rounded-full hover:bg-white hover:text-black transition cursor-pointer"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            duration: 0.8, 
            delay: 2.8,
            type: "spring",
            stiffness: 200
          }}
          whileHover={{ 
            scale: 1.05,
            boxShadow: "0 10px 25px rgba(255, 255, 255, 0.2)",
            borderColor: "#4FC8FF",
            transition: { duration: 0.3 }
          }}
          whileTap={{ scale: 0.95 }}
        >
          DISCOVERY NOW
        </motion.button>
      </motion.div>

      {/* Gradient Overlay */}
      <motion.div
        className="
          absolute inset-x-0 bottom-0
          h-32 sm:h-48 md:h-64
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

      {/* Floating particles effect */}
      <div className="absolute inset-0 z-5 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            style={{
              left: `${15 + i * 12}%`,
              top: `${25 + (i % 3) * 20}%`,
            }}
            animate={{
              y: [-20, 20, -20],
              opacity: [0.2, 0.8, 0.2],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + i * 0.3,
              repeat: Infinity,
              delay: i * 0.4,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Animated light rays */}
      <div className="absolute inset-0 z-5 pointer-events-none overflow-hidden">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={`ray-${i}`}
            className="absolute w-px h-full bg-gradient-to-b from-transparent via-white/10 to-transparent"
            style={{
              left: `${30 + i * 25}%`,
              transform: 'rotate(15deg)',
            }}
            animate={{
              opacity: [0, 0.3, 0],
              scaleY: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 4 + i * 0.5,
              repeat: Infinity,
              delay: i * 1.2,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    </section>
  );
}
