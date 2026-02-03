// API Endpoint: GET /api/dashboard/metrics
// Response structure cho Dashboard

interface DashboardResponse {
  // 📊 KPI Metrics - Cho 4 StatsCard chính
  kpiMetrics: {
    todayRevenue: {
      value: number;           // VD: 5420000
      growth: number;          // VD: 12.5 (%)
      comparison: string;      // "so với hôm qua"
    };
    completedOrders: {
      value: number;           // VD: 28
      total: number;           // VD: 35 (tổng đơn hôm nay)
      label: string;           // "tổng đơn hôm nay"
    };
    monthAgents: {
      value: number;           // VD: 523
      growth: number;          // VD: 8.7 (%)
      comparison: string;      // "so với tháng trước"
    };
    lowStockProducts: {
      value: number;           // VD: 3
      total: number;           // VD: 12 (tổng sản phẩm)
      label: string;           // "tổng sản phẩm"
    };
  };

  // ⚠️ Inventory Alerts - Cho phần cảnh báo tồn kho
  inventoryAlerts: {
    lowStockCount: number;     // VD: 3
    overstockCount: number;    // VD: 2
    urgentProduct?: string;    // VD: "Tai nghe SCS Pro Max"
  };

  // 🏆 Top Performers - Cho section Top performers hôm nay
  topPerformers: {
    topAgent: {
      name: string;            // VD: "Nguyễn Văn An"
      totalSpent: number;      // VD: 45800000
      totalOrders: number;     // VD: 28
    };
    topProduct: {
      name: string;            // VD: "Tai nghe SCS Sport"
      soldQuantity: number;    // VD: 203
      growth: number;          // VD: 25.3
    };
    todayRevenueHighlight: {
      value: number;           // VD: 5420000
      growth: number;          // VD: 12.5
    };
  };

  // 📈 Charts Data - Cho 2 biểu đồ xu hướng
  chartsData: {
    revenueComparison: Array<{
      period: string;          // VD: "Hôm qua", "Hôm nay", "Tuần trước", "Tuần này"
      current: number;         // VD: 5420000
      label: string;           // VD: "Hôm nay"
    }>;
    revenueGrowth: Array<{
      period: string;          // VD: "Ngày", "Tuần", "Tháng", "Năm"
      growth: number;          // VD: 12.5
      label: string;           // VD: "Hôm nay vs Hôm qua"
    }>;
  };

  // 👥 Top Lists - Cho 2 section cuối cùng
  topLists: {
    agents: Array<{
      rank: number;            // VD: 1, 2, 3
      name: string;            // VD: "Nguyễn Văn An"
      totalSpent: number;      // VD: 45800000
    }>;
    products: Array<{
      rank: number;            // VD: 1, 2, 3, 4, 5
      name: string;            // VD: "Tai nghe SCS Sport"
      soldQuantity: number;    // VD: 203
      revenue: number;         // VD: 365400000
      growth: number;          // VD: 25.3
    }>;
  };

  // 🕐 Metadata
  metadata: {
    lastUpdated: string;       // ISO timestamp
    cacheExpiry: number;       // Seconds
    dataSource: "real_time" | "cached";
  };
}

// Example Response:
const exampleResponse: DashboardResponse = {
  kpiMetrics: {
    todayRevenue: {
      value: 5420000,
      growth: 12.5,
      comparison: "so với hôm qua"
    },
    completedOrders: {
      value: 28,
      total: 35,
      label: "tổng đơn hôm nay"
    },
    monthAgents: {
      value: 523,
      growth: 8.7,
      comparison: "so với tháng trước"
    },
    lowStockProducts: {
      value: 3,
      total: 12,
      label: "tổng sản phẩm"
    }
  },

  inventoryAlerts: {
    lowStockCount: 3,
    overstockCount: 2,
    urgentProduct: "Tai nghe SCS Pro Max"
  },

  topPerformers: {
    topAgent: {
      name: "Nguyễn Văn An",
      totalSpent: 45800000,
      totalOrders: 28
    },
    topProduct: {
      name: "Tai nghe SCS Sport",
      soldQuantity: 203,
      growth: 25.3
    },
    todayRevenueHighlight: {
      value: 5420000,
      growth: 12.5
    }
  },

  chartsData: {
    revenueComparison: [
      { period: "Hôm qua", current: 4830000, label: "Hôm qua" },
      { period: "Hôm nay", current: 5420000, label: "Hôm nay" },
      { period: "Tuần trước", current: 32400000, label: "Tuần trước" },
      { period: "Tuần này", current: 36800000, label: "Tuần này" }
    ],
    revenueGrowth: [
      { period: "Ngày", growth: 12.5, label: "Hôm nay vs Hôm qua" },
      { period: "Tuần", growth: 13.6, label: "Tuần này vs Tuần trước" },
      { period: "Tháng", growth: 15.2, label: "Tháng này vs Tháng trước" },
      { period: "Năm", growth: 18.7, label: "Năm nay vs Năm trước" }
    ]
  },

  topLists: {
    agents: [
      { rank: 1, name: "Nguyễn Văn An", totalSpent: 45800000 },
      { rank: 2, name: "Trần Thị Bích", totalSpent: 38200000 },
      { rank: 3, name: "Lê Hoàng Minh", totalSpent: 32500000 }
    ],
    products: [
      { rank: 1, name: "Tai nghe SCS Sport", soldQuantity: 203, revenue: 365400000, growth: 25.3 },
      { rank: 2, name: "Tai nghe SCS Pro Max", soldQuantity: 156, revenue: 546000000, growth: 18.7 },
      { rank: 3, name: "Tai nghe SCS Wireless", soldQuantity: 134, revenue: 375200000, growth: 12.4 },
      { rank: 4, name: "Tai nghe SCS Premium", soldQuantity: 98, revenue: 539000000, growth: 31.2 },
      { rank: 5, name: "Tai nghe SCS Gaming", soldQuantity: 89, revenue: 195800000, growth: -5.1 }
    ]
  },

  metadata: {
    lastUpdated: "2024-12-27T10:30:00Z",
    cacheExpiry: 300, // 5 minutes
    dataSource: "real_time"
  }
};

// Hook implementation would be:
// const dashboardData = useDashboardMetrics();
// Then map to existing structure for backward compatibility