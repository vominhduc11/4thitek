// src/app/home/components/HeroSection.tsx
'use client';

import Image from 'next/image';
import { motion, Variants } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { useState, useEffect } from 'react';
import { apiService } from '@/services/apiService';

// Product info
const PRODUCT_INFO = {
    NAME: 'SCS S8X Pro',
    IMAGE: '/products/product1.png',
    VIDEO: '/videos/motorbike-road-trip-2022-07-26-01-49-02-utc.mp4'
};

// Particle effect config inlined
//         id,  left,    top,     duration, delay
const particles = [
    { id: 0, left: '10%', top: '20%', duration: 2.5, delay: 0 },
    { id: 1, left: '25%', top: '45%', duration: 2.8, delay: 0.4 },
    { id: 2, left: '40%', top: '70%', duration: 3.1, delay: 0.8 },
    { id: 3, left: '55%', top: '95%', duration: 3.4, delay: 1.2 },
    { id: 4, left: '70%', top: '120%', duration: 3.7, delay: 1.6 },
    { id: 5, left: '85%', top: '145%', duration: 4.0, delay: 2.0 }
];
// Light rays config inlined
const lightRays = [
    { id: 0, left: '25%', duration: 3.5, delay: 0 },
    { id: 1, left: '55%', duration: 4.0, delay: 1.5 }
];

// Animation variants with concrete values
const videoVariants: Variants = {
    hidden: { scale: 1.1, opacity: 0 },
    visible: { scale: 1, opacity: 1, transition: { duration: 2.0, ease: 'easeOut' } }
};
const overlayVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 1.2, delay: 0.5 } }
};
const titleVariants: Variants = {
    hidden: { y: -100, opacity: 0, scale: 0.8 },
    visible: {
        y: 0,
        opacity: 1,
        scale: 1,
        transition: { duration: 1.2, delay: 1.0, type: 'spring', stiffness: 100, damping: 15 }
    },
    hover: { scale: 1.05, textShadow: '0 0 30px rgba(79,200,255,0.5)', transition: { duration: 0.3 } }
};
const productVariants: Variants = {
    hidden: { scale: 0, rotate: -180, opacity: 0 },
    visible: {
        scale: 1,
        rotate: 0,
        opacity: 1,
        transition: { duration: 1.8, delay: 1.5, type: 'spring', stiffness: 80, damping: 12 }
    },
    hover: { scale: 1.1, rotate: 5, y: -10, transition: { duration: 0.4, type: 'spring', stiffness: 300 } }
};
const descWrapperVariants: Variants = {
    hidden: { y: 100, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 1.2, delay: 2.2 } }
};
const descVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 1.0, delay: 2.5 } }
};
const buttonVariants: Variants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
        scale: 1,
        opacity: 1,
        transition: { duration: 0.8, delay: 2.8, type: 'spring', stiffness: 200 }
    },
    hover: {
        scale: 1.05,
        boxShadow: '0 10px 25px rgba(255,255,255,0.2)',
        borderColor: '#4FC8FF',
        transition: { duration: 0.3 }
    },
    tap: { scale: 0.95 }
};
const gradientVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 2.0, delay: 1.5 } }
};

interface Product {
    id: number;
    name: string;
    shortDescription: string;
    image: string;
}

interface ParsedImage {
    imageUrl: string;
    public_id: string;
}

