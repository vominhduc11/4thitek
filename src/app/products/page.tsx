'use client';

import { Suspense } from 'react';
import { ProductsHero, ProductGrid } from './components';
import ProductsSimpleHeader from './components/ProductsSimpleHeader';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { products } from '@/data/products';

function ProductsPageContent() {
    return (
        <div className="min-h-screen bg-[#0c131d] text-white flex flex-col">
            {/* Language Switcher */}
            <div className="fixed top-4 right-4 z-50">
                <LanguageSwitcher />
            </div>

            {/* Hero Section */}
            <ProductsHero />

            {/* Header Section */}
            <ProductsSimpleHeader />

            {/* Main Content */}
            <main className="ml-16 sm:ml-20 px-0 sm:px-0 md:px-1 lg:px-2 xl:px-4 2xl:px-6 py-8 flex justify-center">
                <div className="w-full max-w-none">
                    <ProductGrid products={products.slice(0, 10)} />
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
