'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import AvoidSidebar from '@/components/layout/AvoidSidebar';

export default function FeatureCards() {
    const router = useRouter();

    // Navigation handlers
    const handleCardClick = (cardId: string) => {
        switch (cardId) {
            case 'brand-showcase':
                router.push('/certification'); // CVC Technology - certification and technology info
                break;
            case 'membership-program':
                router.push('/account/user');
                break;
            case 'product-showcase':
                router.push('/contact');
                break;
            default:
                break;
        }
    };

    // Types (inline)
    type FeatureCardType = 'image' | 'video' | 'product';

    interface BaseFeatureCard {
        id: string;
        type: FeatureCardType;
        alt: string;
        className?: string;
    }

    interface ImageFeatureCard extends BaseFeatureCard {
        type: 'image';
        backgroundImage: string;
        logoImage?: string;
        iconImage?: string;
        backgroundColor?: string;
    }

    interface VideoFeatureCard extends BaseFeatureCard {
        type: 'video';
        videoSrc: string;
        title: string;
        subtitle?: string;
        logoImage?: string;
        iconImage?: string;
        overlayImage?: string;
        gradientFrom: string;
        gradientTo: string;
    }

    interface ProductFeatureCard extends BaseFeatureCard {
        type: 'product';
        productImage: string;
        brandLogo?: string;
        iconImage?: string;
        backgroundColor?: string;
    }

    type FeatureCard = ImageFeatureCard | VideoFeatureCard | ProductFeatureCard;

    // Mock data (inline)
    const featureCards: FeatureCard[] = [
        {
            id: 'brand-showcase',
            type: 'image',
            alt: 'Brand showcase with product display',
            backgroundImage: '/productCards/card1/466d1bbba4340b452f1792456a3a5ef7cc9fd843.png',
            logoImage: '/productCards/card1/6917c31fe5845c06a4d6ad4aa0ea13f3b79f03ca.png',
            iconImage: '/productCards/card1/image.png',
            backgroundColor: 'white'
        },
        {
            id: 'membership-program',
            type: 'video',
            alt: 'Membership program promotional video',
            videoSrc: '/videos/futuristic-background-2022-08-04-19-57-56-utc.mp4',
            title: 'MEMBERSHIP',
            subtitle: 'PROGRAM',
            logoImage: '/productCards/card2/image2.png',
            iconImage: '/productCards/card1/image.png',
            overlayImage: '/productCards/card2/image.png',
            gradientFrom: '#29ABE2',
            gradientTo: '#0071BC'
        },
        {
            id: 'product-showcase',
            type: 'product',
            alt: 'Featured product showcase',
            productImage: '/productCards/card3/image3.png',
            brandLogo: '/productCards/card3/image.png',
            iconImage: '/productCards/card1/image.png',
            backgroundColor: 'white',
            className: 'lg:col-span-2 xl:col-span-1'
        }
    ];

    // Animation variant function (inline)
    const getAnimationVariant = (index: number) => ({
        hidden: { opacity: 0, y: 50, scale: 0.9 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                duration: 0.6,
                delay: index * 0.2,
                type: 'spring' as const,
                stiffness: 100,
                damping: 15
            }
        }
    });

    // Render card function (inline)
    const renderCard = (card: FeatureCard, index: number) => {
        const animationVariant = getAnimationVariant(index);

        if (card.type === 'image') {
            return (
                <motion.div
                    key={card.id}
                    className={`aspect-square bg-${card.backgroundColor || 'white'} relative rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer ${card.className || ''}`}
                    variants={animationVariant}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    whileHover={{
                        scale: 1.02,
                        y: -5,
                        transition: { duration: 0.3 }
                    }}
                    onClick={() => handleCardClick(card.id)}
                >
                    {/* Logo */}
                    {card.logoImage && (
                        <Image
                            height={40}
                            width={120}
                            src={card.logoImage}
                            alt="Brand logo"
                            className="absolute top-6 sm:top-8 lg:top-12 left-6 sm:left-8 lg:left-12 z-10"
                            loading={index < 2 ? 'eager' : 'lazy'}
                        />
                    )}

                    {/* Background Image */}
                    <div className="relative w-full h-full">
                        <Image
                            fill
                            src={card.backgroundImage}
                            alt={card.alt}
                            className="object-cover"
                            loading={index < 2 ? 'eager' : 'lazy'}
                        />
                    </div>

                    {/* Icon */}
                    {card.iconImage && (
                        <Image
                            height={0}
                            width={0}
                            sizes="100vw"
                            src={card.iconImage}
                            alt="Card icon"
                            className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 z-20 absolute bottom-8 left-8 sm:bottom-8 sm:left-8 lg:bottom-8 lg:left-8"
                            loading="lazy"
                        />
                    )}
                </motion.div>
            );
        }

        if (card.type === 'video') {
            return (
                <motion.div
                    key={card.id}
                    className={`aspect-square relative overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer ${card.className || ''}`}
                    variants={animationVariant}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    whileHover={{
                        scale: 1.02,
                        y: -5,
                        transition: { duration: 0.3 }
                    }}
                    onClick={() => handleCardClick(card.id)}
                >
                    {/* Video Background */}
                    <video
                        src={card.videoSrc}
                        className="absolute inset-0 w-full h-full object-cover"
                        autoPlay
                        loop
                        muted
                        playsInline
                        aria-hidden="true"
                    />

                    {/* Gradient Overlay */}
                    <div
                        className="absolute inset-0 z-10"
                        style={{
                            background: `linear-gradient(to right, ${card.gradientFrom}80, ${card.gradientTo}80)`
                        }}
                    />

                    {/* Content */}
                    <div className="relative z-10 h-full flex flex-col justify-between p-6 sm:p-8 lg:p-12">
                        <div className="flex justify-between items-start">
                            {card.logoImage && (
                                <Image
                                    height={0}
                                    width={0}
                                    sizes="100vw"
                                    src={card.logoImage}
                                    alt="Membership logo"
                                    className="w-30 h-10"
                                    loading={index < 2 ? 'eager' : 'lazy'}
                                />
                            )}
                        </div>

                        <div className="flex justify-between items-end">
                            <div>
                                <h3 className="text-white font-bold text-xl sm:text-2xl lg:text-3xl xl:text-4xl leading-tight">
                                    {card.title}
                                    {card.subtitle && (
                                        <>
                                            <br />
                                            {card.subtitle}
                                        </>
                                    )}
                                </h3>
                            </div>

                            <div className="flex flex-col items-end gap-4">
                                {card.iconImage && (
                                    <Image
                                        height={0}
                                        width={0}
                                        sizes="100vw"
                                        src={card.iconImage}
                                        alt="Card icon"
                                        className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 z-20 absolute bottom-8 left-8 sm:bottom-8 sm:left-8 lg:bottom-8 lg:left-8"
                                        loading="lazy"
                                    />
                                )}
                                {card.overlayImage && (
                                    <Image
                                        height={0}
                                        width={0}
                                        sizes="100vw"
                                        src={card.overlayImage}
                                        alt="Overlay decoration"
                                        className="w-full h-full z-20 bottom-0 left-0 absolute"
                                        loading="lazy"
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            );
        }

        if (card.type === 'product') {
            return (
                <motion.div
                    key={card.id}
                    className={`aspect-square bg-${card.backgroundColor || 'white'} relative rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer ${card.className || ''}`}
                    variants={animationVariant}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    whileHover={{
                        scale: 1.02,
                        y: -5,
                        transition: { duration: 0.3 }
                    }}
                    onClick={() => handleCardClick(card.id)}
                >
                    <div className="relative h-full flex flex-col justify-between p-6 sm:p-8 lg:p-12">
                        {/* Brand Logo */}
                        {card.brandLogo && (
                            <div>
                                <Image
                                    height={80}
                                    width={80}
                                    src={card.brandLogo}
                                    alt="Brand logo"
                                    className="w-36 h-16"
                                    loading={index < 2 ? 'eager' : 'lazy'}
                                />
                            </div>
                        )}

                        {/* Product Image */}
                        <div className="flex-1 flex items-center justify-center">
                            <div className="relative w-full max-w-sm">
                                <Image
                                    width={0}
                                    height={0}
                                    sizes="100vw"
                                    src={card.productImage}
                                    alt={card.alt}
                                    className="w-full h-auto object-contain"
                                    style={{ width: '100%', height: 'auto' }}
                                    loading={index < 2 ? 'eager' : 'lazy'}
                                />
                            </div>
                        </div>

                        {/* Icon */}
                        {card.iconImage && (
                            <div className="flex justify-start">
                                <Image
                                    height={0}
                                    width={0}
                                    sizes="100vw"
                                    src={card.iconImage}
                                    alt="Card icon"
                                    className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 z-20 absolute bottom-8 left-8 sm:bottom-8 sm:left-8 lg:bottom-8 lg:left-8"
                                    loading="lazy"
                                />
                            </div>
                        )}
                    </div>
                </motion.div>
            );
        }

        return null;
    };

    return (
        <AvoidSidebar>
            <motion.section
                className="py-8 sm:py-12 lg:py-16"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true, amount: 0.2 }}
            >
                <div className="sidebar-aware-container pl-8 pr-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                        {featureCards.map((card, index) => renderCard(card, index))}
                    </div>
                </div>
            </motion.section>
        </AvoidSidebar>
    );
}
