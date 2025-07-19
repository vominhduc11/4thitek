'use client';

import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
    ProductsHero,
    ProductsHeader,
    ProductGrid,
    ProductsPagination,
    FilterSidebar,
    EmptyState,
    AdditionalContent,
    StickyBreadcrumbFilter,
    SeriesQuickSwitch
} from './components';

// Product interface
interface Product {
    id: number;
    name: string;
    series: string;
    category: string;
    image: string;
    description: string;
    popularity: number;
}

// Constants
const ITEMS_PER_PAGE = 12; // Increased from 8 to better show multiple products per series

// Mock data for products - Expanded with more realistic data
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

function ProductsPageContent() {
    // State management
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(ITEMS_PER_PAGE);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedSeries, setSelectedSeries] = useState<string>('ALL');
    const [sortBy, setSortBy] = useState<string>('popularity');
    const [isTransitioning, setIsTransitioning] = useState(false);

    // Get URL parameters
    const searchParams = useSearchParams();

    // Handle URL parameters on component mount
    useEffect(() => {
        if (!searchParams) return;

        const seriesParam = searchParams.get('series');
        console.log('URL series parameter:', seriesParam);
        console.log('Current selectedSeries:', selectedSeries);

        if (seriesParam && seriesParam !== selectedSeries) {
            console.log('Setting series to:', seriesParam);
            setSelectedSeries(seriesParam);
            setCurrentPage(1);
        }
    }, [searchParams, selectedSeries]); // Remove selectedSeries from dependency to prevent infinite loop

    // Filter and sort products based on selected criteria
    const filteredAndSortedProducts = useMemo(() => {
        let filtered = mockProducts;

        // Filter by series
        if (selectedSeries !== 'ALL') {
            filtered = filtered.filter((product) => product.series === selectedSeries);
        }

        // Sort products
        switch (sortBy) {
            case 'name-asc':
                filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'name-desc':
                filtered = [...filtered].sort((a, b) => b.name.localeCompare(a.name));
                break;
            case 'category':
                filtered = [...filtered].sort((a, b) => a.category.localeCompare(b.category));
                break;
            case 'popularity':
            default:
                filtered = [...filtered].sort((a, b) => b.popularity - a.popularity);
                break;
        }

        return filtered;
    }, [selectedSeries, sortBy]);

    // Memoized calculations for pagination
    const { currentProducts, totalPages, totalItems } = useMemo(() => {
        const total = filteredAndSortedProducts.length;
        const pages = Math.ceil(total / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const products = filteredAndSortedProducts.slice(startIndex, endIndex);

        return {
            currentProducts: products,
            totalPages: pages,
            totalItems: total
        };
    }, [filteredAndSortedProducts, currentPage, itemsPerPage]);

    // Event handlers
    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            // Smooth scroll to top of products section
            const productsSection = document.querySelector('[data-products-grid]');
            if (productsSection) {
                productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    };

    const handleFilterToggle = () => setIsFilterOpen((prev) => !prev);

    const handleSeriesClick = (series: string) => {
        // Allow clicking the same series to toggle back to 'ALL'
        const newSeries = series === selectedSeries ? 'ALL' : series;

        setIsTransitioning(true);
        setSelectedSeries(newSeries);
        setCurrentPage(1); // Reset to first page when filtering

        // Update URL to reflect the change
        const url = new URL(window.location.href);
        if (newSeries === 'ALL') {
            url.searchParams.delete('series');
        } else {
            url.searchParams.set('series', newSeries);
        }
        window.history.pushState({}, '', url.toString());

        // Add a small delay to allow for smooth transition
        setTimeout(() => {
            setIsTransitioning(false);
            const productsSection = document.querySelector('[data-products-grid]');
            if (productsSection) {
                productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 300);
    };

    const handleSortChange = (newSortBy: string) => {
        setSortBy(newSortBy);
        setCurrentPage(1); // Reset to first page when sorting
    };

    const handleClearFilters = () => {
        setSelectedSeries('ALL');
        setSortBy('popularity');
        setCurrentPage(1);
    };

    // Check if any filters are active
    const hasActiveFilters = selectedSeries !== 'ALL' || sortBy !== 'popularity';

    return (
        <div className="min-h-screen bg-[#0c131d] text-white flex flex-col">
            {/* Hero Video Section */}
            <ProductsHero />

            {/* Title & Description Section */}
            <ProductsHeader
                selectedSeries={selectedSeries}
                hasActiveFilters={hasActiveFilters}
                onSeriesClick={handleSeriesClick}
                onFilterToggle={handleFilterToggle}
                totalProducts={mockProducts.length}
                filteredCount={filteredAndSortedProducts.length}
            />

            {/* Quick Series Switch - Mobile Friendly */}
            <div className="ml-16 sm:ml-20 px-4 sm:px-8 lg:px-12 mb-6 lg:hidden">
                <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400 font-medium">Quick Switch:</span>
                    <SeriesQuickSwitch selectedSeries={selectedSeries} onSeriesClick={handleSeriesClick} />
                </div>
            </div>

            {/* Sticky Breadcrumb & Filter Section */}
            <StickyBreadcrumbFilter
                selectedSeries={selectedSeries}
                hasActiveFilters={hasActiveFilters}
                onSeriesClick={handleSeriesClick}
                onFilterToggle={handleFilterToggle}
                filteredCount={filteredAndSortedProducts.length}
                totalProducts={mockProducts.length}
            />

            {/* Product Grid or Empty State - Flex grow to fill remaining space */}
            <div className="flex-1 transition-all duration-300 ease-in-out">
                {currentProducts.length === 0 ? (
                    <div className="ml-16 sm:ml-20 mb-16 flex items-center justify-center min-h-[400px]">
                        <div className="px-4 sm:px-6 lg:px-8">
                            <EmptyState selectedSeries={selectedSeries} onClearFilters={handleClearFilters} />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col justify-between min-h-[600px]">
                        {/* Product Grid */}
                        <div
                            data-products-grid
                            className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}
                        >
                            <ProductGrid products={currentProducts} />
                        </div>

                        {/* Pagination - Only show when there are products */}
                        <div
                            className={`transition-opacity duration-300 mt-auto ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}
                        >
                            <ProductsPagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={totalItems}
                                currentItemsCount={currentProducts.length}
                                onPageChange={handlePageChange}
                            />
                        </div>

                        {/* Additional Content when there are few products */}
                        <AdditionalContent selectedSeries={selectedSeries} productCount={currentProducts.length} />
                    </div>
                )}
            </div>

            {/* Filter Sidebar */}
            <FilterSidebar
                isOpen={isFilterOpen}
                selectedSeries={selectedSeries}
                sortBy={sortBy}
                onClose={handleFilterToggle}
                onSeriesClick={handleSeriesClick}
                onSortChange={handleSortChange}
                onClearFilters={handleClearFilters}
            />
        </div>
    );
}

export default function ProductsPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen bg-[#0c131d] text-white flex items-center justify-center">
                    <div className="text-center">
                        <div className="w-8 h-8 border-2 border-[#4FC8FF] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-400">Loading products...</p>
                    </div>
                </div>
            }
        >
            <ProductsPageContent />
        </Suspense>
    );
}
