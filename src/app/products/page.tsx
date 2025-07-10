"use client";

import { useState, useMemo } from "react";
import { Product } from "./_components/types";
import {
  ProductsHero,
  ProductsHeader,
  ProductGrid,
  ProductsPagination,
  FilterSidebar,
  EmptyState
} from "./_components";

// Constants
const ITEMS_PER_PAGE = 8;

// Mock data for products
const mockProducts: Product[] = [
  {
    id: 1,
    name: "SCS S8X Pro",
    series: "SX SERIES",
    category: "Category1",
    image: "/products/product1.png",
    description: "Advanced communication device with Bluetooth 5.0 technology, waterproof design, and crystal clear audio quality for professional use.",
    price: 299,
    rating: 4.8,
    isNew: true,
    popularity: 95,
  },
  {
    id: 2,
    name: "SCS S8X Elite",
    series: "SX SERIES",
    category: "Category1",
    image: "/products/product2.png",
    description: "Premium series featuring enhanced noise cancellation, extended battery life, and seamless group communication capabilities.",
    price: 399,
    rating: 4.9,
    isNew: true,
    popularity: 88,
  },
  {
    id: 3,
    name: "SCS S Series Pro",
    series: "S SERIES",
    category: "Category2",
    image: "/products/product3.png",
    description: "Reliable and durable communication solution designed for everyday use with superior sound quality and ergonomic design.",
    price: 199,
    rating: 4.6,
    isNew: false,
    popularity: 92,
  },
  {
    id: 4,
    name: "SCS G+ Elite",
    series: "G+ SERIES",
    category: "Category2",
    image: "/products/product1.png",
    description: "Next-generation communication device with AI-powered noise reduction and ultra-long range connectivity.",
    price: 499,
    rating: 4.9,
    isNew: true,
    popularity: 85,
  },
  {
    id: 5,
    name: "SCS G Pro",
    series: "G SERIES",
    category: "Category3",
    image: "/products/product2.png",
    description: "Professional grade communication system with military-standard durability and crystal clear transmission.",
    price: 349,
    rating: 4.7,
    isNew: false,
    popularity: 90,
  },
  {
    id: 6,
    name: "SCS S Standard",
    series: "S SERIES",
    category: "Category2",
    image: "/products/product3.png",
    description: "Entry-level professional communication device with essential features and reliable performance.",
    price: 149,
    rating: 4.4,
    isNew: false,
    popularity: 78,
  },
];

export default function ProductsPage() {
  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(ITEMS_PER_PAGE);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("popularity");

  // Filter and sort products based on selected criteria
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = mockProducts;

    // Filter by series
    if (selectedSeries !== "ALL") {
      filtered = filtered.filter(product => product.series === selectedSeries);
    }

    // Sort products
    switch (sortBy) {
      case "price-low":
        filtered = [...filtered].sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        filtered = [...filtered].sort((a, b) => b.price - a.price);
        break;
      case "newest":
        filtered = [...filtered].sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      case "rating":
        filtered = [...filtered].sort((a, b) => b.rating - a.rating);
        break;
      case "popularity":
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
    }
  };

  const handleFilterToggle = () => setIsFilterOpen(prev => !prev);

  const handleSeriesClick = (series: string) => {
    setSelectedSeries(series);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleSortChange = (newSortBy: string) => {
    setSortBy(newSortBy);
    setCurrentPage(1); // Reset to first page when sorting
  };

  const handleClearFilters = () => {
    setSelectedSeries("ALL");
    setSortBy("popularity");
    setCurrentPage(1);
  };

  // Check if any filters are active
  const hasActiveFilters = selectedSeries !== "ALL" || sortBy !== "popularity";

  return (
    <div className="min-h-screen bg-[#0c131d] text-white">
      {/* Hero Video Section */}
      <ProductsHero />

      {/* Title & Description Section */}
      <ProductsHeader
        selectedSeries={selectedSeries}
        hasActiveFilters={hasActiveFilters}
        onSeriesClick={handleSeriesClick}
        onFilterToggle={handleFilterToggle}
      />

      {/* Product Grid or Empty State */}
      {currentProducts.length === 0 ? (
        <div className="ml-16 sm:ml-20 mb-16">
          <div className="px-4 sm:px-6 lg:px-8">
            <EmptyState
              selectedSeries={selectedSeries}
              onClearFilters={handleClearFilters}
            />
          </div>
        </div>
      ) : (
        <>
          {/* Product Grid */}
          <ProductGrid products={currentProducts} />

          {/* Pagination - Only show when there are products */}
          <ProductsPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            currentItemsCount={currentProducts.length}
            onPageChange={handlePageChange}
          />
        </>
      )}

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
