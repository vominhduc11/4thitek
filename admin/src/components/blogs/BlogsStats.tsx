import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Archive, Home } from "lucide-react";
import { motion } from "framer-motion";

interface BlogsStatsProps {
  activeCount: number;
  deletedCount: number;
  homepageCount: number;
  loading: boolean;
}

export function BlogsStats({ activeCount, deletedCount, homepageCount, loading }: BlogsStatsProps) {
  const render = (value: number, className?: string) =>
    loading ? <div className="h-7 w-16 bg-muted rounded animate-pulse" /> : <span className={`text-2xl font-bold ${className || ""}`}>{value}</span>;

  return (
    <motion.div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Bài viết</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          {render(activeCount)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Đã xóa</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <Archive className="h-5 w-5 text-amber-600" />
          {render(deletedCount, "text-amber-600")}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Hiển thị homepage</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <Home className="h-5 w-5 text-green-600" />
          {render(homepageCount, "text-green-600")}
        </CardContent>
      </Card>
    </motion.div>
  );
}
