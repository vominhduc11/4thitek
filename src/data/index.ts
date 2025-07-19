export * from './products';

// Re-export commonly used data
export {
    products,
    productSeries,
    productCategories,
    getProductById,
    getProductsBySeries,
    getProductsByCategory,
    getFeaturedProducts,
    getRelatedProducts,
    searchProducts,
    TOTAL_PRODUCTS,
    SERIES_COUNT,
    CATEGORY_COUNT
} from './products';