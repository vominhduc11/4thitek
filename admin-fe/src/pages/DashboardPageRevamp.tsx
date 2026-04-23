import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ADMIN_THEME_EVENT } from "../hooks/useTheme";
import {
  AlertTriangle,
  Package,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  PagePanel,
  StatCard,
  StatusBadge,
  softCardClass,
} from "../components/ui-kit";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { translateCopy } from "../lib/i18n";
import { useToast } from "../context/ToastContext";
import {
  fetchAdminDashboard,
  type BackendDashboardResponse,
} from "../lib/adminApi";
import { formatCurrency, formatNumber } from "../lib/formatters";
import { subscribeAdminDashboardRefresh } from "../lib/adminRealtime";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
);

const copyKeys = {
  topProductsEmptyTitle: "Chưa có dữ liệu bán hàng",
  topProductsEmptyMessage:
    "Chưa có đơn hàng hoàn tất để xếp hạng sản phẩm.",
  trendUnit: "Đơn vị: VNĐ",
  title: "Tổng quan hệ thống",
  description: "Tổng quan vận hành hệ thống theo thời gian thực.",
  loadTitle: "Không tải được dashboard",
  emptyTitle: "Chưa có dữ liệu",
  emptyMessage: "Dữ liệu tổng quan chưa sẵn sàng. Vui lòng tải lại trang.",
  totalOrders: "Tổng đơn hàng",
  lowStock: "Tồn kho thấp",
  bestSeller: "Sản phẩm bán chạy nhất",
  orderStatus: "Phân bổ trạng thái đơn hàng",
  topProducts: "Sản phẩm nổi bật",
  operations: "Cảnh báo vận hành",
  revenueProgress: "Hoàn thành",
  pendingOrders: "đơn chờ xử lý",
  restock: "mặt hàng cần nhập thêm",
  unmatchedPayments: "Thanh toán chưa khớp",
  unmatchedPendingHint: "giao dịch cần xử lý",
  financialSettlements: "Quyết toán tài chính",
  settlementPendingHint: "mục đang chờ quyết toán",
  staleOrders: "Đơn hàng chờ xử lý lâu",
  staleOrdersHint: "đơn chờ xử lý quá 24 giờ, cần kiểm tra",
  shippingOverdue: "Đơn chưa được giao",
  shippingOverdueHint: "đơn đã xác nhận nhưng chưa cập nhật vận chuyển",
} as const;

const getThemeTokens = () => {
  if (typeof window === "undefined") {
    return {
      ink: "#102131",
      muted: "#607181",
      border: "rgba(63,72,86,0.12)",
      accent: "#29abe2",
      accentSoft: "rgba(41,171,226,0.14)",
      palette: ["#29abe2", "#0071bc", "#2be086", "#05a7af", "#bdf919"],
    };
  }
  const styles = window.getComputedStyle(document.documentElement);
  const ink = styles.getPropertyValue("--ink").trim() || "#0f172a";
  const muted = styles.getPropertyValue("--muted").trim() || "#64748b";
  const border = styles.getPropertyValue("--border").trim() || "#e2e8f0";
  const accent = styles.getPropertyValue("--accent").trim() || "#29abe2";
  const accentSoft =
    styles.getPropertyValue("--accent-soft").trim() || "#dbeafe";
  return {
    ink,
    muted,
    border,
    accent,
    accentSoft,
    palette: [accent, "#0071bc", "#2be086", "#05a7af", "#bdf919"],
  };
};

