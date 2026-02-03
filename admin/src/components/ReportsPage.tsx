import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangePicker } from "./DateRangePicker";
import { RevenueChart } from "./shared/RevenueChart";
import { useBusinessMetrics } from "@/hooks/useBusinessMetrics";
import {
  Download,
  DollarSign,
  Users,
  Award,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  PieChart
} from "lucide-react";
import { startOfMonth, endOfMonth } from "date-fns";
import { ReportExporter } from "@/utils/reportExporter";
import { logger } from '@/utils/logger';
import { PageContainer } from "./shared/PageContainer";

export function ReportsPage() {
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });

  const [reportType, setReportType] = useState("overview");
  const [exportFormat, setExportFormat] = useState("pdf");

  const {
    metrics,
    topAgents,
    topSellingProducts,
    inventoryProducts,
    comparisonData,
    growthData,
    orderComparisonData,
    customerComparisonData,
    dealerSegments,
    reportOverviewData,
    reportRevenueData,
    reportProductsData,
    reportDealersData
  } = useBusinessMetrics(dateRange);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handleExport = async () => {
    try {
      await ReportExporter.exportReport({
        type: reportType as 'overview' | 'revenue' | 'customers' | 'products',
        dateRange,
        format: exportFormat as 'pdf' | 'excel' | 'csv',
        data: {
          metrics,
          topAgents,
          topSellingProducts,
          inventoryProducts,
          comparisonData,
          growthData,
          orderComparisonData,
          customerComparisonData
        }
      });
    } catch (error) {
      logger.error('Export failed:', error);
      alert('Xuất báo cáo thất bại. Vui lòng thử lại.');
    }
  };

  // Simple metrics calculation - use API data first
  const simpleMetrics = useMemo(() => {
    // Use API data if available
    if (reportOverviewData?.data.essentialStats) {
      const apiStats = reportOverviewData.data.essentialStats;
      return {
        avgOrderValue: apiStats.avgOrderValue,
        orderFulfillmentRate: apiStats.orderFulfillmentRate,
        lowStockCount: apiStats.lowStockCount,
        totalProducts: metrics.totalProducts
      };
    }

    // Fallback calculation
    const avgOrderValue = metrics.monthRevenue / (metrics.monthOrders || 1);
    const orderFulfillmentRate = (metrics.completedOrders / (metrics.completedOrders + metrics.pendingOrders)) * 100;
    const lowStockCount = inventoryProducts.filter(p => p.status === 'low_stock').length;

    return {
      avgOrderValue,
      orderFulfillmentRate,
      lowStockCount,
      totalProducts: inventoryProducts.length
    };
  }, [metrics, inventoryProducts, reportOverviewData]);


  return (
    <PageContainer
      title="Báo cáo chi tiết"
      description="Phân tích sâu doanh thu, đại lý, sản phẩm và xu hướng kinh doanh"
      actions={
        <div className="flex flex-col sm:flex-row gap-3">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />

          <div className="flex gap-2">
            <Select value={exportFormat} onValueChange={setExportFormat}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleExport} className="whitespace-nowrap">
              <Download className="h-4 w-4 mr-2" />
              Xuất báo cáo
            </Button>
          </div>
        </div>
      }
    >
      <div className="space-y-6 animate-fade-in">
      <Tabs value={reportType} onValueChange={setReportType} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="revenue">Doanh thu</TabsTrigger>
          <TabsTrigger value="customers">Đại lý</TabsTrigger>
          <TabsTrigger value="products">Sản phẩm</TabsTrigger>
        </TabsList>

        {/* Overview Report - Advanced Business Intelligence */}
        <TabsContent value="overview" className="space-y-6">
          {/* Essential Business Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Doanh thu tháng này
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(
                    reportOverviewData?.data.kpiCards.monthRevenue.value ?? metrics.monthRevenue
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {reportOverviewData?.data.kpiCards.monthRevenue.label ||
                   `Tăng ${metrics.monthRevenueGrowth}% vs tháng trước`}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Đơn hàng hoàn thành
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportOverviewData?.data.kpiCards.completedOrders.value ?? metrics.completedOrders}
                </div>
                <div className="text-xs text-muted-foreground">
                  {reportOverviewData?.data.kpiCards.completedOrders.label ||
                   `${simpleMetrics.orderFulfillmentRate.toFixed(1)}% tỷ lệ hoàn thành`}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Đại lý hoạt động
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportOverviewData?.data.kpiCards.activeDealers.value ?? metrics.monthCustomers}
                </div>
                <div className="text-xs text-muted-foreground">
                  {reportOverviewData?.data.kpiCards.activeDealers.label ||
                   `Tăng ${metrics.monthCustomersGrowth}% vs tháng trước`}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Sản phẩm cần nhập
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {reportOverviewData?.data.kpiCards.lowStockProducts.value ?? simpleMetrics.lowStockCount}
                </div>
                <div className="text-xs text-muted-foreground">
                  {reportOverviewData?.data.kpiCards.lowStockProducts.label ||
                   `Trên tổng ${simpleMetrics.totalProducts} sản phẩm`}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Essential Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Thống kê chính
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Giá trị đơn hàng trung bình</span>
                  <span className="font-medium">{formatCurrency(simpleMetrics.avgOrderValue)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Tỷ lệ hoàn thành đơn hàng</span>
                  <span className="font-medium">{simpleMetrics.orderFulfillmentRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Sản phẩm sắp hết hàng</span>
                  <span className={`font-medium ${simpleMetrics.lowStockCount > 5 ? 'text-red-600' : 'text-green-600'}`}>
                    {simpleMetrics.lowStockCount} sản phẩm
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Phân loại đại lý
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {dealerSegments.map((segment) => (
                    <div key={segment.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: segment.color }}
                        />
                        <span className="text-sm">{segment.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{segment.count}</div>
                        <div className="text-xs text-muted-foreground">{segment.percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Essential Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueChart
              title="Xu hướng doanh thu"
              data={comparisonData}
              type="bar"
              dataKey="current"
              color="#3b82f6"
              height={350}
              showDataLabels={true}
            />

            <RevenueChart
              title="Tăng trưởng doanh thu (%)"
              data={growthData}
              type="line"
              dataKey="growth"
              color="#10b981"
              height={350}
              showDataLabels={true}
            />
          </div>
        </TabsContent>

        {/* Revenue Report */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Doanh thu tháng này</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.monthRevenue)}</div>
                <div className={`flex items-center text-xs ${metrics.monthRevenueGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.monthRevenueGrowth > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {Math.abs(metrics.monthRevenueGrowth)}% vs tháng trước
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Doanh thu hôm nay</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.todayRevenue)}</div>
                <div className={`flex items-center text-xs ${metrics.todayRevenueGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metrics.todayRevenueGrowth > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {Math.abs(metrics.todayRevenueGrowth)}% vs hôm qua
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Giá trị đơn hàng TB</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(
                    reportRevenueData?.data.revenueKpis.avgOrderValue.value || simpleMetrics.avgOrderValue
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {reportRevenueData?.data.revenueKpis.avgOrderValue.totalOrders || metrics.monthOrders} đơn hàng
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RevenueChart
              title="So sánh doanh thu theo kỳ"
              data={comparisonData}
              type="bar"
              dataKey="current"
              color="#3b82f6"
              height={350}
              showDataLabels={true}
            />

            <RevenueChart
              title="Tăng trưởng doanh thu (%)"
              data={growthData}
              type="line"
              dataKey="growth"
              color="#10b981"
              height={350}
              showDataLabels={true}
            />
          </div>

          {/* Detailed Revenue Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Chi tiết doanh thu theo sản phẩm</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topSellingProducts.slice(0, 8).map((product) => (
                  <div key={product.name} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.soldQuantity} sản phẩm</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(product.revenue)}</p>
                      <div className={`flex items-center gap-1 text-xs ${product.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {product.growth > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {Math.abs(product.growth)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dealer Report */}
        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tổng đại lý</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportDealersData?.data.dealerKpis.totalDealers.value ?? metrics.monthCustomers}
                </div>
                <div className={`flex items-center text-xs ${
                  (reportDealersData?.data.dealerKpis.totalDealers.growth ?? metrics.monthCustomersGrowth) > 0
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}>
                  {(reportDealersData?.data.dealerKpis.totalDealers.growth ?? metrics.monthCustomersGrowth) > 0
                    ? <TrendingUp className="h-3 w-3 mr-1" />
                    : <TrendingDown className="h-3 w-3 mr-1" />}
                  {reportDealersData?.data.dealerKpis.totalDealers.label ||
                   `${Math.abs(metrics.monthCustomersGrowth)}% vs tháng trước`}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Đại lý VIP</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {reportDealersData?.data.dealerKpis.vipDealers.value ?? dealerSegments[0]?.count ?? 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  {reportDealersData?.data.dealerKpis.vipDealers.label || "Chi tiêu > 20M VND"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Doanh thu/Đại lý</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(
                    reportDealersData?.data.dealerKpis.revenuePerDealer.value ??
                    (metrics.monthRevenue / (metrics.monthCustomers || 1))
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {reportDealersData?.data.dealerKpis.revenuePerDealer.label || "Trung bình/đại lý"}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Dealer Segmentation - Simplified */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Phân loại đại lý
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dealerSegments.map((segment) => (
                    <div key={segment.name} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: segment.color }}
                          />
                          <span className="text-sm font-medium">{segment.name}</span>
                        </div>
                        <span className="text-sm font-bold">{segment.count}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${segment.percentage}%`,
                            backgroundColor: segment.color
                          }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground text-right">
                        {segment.percentage.toFixed(1)}%
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Dealers Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Top 5 đại lý</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topAgents.slice(0, 5).map((dealer, index) => (
                    <div key={dealer.name} className="flex items-center justify-between p-2 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                        }`}>
                          {index + 1}
                        </div>
                        <span className="text-sm font-medium">{dealer.name}</span>
                      </div>
                      <span className="text-sm font-semibold">{formatCurrency(dealer.totalSpent)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Customers Detailed */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Top đại lý chi tiết
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {topAgents.map((customer) => (
                  <div key={customer.name} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-bold text-white ${
                        customer.rank === 1 ? 'bg-yellow-500' :
                        customer.rank === 2 ? 'bg-gray-400' :
                        customer.rank === 3 ? 'bg-orange-600' : 'bg-blue-500'
                      }`}>
                        {customer.rank}
                      </div>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {customer.totalOrders} đơn hàng • Lần cuối: {customer.lastOrder}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{formatCurrency(customer.totalSpent)}</p>
                      <p className="text-sm text-muted-foreground">
                        TB: {formatCurrency(customer.totalSpent / customer.totalOrders)}/đơn
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Report */}
        <TabsContent value="products" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tổng sản phẩm</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalProducts}</div>
                <div className="text-xs text-muted-foreground">Đang kinh doanh</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Sản phẩm bán chạy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {reportProductsData?.data.productKpis.growingProducts.value || topSellingProducts.filter(p => p.growth > 0).length}
                </div>
                <div className="text-xs text-muted-foreground">
                  {reportProductsData?.data.productKpis.growingProducts.label || "Có tăng trưởng"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Doanh thu sản phẩm</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(
                    reportProductsData?.data.productKpis.totalRevenue.value ||
                    topSellingProducts.reduce((sum, p) => sum + p.revenue, 0)
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {reportProductsData?.data.productKpis.totalRevenue.label || "Tổng doanh thu"}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Sắp hết hàng</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {reportProductsData?.data.inventorySummary.lowStock || metrics.lowStockProducts}
                </div>
                <div className="text-xs text-muted-foreground">Cần nhập kho</div>
              </CardContent>
            </Card>
          </div>

          {/* Top Products Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-600" />
                  Top 5 sản phẩm bán chạy
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topSellingProducts.slice(0, 5).map((product, index) => (
                    <div key={product.name} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ${
                          index === 0 ? 'bg-yellow-500' :
                          index === 1 ? 'bg-gray-400' :
                          index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.soldQuantity} đã bán</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sm">{formatCurrency(product.revenue)}</p>
                        <div className={`flex items-center gap-1 text-xs ${product.growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {product.growth > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          <span>{Math.abs(product.growth)}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Sản phẩm cần chú ý
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {inventoryProducts.filter(p => p.status === 'low_stock').map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">Còn {product.currentStock} sản phẩm</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-red-600 text-sm">Sắp hết</p>
                        <p className="text-xs text-muted-foreground">Cần ≥{product.minStock}</p>
                      </div>
                    </div>
                  ))}
                  {inventoryProducts.filter(p => p.status === 'low_stock').length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      <Package className="h-8 w-8 mx-auto mb-2" />
                      <p className="text-sm">Tất cả sản phẩm đều có tồn kho ổn định</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Simplified Inventory Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Tình trạng tồn kho
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {reportProductsData?.data.inventorySummary.lowStock || inventoryProducts.filter(p => p.status === 'low_stock').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Sản phẩm sắp hết</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {reportProductsData?.data.inventorySummary.normal || inventoryProducts.filter(p => p.status === 'normal').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Tồn kho ổn định</div>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {reportProductsData?.data.inventorySummary.overstock || inventoryProducts.filter(p => p.status === 'overstock').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Tồn dư</div>
                </div>
              </div>
              {(reportProductsData?.data.inventorySummary.lowStock || inventoryProducts.filter(p => p.status === 'low_stock').length) > 0 && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-lg">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">
                    {reportProductsData?.data.inventorySummary.alertMessage ||
                     `⚠️ Cảnh báo: Có ${inventoryProducts.filter(p => p.status === 'low_stock').length} sản phẩm cần nhập kho ngay!`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </PageContainer>
  );
}
