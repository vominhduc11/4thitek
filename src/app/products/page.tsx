'use client';

import { Suspense } from 'react';
import { ProductsHero, ProductGrid } from './components';
import ProductsSimpleHeader from './components/ProductsSimpleHeader';
import { products } from '@/data/products';

function ProductsPageContent() {
    return (
        <div className="min-h-screen bg-[#0c131d] text-white flex flex-col">
            {/* Hero Section */}
            <ProductsHero />

            {/* Header Section */}
            <ProductsSimpleHeader />
            
            {/* Main Content */}
            <main className="ml-16 sm:ml-20 px-4 sm:px-12 md:px-16 lg:px-20 py-8">
                <ProductGrid products={products.slice(0, 10)} />
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
