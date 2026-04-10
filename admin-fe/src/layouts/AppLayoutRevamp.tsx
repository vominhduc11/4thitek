import {
  BadgeAlert,
  Bell,
  BellDot,
  BookOpenText,
  Boxes,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  FileText,
  Landmark,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  Moon,
  Package,
  Percent,
  Search,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Sun,
  UserCircle,
  Users,
  Warehouse,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import logoMark from "../assets/images/logo-4t.png";
import LanguageSwitcher from "../components/LanguageSwitcher";
import {
  ghostButtonClass,
  iconButtonClass,
  inputClass,
  tableMetaClass,
} from "../components/ui-kit";
import { ADMIN_APP_NAME, BRAND_NAME } from "../config/businessProfile";
import { useAdminData } from "../context/AdminDataContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { translateCopy } from "../lib/i18n";
import { emitAdminRealtimeNotification } from "../lib/adminRealtime";
import { useProducts } from "../context/ProductsContext";
import { useToast } from "../context/ToastContext";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useLocalStorageSet } from "../hooks/useLocalStorageSet";
import { useOverlaySurface } from "../hooks/useOverlaySurface";
import { useTheme } from "../hooks/useTheme";
import { useAdminWebSocket } from "../hooks/useAdminWebSocket";

type NavGroupId = "overview" | "commerce" | "service" | "system";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  group: NavGroupId;
};

type SearchResult = {
  id: string;
  title: string;
  meta: string;
  to: string;
  icon: LucideIcon;
};

type SearchIndexItem = SearchResult & {
  searchText: string;
};

type AlertItem = {
  id: string;
  title: string;
  description: string;
  to: string;
  icon: LucideIcon;
};

const ALERT_READ_STORAGE_KEY = "admin_alert_read_ids";
const SEARCH_RESULT_LIMIT = 8;

const copyKeys = {
  product: "Sản phẩm",
  order: "Đơn hàng",
  dealer: "Đại lý",
  post: "Bài viết",
  user: "Người dùng",
  discount: "Chiết khấu",
  workspace: "Không gian quản trị",
  welcome: "Bảng điều hành quản trị",
  welcomeText:
    "Theo dõi vận hành, kho, dịch vụ sau bán và tài khoản nội bộ từ một nơi.",
  searchPlaceholder: "Tìm đơn hàng, SKU, đại lý, bài viết...",
  searchEmpty: "Không tìm thấy kết quả phù hợp",
  searchHint: "Kết quả tìm kiếm nhanh",
  searchResultsLabel: "Danh sách kết quả tìm kiếm",
  searchSelectionHint: "Dùng phím mũi tên để duyệt, Enter để mở.",
  searchViewAll: "Xem tất cả {count} kết quả",
  searchCollapse: "Thu gọn kết quả",
  alerts: "Cảnh báo",
  alertsEmpty: "Không có cảnh báo cần theo dõi.",
  markAllRead: "Đánh dấu đã đọc",
  account: "Tài khoản",
  logout: "Đăng xuất",
  language: "Ngôn ngữ",
  light: "Sáng",
  dark: "Tối",
  online: "Hệ thống đang trực tuyến",
  noRole: "Quản trị viên",
  openNavigation: "Mở menu điều hướng",
  closeNavigation: "Đóng menu điều hướng",
  groups: {
    overview: "Điều hành",
    commerce: "Bán hàng",
    service: "Hậu mãi",
    system: "Hệ thống",
  },
  nav: {
    dashboard: "Tổng quan",
    products: "Sản phẩm",
    orders: "Đơn hàng",
    blogs: "Bài viết",
    discounts: "Chiết khấu sỉ",
    dealers: "Đại lý",
    warranties: "Bảo hành",
    serials: "Serial",
    notifications: "Thông báo",
    support: "Hỗ trợ",
    recentPayments: "Đối soát chuyển khoản",
    unmatchedPayments: "Thanh toán không khớp",
    financialSettlements: "Quyết toán tài chính",
    reports: "Báo cáo",
    users: "Người dùng",
    auditLogs: "Nhật ký hệ thống",
    settings: "Cài đặt",
  },
  alertTemplates: {
    pendingOrders: "{count} đơn hàng đang chờ xử lý",
    lowStock: "{count} sản phẩm sắp chạm ngưỡng tồn kho thấp",
    scheduledPosts: "{count} bài viết đang ở trạng thái chờ lịch",
    dealerAttention: "{count} đại lý cần bổ sung hồ sơ",
    pendingUsers: "{count} tài khoản nội bộ đang chờ duyệt",
  },
  alertDescriptions: {
    pendingOrders: "Kiểm tra và xác nhận các đơn hàng mới trước khi trễ SLA.",
    lowStock:
      "Ưu tiên kiểm tra SKU tồn dưới hoặc bằng 10 để tránh gián đoạn đơn hàng.",
    scheduledPosts: "Rà soát nội dung trước thời điểm đăng tự động.",
    dealerAttention:
      "Hoàn tất xác minh để tránh ảnh hưởng kích hoạt dealer app.",
    pendingUsers: "Duyệt quyền truy cập cho tài khoản nội bộ mới.",
  },
  ws: {
    newOrder: "Đơn hàng mới từ {dealer}",
    newDealer: "Đại lý mới đăng ký: {username}",
    newTicket: "Ticket hỗ trợ mới từ {dealer}",
  },
} as const;

