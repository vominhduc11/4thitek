import { FeaturedItem } from './types';

export const featuredItems: FeaturedItem[] = [
    {
        id: 1,
        title: 'SCS S8X Pro',
        img: '/products/product1.png',
        description:
            'Advanced communication device with Bluetooth 5.0 technology, waterproof design, and crystal clear audio quality for professional use.'
    },
    {
        id: 2,
        title: 'SCS G+ Elite',
        img: '/products/product2.png',
        description:
            'Premium series featuring enhanced noise cancellation, extended battery life, and seamless group communication capabilities.'
    },
    {
        id: 3,
        title: 'SCS S Series',
        img: '/products/product3.png',
        description:
            'Reliable and durable communication solution designed for everyday use with superior sound quality and ergonomic design.'
    }
] as const;
