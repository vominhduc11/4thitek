import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ADMIN_THEME_EVENT } from "../hooks/useTheme";
import {
  AlertTriangle,
  CircleDollarSign,
  Landmark,
  Package,
  ShoppingCart,
  TrendingUp,
} from "lucide-react";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  EmptyState,
  ErrorState,
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
import { subscribeAdminRealtimeNotification } from "../lib/adminRealtime";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
);

const copyKeys = {
  title: "Tổng quan hệ thống",
  description: "Tổng quan vận hành hệ thống theo thời gian thực.",
  loadTitle: "Không tải được dashboard",
  emptyTitle: "Chưa có dữ liệu",
  emptyMessage: "Backend chưa trả về dữ liệu dashboard.",
  totalOrders: "Tổng đơn hàng",
  lowStock: "Tồn kho thấp",
  bestSeller: "Sản phẩm bán chạy",
  orderStatus: "Phân bổ trạng thái đơn hàng",
  topProducts: "Sản phẩm nổi bật",
  operations: "Hệ thống và vận hành",
  revenueProgress: "Tiến độ",
  pendingOrders: "đơn chờ xử lý",
  restock: "SKU cần bổ sung",
  unmatchedPayments: "Thanh toán không khớp",
  unmatchedPendingHint: "giao dịch chờ xử lý",
  financialSettlements: "Quyết toán tài chính",
  settlementPendingHint: "mục chờ xử lý",
  staleOrders: "Đơn hàng cần xem xét",
  staleOrdersHint: "đơn có thanh toán không xác nhận được",
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
      return
    }
    return subscribeAdminRealtimeNotification(() => {
      void loadDashboard(accessToken)
    })
  }, [accessToken, loadDashboard]);

  const orderStatusChart = useMemo<ChartData<"doughnut">>(
    () => ({
      labels: dashboard?.orderStatus.map((item) => item.label) ?? [],
      datasets: [
        {
          data: dashboard?.orderStatus.map((item) => item.value) ?? [],
          backgroundColor: themeTokens.palette,
          borderWidth: 0,
        },
      ],
    }),
    [dashboard, themeTokens.palette],
  );

  const orderStatusOptions = useMemo<ChartOptions<"doughnut">>(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: "68%",
      plugins: {
        legend: { display: false },
      },
    }),
    [],
  );

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
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
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
          <div className="grid gap-6 xl:grid-cols-2">
            <div
              className={`${softCardClass} h-72 animate-pulse bg-[var(--surface-muted)]`}
            />
            <div
              className={`${softCardClass} h-72 animate-pulse bg-[var(--surface-muted)]`}
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
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--ink)]">
            {copy.title}
          </h3>
          <p className="text-sm text-[var(--muted)]">{copy.description}</p>
        </div>
        <StatusBadge tone="info">{dashboard.revenue.delta}</StatusBadge>
      </div>

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
          to="/orders?status=pending"
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
          to="/serials"
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
          className="block rounded-3xl transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
        >
          <StatCard
            icon={Package}
            label={copy.bestSeller}
            value={dashboard.topProducts[0]?.name || "-"}
            hint={dashboard.topProducts[0]?.units || "0"}
            tone="neutral"
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
            {copy.orderStatus}
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,10.5rem)_minmax(0,1fr)] xl:grid-cols-1">
            <div
              aria-label={t("Biểu đồ trạng thái đơn hàng")}
              className="mx-auto aspect-square w-full max-w-[10.5rem] sm:max-w-[11.5rem] xl:max-w-[13rem]"
              role="img"
            >
              <Doughnut data={orderStatusChart} options={orderStatusOptions} />
            </div>
            <div className="space-y-3">
              {dashboard.orderStatus.map((item, index) => (
                <div
                  key={`${item.label}-${index}`}
                  className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                      style={{
                        backgroundColor:
                          themeTokens.palette[
                            index % themeTokens.palette.length
                          ],
                      }}
                    >
                      {item.label.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="font-medium text-[var(--ink)]">
                      {item.label}
                    </span>
                  </div>
                  <span className="font-semibold text-[var(--ink)]">
                    {formatNumber(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className={softCardClass}>
          <p className="text-sm font-semibold text-[var(--ink)]">
            {copy.topProducts}
          </p>
          <div className="mt-4 space-y-3">
            {dashboard.topProducts.length === 0 ? (
              <EmptyState title={copy.emptyTitle} message={copy.emptyMessage} />
            ) : (
              dashboard.topProducts.map((item) => (
                <div
                  key={`${item.name}-${item.units}`}
                  className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-sm"
                >
                  <span className="truncate font-medium text-[var(--ink)]">
                    {item.name}
                  </span>
                  <span className="font-semibold text-[var(--accent)]">
                    {item.units}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={softCardClass}>
          <p className="text-sm font-semibold text-[var(--ink)]">
            {copy.operations}
          </p>
          <div className="mt-4 space-y-3">
            {dashboard.system.map((item) => (
              <div
                key={`${item.group}-${item.label}`}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--ink)]">
                      {item.label}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      {item.hint || "-"}
                    </p>
                  </div>
                  <StatusBadge
                    tone={
                      item.tone === "warn"
                        ? "warning"
                        : item.tone === "good"
                          ? "success"
                          : "neutral"
                    }
                  >
                    {item.value}
                  </StatusBadge>
                </div>
              </div>
            ))}
            {(dashboard.unmatchedPendingCount ?? 0) > 0 && (
              <Link
                to="/unmatched-payments"
                className="block rounded-2xl transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                <div className="rounded-2xl border border-[rgba(189,249,25,0.34)] bg-[rgba(189,249,25,0.16)] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <CircleDollarSign className="h-4 w-4 shrink-0 text-[var(--tone-warning-text)]" />
                      <div>
                        <p className="text-sm font-semibold text-[var(--tone-warning-text)]">
                          {copy.unmatchedPayments}
                        </p>
                        <p className="text-xs text-[var(--tone-warning-text)]">
                          {dashboard.unmatchedPendingCount}{" "}
                          {copy.unmatchedPendingHint}
                        </p>
                      </div>
                    </div>
                    <StatusBadge tone="warning">
                      {String(dashboard.unmatchedPendingCount)}
                    </StatusBadge>
                  </div>
                </div>
              </Link>
            )}
            {(dashboard.settlementPendingCount ?? 0) > 0 && (
              <Link
                to="/financial-settlements"
                className="block rounded-2xl transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                <div className="rounded-2xl border border-[var(--brand-border-strong)] bg-[var(--accent-soft)] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Landmark className="h-4 w-4 shrink-0 text-[var(--accent-strong)]" />
                      <div>
                        <p className="text-sm font-semibold text-[var(--accent-strong)]">
                          {copy.financialSettlements}
                        </p>
                        <p className="text-xs text-[var(--accent-strong)]">
                          {dashboard.settlementPendingCount}{" "}
                          {copy.settlementPendingHint}
                        </p>
                      </div>
                    </div>
                    <StatusBadge tone="info">
                      {String(dashboard.settlementPendingCount)}
                    </StatusBadge>
                  </div>
                </div>
              </Link>
            )}
            {(dashboard.staleOrdersCount ?? 0) > 0 && (
              <Link
                to="/orders"
                className="block rounded-2xl transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                <div className="rounded-2xl border border-[var(--destructive-border)] bg-[var(--destructive-soft)] px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-[var(--destructive-text)]" />
                      <div>
                        <p className="text-sm font-semibold text-[var(--destructive-text)]">
                          {copy.staleOrders}
                        </p>
                        <p className="text-xs text-[var(--destructive-text)]">
                          {dashboard.staleOrdersCount} {copy.staleOrdersHint}
                        </p>
                      </div>
                    </div>
                    <StatusBadge tone="danger">
                      {String(dashboard.staleOrdersCount)}
                    </StatusBadge>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>
    </PagePanel>
  );
}

export default DashboardPageRevamp;