export default function HeroSection() {
    const router = useRouter();
    const { t } = useLanguage();
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Helper function to format product title
    const formatProductTitle = (title: string) => {
        // Nếu quá dài, chia thành nhiều dòng tại vị trí hợp lý
        if (title.length > 25) {
            // Tìm khoảng trắng gần giữa để ngắt dòng
            const midpoint = Math.floor(title.length / 2);
            const spaceIndex = title.indexOf(' ', midpoint);

            if (spaceIndex !== -1 && spaceIndex < title.length - 5) {
                return title.substring(0, spaceIndex) + '\n' + title.substring(spaceIndex + 1);
            }
        }
        return title;
    };

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setIsLoading(true);
                const response = await apiService.fetchHomepageProducts();

                if (response.success && response.data && response.data.length > 0) {
                    const productData = response.data[0];

                    // Parse image JSON string
                    let imageUrl = PRODUCT_INFO.IMAGE; // fallback
                    try {
                        const parsedImage: ParsedImage = JSON.parse(productData.image);
                        imageUrl = parsedImage.imageUrl;
                    } catch (e) {
                        console.warn('Failed to parse product image JSON:', e);
                    }

                    setProduct({
                        ...productData,
                        image: imageUrl
                    });
                } else {
                    setError('No products found');
                }
            } catch (err) {
                setError('Failed to load product data');
                console.error('Error fetching product:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchProduct();
    }, []);

    const handleDiscoveryClick = () => {
        router.push('/products?position=Premium');
    };

    const displayName = product?.name || PRODUCT_INFO.NAME;
    const displayImage = product?.image || PRODUCT_INFO.IMAGE;

    return (
        <section
            className="relative w-full h-[450px] xs:h-[500px] sm:h-[600px] md:h-[700px] lg:h-[800px] xl:h-[850px] 2xl:h-[900px] 3xl:h-[1000px] 4xl:h-[1100px] 5xl:h-[1200px] overflow-hidden"
            role="banner"
            aria-label="Hero section showcasing SCS S8X product"
        >
            <motion.div
                className="absolute inset-x-0 top-0 h-24 xs:h-32 sm:h-48 md:h-64 bg-gradient-to-t from-transparent to-[#0c131d] pointer-events-none z-10"
                variants={gradientVariants}
                initial="hidden"
                animate="visible"
                aria-hidden="true"
            />
            {/* Background Video */}
            <motion.video
                src={PRODUCT_INFO.VIDEO}
                className="absolute inset-0 w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
                variants={videoVariants}
                initial="hidden"
                animate="visible"
                aria-hidden="true"
            />

            {/* Dark Overlay */}
            <motion.div
                className="absolute inset-0 bg-black/60 z-10"
                variants={overlayVariants}
                initial="hidden"
                animate="visible"
                aria-hidden="true"
            />

            {/* Title */}
            <motion.h1
                className="absolute top-[12%] xs:top-[15%] sm:top-[18%] md:top-[16%] left-16 sm:left-20 right-0 text-white text-2xl xs:text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-sans leading-tight z-20 text-center px-2 line-clamp-2 xs:line-clamp-2 sm:line-clamp-1 md:line-clamp-1"
                variants={titleVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                title={displayName} // Tooltip hiển thị tên đầy đủ
            >
                {isLoading ? (
                    <div className="animate-pulse bg-white/20 rounded h-16 mx-auto max-w-md"></div>
                ) : (
                    <span style={{ whiteSpace: 'pre-line' }}>
                        {formatProductTitle(displayName)}
                    </span>
                )}
            </motion.h1>

            {/* Product Image */}
            <motion.div
                className="absolute top-[16%] xs:top-[18%] sm:top-[20%] md:top-[18%] lg:top-[20%] left-16 sm:left-20 right-0 flex justify-center z-25"
                variants={productVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
            >
                {isLoading ? (
                    <div className="animate-pulse bg-white/20 rounded-lg w-[180px] xs:w-[220px] sm:w-[280px] md:w-[350px] lg:w-[384px] h-[100px] xs:h-[120px] sm:h-[157px] md:h-[197px] lg:h-[216px]"></div>
                ) : (
                    <Image
                        src={displayImage}
                        alt={displayName}
                        width={384}
                        height={216}
                        className="object-contain drop-shadow-2xl w-[180px] xs:w-[220px] sm:w-[280px] md:w-[350px] lg:w-[384px] h-auto"
                        priority
                    />
                )}
            </motion.div>

            {/* Description & Button */}
            <motion.div
                className="absolute bottom-[12%] xs:bottom-[14%] sm:bottom-[6%] md:bottom-[5%] left-16 sm:left-20 right-0 text-center px-3 xs:px-4 sm:px-6 z-20"
                variants={descWrapperVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div
                    className="max-w-sm xs:max-w-lg sm:max-w-xl md:max-w-2xl mx-auto mb-3 xs:mb-4 sm:mb-6"
                    variants={descVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <motion.p
                        className="text-white text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl 3xl:text-3xl 4xl:text-4xl 5xl:text-5xl font-sans leading-relaxed line-clamp-3 xs:line-clamp-4 sm:line-clamp-3 md:line-clamp-4 lg:line-clamp-5 xl:line-clamp-5 2xl:line-clamp-6 3xl:line-clamp-7 4xl:line-clamp-8 5xl:line-clamp-10"
                        variants={descVariants}
                        initial="hidden"
                        animate="visible"
                    >
                        {isLoading ? (
                            <>
                                <span className="block animate-pulse bg-white/20 rounded h-4 mx-auto max-w-xl mb-2"></span>
                                <span className="block animate-pulse bg-white/20 rounded h-4 mx-auto max-w-lg mb-2"></span>
                                <span className="block animate-pulse bg-white/20 rounded h-4 mx-auto max-w-md"></span>
                            </>
                        ) : (
                            product?.shortDescription || t('hero.subtitle')
                        )}
                    </motion.p>
                </motion.div>

                <motion.button
                    className="px-3 xs:px-4 sm:px-6 py-2 xs:py-2.5 sm:py-3 border border-white text-white text-xs xs:text-sm sm:text-base font-medium font-sans rounded-full hover:bg-white hover:text-black transition cursor-pointer min-w-[140px] xs:min-w-[160px] sm:min-w-auto"
                    variants={buttonVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover="hover"
                    whileTap="tap"
                    onClick={handleDiscoveryClick}
                    aria-label={`Discover more about ${displayName}`}
                    disabled={isLoading}
                >
                    {t('hero.cta')}
                </motion.button>
            </motion.div>

            {/* Gradient Overlay */}
            <motion.div
                className="absolute inset-x-0 bottom-0 h-24 xs:h-32 sm:h-48 md:h-64 bg-gradient-to-b from-transparent to-[#0c131d] pointer-events-none z-10"
                variants={gradientVariants}
                initial="hidden"
                animate="visible"
                aria-hidden="true"
            />

            {/* Optimized Particles - Reduced count and CSS animations */}
            {particles.slice(0, 3).map((p) => (
                <div
                    key={p.id}
                    className="absolute w-2 h-2 bg-blue-400 rounded-full opacity-60 animate-float-slow"
                    style={{ left: p.left, top: p.top, animationDelay: `${p.delay}s` }}
                />
            ))}

            {/* Optimized Light Rays - Reduced count */}
            {lightRays.slice(0, 2).map((r) => (
                <div
                    key={r.id}
                    className="absolute w-1 h-32 bg-gradient-to-b from-blue-400/30 to-transparent animate-pulse"
                    style={{ left: r.left, top: '10%', transform: 'rotate(12deg)', animationDelay: `${r.delay}s`, animationDuration: `${r.duration}s` }}
                />
            ))}

            {/* Error Display */}
            {error && (
                <motion.div
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-500/80 text-white px-4 py-2 rounded-lg z-30"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                >
                    <p className="text-sm font-medium">⚠️ {error}</p>
                    <p className="text-xs opacity-75 mt-1">Using fallback content</p>
                </motion.div>
            )}
        </section>
    );
}
