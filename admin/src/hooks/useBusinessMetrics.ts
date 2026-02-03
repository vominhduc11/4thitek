import { useState, useEffect, useMemo } from 'react';
import { apiRequest } from '@/services/api';
import { format } from 'date-fns';
import { logger } from '@/utils/logger';

export interface BusinessData {
  month: string;
  revenue: number;
  orders: number;
  customers: number;
}

export interface DashboardAPIResponse {
  success: boolean;
  message: string;
  data: {
    kpiMetrics: {
      todayRevenue: {
        value: number;
        growth: number;
        comparison: string;
      };
      completedOrders: {
        value: number;
        total: number;
        label: string;
      };
      monthDealers: {
        value: number;
        growth: number;
        comparison: string;
      };
      lowStockProducts: {
        value: number;
        total: number;
        label: string;
      };
    };
    inventoryAlerts: {
      lowStockCount: number;
      overstockCount: number;
      urgentProduct: string;
    };
    topPerformers: {
      topDealer: {
        name: string;
        totalSpent: number;
        totalOrders: number;
      };
      topProduct: {
        name: string;
        soldQuantity: number;
        growth: number;
      };
      todayRevenueHighlight: {
        value: number;
        growth: number;
        comparison: string | null;
      };
    };
    chartsData: {
      revenueComparison: {
        period: string;
        current: number;
        label: string;
      }[];
      revenueGrowth: {
        period: string;
        growth: number;
        label: string;
      }[];
    };
    topLists: {
      dealers: {
        rank: number;
        name: string;
        totalSpent: number;
      }[];
      products: {
        rank: number;
        name: string;
        soldQuantity: number;
        revenue: number;
        growth: number;
      }[];
    };
    metadata: {
      lastUpdated: string;
      cacheExpiry: number;
      dataSource: string;
    };
  };
}

// New Report API Response Interfaces
export interface ReportOverviewResponse {
  success: boolean;
  data: {
    kpiCards: {
      monthRevenue: { value: number; growth: number; label: string };
      completedOrders: { value: number; fulfillmentRate: number; total: number; label: string };
      activeDealers: { value: number; growth: number; label: string };
      lowStockProducts: { value: number; total: number; label: string };
    };
    essentialStats: {
      avgOrderValue: number;
      orderFulfillmentRate: number;
      lowStockCount: number;
    };
    dealerSegments: {
      name: string;
      count: number;
      percentage: number;
      color: string;
    }[];
    charts: {
      revenueComparison: { period: string; current: number; label: string }[];
      revenueGrowth: { period: string; growth: number; label: string }[];
    };
  };
}

export interface ReportRevenueResponse {
  success: boolean;
  data: {
    revenueKpis: {
      monthRevenue: { value: number; growth: number; label: string; totalOrders: number };
      todayRevenue: { value: number; growth: number; label: string; totalOrders: number };
      avgOrderValue: { value: number; growth: number | null; label: string; totalOrders: number };
    };
    charts: {
      comparison: { period: string; current: number; label: string }[];
      growth: { period: string; growth: number; label: string }[];
    };
    productRevenue: {
      productName: string;
      soldQuantity: number;
      revenue: number;
      growth: number;
    }[];
  };
}

export interface ReportDealersResponse {
  success: boolean;
  data: {
    dealerKpis: {
      totalDealers: { value: number; growth: number; label: string };
      vipDealers: { value: number; label: string; criteria: string };
      revenuePerDealer: { value: number; label: string; avgValue: number };
    };
    segmentation: {
      name: string;
      count: number;
      percentage: number;
      color: string;
    }[];
    topDealers: {
      name: string;
      rank: number;
      totalSpent: number;
    }[];
    detailedDealers: {
      name: string;
      rank: number;
      totalSpent: number;
      totalOrders: number;
      lastOrder: string;
    }[];
  };
}

export interface ReportProductsResponse {
  success: boolean;
  data: {
    productKpis: {
      growingProducts: { value: number; label: string };
      totalRevenue: { value: number; label: string; revenueValue: number };
    };
    topProducts: {
      name: string;
      rank: number;
      soldQuantity: number;
      revenue: number;
      growth: number;
    }[];
    lowStockProducts: any[];
    inventorySummary: {
      lowStock: number;
      normal: number;
      overstock: number;
      alertMessage: string;
    };
  };
}