function DashboardPageRevamp() {
  const { t } = useLanguage();
  const copy = translateCopy(copyKeys, t);
  const { accessToken } = useAuth();
  const { notify } = useToast();
  const [dashboard, setDashboard] = useState<BackendDashboardResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [themeTokens, setThemeTokens] = useState(getThemeTokens);
  const copyRef = useRef(copy);

  useEffect(() => {
    copyRef.current = copy;
  }, [copy]);

  const loadDashboard = useMemo(
    () => async (token: string) => {
      setLoading(true);
      setError(null);
      try {
        const payload = await fetchAdminDashboard(token);
        setDashboard(payload);
      } catch (loadError) {
        const message =
          loadError instanceof Error ? loadError.message : copyRef.current.loadTitle;
        setError(message);
        notify(message, { title: copyRef.current.title, variant: "error" });
      } finally {
        setLoading(false);
      }
    },
    [notify],
  );

  useEffect(() => {
    const updateThemeTokens = () => setThemeTokens(getThemeTokens());
    updateThemeTokens();

    window.addEventListener(ADMIN_THEME_EVENT, updateThemeTokens);
    window.addEventListener("storage", updateThemeTokens);

    return () => {
      window.removeEventListener(ADMIN_THEME_EVENT, updateThemeTokens);
      window.removeEventListener("storage", updateThemeTokens);
    };
  }, []);

  useEffect(() => {
    if (!accessToken) {
      setDashboard(null);
      setLoading(false);
      setError(copyRef.current.loadTitle);
      return;
    }

    void loadDashboard(accessToken);
  }, [accessToken, loadDashboard]);

  useEffect(() => {
    if (!accessToken) {
      return;
    }
    let debounceTimer: number | undefined;
    const unsubscribe = subscribeAdminDashboardRefresh(() => {
      window.clearTimeout(debounceTimer);
      debounceTimer = window.setTimeout(() => {
        void loadDashboard(accessToken);
      }, 1500);
    });
    return () => {
      window.clearTimeout(debounceTimer);
      unsubscribe();
    };
  }, [accessToken, loadDashboard]);

  const trendChart = useMemo<ChartData<"bar">>(
    () => ({
      labels: dashboard?.trend.points.map((item) => item.label) ?? [],
      datasets: [
        {
          label: dashboard?.trend.title || "Revenue",
          data: dashboard?.trend.points.map((item) => item.value) ?? [],
          backgroundColor: themeTokens.accent,
          borderRadius: 12,
          borderSkipped: false,
          maxBarThickness: 28,
        },
      ],
    }),
    [dashboard, themeTokens.accent],
  );

  const trendOptions = useMemo<ChartOptions<"bar">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
          labels: { color: themeTokens.ink },
        },
      },
      scales: {
        x: {
          ticks: { color: themeTokens.muted },
          grid: { display: false },
          border: { color: themeTokens.border },
        },
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: "VNĐ",
            color: themeTokens.muted,
          },
          ticks: {
            color: themeTokens.muted,
            callback: (value) => formatNumber(Number(value)),
          },
          grid: { color: themeTokens.border },
          border: { color: themeTokens.border },
        },
      },
    }),
    [themeTokens.border, themeTokens.ink, themeTokens.muted],
  );

  if (loading) {
    return (
      <PagePanel>
        <div
          aria-busy="true"
          aria-live="polite"
          className="space-y-6"
          role="status"
        >
          <span className="sr-only">Loading dashboard</span>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={`dashboard-stat-skeleton-${index}`}
                className={`${softCardClass} h-28 animate-pulse bg-[var(--surface-muted)]`}
              />
            ))}
          </div>
          <div className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
            <div
              className={`${softCardClass} h-80 animate-pulse bg-[var(--surface-muted)]`}
            />
            <div
              className={`${softCardClass} h-80 animate-pulse bg-[var(--surface-muted)]`}
            />
          </div>
        </div>
      </PagePanel>
    );
  }

  if (error) {
    return (
      <PagePanel>
        <ErrorState title={copy.loadTitle} message={error} />
      </PagePanel>
    );
  }

  if (!dashboard) {
    return (
      <PagePanel>
        <EmptyState title={copy.emptyTitle} message={copy.emptyMessage} />
      </PagePanel>
    );
  }

  return (
    <PagePanel>
      <PageHeader
        title={copy.title}
        subtitle={copy.description}
        actions={<StatusBadge tone="info">{dashboard.revenue.delta}</StatusBadge>}
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link
          to="/orders"
          className="block rounded-3xl transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <StatCard
            icon={TrendingUp}
            label={dashboard.revenue.label}
            value={formatCurrency(Number(dashboard.revenue.value ?? 0))}
            hint={`${copy.revenueProgress} ${dashboard.revenue.progress}%`}
            tone="success"
          />
        </Link>
        <Link
          to="/orders"
          className="block rounded-3xl transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <StatCard
            icon={ShoppingCart}
            label={copy.totalOrders}
            value={formatNumber(dashboard.orders.total)}
            hint={`${formatNumber(dashboard.orders.pending)} ${copy.pendingOrders}`}
            tone="info"
          />
        </Link>
        <Link
          to="/products?inventoryAlert=low"
          className="block rounded-3xl transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <StatCard
            icon={AlertTriangle}
            label={copy.lowStock}
            value={formatNumber(dashboard.lowStock.skus)}
            hint={`${formatNumber(dashboard.lowStock.restock)} ${copy.restock}`}
            tone="warning"
          />
        </Link>
        <Link
          to="/products"
          title={dashboard.topProducts[0]?.name}
          className="block rounded-3xl transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <StatCard
            icon={Package}
            label={copy.bestSeller}
            value={dashboard.topProducts[0]?.name || "-"}
            hint={dashboard.topProducts[0]?.units || "0"}
            tone="neutral"
            valueClassName="truncate text-[1.1rem] sm:text-[1.25rem]"
          />
        </Link>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        <div className={softCardClass}>
          <div>
            <p className="text-sm font-semibold text-[var(--ink)]">
              {dashboard.trend.title}
            </p>
            <p className="text-xs text-[var(--muted)]">
              {dashboard.trend.subtitle}
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">{copy.trendUnit}</p>
          </div>
          <div
            aria-label={t("Biểu đồ xu hướng doanh số")}
            className="mt-4 h-56 sm:h-64 lg:h-72"
            role="img"
          >
            <Bar data={trendChart} options={trendOptions} />
          </div>
        </div>

        <div className={softCardClass}>
          <p className="text-sm font-semibold text-[var(--ink)]">
            {copy.topProducts}
          </p>
          <div className="mt-4 space-y-2.5">
            {dashboard.topProducts.length === 0 ? (
              <EmptyState
                title={copy.topProductsEmptyTitle}
                message={copy.topProductsEmptyMessage}
                action={
                  <Link
                    to="/orders"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-xs font-semibold text-[var(--ink)] transition hover:opacity-80"
                  >
                    Xem đơn hàng
                  </Link>
                }
              />
            ) : (
              dashboard.topProducts.slice(0, 5).map((item, index) => (
                <div
                  key={`${item.name}-${item.units}`}
                  title={item.name}
                  className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[11px] font-bold text-[var(--accent-strong)]">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium text-[var(--ink)]">
                    {item.name}
                  </span>
                  <span className="shrink-0 font-semibold text-[var(--accent)]">
                    {item.units}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </PagePanel>
  );
}

export default DashboardPageRevamp;
