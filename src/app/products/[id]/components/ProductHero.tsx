'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CiShuffle } from 'react-icons/ci';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
    id: string;
    name: string;
    subtitle: string;
    description: string;
    image: string;
    series?: {
        id: string;
        name: string;
    };
}

interface BreadcrumbItem {
    label: string;
    section: string;
}

interface ProductHeroProps {
    product: Product;
    breadcrumbItems: BreadcrumbItem[];
    activeBreadcrumb: string;
    onBreadcrumbClick: (item: BreadcrumbItem) => void;
    seriesProducts?: Product[]; // List of products in the same series
    currentProductIndex?: number; // Current product index in series
    onProductSwitch?: (index: number) => void; // Function to switch product
}

export default function ProductHero({
    product,
    breadcrumbItems,
    activeBreadcrumb,
    onBreadcrumbClick,
    seriesProducts = [],
    currentProductIndex = 0,
    onProductSwitch
}: ProductHeroProps) {
    const [, setVideoLoaded] = useState(false);
    const [, setVideoError] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const router = useRouter();

    const handleFindRetailer = () => {
        router.push('/reseller_infomation');
    };

    const handleShuffleProduct = () => {
        console.log('Current product index:', currentProductIndex);
        console.log('Series products:', seriesProducts);
        
        if (seriesProducts.length <= 1) {
            console.log('No other products in this series');
            return;
        }

        // Get all possible indices except current one
        const availableIndices = seriesProducts
            .map((_, index) => index)
            .filter(index => index !== currentProductIndex);

        if (availableIndices.length === 0) {
            console.log('No other products available');
            return;
        }

        // Pick a random index from available ones
        const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
        
        console.log('Switching to product index:', randomIndex);
        console.log('Product:', seriesProducts[randomIndex]);
        
        // Use callback to switch product instead of navigation
        if (onProductSwitch) {
            onProductSwitch(randomIndex);
        }
    };


    return (
        <section
            id="product-videos"
            className="relative min-h-screen flex items-center justify-center overflow-visible group"
        >
            {/* Video Background */}
            <div className="absolute inset-0 z-0">
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className="w-full h-full object-cover"
                    onLoadedData={() => {
                        console.log('Video loaded successfully');
                        setVideoLoaded(true);
                        if (videoRef.current && videoRef.current.paused) {
                            videoRef.current.play().catch(console.error);
                        }
                    }}
                    onError={(e) => {
                        console.error('Video failed to load:', e);
                        setVideoError(true);
                    }}
                    onCanPlay={() => {
                        console.log('Video can play');
                        if (videoRef.current) {
                            videoRef.current.play().catch(console.error);
                        }
                    }}
                >
                    <source src="/videos/futuristic-background-2022-08-04-19-57-56-utc.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                </video>

                {/* Fallback background image */}
                <div
                    className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-black"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)'
                    }}
                ></div>

                {/* Dark overlay for better text readability */}
                <div className="absolute inset-0 bg-black/30"></div>

                {/* Top gradient overlay */}
                <div className="absolute top-0 left-0 right-0 h-96 bg-gradient-to-b from-black via-black/95 via-black/85 via-black/75 via-black/65 via-black/55 via-black/45 via-black/35 via-black/25 via-black/15 to-transparent z-10"></div>

                {/* Bottom gradient overlay */}
                <div className="absolute bottom-0 left-0 right-0 h-[600px] bg-gradient-to-t from-black via-black/95 via-black/85 via-black/75 via-black/65 via-black/55 via-black/45 via-black/35 via-black/25 via-black/15 to-transparent z-10"></div>

                {/* Left gradient overlay */}
                <div
                    className="absolute top-0 bottom-0 left-0 w-32 bg-gradient-to-r from-black via-black/95 via-black/85 via-black/75 via-black/65 via-black/55 via-black/45 via-black/35 via-black/25 via-black/15 to-transparent z-10"
                    style={{ clipPath: 'ellipse(100% 70% at 0% 50%)' }}
                ></div>

                {/* Right gradient overlay */}
                <div
                    className="absolute top-0 bottom-0 right-0 w-32 bg-gradient-to-l from-black via-black/95 via-black/85 via-black/75 via-black/65 via-black/55 via-black/45 via-black/35 via-black/25 via-black/15 to-transparent z-10"
                    style={{ clipPath: 'ellipse(100% 70% at 100% 50%)' }}
                ></div>
            </div>

            {/* Side Navigation */}
            <div className="absolute left-20 top-2/5 transform -translate-y-1/2 -rotate-90 z-30 mt-5 -ml-6">
                <div className="text-white font-bold tracking-[0.3em] text-5xl">
                    {product.series?.name || 'PRODUCT SERIES'}
                </div>
            </div>

            {/* Main Content Area with Product Image */}
            <div className="relative z-10 container mx-auto px-4 text-center -mt-32">

                {/* Product Image with Navigation */}
                <div className="flex items-center justify-center min-h-screen px-4">
                    <div className="grid grid-cols-3 items-center w-full max-w-6xl">
                        {/* Left Navigation - Shuffle Button */}
                        <div className="flex justify-start">
                            <button 
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('Shuffle button clicked!');
                                    handleShuffleProduct();
                                }}
                                className="w-12 h-12 bg-white/10 hover:bg-white rounded-full flex items-center justify-center transition-all duration-300 backdrop-blur-sm border border-white/20 opacity-0 group-hover:opacity-100 transform -translate-x-4 group-hover:translate-x-0 hover:scale-110 cursor-pointer z-50 group/shuffle"
                                title={`Shuffle sản phẩm khác trong ${product.series?.name || 'series này'}`}
                            >
                                <CiShuffle className="w-6 h-6 text-white group-hover/shuffle:text-gray-800 pointer-events-none transition-colors duration-300" />
                            </button>
                        </div>

                        {/* Product Image - Centered */}
                        <div className="flex flex-col justify-center items-center">
                            {/* Product Title with Animation */}
                            <div className="text-center mb-8">
                                <AnimatePresence mode="wait">
                                    <motion.h1
                                        key={product.id + '-title'}
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 20 }}
                                        transition={{ 
                                            duration: 0.5,
                                            ease: [0.25, 0.1, 0.25, 1]
                                        }}
                                        className="text-2xl md:text-3xl font-bold text-white w-[520px]"
                                    >
                                        {product.name}
                                    </motion.h1>
                                </AnimatePresence>
                            </div>

                            <div className="relative w-full max-w-md h-96 md:h-[500px] -mt-24">
                                <div className="relative w-full h-full flex items-center justify-center">
                                    {/* Product Image with Animation */}
                                    <AnimatePresence mode="wait">
                                        <motion.img
                                            key={product.id + '-image'}
                                            src={product.image || "/products/product1.png"}
                                            alt={product.name}
                                            className="w-full h-full object-contain"
                                            initial={{ 
                                                opacity: 0, 
                                                scale: 0.8,
                                                rotateY: -90
                                            }}
                                            animate={{ 
                                                opacity: 1, 
                                                scale: 1,
                                                rotateY: 0
                                            }}
                                            exit={{ 
                                                opacity: 0, 
                                                scale: 1.2,
                                                rotateY: 90
                                            }}
                                            transition={{
                                                duration: 0.6,
                                                ease: [0.25, 0.1, 0.25, 1],
                                                rotateY: {
                                                    duration: 0.6,
                                                    ease: "easeInOut"
                                                }
                                            }}
                                            onError={(e) => {
                                                console.error('Product image failed to load');
                                                const target = e.target as HTMLImageElement;
                                                target.style.display = 'none';
                                                const fallback = document.createElement('div');
                                                fallback.className = 'text-8xl md:text-9xl';
                                                fallback.textContent = '🎧';
                                                target.parentNode?.appendChild(fallback);
                                            }}
                                        />
                                    </AnimatePresence>
                                </div>
                            </div>
                        </div>

                        {/* Right Navigation - Find Retailer Button */}
                        <div className="flex justify-end">
                            <button 
                                onClick={handleFindRetailer}
                                className="bg-white/10 hover:bg-white hover:text-black text-white px-6 py-3 rounded-full font-medium tracking-wide flex items-center gap-2 transition-all duration-300 backdrop-blur-sm border border-white/20 opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0"
                            >
                                TÌM ĐẠI LÝ
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 4l8 8-8 8M4 12h16"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Breadcrumb Navigation */}
            <div className="absolute bottom-72 left-0 right-0 z-20">
                {/* Left line segment */}
                <div
                    className="absolute top-1/2 left-0 right-1/2 h-px bg-gray-600 z-10"
                    style={{ right: 'calc(50% + 250px)' }}
                ></div>

                {/* Right line segment */}
                <div
                    className="absolute top-1/2 left-1/2 right-0 h-px bg-gray-600 z-10"
                    style={{ left: 'calc(50% + 250px)' }}
                ></div>

                <div className="container mx-auto max-w-6xl px-4">
                    <nav className="flex justify-center items-center space-x-2 text-sm relative z-20">
                        {breadcrumbItems.map((item, index) => (
                            <div key={item.label} className="flex items-center space-x-2">
                                <motion.button
                                    onClick={() => onBreadcrumbClick(item)}
                                    className={`font-medium relative transition-all duration-300 hover:scale-105 ${
                                        activeBreadcrumb === item.label
                                            ? 'text-blue-400'
                                            : 'text-gray-400 hover:text-white'
                                    }`}
                                    whileHover={{
                                        scale: 1.05,
                                        transition: { duration: 0.2 }
                                    }}
                                    whileTap={{
                                        scale: 0.95,
                                        transition: { duration: 0.1 }
                                    }}
                                    animate={
                                        activeBreadcrumb === item.label
                                            ? {
                                                  textShadow: '0 0 8px rgba(59, 130, 246, 0.5)'
                                              }
                                            : {}
                                    }
                                >
                                    {item.label}
                                    {activeBreadcrumb === item.label && (
                                        <motion.div
                                            className="absolute -bottom-1 left-0 right-0 h-0.5 bg-blue-400"
                                            layoutId="breadcrumb-underline"
                                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                        />
                                    )}
                                </motion.button>
                                {index < breadcrumbItems.length - 1 && (
                                    <span className="text-gray-500 relative">/</span>
                                )}
                            </div>
                        ))}
                    </nav>
                </div>
            </div>
        </section>
    );
}
