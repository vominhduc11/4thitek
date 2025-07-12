'use client';

import { motion } from 'framer-motion';
import { featureCards } from './mockdata';
import { useFeatureCards } from './useFeatureCards';
import { LAYOUT } from './constants';
import ImageCard from './ImageCard';
import VideoCard from './VideoCard';
import ProductCard from './ProductCard';

function FeatureCards() {
    const { getAnimationVariant } = useFeatureCards();

    const renderCard = (card: typeof featureCards[0], index: number) => {
        const animationVariant = getAnimationVariant(index);

        switch (card.type) {
            case 'image':
                return (
                    <ImageCard
                        key={card.id}
                        card={card}
                        index={index}
                        animationVariant={animationVariant}
                    />
                );
            case 'video':
                return (
                    <VideoCard
                        key={card.id}
                        card={card}
                        index={index}
                        animationVariant={animationVariant}
                    />
                );
            case 'product':
                return (
                    <ProductCard
                        key={card.id}
                        card={card}
                        index={index}
                        animationVariant={animationVariant}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <motion.section 
            className="py-8 sm:py-12 lg:py-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, amount: 0.2 }}
        >
            <div className="sidebar-aware-container">
                <div className={`grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 ${LAYOUT.SPACING.SMALL} ${LAYOUT.SPACING.MEDIUM} ${LAYOUT.SPACING.LARGE}`}>
                    {featureCards.map((card, index) => renderCard(card, index))}
                </div>
            </div>
        </motion.section>
    );
}

export default FeatureCards;
