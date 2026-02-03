import { useState, useEffect, useMemo, useCallback } from "react";
import { Product } from "@/types";
import { productService } from "@/services/productService";
import { useToast } from "@/hooks/use-toast";
import { logger } from "@/utils/logger";

export const useProducts = (viewMode: "active" | "deleted" = "active") => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "active" | "deleted">("all");
  const [showFeatured, setShowFeatured] = useState<boolean | null>(null);
  const [showOnHomepage, setShowOnHomepage] = useState<boolean | null>(null);
  const [stockFilter, setStockFilter] = useState<"all" | "in-stock" | "low-stock" | "out-of-stock">("all");
  const [sortBy, setSortBy] = useState<"name-asc" | "name-desc" | "price-asc" | "price-desc" | "stock-asc" | "stock-desc">(
    "name-asc"
  );

  const { toast } = useToast();

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const list = viewMode === "deleted"
        ? await productService.getDeletedProducts()
        : await productService.getProducts();

      const normalized = Array.isArray(list) ? list : [];
      const withFlag = normalized.map((p: any) =>
        viewMode === "deleted" ? { ...p, isDeleted: true } : p
      );
      setProducts(withFlag);
    } catch (error) {
      logger.error("Error loading products:", error);
      setError("Không thể tải danh sách sản phẩm");
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách sản phẩm",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast, viewMode]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        !searchTerm ||
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (product.shortDescription &&
          product.shortDescription.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = !selectedCategory || product.category === selectedCategory;
      const matchesStatus =
        selectedStatus === "all" ||
        (selectedStatus === "active" && !product.isDeleted) ||
        (selectedStatus === "deleted" && product.isDeleted);

      const matchesFeatured = showFeatured === null || product.isFeatured === showFeatured;
      const matchesHomepage = showOnHomepage === null || product.showOnHomepage === showOnHomepage;
      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "in-stock" && (product.stock || 0) > 0) ||
        (stockFilter === "low-stock" && (product.stock || 0) > 0 && (product.stock || 0) < 10) ||
        (stockFilter === "out-of-stock" && (product.stock || 0) === 0);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus &&
        matchesFeatured &&
        matchesHomepage &&
        matchesStock
      );
    }).sort((a, b) => {
      const getPrice = (p: Product) => Number(p.price ?? p.retailPrice ?? 0);
      const getStock = (p: Product) => Number(p.stock ?? p.availability?.quantity ?? 0);

      switch (sortBy) {
        case "name-asc":
          return a.name.localeCompare(b.name);
        case "name-desc":
          return b.name.localeCompare(a.name);
        case "price-asc":
          return getPrice(a) - getPrice(b);
        case "price-desc":
          return getPrice(b) - getPrice(a);
        case "stock-asc":
          return getStock(a) - getStock(b);
        case "stock-desc":
          return getStock(b) - getStock(a);
        default:
          return 0;
      }
    });
  }, [
    products,
    searchTerm,
    selectedCategory,
    selectedStatus,
    showFeatured,
    showOnHomepage,
    stockFilter,
    sortBy,
  ]);

  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => !p.isDeleted).length;
    const featured = products.filter((p) => p.isFeatured).length;
    const lowStock = products.filter((p) => (p.stock || 0) > 0 && (p.stock || 0) < 10).length;
    const outOfStock = products.filter((p) => (p.stock || 0) === 0).length;

    return {
      total,
      active,
      featured,
      lowStock,
      outOfStock,
    };
  }, [products]);

  return {
    products,
    filteredProducts,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    showFeatured,
    setShowFeatured,
    showOnHomepage,
    setShowOnHomepage,
    stockFilter,
    setStockFilter,
    sortBy,
    setSortBy,
    stats,
    loadProducts,
    setProducts,
  };
};
