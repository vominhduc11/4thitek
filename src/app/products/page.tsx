'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { ProductsHero, ProductGrid } from './components';
import ProductsSimpleHeader from './components/ProductsSimpleHeader';
import { apiService } from '@/services/apiService';
import { ApiProduct } from '@/types/api';
import { SimpleProduct } from '@/types/product';

function ProductsPageContent() {
    const [products, setProducts] = useState<SimpleProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Helper function to parse product image JSON
    const parseProductImage = (imageData: string): string => {
        try {
            const parsed = JSON.parse(imageData);
            return parsed.imageUrl || '';
        } catch {
            return '';
        }
    };

    // Convert API product to SimpleProduct type
    const convertApiProductToProduct = useCallback((apiProduct: ApiProduct): SimpleProduct => {
        return {
            id: apiProduct.id?.toString() || `product-${Date.now()}`,
            name: apiProduct.name,
            shortDescription: apiProduct.shortDescription,
            description: apiProduct.shortDescription, // Use shortDescription as fallback
            image: parseProductImage(apiProduct.image),
            price: 0, // Price not provided in this API
            category: 'Bluetooth Headset',
            specifications: [],
            inStock: true,
            featured: false,
            rating: 4.5,
            reviews: 0,
            tags: [],
            videos: [],
            relatedProducts: [],
            wholesalePrice: ''
        };
    }, []);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const response = await apiService.fetchProducts();

                if (response.success && response.data) {
                    const convertedProducts = response.data.map(convertApiProductToProduct);
                    setProducts(convertedProducts);
                    setError(null);
                } else {
                    setError('Failed to load products');
                }
            } catch (err) {
                console.error('Error fetching products:', err);
                setError('Error loading products');
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [convertApiProductToProduct]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0c131d] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading products...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-[#0c131d] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-400 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0c131d] text-white flex flex-col">
            {/* Hero Section */}
            <ProductsHero />

            {/* Header Section */}
            <ProductsSimpleHeader />

            {/* Main Content */}
            <main className="ml-16 sm:ml-20 px-0 sm:px-0 md:px-1 lg:px-2 xl:px-4 2xl:px-6 py-8 flex justify-center">
                <div className="w-full max-w-none">
                    <ProductGrid products={products} />
                </div>
            </main>
        </div>
    );
}

export default function ProductsPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-400">Loading products...</p>
                    </div>
                </div>
            }
        >
            <ProductsPageContent />
        </Suspense>
    );
}
