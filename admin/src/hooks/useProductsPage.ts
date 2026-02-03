import { useState, useEffect, useCallback } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { apiRequest } from "@/services/api";
import { Product, ApiResponse, ApiProductResponse, ApiProductRequest } from "@/types";
import { logger } from "@/utils/logger";

export type ViewMode = "active" | "deleted";
export type DisplayMode = "grid" | "list";

export type Filters = {
  status: "all" | "in_stock" | "out_of_stock" | "low_stock";
  priceRange: { min: number; max: number };
  featured: "all" | "featured" | "not_featured";
};

type UseProductsPageProps = {
  initialViewMode?: ViewMode;
};

const DEFAULT_ITEMS_PER_PAGE = 10;

export const useProductsPage = ({ initialViewMode = "active" }: UseProductsPageProps = {}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showAll, setShowAll] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(initialViewMode);
  const [displayMode, setDisplayMode] = useState<DisplayMode>("list");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [totalActiveProducts, setTotalActiveProducts] = useState(0);
  const [totalDeletedProducts, setTotalDeletedProducts] = useState(0);
  const [filters, setFilters] = useState<Filters>({
    status: "all",
    priceRange: { min: 0, max: 100000000 },
    featured: "all",
  });
  const [sortBy, setSortBy] = useState<
    "name" | "price-asc" | "price-desc" | "stock-asc" | "stock-desc" | "newest" | "oldest"
  >("newest");
  const [exporting, setExporting] = useState(false);
  const [isSyncingStock, setIsSyncingStock] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, refreshTrigger]);

  useEffect(() => {
    if (viewMode === "active") {
      fetchProducts(debouncedSearchTerm, true);
    }
  }, [debouncedSearchTerm, fetchProducts, viewMode]);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const activeResponse = await apiRequest<ApiResponse<ApiProductResponse[]>>("/api/product/products");
        if (activeResponse.success) {
          setTotalActiveProducts(activeResponse.data.length);
        }
        const deletedResponse = await apiRequest<ApiResponse<ApiProductResponse[]>>("/api/product/products/deleted");
        if (deletedResponse.success) {
          setTotalDeletedProducts(deletedResponse.data.length);
        }
      } catch (error) {
        logger.error("Failed to fetch product counts:", error);
      }
    };
    fetchCounts();
  }, [refreshTrigger]);

  const transformApiProductToUI = useCallback((product: ApiProductResponse): Product => {
    let descriptions = null;
    let specifications = null;
    let videos = null;
    let parsedImage = "";

    try {
      if (product.descriptions) descriptions = JSON.parse(product.descriptions);
    } catch (error) {
      logger.warn("Failed to parse descriptions:", product.descriptions, error);
    }

    try {
      if (product.specifications) specifications = JSON.parse(product.specifications);
    } catch (error) {
      logger.warn("Failed to parse specifications:", product.specifications, error);
    }

    try {
      if (product.videos) videos = JSON.parse(product.videos);
    } catch (error) {
      logger.warn("Failed to parse videos:", product.videos, error);
    }

    try {
      if (product.image) {
        const imageData = JSON.parse(product.image);
        parsedImage = imageData.imageUrl || imageData.url || "";
      }
    } catch (error) {
      logger.warn("Failed to parse image:", product.image, error);
      parsedImage = product.image || "";
    }

    const stockValue =
      (product as any).stock !== undefined
        ? (product as any).stock
        : (specifications as any)?.stock
        ? parseInt((specifications as any).stock)
        : 0;

    return {
      id: product.id.toString(),
      sku: product.sku || "",
      name: product.name,
      categoryId: product.categoryId || "",
      image: parsedImage,
      descriptions,
      specifications,
      createdAt: product.createdAt,
      updatedAt: product.updateAt,
      showOnHomepage: product.showOnHomepage,
      isFeatured: product.isFeatured,
      publishStatus: (product as any).publishStatus || "UNPUBLISHED",
      retailPrice: product.price,
      videos,
      shortDescription: product.shortDescription || "",
      isDeleted: product.isDeleted || false,
      stock: typeof stockValue === "number" ? stockValue : parseInt(stockValue) || 0,
      model: (specifications as any)?.model || "",
      price: product.price,
      status: product.isDeleted ? "deleted" : product.status || "active",
      sold: 0,
      images: parsedImage ? [{ url: parsedImage, alt: product.name, type: "main", order: 1 }] : [],
      description: (descriptions as any)?.description || product.shortDescription || "",
    };
  }, []);

  const fetchProducts = useCallback(
    async (searchQuery: string = "", isSearch: boolean = false) => {
      try {
        if (isSearch) setSearchLoading(true);
        else setInitialLoading(true);

        let response: ApiResponse<ApiProductResponse[]>;
        if (viewMode === "active") {
          if (searchQuery.trim()) {
            response = await apiRequest<ApiResponse<ApiProductResponse[]>>(
              `/api/product/products/search?q=${encodeURIComponent(searchQuery)}`
            );
          } else {
            response = await apiRequest<ApiResponse<ApiProductResponse[]>>("/api/product/products");
          }
        } else {
          response = await apiRequest<ApiResponse<ApiProductResponse[]>>("/api/product/products/deleted");
        }

        if (response.success && response.data) {
          const transformed = response.data.map(transformApiProductToUI);
          setProducts(transformed);

          if (!isSearch && viewMode === "active") {
            setAllProducts(transformed);
          }

          if (viewMode === "active") {
            setTotalActiveProducts(transformed.length);
          } else {
            setTotalDeletedProducts(transformed.length);
          }
        } else {
          throw new Error(response.message || "Failed to fetch products");
        }
      } catch (error) {
        logger.error("Error fetching products", error);
      } finally {
      setInitialLoading(false);
      setSearchLoading(false);
    }
  },
  [viewMode, transformApiProductToUI]
);

  const applyFilters = useCallback(
    (newFilters: Filters) => {
      setFilters(newFilters);
      setCurrentPage(1);
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilters({
      status: "all",
      priceRange: { min: 0, max: 100000000 },
      featured: "all",
    });
  }, []);

  const handleSaveProduct = useCallback(
    async (productData: Partial<Product>, selectedProduct?: Product, formMode?: "add" | "edit") => {
      const apiProductData: ApiProductRequest = {
        name: productData.name || "",
        categoryId: productData.categoryId || "",
        shortDescription: productData.shortDescription || "",
        descriptions: JSON.stringify(productData.descriptions || {}),
        specifications: JSON.stringify(productData.specifications || {}),
        videos: JSON.stringify(productData.videos || []),
        image: productData.image || "",
        price:
          typeof productData.price === "number"
            ? productData.price
            : typeof productData.price === "string"
            ? parseFloat(productData.price.replace(/[^0-9.-]+/g, ""))
            : 0,
        showOnHomepage: !!productData.showOnHomepage,
        isFeatured: !!productData.isFeatured,
        publishStatus: productData.publishStatus || "UNPUBLISHED",
      };
      if (productData.sku !== undefined) {
        apiProductData.sku = productData.sku;
      }

      if (formMode === "add") {
        const response = await apiRequest<ApiResponse<ApiProductResponse>>("/api/product/products", {
          method: "POST",
          body: JSON.stringify(apiProductData),
        });

        if (response.success && response.data) {
          const newProduct = transformApiProductToUI(response.data);
          setProducts((prev) => [newProduct, ...prev]);
          setAllProducts((prev) => [newProduct, ...prev]);
        } else {
          throw new Error(response.message || "Failed to create product");
        }
      } else if (formMode === "edit" && selectedProduct) {
        const response = await apiRequest<ApiResponse<ApiProductResponse>>(`/api/product/${selectedProduct.id}`, {
          method: "PATCH",
          body: JSON.stringify(apiProductData),
        });

        if (response.success && response.data) {
          const updatedProduct = transformApiProductToUI(response.data);
          setProducts((prev) => prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)));
          setAllProducts((prev) => prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)));
        } else {
          throw new Error(response.message || "Failed to update product");
        }
      }
    },
    [transformApiProductToUI]
  );

  return {
    state: {
      searchTerm,
      debouncedSearchTerm,
      products,
      allProducts,
      initialLoading,
      searchLoading,
      currentPage,
      showAll,
      viewMode,
      displayMode,
      totalActiveProducts,
      totalDeletedProducts,
      filters,
      sortBy,
      exporting,
      isSyncingStock,
      itemsPerPage: DEFAULT_ITEMS_PER_PAGE,
    },
    actions: {
      setSearchTerm,
      setProducts,
      setAllProducts,
      setCurrentPage,
      setShowAll,
      setViewMode,
      setDisplayMode,
      setRefreshTrigger,
      setFilters: applyFilters,
      resetFilters,
      setSortBy,
      fetchProducts,
      handleSaveProduct,
      setExporting,
      setIsSyncingStock,
    },
  };
};

export type UseProductsPageReturn = ReturnType<typeof useProductsPage>;
