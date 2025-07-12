import { SeriesItem } from './types';

export const seriesItems: SeriesItem[] = [
    {
        id: '1',
        label: 'SX SERIES',
        img: '/products/product1.png',
        thumbs: [
            { id: 'sx1', src: '/products/product1.png', label: 'S8X Pro' },
            { id: 'sx2', src: '/products/product2.png', label: 'S8X Elite' },
            { id: 'sx3', src: '/products/product3.png', label: 'S8X Max' },
            { id: 'sx4', src: '/products/product1.png', label: 'S8X Standard' },
            { id: 'sx5', src: '/products/product2.png', label: 'S8X Sport' }
        ]
    },
    {
        id: '2',
        label: 'S SERIES',
        img: '/products/product3.png',
        thumbs: [
            { id: 's1', src: '/products/product3.png', label: 'S Pro' },
            { id: 's2', src: '/products/product1.png', label: 'S Standard' },
            { id: 's3', src: '/products/product2.png', label: 'S Plus' },
            { id: 's4', src: '/products/product3.png', label: 'S Compact' }
        ]
    },
    {
        id: '3',
        label: 'G SERIES',
        img: '/products/product1.png',
        thumbs: [
            { id: 'g1', src: '/products/product1.png', label: 'G Pro' },
            { id: 'g2', src: '/products/product2.png', label: 'G Elite' },
            { id: 'g3', src: '/products/product3.png', label: 'G Standard' },
            { id: 'g4', src: '/products/product1.png', label: 'G Tactical' }
        ]
    },
    {
        id: '4',
        label: 'G+ SERIES',
        img: '/products/product2.png',
        thumbs: [
            { id: 'gp1', src: '/products/product2.png', label: 'G+ Elite' },
            { id: 'gp2', src: '/products/product3.png', label: 'G+ Max' },
            { id: 'gp3', src: '/products/product1.png', label: 'G+ Pro' },
            { id: 'gp4', src: '/products/product2.png', label: 'G+ Sport' },
            { id: 'gp5', src: '/products/product3.png', label: 'G+ Tactical' }
        ]
    }
];
