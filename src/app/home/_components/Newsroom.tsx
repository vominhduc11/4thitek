"use client";

import { FiArrowUpRight } from "react-icons/fi";
import { motion } from "framer-motion";

const newsItems = [
  {
    id: 1,
    img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=500&fit=crop",
    caption: "Latest motorcycle communication technology breakthrough in 2024"
  },
  {
    id: 2,
    img: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&h=500&fit=crop",
    caption: "Exploring new horizons with advanced rider communication systems"
  },
  {
    id: 3,
    img: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=500&fit=crop",
    caption: "Enjoying the ride with crystal clear group communication"
  },
  {
    id: 4,
    img: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400&h=500&fit=crop",
    caption: "Professional riders choose SCSETC for reliable communication"
  },
  {
    id: 5,
    img: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=500&fit=crop",
    caption: "Adventure awaits with our premium communication devices"
  },
  {
    id: 6,
    img: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=500&fit=crop",
    caption: "Innovation in motorcycle safety and communication technology"
  }
];

export default function Newsroom() {
  return (
    <motion.section 
      className="relative bg-gradient-to-b from-[#001A35] to-[#0c131d] py-20 md:py-24 px-6 md:px-24 overflow-hidden"
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      viewport={{ once: true, amount: 0.2 }}
    >
      {/* Heading */}
      <motion.div 
        className="text-center text-white z-10 mb-12"
        initial={{ y: -50, opacity: 0 }}
        whileInView={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        viewport={{ once: true }}
      >
        <motion.h2 
          className="text-4xl md:text-5xl font-semibold font-sans"
          whileHover={{ 
            scale: 1.05,
            color: "#4FC8FF",
            transition: { duration: 0.3 }
          }}
        >
          Newsroom
        </motion.h2>
        <motion.p 
          className="mt-3 text-base uppercase tracking-wider font-sans"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          viewport={{ once: true }}
        >
          #RIDING, EXPLORING, ENJOYING
        </motion.p>
        <motion.span 
          className="mt-2 text-sm text-white/70 block font-sans"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          viewport={{ once: true }}
        >
          SCSETC is here for your Ride...
        </motion.span>
      </motion.div>

      {/* News Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 z-10 relative">
        {newsItems.map((post, index) => (
          <motion.div 
            key={post.id} 
            className="relative w-full h-80 bg-black/10 rounded-lg overflow-hidden group cursor-pointer"
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              duration: 0.6, 
              delay: index * 0.1,
              type: "spring",
              stiffness: 100
            }}
            viewport={{ once: true, amount: 0.3 }}
            whileHover={{ 
              y: -10,
              scale: 1.02,
              boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
              transition: { duration: 0.3 }
            }}
          >
            <motion.img 
              src={post.img} 
              alt={post.caption} 
              className="w-full h-full object-cover"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.4 }}
            />
            
            {/* Hover Overlay */}
            <motion.div 
              className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col justify-between p-6"
              initial={{ opacity: 0 }}
              whileHover={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <motion.p 
                className="text-sm md:text-base text-white/90 font-sans"
                initial={{ y: 20, opacity: 0 }}
                whileHover={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                {post.caption}
              </motion.p>
              <div className="flex justify-end">
                <motion.button 
                  className="p-3 bg-white/20 hover:bg-white/40 rounded-full transition"
                  whileHover={{ 
                    scale: 1.2, 
                    rotate: 45,
                    backgroundColor: "rgba(79, 200, 255, 0.3)"
                  }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <FiArrowUpRight size={18} color="white" />
                </motion.button>
              </div>
            </motion.div>

            {/* Animated border on hover */}
            <motion.div
              className="absolute inset-0 border-2 border-transparent rounded-lg"
              whileHover={{ 
                borderColor: "#4FC8FF",
                boxShadow: "0 0 20px rgba(79, 200, 255, 0.3)"
              }}
              transition={{ duration: 0.3 }}
            />
          </motion.div>
        ))}
      </div>

      {/* Explore More Button */}
      <motion.div 
        className="text-center mt-10 z-10 relative"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        viewport={{ once: true }}
      >
        <motion.button 
          className="px-8 py-3 border border-white text-white hover:bg-white/10 rounded-full transition text-base font-medium font-sans"
          whileHover={{ 
            scale: 1.05,
            borderColor: "#4FC8FF",
            color: "#4FC8FF",
            boxShadow: "0 10px 25px rgba(79, 200, 255, 0.2)"
          }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          Explore More
        </motion.button>
      </motion.div>

      {/* Background animated elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400/30 rounded-full"
            style={{
              left: `${10 + i * 25}%`,
              top: `${20 + i * 15}%`,
            }}
            animate={{
              scale: [1, 2, 1],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 2 + i * 0.5,
              repeat: Infinity,
              delay: i * 0.5,
            }}
          />
        ))}
      </div>
    </motion.section>
  );
}
