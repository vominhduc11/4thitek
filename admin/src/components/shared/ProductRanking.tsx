import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

interface Product {
  name: string;
  revenue?: number;
  sold?: number;
  growth?: number;
}

interface ProductRankingProps {
  title: string;
  products: Product[];
  showGrowth?: boolean;
}

export function ProductRanking({ title, products, showGrowth = false }: ProductRankingProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {products.map((product, index) => (
            <div key={product.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-foreground">{product.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {product.revenue
                      ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.revenue)
                      : product.sold ? `${product.sold} đã bán` : ''
                    }
                  </p>
                </div>
              </div>
              <div className="text-right">
                {showGrowth && product.growth !== undefined && (
                  <div className="flex items-center gap-1">
                    {product.growth > 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${product.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {product.growth > 0 ? '+' : ''}{product.growth}%
                    </span>
                  </div>
                )}
                {product.revenue && !showGrowth && (
                  <p className="font-medium text-foreground">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.revenue)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}