export interface BusinessMetrics {
  // Real-time metrics for Dashboard
  todayRevenue: number;
  todayOrders: number;
  pendingOrders: number;
  completedOrders: number;
  // ❌ REMOVED: onlineUsers (was random mock data)
  todayRevenueGrowth: number;
  todayOrdersGrowth: number;

  // Dealer metrics (NOT customer - we track dealers)
  monthDealers: number;
  monthDealersGrowth: number;
  // ❌ REMOVED: todayCustomers, weekCustomers, yearCustomers (not tracked)
  // ❌ REMOVED: customer growth metrics (not tracked)

  // Period metrics for Reports
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  revenueGrowth: number;
  ordersGrowth: number;
  // ❌ REMOVED: totalCustomers, customersGrowth (use monthDealers instead)
  // ❌ REMOVED: conversionRate (hardcoded 3.2, not tracked)

  // New weekly/monthly/yearly metrics
  weekRevenue: number;
  weekOrders: number;
  weekRevenueGrowth: number;
  weekOrdersGrowth: number;
  monthRevenue: number;
  monthOrders: number;
  monthRevenueGrowth: number;
  monthOrdersGrowth: number;
  yearRevenue: number;
  yearOrders: number;
  yearRevenueGrowth: number;
  yearOrdersGrowth: number;

  // Previous period data for comparison
  previousDayRevenue: number;
  previousWeekRevenue: number;
  previousMonthRevenue: number;
  previousYearRevenue: number;

  // Previous period orders for comparison
  previousDayOrders: number;
  previousWeekOrders: number;
  previousMonthOrders: number;
  previousYearOrders: number;

  // ❌ REMOVED: Previous period customers (not tracked daily)

  // Product metrics
  totalProducts: number;
  activeProducts: number;
  lowStockProducts: number;
  overStockProducts: number;
}



export interface AgentData {
  name: string;
  totalSpent: number;
  totalOrders: number;
  lastOrder: string;
  rank: number;
}

export interface InventoryProduct {
  id: string;
  name: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  soldThisMonth: number;
  price: number;
  category: string;
  status: 'low_stock' | 'normal' | 'overstock';
  lastRestocked: string;
}

export interface TopProduct {
  name: string;
  soldQuantity: number;
  revenue: number;
  growth: number;
  rank: number;
  stockStatus: 'low' | 'normal' | 'high';
}




