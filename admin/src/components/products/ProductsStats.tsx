import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Star, AlertTriangle, ShoppingBag } from "lucide-react";

interface ProductsStatsProps {
  stats: {
    total: number;
    active: number;
    featured: number;
    lowStock: number;
    outOfStock: number;
  };
  loading: boolean;
}

export function ProductsStats({ stats, loading }: ProductsStatsProps) {
  const renderValue = (value: number, className?: string) =>
    loading ? (
      <div className="h-7 w-16 bg-muted rounded animate-pulse" />
    ) : (
      <span className={`text-2xl font-bold ${className || ""}`}>{value}</span>
    );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Tổng sản phẩm</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          {renderValue(stats.total)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Đang bán</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-green-600" />
          {renderValue(stats.active, "text-green-600")}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Nổi bật</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          {renderValue(stats.featured, "text-yellow-600")}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Sắp hết</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          {renderValue(stats.lowStock, "text-amber-600")}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Hết hàng</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          {renderValue(stats.outOfStock, "text-red-600")}
        </CardContent>
      </Card>
    </div>
  );
}