const interpolate = (template: string, vars: Record<string, string | number>) =>
  Object.entries(vars).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );


const NAV_GROUP_STORAGE_KEY = "admin_nav_groups";

const loadNavGroups = (): Record<NavGroupId, boolean> => {
  try {
    const raw = window.localStorage.getItem(NAV_GROUP_STORAGE_KEY);
    if (!raw)
      return { overview: true, commerce: true, service: false, system: false };
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed === "object" && parsed !== null) {
      return {
        overview: (parsed as Record<string, boolean>).overview ?? true,
        commerce: (parsed as Record<string, boolean>).commerce ?? true,
        service: (parsed as Record<string, boolean>).service ?? false,
        system: (parsed as Record<string, boolean>).system ?? false,
      };
    }
  } catch {
    /* ignore */
  }
  return { overview: true, commerce: true, service: false, system: false };
};

function AppLayoutRevamp() {
  const { language, t } = useLanguage();
  const copy = translateCopy(copyKeys, t);
  const { user, logout, hasRole, accessToken } = useAuth();
  const { notify } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    orders,
    dealers,
    posts,
    discountRules,
    users,
    ensureResourceLoaded,
    reloadResource,
  } = useAdminData();
  const { products } = useProducts();

  const { theme, toggleTheme } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [globalQuery, setGlobalQuery] = useState("");
  const [showAllSearchResults, setShowAllSearchResults] = useState(false);
  const [activeSearchIndex, setActiveSearchIndex] = useState(-1);
  const [openGroups, setOpenGroups] =
    useState<Record<NavGroupId, boolean>>(loadNavGroups);

  useAdminWebSocket(accessToken, {
    onNewOrder: (event) => {
      void reloadResource("orders");
      notify(interpolate(copy.ws.newOrder, { dealer: event.dealerName }), {
        title: copy.order,
        variant: "info",
      });
    },
    onNewDealer: (event) => {
      void reloadResource("dealers");
      notify(interpolate(copy.ws.newDealer, { username: event.username }), {
        title: copy.dealer,
        variant: "info",
      });
    },
    onNewSupportTicket: (event) => {
      notify(interpolate(copy.ws.newTicket, { dealer: event.dealerName }), {
        title: copy.nav.support,
        variant: "info",
      });
    },
    onNotificationCreated: (event) => {
      emitAdminRealtimeNotification(event);
    },
  });

  const toggleGroup = useCallback((group: NavGroupId) => {
    setOpenGroups((prev) => {
      const next = { ...prev, [group]: !prev[group] };
      try {
        window.localStorage.setItem(
          NAV_GROUP_STORAGE_KEY,
          JSON.stringify(next),
        );
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);
  const {
    values: readAlertIds,
    add: markAlertReadById,
    addAll: markAllAlertIds,
  } = useLocalStorageSet(ALERT_READ_STORAGE_KEY);

  const mobileNavTriggerRef = useRef<HTMLButtonElement | null>(null);
  const mobileSidebarRef = useRef<HTMLDivElement | null>(null);
  const alertsTriggerRef = useRef<HTMLButtonElement | null>(null);
  const alertsRef = useRef<HTMLDivElement | null>(null);
  const accountTriggerRef = useRef<HTMLButtonElement | null>(null);
  const accountRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLFormElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const debouncedGlobalQuery = useDebouncedValue(globalQuery, 180);
  const deferredGlobalQuery = useDeferredValue(debouncedGlobalQuery);
  const mobileNavigationId = "admin-mobile-navigation";
  const searchListboxId = "admin-global-search-results";
  const alertsPopoverId = "admin-alerts-popover";
  const accountPopoverId = "admin-account-popover";

  const navItems = useMemo<NavItem[]>(() => {
    const items: NavItem[] = [
      {
        to: "/",
        label: copy.nav.dashboard,
        icon: LayoutDashboard,
        group: "overview",
      },
      {
        to: "/reports",
        label: copy.nav.reports,
        icon: FileText,
        group: "overview",
      },
      {
        to: "/products",
        label: copy.nav.products,
        icon: Package,
        group: "commerce",
      },
      {
        to: "/orders",
        label: copy.nav.orders,
        icon: ShoppingCart,
        group: "commerce",
      },
      {
        to: "/dealers",
        label: copy.nav.dealers,
        icon: UserCircle,
        group: "commerce",
      },
      {
        to: "/discounts",
        label: copy.nav.discounts,
        icon: Percent,
        group: "commerce",
      },
      {
        to: "/blogs",
        label: copy.nav.blogs,
        icon: BookOpenText,
        group: "commerce",
      },
      {
        to: "/warranties",
        label: copy.nav.warranties,
        icon: ShieldCheck,
        group: "service",
      },
      {
        to: "/serials",
        label: copy.nav.serials,
        icon: Warehouse,
        group: "service",
      },
      {
        to: "/notifications",
        label: copy.nav.notifications,
        icon: Bell,
        group: "service",
      },
      {
        to: "/support-tickets",
        label: copy.nav.support,
        icon: LifeBuoy,
        group: "service",
      },
      {
        to: "/payments/recent",
        label: copy.nav.recentPayments,
        icon: BadgeAlert,
        group: "service",
      },
      {
        to: "/unmatched-payments",
        label: copy.nav.unmatchedPayments,
        icon: CircleDollarSign,
        group: "service",
      },
      {
        to: "/financial-settlements",
        label: copy.nav.financialSettlements,
        icon: Landmark,
        group: "service",
      },
    ];

    if (hasRole("SUPER_ADMIN")) {
      items.unshift({
        to: "/users",
        label: copy.nav.users,
        icon: Users,
        group: "system",
      });
      items.push({
        to: "/audit-logs",
        label: copy.nav.auditLogs,
        icon: ClipboardList,
        group: "system",
      });
      items.push({
        to: "/settings",
        label: copy.nav.settings,
        icon: Settings,
        group: "system",
      });
    }

    return items;
  }, [copy.nav, hasRole]);

  const groupedNav = useMemo(
    () =>
      (["overview", "commerce", "service", "system"] as NavGroupId[]).map(
        (groupId) => ({
          id: groupId,
          label: copy.groups[groupId],
          items: navItems.filter((item) => item.group === groupId),
        }),
      ),
    [copy.groups, navItems],
  );

  const activeGroup = useMemo<NavGroupId>(() => {
    const matched = navItems.find((item) =>
      item.to === "/"
        ? location.pathname === "/"
        : location.pathname.startsWith(item.to),
    );
    return matched?.group ?? "overview";
  }, [location.pathname, navItems]);

  const currentSectionLabel = useMemo(() => {
    const matched = navItems.find((item) =>
      item.to === "/"
        ? location.pathname === "/"
        : location.pathname.startsWith(item.to),
    );

    return matched?.label ?? copy.welcome;
  }, [copy.welcome, location.pathname, navItems]);

  const alerts = useMemo<AlertItem[]>(() => {
    const items: AlertItem[] = [];
    const pendingOrders = orders.filter(
      (item) => item.status === "pending",
    ).length;
    const lowStockProducts = products.filter(
      (item) =>
        !item.isDeleted && item.availableStock > 0 && item.availableStock <= 10,
    ).length;
    const scheduledPosts = posts.filter(
      (item) => item.status === "scheduled",
    ).length;
    const dealerAttention = dealers.filter(
      (item) => item.status === "suspended",
    ).length;
    const pendingUsers = users.filter(
      (item) => item.status === "pending",
    ).length;

    if (pendingOrders > 0) {
      items.push({
        id: "pending-orders",
        title: interpolate(copy.alertTemplates.pendingOrders, {
          count: pendingOrders,
        }),
        description: copy.alertDescriptions.pendingOrders,
        to: "/orders",
        icon: ShoppingCart,
      });
    }
    if (lowStockProducts > 0) {
      items.push({
        id: "low-stock",
        title: interpolate(copy.alertTemplates.lowStock, {
          count: lowStockProducts,
        }),
        description: copy.alertDescriptions.lowStock,
        to: "/products",
        icon: Boxes,
      });
    }
    if (scheduledPosts > 0) {
      items.push({
        id: "scheduled-posts",
        title: interpolate(copy.alertTemplates.scheduledPosts, {
          count: scheduledPosts,
        }),
        description: copy.alertDescriptions.scheduledPosts,
        to: "/blogs",
        icon: BookOpenText,
      });
    }
    if (dealerAttention > 0) {
      items.push({
        id: "dealer-attention",
        title: interpolate(copy.alertTemplates.dealerAttention, {
          count: dealerAttention,
        }),
        description: copy.alertDescriptions.dealerAttention,
        to: "/dealers",
        icon: BadgeAlert,
      });
    }
    if (hasRole("SUPER_ADMIN") && pendingUsers > 0) {
      items.push({
        id: "pending-users",
        title: interpolate(copy.alertTemplates.pendingUsers, {
          count: pendingUsers,
        }),
        description: copy.alertDescriptions.pendingUsers,
        to: "/users",
        icon: Users,
      });
    }

    return items;
  }, [
    copy.alertDescriptions,
    copy.alertTemplates,
    dealers,
    hasRole,
    orders,
    posts,
    products,
    users,
  ]);

  const unreadAlerts = useMemo(
    () => alerts.filter((alert) => !readAlertIds.has(alert.id)),
    [alerts, readAlertIds],
  );

  const searchIndex = useMemo<SearchIndexItem[]>(() => {
    const results: SearchIndexItem[] = [];
    const pushSearchItem = (item: SearchResult, ...searchTokens: string[]) => {
      results.push({
        ...item,
        searchText: `${item.title} ${item.meta} ${searchTokens.join(" ")}`
          .trim()
          .toLowerCase(),
      });
    };

    navItems.forEach((item) => {
      pushSearchItem(
        {
          id: `nav-${item.to}`,
          title: item.label,
          meta: copy.groups[item.group],
          to: item.to,
          icon: item.icon,
        },
        item.label,
        copy.groups[item.group],
      );
    });

    orders.forEach((item) => {
      pushSearchItem(
        {
          id: `order-${item.id}`,
          title: `${copy.order} #${item.id}`,
          meta: item.dealer,
          to: `/orders/${encodeURIComponent(item.id)}`,
          icon: ShoppingCart,
        },
        item.id,
        item.dealer,
        item.address,
      );
    });

    products.forEach((item) => {
      if (item.isDeleted) {
        return;
      }

      pushSearchItem(
        {
          id: `product-${item.sku}`,
          title: item.name,
          meta: `${copy.product} · ${item.sku}`,
          to: `/products/${encodeURIComponent(item.sku)}`,
          icon: Package,
        },
        item.name,
        item.sku,
        item.shortDescription,
      );
    });

    dealers.forEach((item) => {
      pushSearchItem(
        {
          id: `dealer-${item.id}`,
          title: item.name,
          meta: `${copy.dealer} · ${item.email}`,
          to: `/dealers/${encodeURIComponent(item.id)}`,
          icon: UserCircle,
        },
        item.id,
        item.name,
        item.email,
        item.phone,
      );
    });

    posts.forEach((item) => {
      pushSearchItem(
        {
          id: `post-${item.id}`,
          title: item.title,
          meta: `${copy.post} · ${item.category || "-"}`,
          to: `/blogs/${encodeURIComponent(item.id)}`,
          icon: BookOpenText,
        },
        item.id,
        item.title,
        item.category,
        item.excerpt,
      );
    });

    discountRules.forEach((item) => {
      pushSearchItem(
        {
          id: `discount-${item.id}`,
          title: item.label,
          meta: `${copy.discount} · ${item.range}`,
          to: "/discounts",
          icon: Percent,
        },
        item.id,
        item.label,
        item.range,
      );
    });

    users.forEach((item) => {
      pushSearchItem(
        {
          id: `user-${item.id}`,
          title: item.name,
          meta: `${copy.user} · ${item.role}`,
          to: "/users",
          icon: Users,
        },
        item.id,
        item.name,
        item.role,
      );
    });

    return results;
  }, [copy, dealers, discountRules, navItems, orders, posts, products, users]);

  const searchResults = useMemo<SearchResult[]>(() => {
    const normalizedQuery = deferredGlobalQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return [];
    }

    return searchIndex
      .filter((item) => item.searchText.includes(normalizedQuery))
      .map((item) => ({
        id: item.id,
        title: item.title,
        meta: item.meta,
        to: item.to,
        icon: item.icon,
      }));
  }, [deferredGlobalQuery, searchIndex]);

  const visibleSearchResults = useMemo(
    () =>
      showAllSearchResults
        ? searchResults
        : searchResults.slice(0, SEARCH_RESULT_LIMIT),
    [searchResults, showAllSearchResults],
  );

  useEffect(() => {
    const shouldLoadSearchData = isSearchOpen || globalQuery.trim().length > 0;
    if (!shouldLoadSearchData) {
      return;
    }

    void ensureResourceLoaded("orders");
    void ensureResourceLoaded("dealers");
    void ensureResourceLoaded("posts");
    void ensureResourceLoaded("discountRules");
    if (hasRole("SUPER_ADMIN")) {
      void ensureResourceLoaded("users");
    }
  }, [ensureResourceLoaded, globalQuery, hasRole, isSearchOpen]);

  useEffect(() => {
    if (!isAlertsOpen) {
      return;
    }

    void ensureResourceLoaded("orders");
    void ensureResourceLoaded("dealers");
    void ensureResourceLoaded("posts");
    if (hasRole("SUPER_ADMIN")) {
      void ensureResourceLoaded("users");
    }
  }, [ensureResourceLoaded, hasRole, isAlertsOpen]);

  const closeTransientUi = useCallback((options?: { clearQuery?: boolean }) => {
    if (options?.clearQuery) {
      setGlobalQuery("");
    }
    setIsSidebarOpen(false);
    setIsAlertsOpen(false);
    setIsAccountOpen(false);
    setIsSearchOpen(false);
    setShowAllSearchResults(false);
    setActiveSearchIndex(-1);
  }, []);

  const openSidebar = useCallback(() => {
    setIsSidebarOpen(true);
    setIsAlertsOpen(false);
    setIsAccountOpen(false);
    setIsSearchOpen(false);
  }, []);

  const toggleAlerts = useCallback(() => {
    setIsAlertsOpen((current) => {
      const next = !current;
      if (next) {
        setIsSidebarOpen(false);
        setIsAccountOpen(false);
        setIsSearchOpen(false);
      }
      return next;
    });
  }, []);

  const toggleAccount = useCallback(() => {
    setIsAccountOpen((current) => {
      const next = !current;
      if (next) {
        setIsSidebarOpen(false);
        setIsAlertsOpen(false);
        setIsSearchOpen(false);
      }
      return next;
    });
  }, []);

  const openSearch = useCallback(() => {
    setIsSearchOpen(true);
    setIsSidebarOpen(false);
    setIsAlertsOpen(false);
    setIsAccountOpen(false);
  }, []);

  useEffect(() => {
    setOpenGroups((current) => ({
      ...current,
      [activeGroup]: true,
    }));
  }, [activeGroup]);

  useEffect(() => {
    closeTransientUi();
  }, [closeTransientUi, location.pathname]);

  useEffect(() => {
    setShowAllSearchResults(false);
    setActiveSearchIndex(searchResults.length > 0 ? 0 : -1);
  }, [deferredGlobalQuery, searchResults.length]);

  useEffect(() => {
    if (!isSearchOpen) {
      setActiveSearchIndex(-1);
    }
  }, [isSearchOpen]);

  useBodyScrollLock(isSidebarOpen);
  useOverlaySurface({
    isOpen: isSidebarOpen,
    containerRef: mobileSidebarRef,
    triggerRef: mobileNavTriggerRef,
    onClose: () => setIsSidebarOpen(false),
  });
  useOverlaySurface({
    isOpen: isAlertsOpen,
    containerRef: alertsRef,
    triggerRef: alertsTriggerRef,
    onClose: () => setIsAlertsOpen(false),
  });
  useOverlaySurface({
    isOpen: isAccountOpen,
    containerRef: accountRef,
    triggerRef: accountTriggerRef,
    onClose: () => setIsAccountOpen(false),
  });
  useOverlaySurface({
    isOpen: isSearchOpen,
    containerRef: searchRef,
    triggerRef: searchInputRef,
    initialFocusRef: searchInputRef,
    onClose: () => setIsSearchOpen(false),
  });

  const handleNavigate = (to: string) => {
    navigate(to);
    closeTransientUi({ clearQuery: true });
  };

  const markAlertRead = (id: string) => {
    markAlertReadById(id);
  };

  const handleGlobalSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (searchResults.length === 0) {
      notify(copy.searchEmpty, { title: copy.workspace, variant: "info" });
      return;
    }
    const nextTarget =
      activeSearchIndex >= 0
        ? visibleSearchResults[activeSearchIndex]?.to
        : searchResults[0]?.to;
    if (nextTarget) {
      handleNavigate(nextTarget);
    }
  };

  const handleSearchKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (!searchResults.length) {
      if (event.key === "Escape") {
        setIsSearchOpen(false);
      }
      return;
    }

    const maxIndex = visibleSearchResults.length - 1;
    if (maxIndex < 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsSearchOpen(true);
      setActiveSearchIndex((current) =>
        current >= maxIndex ? 0 : current + 1,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsSearchOpen(true);
      setActiveSearchIndex((current) =>
        current <= 0 ? maxIndex : current - 1,
      );
      return;
    }

    if (
      event.key === "Enter" &&
      activeSearchIndex >= 0 &&
      visibleSearchResults[activeSearchIndex]
    ) {
      event.preventDefault();
      handleNavigate(visibleSearchResults[activeSearchIndex].to);
      return;
    }

    if (event.key === "Escape") {
      setIsSearchOpen(false);
    }
  };

  const renderSidebar = (mobile = false) => (
    <aside
      id={mobile ? mobileNavigationId : undefined}
      aria-label={copy.openNavigation}
      className={
        mobile
          ? "brand-admin-shell flex h-full min-h-0 flex-col gap-4 border-r border-[var(--brand-border)] px-4 py-4 text-slate-100"
          : "brand-admin-shell hidden min-h-0 flex-col gap-4 border-r border-[var(--brand-border)] px-4 py-4 text-slate-100 lg:fixed lg:inset-y-0 lg:left-0 lg:z-20 lg:flex lg:h-[100dvh] lg:w-[296px] lg:overflow-hidden xl:w-[320px]"
      }
    >
      <div className="flex items-center gap-3">
        <img
          src={logoMark}
          alt={BRAND_NAME}
          className="h-10 w-auto max-w-[152px] object-contain drop-shadow-[0_10px_24px_rgba(0,113,188,0.22)]"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold tracking-[0.01em] text-white">
            {ADMIN_APP_NAME}
          </div>
          <p className="text-xs text-slate-400">{copy.workspace}</p>
        </div>
      </div>

      <nav className="app-scroll flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pr-1">
        {groupedNav.map((group) => (
          <section
            key={group.id}
            className="rounded-[22px] border border-[var(--brand-border)] bg-[rgba(41,171,226,0.05)] px-2 py-2"
          >
            <button
              aria-expanded={openGroups[group.id]}
              className="flex w-full items-center justify-between gap-3 px-2.5 py-1.5 text-left text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400"
              onClick={() => toggleGroup(group.id)}
              type="button"
            >
              <span>{group.label}</span>
              <span className="inline-flex items-center gap-2">
                <span className="rounded-full bg-[rgba(41,171,226,0.1)] px-2 py-0.5 text-[10px] text-slate-300">
                  {group.items.length}
                </span>
                {openGroups[group.id] ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </span>
            </button>
            <div
              className={`overflow-hidden transition-all duration-200 ${openGroups[group.id] ? "max-h-[40rem]" : "max-h-0"}`}
            >
              <div className="mt-1.5 space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === "/"}
                      className={({ isActive }) =>
                        [
                          "group relative grid grid-cols-[auto,minmax(0,1fr),auto] items-center gap-3 overflow-hidden rounded-[18px] px-3 py-2.5 text-left text-sm font-medium transition",
                          isActive
                            ? "bg-[linear-gradient(135deg,rgba(41,171,226,0.22),rgba(0,113,188,0.18))] text-white shadow-[inset_0_0_0_1px_rgba(41,171,226,0.38),0_14px_28px_rgba(3,16,28,0.16)]"
                            : "text-slate-300 hover:bg-[rgba(41,171,226,0.1)] hover:text-white",
                        ].join(" ")
                      }
                      title={item.label}
                    >
                      {({ isActive }) => (
                        <>
                          <span
                            className={[
                              "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl transition",
                              isActive
                                ? "bg-[rgba(255,255,255,0.12)] text-white"
                                : "bg-[rgba(41,171,226,0.14)] text-blue-200",
                            ].join(" ")}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="block min-w-0 pr-1 text-sm leading-5 text-inherit break-words">
                            {item.label}
                          </span>
                          <ChevronRight
                            className={[
                              "h-4 w-4 shrink-0 transition",
                              isActive
                                ? "translate-x-0 text-white/70"
                                : "text-white/20 group-hover:translate-x-0.5 group-hover:text-white/50",
                            ].join(" ")}
                          />
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          </section>
        ))}
      </nav>

      <div className="text-xs text-slate-400">
        <div className="rounded-[18px] border border-[var(--brand-border)] bg-[rgba(41,171,226,0.05)] px-3 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
                {copy.account}
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-white">
                {user?.username ?? "Admin"}
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[rgba(34,197,94,0.12)] px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(34,197,94,0.16)]" />
              {copy.online}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--app-bg)] text-[var(--ink)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-[18vmax] left-[8vmax] h-[34vmax] w-[34vmax] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(41,171,226,0.06),transparent_65%)] animate-drift motion-reduce:animate-none" />
        <div className="absolute -bottom-[20vmax] right-[6vmax] h-[38vmax] w-[38vmax] rounded-full bg-[radial-gradient(circle_at_60%_40%,rgba(0,113,188,0.08),transparent_65%)] animate-drift-slow motion-reduce:animate-none" />
      </div>

      <div className="relative flex min-h-screen">
        {renderSidebar()}

        <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:pl-[296px] xl:pl-[320px]">
          <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-[var(--surface-tint)]/95 backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-3 px-4 py-3 sm:px-6 lg:px-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    ref={mobileNavTriggerRef}
                    aria-controls={mobileNavigationId}
                    aria-expanded={isSidebarOpen}
                    aria-label={copy.openNavigation}
                    className={`${iconButtonClass} lg:hidden`}
                    onClick={openSidebar}
                    type="button"
                  >
                    <Menu className="h-5 w-5" />
                  </button>
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--muted)]">
                      {copy.groups[activeGroup]}
                    </p>
                    <p className="truncate text-sm font-semibold text-[var(--ink)] sm:text-base">
                      {currentSectionLabel}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                  <button
                    aria-label={theme === "dark" ? copy.light : copy.dark}
                    className={ghostButtonClass}
                    onClick={toggleTheme}
                    type="button"
                  >
                    {theme === "dark" ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Moon className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline">
                      {theme === "dark" ? copy.light : copy.dark}
                    </span>
                  </button>

                  <LanguageSwitcher />

                  <div className="relative" ref={alertsRef}>
                    <button
                      ref={alertsTriggerRef}
                      aria-controls={alertsPopoverId}
                      aria-expanded={isAlertsOpen}
                      aria-haspopup="dialog"
                      className={ghostButtonClass}
                      onClick={toggleAlerts}
                      type="button"
                    >
                      {unreadAlerts.length > 0 ? (
                        <BellDot className="h-4 w-4" />
                      ) : (
                        <Bell className="h-4 w-4" />
                      )}
                      <span className="hidden sm:inline">{copy.alerts}</span>
                      {unreadAlerts.length > 0 ? (
                        <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-[var(--destructive)] px-1.5 py-0.5 text-[11px] font-semibold text-white">
                          {unreadAlerts.length}
                        </span>
                      ) : null}
                    </button>

                    {isAlertsOpen ? (
                      <div
                        id={alertsPopoverId}
                        aria-label={copy.alerts}
                        className="absolute right-0 z-40 mt-2 w-[min(92vw,360px)] rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[0_18px_38px_rgba(15,23,42,0.14)]"
                        role="dialog"
                        tabIndex={-1}
                      >
                        <div className="flex items-center justify-between gap-3 px-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                            {copy.alerts}
                          </p>
                          {unreadAlerts.length > 0 ? (
                            <button
                              className="text-xs font-semibold text-[var(--accent)]"
                              onClick={() => {
                                markAllAlertIds(
                                  alerts.map((alert) => alert.id),
                                );
                              }}
                              type="button"
                            >
                              {copy.markAllRead}
                            </button>
                          ) : null}
                        </div>
                        {alerts.length > 0 ? (
                          <ul className="mt-2 space-y-1">
                            {alerts.map((alert) => {
                              const Icon = alert.icon;
                              const isUnread = !readAlertIds.has(alert.id);
                              return (
                                <li key={alert.id}>
                                  <button
                                    className={[
                                      "flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition",
                                      isUnread
                                        ? "bg-[var(--surface-muted)] hover:bg-[var(--accent-soft)]/50"
                                        : "hover:bg-[var(--surface-muted)]",
                                    ].join(" ")}
                                    onClick={() => {
                                      markAlertRead(alert.id);
                                      navigate(alert.to);
                                    }}
                                    type="button"
                                  >
                                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                                      <Icon className="h-4 w-4" />
                                    </span>
                                    <span className="min-w-0">
                                      <span className="flex items-center gap-2">
                                        <span className="truncate text-sm font-semibold text-[var(--ink)]">
                                          {alert.title}
                                        </span>
                                        {isUnread ? (
                                          <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--destructive)]" />
                                        ) : null}
                                      </span>
                                      <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">
                                        {alert.description}
                                      </span>
                                    </span>
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <p className="px-2 py-4 text-sm text-[var(--muted)]">
                            {copy.alertsEmpty}
                          </p>
                        )}
                      </div>
                    ) : null}
                  </div>

                  <div className="relative" ref={accountRef}>
                    <button
                      ref={accountTriggerRef}
                      aria-controls={accountPopoverId}
                      aria-expanded={isAccountOpen}
                      aria-haspopup="dialog"
                      className={ghostButtonClass}
                      onClick={toggleAccount}
                      type="button"
                    >
                      <UserCircle className="h-4 w-4" />
                      <span className="hidden sm:inline">{copy.account}</span>
                    </button>

                    {isAccountOpen ? (
                      <div
                        id={accountPopoverId}
                        aria-label={copy.account}
                        className="absolute right-0 z-40 mt-2 w-[min(92vw,18rem)] rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_18px_38px_rgba(15,23,42,0.14)] sm:w-72"
                        role="dialog"
                        tabIndex={-1}
                      >
                        <p className="text-xs uppercase tracking-[0.2em] text-[var(--muted)]">
                          {copy.account}
                        </p>
                        <p className="mt-2 truncate text-base font-semibold text-[var(--ink)]">
                          {user?.username ?? "Admin"}
                        </p>
                        <p className="mt-1 text-sm text-[var(--muted)]">
                          {user?.role ?? copy.noRole}
                        </p>
                        <div className="mt-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-3">
                          <p className={tableMetaClass}>{copy.language}</p>
                          <p className="mt-1 text-sm font-medium text-[var(--ink)]">
                            {language === "vi" ? "Tiếng Việt" : "English"}
                          </p>
                        </div>
                        <button
                          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-[18px] border border-[var(--destructive-border)] bg-[var(--destructive-soft)] px-4 py-2 text-sm font-semibold text-[var(--destructive-text)] transition hover:bg-[var(--destructive-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--destructive)]"
                          onClick={() => {
                            logout();
                            notify(copy.logout, {
                              title: copy.account,
                              variant: "info",
                            });
                            navigate("/login");
                          }}
                          type="button"
                        >
                          <LogOut className="h-4 w-4" />
                          {copy.logout}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <form
                  ref={searchRef}
                  aria-label={copy.searchHint}
                  className="relative w-full lg:max-w-xl"
                  onSubmit={handleGlobalSearch}
                >
                  <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                  <input
                    ref={searchInputRef}
                    aria-activedescendant={
                      activeSearchIndex >= 0
                        ? `global-search-option-${activeSearchIndex}`
                        : undefined
                    }
                    aria-autocomplete="list"
                    aria-controls={searchListboxId}
                    aria-expanded={
                      isSearchOpen && visibleSearchResults.length > 0
                    }
                    aria-label={copy.searchPlaceholder}
                    className={`${inputClass} w-full pl-10 pr-4`}
                    onChange={(event) => {
                      setGlobalQuery(event.target.value);
                      openSearch();
                      setShowAllSearchResults(false);
                      setActiveSearchIndex(-1);
                    }}
                    onFocus={openSearch}
                    onKeyDown={handleSearchKeyDown}
                    placeholder={copy.searchPlaceholder}
                    role="combobox"
                    value={globalQuery}
                  />
                  {isSearchOpen && globalQuery.trim() ? (
                    <div
                      aria-label={copy.searchHint}
                      className="absolute left-0 right-0 z-40 mt-2 rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[0_18px_38px_rgba(15,23,42,0.14)]"
                      role="dialog"
                      tabIndex={-1}
                    >
                      <div className="flex items-start justify-between gap-3 px-2">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                          {copy.searchHint}
                        </p>
                        {searchResults.length > SEARCH_RESULT_LIMIT ? (
                          <button
                            className="text-xs font-semibold text-[var(--accent)]"
                            onClick={() =>
                              setShowAllSearchResults((current) => !current)
                            }
                            type="button"
                          >
                            {showAllSearchResults
                              ? copy.searchCollapse
                              : interpolate(copy.searchViewAll, {
                                  count: searchResults.length,
                                })}
                          </button>
                        ) : null}
                      </div>
                      <p className="px-2 pt-1 text-xs text-[var(--muted)]">
                        {copy.searchSelectionHint}
                      </p>
                      {searchResults.length > 0 ? (
                        <ul
                          aria-label={copy.searchResultsLabel}
                          className="mt-2 space-y-1"
                          id={searchListboxId}
                          role="listbox"
                        >
                          {visibleSearchResults.map((result, index) => {
                            const Icon = result.icon;
                            const isActive = index === activeSearchIndex;
                            return (
                              <li key={result.id}>
                                <button
                                  aria-selected={isActive}
                                  className={[
                                    "flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition",
                                    isActive
                                      ? "bg-[var(--surface-muted)] ring-2 ring-[var(--accent-soft)]"
                                      : "hover:bg-[var(--surface-muted)]",
                                  ].join(" ")}
                                  id={`global-search-option-${index}`}
                                  onClick={() => handleNavigate(result.to)}
                                  onMouseEnter={() =>
                                    setActiveSearchIndex(index)
                                  }
                                  role="option"
                                  type="button"
                                >
                                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
                                    <Icon className="h-4 w-4" />
                                  </span>
                                  <span className="min-w-0">
                                    <span className="block truncate text-sm font-semibold text-[var(--ink)]">
                                      {result.title}
                                    </span>
                                    <span className="block truncate text-xs text-[var(--muted)]">
                                      {result.meta}
                                    </span>
                                  </span>
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <p className="px-2 py-4 text-sm text-[var(--muted)]">
                          {copy.searchEmpty}
                        </p>
                      )}
                    </div>
                  ) : null}
                </form>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 pb-10 pt-4 sm:px-6 md:px-8">
            <div className="mx-auto w-full max-w-screen-2xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      <div
        aria-hidden={!isSidebarOpen}
        className={`fixed inset-0 z-40 bg-[rgba(1,8,15,0.62)] transition lg:hidden ${
          isSidebarOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <div
        ref={mobileSidebarRef}
        aria-labelledby="admin-mobile-navigation-title"
        aria-modal="true"
        className={`fixed inset-y-0 left-0 z-50 w-[min(92vw,360px)] transform transition duration-300 ease-out lg:hidden ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        tabIndex={-1}
      >
        <div className="flex h-full flex-col">
          <button
            aria-label={copy.closeNavigation}
            className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-[var(--brand-border)] bg-[rgba(41,171,226,0.1)] text-white"
            onClick={() => setIsSidebarOpen(false)}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
          <h2 className="sr-only" id="admin-mobile-navigation-title">
            {copy.workspace}
          </h2>
          {renderSidebar(true)}
        </div>
      </div>
    </div>
  );
}

export default AppLayoutRevamp;

