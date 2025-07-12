import { FeatureCard } from './types';

export const featureCards: FeatureCard[] = [
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
] as const;
