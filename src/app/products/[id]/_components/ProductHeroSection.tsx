'use client';

import { motion } from 'framer-motion';
import { FiPlus, FiMousePointer } from 'react-icons/fi';
import { TbArrowsLeftRight } from 'react-icons/tb';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { Product } from '../../_components/types';

interface ProductHeroSectionProps {
    product: Product;
}

const ProductHeroSection = ({ product }: ProductHeroSectionProps) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    // Auto-play carousel
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % 3); // Assuming 3 slides
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + 3) % 3);
    };

    return (
        <div className="relative w-full h-[600px] lg:h-[700px] overflow-hidden">
            {/* Futuristic Video Background */}
            <motion.video
                src="/videos/futuristic-background-2022-08-04-19-57-56-utc.mp4"
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                transition={{ duration: 2 }}
            />

            {/* Dark Overlay */}
            <div className="absolute inset-0 bg-black/40" />

            {/* Vertical "S SERIES" Text - Left Side */}
            <motion.div
                className="absolute left-10 top-1/2 transform -translate-y-1/2 z-20"
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
            >
                <div
                    className="text-white text-xl font-bold tracking-[0.3em] tech-font"
                    style={{
                        writingMode: 'vertical-rl',
                        textOrientation: 'mixed'
                    }}
                >
                    S SERIES
                </div>
            </motion.div>

            {/* Main Content Container */}
            <div className="relative z-10 h-full flex flex-col">
                {/* Product Title - Top Center */}
                <motion.div
                    className="flex-shrink-0 text-center pt-12 lg:pt-16 px-4"
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                >
                    <h1 className="text-white font-sans uppercase">
                        <div className="text-2xl lg:text-4xl font-bold mb-2 tracking-wide">
                            TAI NGHE BLUETOOTH INTERCOM
                        </div>
                        <div className="text-xl lg:text-3xl font-medium tracking-wide">SCS S-9 CHO MŨ BẢO HIỂM</div>
                    </h1>
                </motion.div>

                {/* Product Display Area - Center */}
                <div className="flex-1 flex items-center justify-center relative px-4">
                    {/* Carousel Navigation Button - Left */}
                    <motion.button
                        onClick={prevSlide}
                        className="absolute left-8 lg:left-24 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-all duration-300 group z-20"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                    >
                        <TbArrowsLeftRight className="w-6 h-6 text-black group-hover:scale-110 transition-transform" />
                    </motion.button>

                    {/* Product Image - Center */}
                    <motion.div
                        className="relative w-80 h-80 lg:w-[500px] lg:h-[500px]"
                        key={currentSlide}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-contain drop-shadow-2xl filter drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                            priority
                        />
                    </motion.div>

                    {/* Buy Now Button - Right */}
                    <motion.button
                        className="absolute right-8 lg:right-24 top-1/2 transform -translate-y-1/2 bg-white text-black px-6 py-3 rounded-full flex items-center space-x-2 hover:bg-gray-100 transition-all duration-300 group z-20"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.5 }}
                    >
                        <span className="font-semibold text-base">BUY NOW</span>
                        <FiPlus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                        <FiMousePointer className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                    </motion.button>
                </div>

                {/* Slide Indicators */}
                <motion.div
                    className="flex-shrink-0 flex justify-center space-x-2 pb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                >
                    {[0, 1, 2].map((index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                index === currentSlide ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/60'
                            }`}
                        />
                    ))}
                </motion.div>
            </div>

            {/* Mobile Responsive Adjustments */}
            <style jsx>{`
                @media (max-width: 768px) {
                    .tech-font {
                        font-size: 16px;
                        left: 20px;
                    }
                }
            `}</style>
        </div>
    );
};

export default ProductHeroSection;
