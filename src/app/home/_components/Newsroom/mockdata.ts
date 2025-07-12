import { NewsItem } from './types';

export const newsItems: NewsItem[] = [
    {
        id: 1,
        img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=500&fit=crop',
        caption: 'Latest motorcycle communication technology breakthrough in 2024',
        title: 'Revolutionary Bluetooth 5.0 Technology',
        content:
            'Discover the latest breakthrough in motorcycle communication with our advanced Bluetooth 5.0 technology. Enhanced connectivity, crystal clear audio quality, and seamless integration with modern devices.',
        date: 'March 15, 2024',
        category: 'Technology'
    },
    {
        id: 2,
        img: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&h=500&fit=crop',
        caption: 'Exploring new horizons with advanced rider communication systems',
        title: 'Adventure Riding Communication',
        content:
            'Join the adventure with our premium communication systems designed for long-distance touring. Waterproof design, extended battery life, and group intercom capabilities for the ultimate riding experience.',
        date: 'March 10, 2024',
        category: 'Adventure'
    },
    {
        id: 3,
        img: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=500&fit=crop',
        caption: 'Enjoying the ride with crystal clear group communication',
        title: 'Group Intercom Excellence',
        content:
            'Experience seamless group communication with up to 8 riders simultaneously. Advanced noise cancellation technology ensures clear conversations even at high speeds and in challenging weather conditions.',
        date: 'March 5, 2024',
        category: 'Features'
    },
    {
        id: 4,
        img: 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400&h=500&fit=crop',
        caption: 'Professional riders choose SCSETC for reliable communication',
        title: 'Professional Grade Reliability',
        content:
            'Trusted by professional riders worldwide, our communication systems deliver unmatched reliability and performance. Built to withstand extreme conditions while maintaining superior audio quality.',
        date: 'February 28, 2024',
        category: 'Professional'
    },
    {
        id: 5,
        img: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=500&fit=crop',
        caption: 'Adventure awaits with our premium communication devices',
        title: 'Premium Series Launch',
        content:
            'Introducing our new premium series with enhanced features including GPS navigation integration, voice commands, and smart connectivity. Perfect for riders who demand the best technology.',
        date: 'February 20, 2024',
        category: 'Product Launch'
    },
    {
        id: 6,
        img: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=500&fit=crop',
        caption: 'Innovation in motorcycle safety and communication technology',
        title: 'Safety Innovation Awards',
        content:
            'SCSETC wins multiple safety innovation awards for our groundbreaking communication technology that enhances rider safety through improved connectivity and emergency features.',
        date: 'February 15, 2024',
        category: 'Awards'
    }
] as const;
