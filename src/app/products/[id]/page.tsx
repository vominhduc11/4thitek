'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Product } from '../_components/types';
import { ProductHeroSection } from './_components';

// Mock data - complete product list matching the products page
const mockProducts: Product[] = [
    // SX SERIES - Premium Line
    {
        id: 1,
        name: 'SCS S8X Pro',
        series: 'SX SERIES',
        category: 'Premium',
        image: '/products/product1.png',
        description:
            'Advanced communication device with Bluetooth 5.0 technology, waterproof design, and crystal clear audio quality for professional use.',
        popularity: 95
    },
    {
        id: 2,
        name: 'SCS S8X Elite',
        series: 'SX SERIES',
        category: 'Premium',
        image: '/products/product2.png',
        description:
            'Premium series featuring enhanced noise cancellation, extended battery life, and seamless group communication capabilities.',
        popularity: 88
    },
    {
        id: 3,
        name: 'SCS S8X Max',
        series: 'SX SERIES',
        category: 'Premium',
        image: '/products/product3.png',
        description:
            'Top-tier communication system with AI-powered features and ultra-long range connectivity for extreme conditions.',
        popularity: 92
    },
    {
        id: 4,
        name: 'SCS S8X Standard',
        series: 'SX SERIES',
        category: 'Premium',
        image: '/products/product1.png',
        description:
            'Entry-level SX series with essential premium features and reliable performance for everyday professional use.',
        popularity: 85
    },
    {
        id: 5,
        name: 'SCS S8X Sport',
        series: 'SX SERIES',
        category: 'Premium',
        image: '/products/product2.png',
        description:
            'Sport-oriented design with enhanced durability and sweat resistance for active professional riders.',
        popularity: 89
    },

    // S SERIES - Professional Line
    {
        id: 6,
        name: 'SCS S Series Pro',
        series: 'S SERIES',
        category: 'Professional',
        image: '/products/product3.png',
        description:
            'Reliable and durable communication solution designed for everyday use with superior sound quality and ergonomic design.',
        popularity: 92
    },
    {
        id: 7,
        name: 'SCS S Series Standard',
        series: 'S SERIES',
        category: 'Professional',
        image: '/products/product1.png',
        description: 'Entry-level professional communication device with essential features and reliable performance.',
        popularity: 78
    },
    {
        id: 8,
        name: 'SCS S Series Plus',
        series: 'S SERIES',
        category: 'Professional',
        image: '/products/product2.png',
        description: 'Enhanced S series with improved battery life and advanced noise filtering technology.',
        popularity: 83
    },
    {
        id: 9,
        name: 'SCS S Series Compact',
        series: 'S SERIES',
        category: 'Professional',
        image: '/products/product3.png',
        description: 'Compact design with full S series functionality, perfect for lightweight professional use.',
        popularity: 76
    },

    // G SERIES - Advanced Line
    {
        id: 10,
        name: 'SCS G Pro',
        series: 'G SERIES',
        category: 'Advanced',
        image: '/products/product1.png',
        description:
            'Professional grade communication system with military-standard durability and crystal clear transmission.',
        popularity: 90
    },
    {
        id: 11,
        name: 'SCS G Elite',
        series: 'G SERIES',
        category: 'Advanced',
        image: '/products/product2.png',
        description: 'Elite G series with advanced features including GPS integration and emergency alert systems.',
        popularity: 87
    },
    {
        id: 12,
        name: 'SCS G Standard',
        series: 'G SERIES',
        category: 'Advanced',
        image: '/products/product3.png',
        description:
            'Standard G series offering reliable advanced communication with professional-grade build quality.',
        popularity: 82
    },
    {
        id: 13,
        name: 'SCS G Tactical',
        series: 'G SERIES',
        category: 'Advanced',
        image: '/products/product1.png',
        description:
            'Tactical version with enhanced security features and rugged construction for demanding environments.',
        popularity: 94
    },

    // G+ SERIES - Ultimate Line
    {
        id: 14,
        name: 'SCS G+ Elite',
        series: 'G+ SERIES',
        category: 'Ultimate',
        image: '/products/product2.png',
        description:
            'Next-generation communication device with AI-powered noise reduction and ultra-long range connectivity.',
        popularity: 85
    },
    {
        id: 15,
        name: 'SCS G+ Max',
        series: 'G+ SERIES',
        category: 'Ultimate',
        image: '/products/product3.png',
        description: 'Maximum performance G+ series with cutting-edge technology and premium materials throughout.',
        popularity: 96
    },
    {
        id: 16,
        name: 'SCS G+ Pro',
        series: 'G+ SERIES',
        category: 'Ultimate',
        image: '/products/product1.png',
        description: 'Professional G+ series combining ultimate performance with practical professional features.',
        popularity: 91
    },
    {
        id: 17,
        name: 'SCS G+ Sport',
        series: 'G+ SERIES',
        category: 'Ultimate',
        image: '/products/product2.png',
        description: 'Sport-focused G+ series with enhanced ergonomics and performance optimization for active use.',
        popularity: 88
    },
    {
        id: 18,
        name: 'SCS G+ Tactical',
        series: 'G+ SERIES',
        category: 'Ultimate',
        image: '/products/product3.png',
        description: 'Ultimate tactical communication system with military-grade security and extreme durability.',
        popularity: 93
    }
];

function ProductDetailContent() {
    const params = useParams();
    const router = useRouter();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!params?.id) return;
        
        const productId = parseInt(params.id as string);
        console.log('Looking for product ID:', productId);
        console.log(
            'Available products:',
            mockProducts.map((p) => ({ id: p.id, name: p.name }))
        );

        // Simulate API call
        setTimeout(() => {
            const foundProduct = mockProducts.find((p) => p.id === productId);

            if (foundProduct) {
                console.log('Found product:', foundProduct);
                setProduct(foundProduct);
            } else {
                console.log('Product not found for ID:', productId);
                setError('Product not found');
            }
            setLoading(false);
        }, 500);
    }, [params?.id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0f1a] text-white flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-2 border-[#4FC8FF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading product details...</p>
                </div>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-[#0a0f1a] text-white flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
                    <p className="text-gray-400 mb-6">The product you&apos;re looking for doesn&apos;t exist.</p>
                    <p className="text-gray-500 mb-6 text-sm">Product ID: {params?.id}</p>
                    <button
                        onClick={() => router.push('/products')}
                        className="px-6 py-3 bg-[#4FC8FF] text-black font-semibold rounded-lg hover:bg-[#4FC8FF]/90 transition-colors"
                    >
                        Back to Products
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0f1a] text-white">
            {/* Hero Section - Space theme with product */}
            <ProductHeroSection product={product} />
        </div>
    );
}

export default function ProductDetailPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-[#0a0f1a] text-white flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-8 h-8 border-2 border-[#4FC8FF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-400">Loading...</p>
                    </div>
                </div>
            }
        >
            <ProductDetailContent />
        </Suspense>
    );
}
