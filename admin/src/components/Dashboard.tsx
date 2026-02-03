import { useState } from "react";
import { motion } from "framer-motion";
import { DollarSign, RefreshCw, CheckCircle, ArrowUpRight, ArrowDownRight, BarChart3, Users, AlertTriangle, Award, Crown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatsCard } from "./shared/StatsCard";
import { RevenueChart } from "./shared/RevenueChart";
import { DateRangePicker } from "./DateRangePicker";
import { useBusinessMetrics } from "@/hooks/useBusinessMetrics";
import { startOfMonth, endOfMonth } from "date-fns";
import { gridContainerVariants, gridItemVariants } from "@/utils/animations";
import { PageContainer } from "./shared/PageContainer";

export function Dashboard() {
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });

  const { metrics, comparisonData, growthData, topAgents, inventoryProducts, topSellingProducts, loading, error, dashboardData } = useBusinessMetrics(dateRange);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Đang tải dữ liệu...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <AlertTriangle className="h-8 w-8 text-red-600" />
        <span className="ml-2 text-red-600">Lỗi tải dữ liệu: {error}</span>
      </div>
    );
  }

  return (
    <PageContainer
      title="Dashboard - Tổng quan kinh doanh"
      description={
        dashboardData?.data.metadata.lastUpdated
          ? `Theo dõi doanh thu, đơn hàng, khách hàng và sản phẩm. Cập nhật: ${new Date(dashboardData.data.metadata.lastUpdated).toLocaleString('vi-VN')}`
          : "Theo dõi doanh thu, đơn hàng, khách hàng và sản phẩm."
      }
      actions={(
        <DateRangePicker
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
        />
      )}
    >
      <div className="space-y-6 animate-fade-in">
      {/* Key Performance Indicators - Most Important Metrics */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Chỉ số kinh doanh chính</h2>
        </div>

        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
          variants={gridContainerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={gridItemVariants}>
            <StatsCard
              title="Doanh thu hôm nay"
              value={new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(metrics.todayRevenue)}
              change={{
                value: `${metrics.todayRevenueGrowth > 0 ? '+' : ''}${metrics.todayRevenueGrowth}%`,
                isPositive: metrics.todayRevenueGrowth > 0,
                label: "so với hôm qua"
              }}
              icon={DollarSign}
              iconColor="text-green-600"
            />
          </motion.div>

          <motion.div variants={gridItemVariants}>
            <StatsCard
              title="Đơn hàng hoàn thành"
              value={metrics.completedOrders.toString()}
              change={{
                value: `${metrics.todayOrders}`,
                isPositive: true,
                label: "tổng đơn hôm nay"
              }}
              icon={CheckCircle}
              iconColor="text-blue-600"
            />
          </motion.div>

          <motion.div variants={gridItemVariants}>
            <StatsCard
              title="Đại lý tháng này"
              value={dashboardData?.data.kpiMetrics.monthDealers?.value?.toString() || metrics.monthDealers.toString()}
              change={{
                value: `${(dashboardData?.data.kpiMetrics.monthDealers?.growth || metrics.monthDealersGrowth) > 0 ? '+' : ''}${dashboardData?.data.kpiMetrics.monthDealers?.growth || metrics.monthDealersGrowth}%`,
                isPositive: (dashboardData?.data.kpiMetrics.monthDealers?.growth || metrics.monthDealersGrowth) > 0,
                label: dashboardData?.data.kpiMetrics.monthDealers?.comparison || "so với tháng trước"
              }}
              icon={Users}
              iconColor="text-purple-600"
            />
          </motion.div>

          <motion.div variants={gridItemVariants}>
            <StatsCard
              title="Sản phẩm sắp hết"
              value={metrics.lowStockProducts.toString()}
              change={{
                value: `${metrics.totalProducts}`,
                isPositive: false,
                label: "tổng sản phẩm"
              }}
              icon={AlertTriangle}
              iconColor="text-red-600"
            />
          </motion.div>
        </motion.div>
      </div>

      {/* Critical Alerts & Top Performers */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6"
        variants={gridContainerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Critical Inventory Summary */}
        <motion.div variants={gridItemVariants}>
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Cảnh báo tồn kho
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="text-center p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {dashboardData?.data.inventoryAlerts.lowStockCount || inventoryProducts.filter(p => p.status === 'low_stock').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Sắp hết hàng</div>
                </div>
                <div className="text-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {dashboardData?.data.inventoryAlerts.overstockCount || inventoryProducts.filter(p => p.status === 'overstock').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Tồn dư</div>
                </div>
              </div>
              {(dashboardData?.data.inventoryAlerts.urgentProduct || inventoryProducts.filter(p => p.status === 'low_stock').length > 0) && (
                <div className="text-center">
                  <p className="text-sm text-red-600 font-medium">
                    ⚠️ Cần nhập kho gấp: {dashboardData?.data.inventoryAlerts.urgentProduct || inventoryProducts.filter(p => p.status === 'low_stock')[0]?.name}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        </motion.div>

        {/* Top Performers Quick View */}
        <motion.div variants={gridItemVariants}>
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600" />
              Top performers hôm nay
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Top Customer */}
              <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800/30 rounded-lg">
                <div>
                  <p className="font-medium text-foreground flex items-center gap-2">
                    <Crown className="h-4 w-4 text-yellow-600" />
                    Đại lý VIP
                  </p>
                  <p className="text-sm text-muted-foreground">{dashboardData?.data.topPerformers.topDealer?.name || topAgents[0]?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-yellow-700">{formatCurrency(dashboardData?.data.topPerformers.topDealer?.totalSpent || topAgents[0]?.totalSpent || 0)}</p>
                  <p className="text-xs text-muted-foreground">{dashboardData?.data.topPerformers.topDealer?.totalOrders || topAgents[0]?.totalOrders || 0} đơn</p>
                </div>
              </div>

              {/* Top Product */}
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/30 rounded-lg">
                <div>
                  <p className="font-medium text-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    Sản phẩm bán chạy
                  </p>
                  <p className="text-sm text-muted-foreground">{dashboardData?.data.topPerformers.topProduct.name || topSellingProducts[0]?.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-700">{dashboardData?.data.topPerformers.topProduct.soldQuantity || topSellingProducts[0]?.soldQuantity || 0} sản phẩm</p>
                  <p className="text-xs text-muted-foreground">+{dashboardData?.data.topPerformers.topProduct.growth || topSellingProducts[0]?.growth || 0}%</p>
                </div>
              </div>

              {/* Revenue Today */}
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 rounded-lg">
                <div>
                  <p className="font-medium text-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                    Doanh thu hôm nay
                  </p>
                  <p className="text-sm text-muted-foreground">{(dashboardData?.data.topPerformers.todayRevenueHighlight.growth || metrics.todayRevenueGrowth) > 0 ? 'Tăng' : 'Giảm'} {Math.abs(dashboardData?.data.topPerformers.todayRevenueHighlight.growth || metrics.todayRevenueGrowth)}% {dashboardData?.data.topPerformers.todayRevenueHighlight.comparison || 'vs hôm qua'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-blue-700">{formatCurrency(dashboardData?.data.topPerformers.todayRevenueHighlight.value || metrics.todayRevenue)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        </motion.div>
      </motion.div>


      {/* Charts Section - Simplified */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Biểu đồ xu hướng</h2>
        </div>

        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6"
          variants={gridContainerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={gridItemVariants}>
            <RevenueChart
              title="Xu hướng doanh thu"
              data={comparisonData}
              type="bar"
              dataKey="current"
              color="#2563eb"
              height={300}
              showDataLabels={true}
            />
          </motion.div>

          <motion.div variants={gridItemVariants}>
            <RevenueChart
              title="Tăng trưởng doanh thu (%)"
              data={growthData}
              type="line"
              dataKey="growth"
              color="#059669"
              height={300}
              showDataLabels={true}
            />
          </motion.div>
        </motion.div>

      </div>

      {/* Top Customers & Products - Final Section */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6"
        variants={gridContainerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Top Customers List */}
        <motion.div variants={gridItemVariants}>
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-600" />
              Top 3 đại lý VIP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(dashboardData?.data.topLists.dealers || topAgents).slice(0, 3).map((customer, index) => (
                <div key={`dealer-${customer.rank || index}`} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ${
                      customer.rank === 1 ? 'bg-yellow-500' :
                      customer.rank === 2 ? 'bg-gray-400' :
                      customer.rank === 3 ? 'bg-orange-600' : 'bg-blue-500'
                    }`}>
                      {customer.rank}
                    </div>
                    <p className="font-medium text-foreground text-sm">{customer.name}</p>
                  </div>
                  <p className="font-semibold text-foreground text-sm">
                    {formatCurrency(customer.totalSpent)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </motion.div>

        {/* Top Products List */}
        <motion.div variants={gridItemVariants}>
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600" />
              Top 5 sản phẩm bán chạy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topSellingProducts.slice(0, 5).map((product, index) => (
                <div key={`product-${product.rank || index}`} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold text-white ${
                      product.rank === 1 ? 'bg-yellow-500' :
                      product.rank === 2 ? 'bg-gray-400' :
                      product.rank === 3 ? 'bg-orange-600' : 'bg-blue-500'
                    }`}>
                      {product.rank}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.soldQuantity} sản phẩm đã bán</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">
                      {formatCurrency(product.revenue)}
                    </p>
                    <div className={`flex items-center gap-1 ${product.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {product.growth > 0 ?
                        <ArrowUpRight className="h-3 w-3" /> :
                        <ArrowDownRight className="h-3 w-3" />
                      }
                      <span className="text-xs font-medium">{Math.abs(product.growth)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </motion.div>
      </motion.div>
    </div>
    </PageContainer>
  );
}