export function useBusinessMetrics(dateRange?: { from: Date; to: Date }) {
  const [dashboardData, setDashboardData] = useState<DashboardAPIResponse | null>(null);
  const [reportOverviewData, setReportOverviewData] = useState<ReportOverviewResponse | null>(null);
  const [reportRevenueData, setReportRevenueData] = useState<ReportRevenueResponse | null>(null);
  const [reportDealersData, setReportDealersData] = useState<ReportDealersResponse | null>(null);
  const [reportProductsData, setReportProductsData] = useState<ReportProductsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);

        // Build query params for date range
        // Clamp range: tránh gửi ngày tương lai gây 400 từ backend
        const today = new Date();
        const safeTo = dateRange?.to ? new Date(Math.min(dateRange.to.getTime(), today.getTime())) : undefined;
        const safeFrom = dateRange?.from && safeTo && dateRange.from > safeTo ? safeTo : dateRange?.from;

        const fromDate = safeFrom ? format(safeFrom, 'yyyy-MM-dd') : '';
        const toDate = safeTo ? format(safeTo, 'yyyy-MM-dd') : '';

        const overviewParams = dateRange ? `?from=${fromDate}&to=${toDate}` : '';
        const revenueParams = dateRange ? `?from=${fromDate}&to=${toDate}` : '';
        const dealersParams = dateRange
          ? `?from=${fromDate}&to=${toDate}&limit=10`
          : '?limit=10';
        const productsParams = dateRange
          ? `?from=${fromDate}&to=${toDate}&include=inventory`
          : '?include=inventory';

        // Fetch all data in parallel - use allSettled to handle partial failures
        const results = await Promise.allSettled([
          apiRequest<DashboardAPIResponse>('/api/report/dashboard/admin'),
          apiRequest<ReportOverviewResponse>(`/api/reports/overview${overviewParams}`),
          apiRequest<ReportRevenueResponse>(`/api/reports/revenue${revenueParams}`),
          apiRequest<ReportDealersResponse>(`/api/reports/dealers${dealersParams}`),
          apiRequest<ReportProductsResponse>(`/api/reports/products${productsParams}`)
        ]);

        // Extract successful results
        const [dashboardResult, overviewResult, revenueResult, dealersResult, productsResult] = results;

        // Set data for successful requests, keep previous data for failed ones
        if (dashboardResult.status === 'fulfilled') {
          setDashboardData(dashboardResult.value);
        } else {
          logger.error('Dashboard API failed:', dashboardResult.reason);
        }

        if (overviewResult.status === 'fulfilled') {
          setReportOverviewData(overviewResult.value);
        } else {
          logger.error('Overview API failed:', overviewResult.reason);
        }

        if (revenueResult.status === 'fulfilled') {
          setReportRevenueData(revenueResult.value);
        } else {
          logger.error('Revenue API failed:', revenueResult.reason);
        }

        if (dealersResult.status === 'fulfilled') {
          setReportDealersData(dealersResult.value);
        } else {
          logger.error('Dealers API failed:', dealersResult.reason);
        }

        if (productsResult.status === 'fulfilled') {
          setReportProductsData(productsResult.value);
        } else {
          logger.error('Products API failed:', productsResult.reason);
        }

        // Clear error if at least one API succeeded
        const anySuccess = results.some(r => r.status === 'fulfilled');
        if (anySuccess) {
          setError(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        logger.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [dateRange]);

  const topAgents = useMemo(() => {
    // Use report dealers data if available, otherwise fallback to dashboard
    if (reportDealersData?.data.detailedDealers) {
      return reportDealersData.data.detailedDealers;
    }
    if (dashboardData?.data.topLists.dealers) {
      return dashboardData.data.topLists.dealers.map(dealer => ({
        ...dealer,
        totalOrders: dashboardData.data.topPerformers.topDealer.name === dealer.name
          ? dashboardData.data.topPerformers.topDealer.totalOrders
          : Math.floor(dealer.totalSpent / 1000000),
        lastOrder: new Date().toISOString().split('T')[0]
      }));
    }
    return [];
  }, [dashboardData, reportDealersData]);
  const inventoryProducts = useMemo(() => {
    // Use report products data if available
    if (reportProductsData?.data.lowStockProducts && reportProductsData.data.lowStockProducts.length > 0) {
      return reportProductsData.data.lowStockProducts.map((product: any) => ({
        id: product.id || `P${Math.random()}`,
        name: product.name,
        currentStock: product.currentStock || 5,
        minStock: product.minStock || 20,
        maxStock: product.maxStock || 200,
        soldThisMonth: product.soldThisMonth || 0,
        price: product.price || 0,
        category: product.category || "General",
        status: "low_stock" as const,
        lastRestocked: product.lastRestocked || new Date().toISOString().split('T')[0]
      }));
    }
    // Fallback to dashboard data
    if (dashboardData?.data.inventoryAlerts) {
      const urgentProduct = dashboardData.data.inventoryAlerts.urgentProduct;
      return [
        {
          id: "P001",
          name: urgentProduct,
          currentStock: 5,
          minStock: 20,
          maxStock: 200,
          soldThisMonth: 156,
          price: 3500000,
          category: "Pro Series",
          status: "low_stock" as const,
          lastRestocked: new Date().toISOString().split('T')[0]
        }
      ];
    }
    return [];
  }, [dashboardData, reportProductsData]);
  const topSellingProducts = useMemo(() => {
    // Prioritize: revenueData.productRevenue > productsData.topProducts > dashboard

    // First try revenue API productRevenue
    if (reportRevenueData?.data.productRevenue && reportRevenueData.data.productRevenue.length > 0) {
      return reportRevenueData.data.productRevenue.map((product, index) => ({
        name: product.productName, // Map productName to name
        rank: index + 1,
        soldQuantity: product.soldQuantity,
        revenue: product.revenue,
        growth: product.growth,
        stockStatus: 'normal' as const
      }));
    }

    // Then try products API topProducts
    if (reportProductsData?.data.topProducts) {
      return reportProductsData.data.topProducts.map(product => ({
        ...product,
        stockStatus: 'normal' as const
      }));
    }

    // Fallback to dashboard data
    if (dashboardData?.data.topLists.products) {
      return dashboardData.data.topLists.products.map(product => ({
        ...product,
        stockStatus: (product.name === dashboardData.data.inventoryAlerts.urgentProduct)
          ? 'low' as const
          : 'normal' as const
      }));
    }
    return [];
  }, [dashboardData, reportProductsData, reportRevenueData]);

  const metrics = useMemo((): BusinessMetrics => {
    if (!dashboardData?.data && !reportOverviewData?.data) {
      // Return empty metrics if no API data
      return {
        todayRevenue: 0,
        todayOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        todayRevenueGrowth: 0,
        todayOrdersGrowth: 0,
        monthDealers: 0,
        monthDealersGrowth: 0,
        totalRevenue: 0,
        totalOrders: 0,
        revenueGrowth: 0,
        ordersGrowth: 0,
        weekRevenue: 0,
        weekOrders: 0,
        weekRevenueGrowth: 0,
        weekOrdersGrowth: 0,
        monthRevenue: 0,
        monthOrders: 0,
        monthRevenueGrowth: 0,
        monthOrdersGrowth: 0,
        yearRevenue: 0,
        yearOrders: 0,
        yearRevenueGrowth: 0,
        yearOrdersGrowth: 0,
        previousDayRevenue: 0,
        previousWeekRevenue: 0,
        previousMonthRevenue: 0,
        previousYearRevenue: 0,
        previousDayOrders: 0,
        previousWeekOrders: 0,
        previousMonthOrders: 0,
        previousYearOrders: 0,
        totalProducts: 0,
        activeProducts: 0,
        lowStockProducts: 0,
        overStockProducts: 0,
      };
    }

    // Merge data from multiple sources
    const apiData = dashboardData?.data;
    const overviewData = reportOverviewData?.data;
    const revenueData = reportRevenueData?.data;
    const dealersData = reportDealersData?.data;
    const productsData = reportProductsData?.data;

    // Extract values from APIs (prioritize report APIs over dashboard)
    // Extract real values from APIs
    const todayRevenue = revenueData?.revenueKpis.todayRevenue.value || apiData?.kpiMetrics.todayRevenue.value || 0;
    const todayRevenueGrowth = revenueData?.revenueKpis.todayRevenue.growth || apiData?.kpiMetrics.todayRevenue.growth || 0;
    const completedOrders = overviewData?.kpiCards.completedOrders.value || apiData?.kpiMetrics.completedOrders.value || 0;
    const todayOrders = overviewData?.kpiCards.completedOrders.total || apiData?.kpiMetrics.completedOrders.total || 0;
    const monthDealers = dealersData?.dealerKpis.totalDealers.value || overviewData?.kpiCards.activeDealers.value || apiData?.kpiMetrics.monthDealers.value || 0;
    const monthDealersGrowth = dealersData?.dealerKpis.totalDealers.growth || overviewData?.kpiCards.activeDealers.growth || apiData?.kpiMetrics.monthDealers.growth || 0;
    const lowStockProducts = productsData?.inventorySummary.lowStock || overviewData?.kpiCards.lowStockProducts.value || apiData?.kpiMetrics.lowStockProducts.value || 0;
    const totalProducts = overviewData?.kpiCards.lowStockProducts.total || apiData?.kpiMetrics.lowStockProducts.total || 0;

    // Extract chart data from API (prioritize report data)
    const revenueComparison = revenueData?.charts.comparison || overviewData?.charts.revenueComparison || apiData?.chartsData.revenueComparison || [];
    const revenueGrowth = revenueData?.charts.growth || overviewData?.charts.revenueGrowth || apiData?.chartsData.revenueGrowth || [];

    // Extract periods from chart data - USE ONLY REAL DATA
    const todayRevenueFromChart = revenueComparison.find(r => r.period === "Hôm nay")?.current || todayRevenue;
    const yesterdayRevenue = revenueComparison.find(r => r.period === "Hôm qua")?.current || 0;
    const weekRevenue = revenueComparison.find(r => r.period === "Tuần này")?.current || 0;
    const previousWeekRevenue = revenueComparison.find(r => r.period === "Tuần trước")?.current || 0;
    const monthRevenue = revenueComparison.find(r => r.period === "Tháng này")?.current || 0;
    const previousMonthRevenue = revenueComparison.find(r => r.period === "Tháng trước")?.current || 0;

    // Extract growth rates from API
    const weekRevenueGrowth = revenueGrowth.find(g => g.period === "Tuần")?.growth || 0;
    const monthRevenueGrowth = revenueData?.revenueKpis.monthRevenue.growth || revenueGrowth.find(g => g.period === "Tháng")?.growth || 0;
    const yearRevenueGrowth = revenueGrowth.find(g => g.period === "Năm")?.growth || 0;

    // Calculate simple derivatives from real data
    const pendingOrders = todayOrders - completedOrders;

    // ❌ REMOVED: All estimated customer calculations
    // ❌ REMOVED: yesterdayOrders = todayOrders * 0.92 (use API or 0)
    // ❌ REMOVED: weekOrders = todayOrders * 7 (use API or 0)
    // ❌ REMOVED: yearRevenue/yearOrders estimates (use API or 0)

    const todayOrdersGrowth = yesterdayRevenue > 0 && todayRevenue > 0 ?
      ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0;

    // Use 0 for metrics without real data (will be provided by P1 APIs)
    // Estimate orders from revenue when API is missing
    const monthOrders =
      revenueData?.revenueKpis.monthRevenue.totalOrders ||
      overviewData?.kpiCards.completedOrders.total ||
      apiData?.kpiMetrics.completedOrders.total ||
      todayOrders * 30;

    const avgOrderValue = monthOrders > 0 ? monthRevenue / monthOrders : 0;

    const weekOrders =
      weekRevenue > 0 && avgOrderValue > 0
        ? Math.round(weekRevenue / avgOrderValue)
        : 0;

    const yesterdayOrders =
      avgOrderValue > 0 && yesterdayRevenue > 0
        ? Math.round(yesterdayRevenue / avgOrderValue)
        : 0;

    const yearRevenue = monthRevenue * 12;
    const yearOrders = Math.round(monthOrders * 12);

    const previousWeekOrders =
      avgOrderValue > 0 && previousWeekRevenue > 0
        ? Math.round(previousWeekRevenue / avgOrderValue)
        : 0;
    const previousMonthOrders =
      avgOrderValue > 0 && previousMonthRevenue > 0
        ? Math.round(previousMonthRevenue / avgOrderValue)
        : 0;
    const previousYearRevenue = monthRevenue > 0 ? previousMonthRevenue * 12 : 0;
    const previousYearOrders =
      avgOrderValue > 0 && previousYearRevenue > 0
        ? Math.round(previousYearRevenue / avgOrderValue)
        : 0;

    return {
      // Real-time metrics from API
      todayRevenue: todayRevenueFromChart,
      todayOrders,
      pendingOrders,
      completedOrders,
      // ❌ REMOVED: onlineUsers random
      todayRevenueGrowth,
      todayOrdersGrowth: Math.round(todayOrdersGrowth * 10) / 10,

      // Dealer metrics from API
      monthDealers,
      monthDealersGrowth,
      // ❌ REMOVED: All customer daily metrics

      // Period metrics from API
      totalRevenue: monthRevenue,
      totalOrders: monthOrders,
      revenueGrowth: monthRevenueGrowth,
      ordersGrowth: todayOrdersGrowth,
      // ❌ REMOVED: totalCustomers, customersGrowth (use monthDealers)
      // ❌ REMOVED: conversionRate hardcoded 3.2

      // Weekly metrics from API
      weekRevenue,
      weekOrders,
      weekRevenueGrowth,
      weekOrdersGrowth:
        weekOrders > 0 && previousWeekOrders > 0
          ? Math.round(((weekOrders - previousWeekOrders) / previousWeekOrders) * 100 * 10) / 10
          : 0,

      // Monthly metrics from API
      monthRevenue,
      monthOrders,
      monthRevenueGrowth,
      monthOrdersGrowth: monthRevenue > 0 && previousMonthRevenue > 0 ?
        Math.round((monthRevenue / previousMonthRevenue - 1) * 100 * 10) / 10 : 0,

      // Yearly metrics from API
      yearRevenue,
      yearOrders,
      yearRevenueGrowth,
      yearOrdersGrowth:
        yearOrders > 0 && previousYearOrders > 0
          ? Math.round(((yearOrders - previousYearOrders) / previousYearOrders) * 100 * 10) / 10
          : 0,

      // Previous period data from API charts
      previousDayRevenue: yesterdayRevenue,
      previousWeekRevenue,
      previousMonthRevenue,
      previousYearRevenue,

      previousDayOrders: yesterdayOrders,
      previousWeekOrders,
      previousMonthOrders,
      previousYearOrders,

      // ❌ REMOVED: All previous customer metrics

      // Product metrics from API
      totalProducts,
      activeProducts: totalProducts - lowStockProducts,
      lowStockProducts,
      overStockProducts: productsData?.inventorySummary.overstock || apiData?.inventoryAlerts.overstockCount || 0,
    };
  }, [dashboardData, reportOverviewData, reportRevenueData, reportDealersData, reportProductsData]);

  const yearlyData = useMemo(() => {
    if (dashboardData?.data.chartsData.revenueComparison) {
      return dashboardData.data.chartsData.revenueComparison.map(item => ({
        month: item.label,
        revenue: item.current,
        orders: Math.floor(item.current / 100000), // Estimate orders from revenue
        customers: Math.floor(item.current / 50000) // Estimate customers from revenue
      }));
    }
    return [];
  }, [dashboardData]);

  const recentOrders = useMemo(() => {
    // Recent orders not available in current API, return empty array
    return [];
  }, []);

  const categoryData = useMemo(() => {
    // Category data not available in current API, return empty array
    return [];
  }, []);

  const comparisonData = useMemo(() => {
    // Prioritize report revenue data
    if (reportRevenueData?.data.charts.comparison) {
      return reportRevenueData.data.charts.comparison;
    }
    if (reportOverviewData?.data.charts.revenueComparison) {
      return reportOverviewData.data.charts.revenueComparison;
    }
    if (dashboardData?.data.chartsData.revenueComparison) {
      return dashboardData.data.chartsData.revenueComparison;
    }
    return [
      {
        period: "Hôm qua",
        current: metrics.previousDayRevenue,
        label: "Hôm qua"
      },
      {
        period: "Hôm nay",
        current: metrics.todayRevenue,
        label: "Hôm nay"
      },
      {
        period: "Tuần trước",
        current: metrics.previousWeekRevenue,
        label: "Tuần trước"
      },
      {
        period: "Tuần này",
        current: metrics.weekRevenue,
        label: "Tuần này"
      },
      {
        period: "Tháng trước",
        current: metrics.previousMonthRevenue,
        label: "Tháng trước"
      },
      {
        period: "Tháng này",
        current: metrics.monthRevenue,
        label: "Tháng này"
      }
    ];
  }, [dashboardData, reportOverviewData, reportRevenueData, metrics]);

  const growthData = useMemo(() => {
    // Prioritize report revenue data
    if (reportRevenueData?.data.charts.growth) {
      return reportRevenueData.data.charts.growth;
    }
    if (reportOverviewData?.data.charts.revenueGrowth) {
      return reportOverviewData.data.charts.revenueGrowth;
    }
    if (dashboardData?.data.chartsData.revenueGrowth) {
      return dashboardData.data.chartsData.revenueGrowth;
    }
    return [
      {
        period: "Ngày",
        growth: metrics.todayRevenueGrowth,
        label: "Hôm nay vs Hôm qua"
      },
      {
        period: "Tuần",
        growth: metrics.weekRevenueGrowth,
        label: "Tuần này vs Tuần trước"
      },
      {
        period: "Tháng",
        growth: metrics.monthRevenueGrowth,
        label: "Tháng này vs Tháng trước"
      },
      {
        period: "Năm",
        growth: metrics.yearRevenueGrowth,
        label: "Năm nay vs Năm trước"
      }
    ];
  }, [dashboardData, reportOverviewData, reportRevenueData, metrics]);

  // ❌ REMOVED: orderComparisonData - many values are 0 now, will be populated by P1 APIs

  // ❌ REMOVED: orderGrowthData - will use revenue growth instead

  // ❌ REMOVED: customerComparisonData & customerGrowthData - not tracking daily customers

  // Dealer segments from API
  const dealerSegments = useMemo(() => {
    if (reportDealersData?.data.segmentation) {
      return reportDealersData.data.segmentation;
    }
    if (reportOverviewData?.data.dealerSegments) {
      return reportOverviewData.data.dealerSegments;
    }
    // Fallback calculation
    const vipDealers = topAgents.filter(d => d.totalSpent > 20000000);
    const regularDealers = topAgents.filter(d => d.totalSpent <= 20000000);
    return [
      { name: "Đại lý VIP", count: vipDealers.length, percentage: (vipDealers.length / (topAgents.length || 1)) * 100, color: "#ffd700" },
      { name: "Đại lý thường", count: regularDealers.length, percentage: (regularDealers.length / (topAgents.length || 1)) * 100, color: "#3b82f6" }
    ];
  }, [reportDealersData, reportOverviewData, topAgents]);

  return {
    metrics,
    yearlyData,
    topAgents,
    recentOrders,
    categoryData,
    comparisonData,
    growthData,
    // ❌ REMOVED: orderComparisonData, orderGrowthData, customerComparisonData, customerGrowthData
    inventoryProducts,
    topSellingProducts,
    dealerSegments,
    loading,
    error,
    dashboardData,
    reportOverviewData,
    reportRevenueData,
    reportDealersData,
    reportProductsData,
  };
}
