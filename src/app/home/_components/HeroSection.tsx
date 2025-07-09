"use client";

import Image from "next/image";
import { motion } from "framer-motion";

export default function HeroSection() {
  return (
    <section className="relative w-full h-[450px] xs:h-[500px] sm:h-[600px] md:h-[700px] lg:h-[800px] overflow-hidden">
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

      {/* Title (behind image) */}
      <motion.h1 
        className="absolute top-[12%] xs:top-[15%] sm:top-[18%] md:top-[16%] left-1/2 transform -translate-x-1/2 text-white text-[45px] xs:text-[55px] sm:text-[80px] md:text-[120px] lg:text-[160px] xl:text-[200px] font-sans leading-none z-20 text-center px-2"
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
        className="absolute top-[16%] xs:top-[18%] sm:top-[20%] md:top-[18%] lg:top-[20%] left-1/2 transform -translate-x-1/2 z-25"
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
          className="object-contain drop-shadow-2xl w-[180px] xs:w-[220px] sm:w-[280px] md:w-[350px] lg:w-[384px] h-auto"
          priority
        />
      </motion.div>

      {/* Description & Button (above image) */}
      <motion.div 
        className="absolute bottom-[3%] xs:bottom-[4%] sm:bottom-[6%] md:bottom-[5%] left-1/2 transform -translate-x-1/2 text-center px-3 xs:px-4 sm:px-6 z-20 w-full max-w-[90%] sm:max-w-none"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.2, delay: 2.2 }}
      >
        <motion.p 
          className="text-white text-xs xs:text-sm sm:text-base md:text-lg max-w-sm xs:max-w-lg sm:max-w-xl md:max-w-2xl mx-auto mb-3 xs:mb-4 sm:mb-6 font-sans leading-relaxed"
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
          className="px-3 xs:px-4 sm:px-6 py-2 xs:py-2.5 sm:py-3 border border-white text-white text-xs xs:text-sm sm:text-base font-medium font-sans rounded-full hover:bg-white hover:text-black transition cursor-pointer min-w-[140px] xs:min-w-[160px] sm:min-w-auto"
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

      {/* Floating particles effect - Responsive */}
      <div className="absolute inset-0 z-5 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 xs:w-2 sm:w-2.5 h-1.5 xs:h-2 sm:h-2.5 bg-white/20 rounded-full"
            style={{
              left: `${10 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [-15, 15, -15],
              opacity: [0.1, 0.6, 0.1],
              scale: [0.8, 1.3, 0.8],
            }}
            transition={{
              duration: 2.5 + i * 0.3,
              repeat: Infinity,
              delay: i * 0.4,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Animated light rays - Responsive */}
      <div className="absolute inset-0 z-5 pointer-events-none overflow-hidden">
        {[...Array(2)].map((_, i) => (
          <motion.div
            key={`ray-${i}`}
            className="absolute w-px h-full bg-gradient-to-b from-transparent via-white/8 to-transparent hidden sm:block"
            style={{
              left: `${25 + i * 30}%`,
              transform: 'rotate(12deg)',
            }}
            animate={{
              opacity: [0, 0.25, 0],
              scaleY: [0.4, 1, 0.4],
            }}
            transition={{
              duration: 3.5 + i * 0.5,
              repeat: Infinity,
              delay: i * 1.5,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    </section>
  );
}
