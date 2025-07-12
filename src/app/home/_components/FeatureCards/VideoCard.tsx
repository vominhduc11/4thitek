import { memo } from 'react';
import Image from 'next/image';
import { motion, Variants } from 'framer-motion';
import { VideoFeatureCard } from './types';
import { LAYOUT, EFFECTS } from './constants';

interface VideoCardProps {
    card: VideoFeatureCard;
    index: number;
    animationVariant: Variants;
}

function VideoCard({ card, index, animationVariant }: VideoCardProps) {
    return (
        <motion.div
            className={`aspect-square relative overflow-hidden rounded-lg ${EFFECTS.SHADOW} ${EFFECTS.TRANSITION} ${card.className || ''}`}
            variants={animationVariant}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            whileHover={{
                scale: EFFECTS.HOVER_SCALE,
                y: EFFECTS.HOVER_Y,
                transition: { duration: 0.3 }
            }}
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
            <div className={`relative z-10 h-full flex flex-col justify-between ${LAYOUT.PADDING.MOBILE} ${LAYOUT.PADDING.TABLET} ${LAYOUT.PADDING.DESKTOP}`}>
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
                                className={`w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 z-20 absolute ${LAYOUT.POSITION.ICON}`}
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

export default memo(VideoCard);
