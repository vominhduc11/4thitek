// Shared types for products
export interface Product {
    id: number;
    name: string;
    series: string;
    category: string;
    image: string;
    description: string;
    popularity: number; // Keep for sorting purposes
}

export interface FilterState {
    selectedSeries: string;
    sortBy: string;
}

export interface PaginationState {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
}
