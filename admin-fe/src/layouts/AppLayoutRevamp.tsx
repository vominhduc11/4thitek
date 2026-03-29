import {
  BadgeAlert,
  Bell,
  BellDot,
  Blocks,
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
  Sparkles,
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
  inputClass,
  tableMetaClass,
} from "../components/ui-kit";
import { useAdminData } from "../context/AdminDataContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { translateCopy } from "../lib/i18n";
import { useProducts } from "../context/ProductsContext";
import { useToast } from "../context/ToastContext";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
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
const ADMIN_THEME_EVENT = "admin-theme-change";

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

const getStoredTheme = (): "dark" | "light" | null => {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const stored = window.localStorage.getItem("theme");
    return stored === "dark" || stored === "light" ? stored : null;
  } catch {
    return null;
  }
};

const getPreferredTheme = (): "dark" | "light" => {
  if (typeof window === "undefined" || !window.matchMedia) {
    return "light";
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

const loadReadAlertIds = () => {
  if (typeof window === "undefined") {
    return new Set<string>();
  }
  try {
    const raw = window.localStorage.getItem(ALERT_READ_STORAGE_KEY);
    if (!raw) {
      return new Set<string>();
    }
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed)
      ? new Set(
          parsed.filter((item): item is string => typeof item === "string"),
        )
      : new Set<string>();
  } catch {
    return new Set<string>();
  }
};

const writeAlertIds = (ids: Set<string>) => {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(
      ALERT_READ_STORAGE_KEY,
      JSON.stringify(Array.from(ids)),
    );
  } catch {
    // ignore storage errors
  }
};

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
  const { orders, dealers, posts, discountRules, users, reloadResource } =
    useAdminData();
  const { products } = useProducts();

  const [theme, setTheme] = useState<"light" | "dark">(
    getStoredTheme() ?? getPreferredTheme(),
  );
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
  const [readAlertIds, setReadAlertIds] = useState<Set<string>>(() =>
    loadReadAlertIds(),
  );

  const alertsRef = useRef<HTMLDivElement | null>(null);
  const accountRef = useRef<HTMLDivElement | null>(null);
  const searchRef = useRef<HTMLFormElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const debouncedGlobalQuery = useDebouncedValue(globalQuery, 180);
  const deferredGlobalQuery = useDeferredValue(debouncedGlobalQuery);
  const mobileNavigationId = "admin-mobile-navigation";
  const searchListboxId = "admin-global-search-results";

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

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.dispatchEvent(new Event(ADMIN_THEME_EVENT));
  }, [theme]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setOpenGroups((current) => ({
        ...current,
        [activeGroup]: true,
      }));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [activeGroup]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      closeTransientUi();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [closeTransientUi, location.pathname]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowAllSearchResults(false);
      setActiveSearchIndex(searchResults.length > 0 ? 0 : -1);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [deferredGlobalQuery, searchResults.length]);

  useEffect(() => {
    if (!isSearchOpen) {
      const timer = window.setTimeout(() => {
        setActiveSearchIndex(-1);
      }, 0);
      return () => window.clearTimeout(timer);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (alertsRef.current && !alertsRef.current.contains(target)) {
        setIsAlertsOpen(false);
      }
      if (accountRef.current && !accountRef.current.contains(target)) {
        setIsAccountOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(target)) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleTheme = () => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem("theme", next);
        } catch {
          // ignore storage errors
        }
      }
      return next;
    });
  };

  const handleNavigate = (to: string) => {
    navigate(to);
    closeTransientUi({ clearQuery: true });
  };

  const markAlertRead = (id: string) => {
    setReadAlertIds((current) => {
      const next = new Set(current);
      next.add(id);
      writeAlertIds(next);
      return next;
    });
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
      className={
        mobile
          ? "flex h-full min-h-0 flex-col gap-6 border-r border-white/10 bg-[linear-gradient(180deg,#0f172a,#111827_60%,#0b1120)] px-5 py-6 text-slate-100"
          : "hidden min-h-0 flex-col gap-6 border-r border-white/10 bg-[linear-gradient(180deg,#0f172a,#111827_60%,#0b1120)] px-5 py-6 text-slate-100 lg:flex lg:w-72 lg:shrink-0 xl:w-[308px]"
      }
    >
      <div className="flex items-center gap-3">
        <img
          src={logoMark}
          alt="4ThiTek"
          className="h-11 w-auto max-w-[168px] object-contain drop-shadow-[0_10px_24px_rgba(37,99,235,0.22)]"
        />
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            Admin Portal
            <Sparkles className="h-4 w-4 text-blue-300" />
          </div>
          <p className="text-xs text-slate-400">{copy.workspace}</p>
        </div>
      </div>

      <div className="space-y-2 rounded-3xl border border-white/10 bg-white/5 p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 text-blue-200">
            <Blocks className="h-4 w-4" />
          </span>
          {copy.welcome}
        </div>
        <p className="text-xs leading-5 text-slate-400">{copy.welcomeText}</p>
      </div>

      <nav className="app-scroll flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
        {groupedNav.map((group) => (
          <section
            key={group.id}
            className="rounded-3xl border border-white/10 bg-white/5 px-3 py-3"
          >
            <button
              className="flex w-full items-center justify-between gap-3 px-2 py-2 text-left text-xs font-semibold uppercase tracking-[0.25em] text-slate-400"
              onClick={() => toggleGroup(group.id)}
              type="button"
            >
              <span>{group.label}</span>
              <span className="inline-flex items-center gap-2">
                <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-slate-300">
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
              className={`overflow-hidden transition-all duration-200 ${openGroups[group.id] ? "max-h-96" : "max-h-0"}`}
            >
              <div className="mt-2 space-y-1.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.to === "/"}
                      className={({ isActive }) =>
                        [
                          "group flex items-center justify-between gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition",
                          isActive
                            ? "bg-[color:rgba(37,99,235,0.18)] text-white shadow-[inset_0_0_0_1px_rgba(59,130,246,0.45)]"
                            : "text-slate-300 hover:bg-white/6 hover:text-white",
                        ].join(" ")
                      }
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white/8 text-blue-200">
                          <Icon className="h-4 w-4" />
                        </span>
                        <span className="truncate">{item.label}</span>
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-white/30 transition group-hover:translate-x-0.5" />
                    </NavLink>
                  );
                })}
              </div>
            </div>
          </section>
        ))}
      </nav>

      <div className="space-y-3 border-t border-white/10 pt-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(34,197,94,0.18)]" />
          <span>{copy.online}</span>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
          <p className="text-[11px] uppercase tracking-[0.28em] text-slate-500">
            {copy.account}
          </p>
          <p className="mt-1 truncate text-sm font-semibold text-white">
            {user?.username ?? "Admin"}
          </p>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[var(--app-bg)] text-[var(--ink)] lg:overflow-hidden">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -top-[18vmax] left-[8vmax] h-[38vmax] w-[38vmax] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(37,99,235,0.14),transparent_65%)] animate-drift motion-reduce:animate-none" />
        <div className="absolute -bottom-[20vmax] right-[6vmax] h-[44vmax] w-[44vmax] rounded-full bg-[radial-gradient(circle_at_60%_40%,rgba(59,130,246,0.16),transparent_65%)] animate-drift-slow motion-reduce:animate-none" />
        <div className="absolute inset-0 opacity-35 [background-size:120px_120px] [background-image:linear-gradient(to_right,rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.05)_1px,transparent_1px)]" />
      </div>

      <div className="relative flex min-h-screen lg:h-screen">
        {renderSidebar()}

        <div className="flex min-h-screen flex-1 flex-col lg:h-full lg:min-h-0">
          <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--surface-tint)] backdrop-blur-xl">
            <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4 lg:px-8">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">
                    {copy.workspace}
                  </p>
                  <h1 className="mt-1 text-lg font-semibold text-[var(--ink)] sm:text-2xl">
                    {copy.welcome}
                  </h1>
                  <p className="mt-1 hidden max-w-3xl text-sm text-[var(--muted)] md:block">
                    {copy.welcomeText}
                  </p>
                </div>
                <button
                  aria-controls={mobileNavigationId}
                  aria-expanded={isSidebarOpen}
                  aria-label={copy.openNavigation}
                  className={`${ghostButtonClass} h-11 w-11 px-0 lg:hidden`}
                  onClick={() => setIsSidebarOpen(true)}
                  type="button"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </div>

              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <form
                  ref={searchRef}
                  className="relative w-full lg:max-w-lg"
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
                      setIsSearchOpen(true);
                      setShowAllSearchResults(false);
                      setActiveSearchIndex(-1);
                    }}
                    onFocus={() => setIsSearchOpen(true)}
                    onKeyDown={handleSearchKeyDown}
                    placeholder={copy.searchPlaceholder}
                    role="combobox"
                    value={globalQuery}
                  />
                  {isSearchOpen && globalQuery.trim() ? (
                    <div className="absolute left-0 right-0 z-30 mt-2 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
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

                <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end sm:gap-3">
                  <button
                    aria-label={theme === "dark" ? copy.light : copy.dark}
                    className={ghostButtonClass}
                    onClick={handleToggleTheme}
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
                      aria-expanded={isAlertsOpen}
                      aria-haspopup="menu"
                      className={ghostButtonClass}
                      onClick={() => setIsAlertsOpen((current) => !current)}
                      type="button"
                    >
                      {unreadAlerts.length > 0 ? (
                        <BellDot className="h-4 w-4" />
                      ) : (
                        <Bell className="h-4 w-4" />
                      )}
                      <span className="hidden sm:inline">{copy.alerts}</span>
                      {unreadAlerts.length > 0 ? (
                        <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-rose-600 px-1.5 py-0.5 text-[11px] font-semibold text-white">
                          {unreadAlerts.length}
                        </span>
                      ) : null}
                    </button>

                    {isAlertsOpen ? (
                      <div
                        className="absolute right-0 z-30 mt-2 w-[min(92vw,360px)] rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-3 shadow-[0_18px_40px_rgba(15,23,42,0.12)]"
                        role="menu"
                      >
                        <div className="flex items-center justify-between gap-3 px-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">
                            {copy.alerts}
                          </p>
                          {unreadAlerts.length > 0 ? (
                            <button
                              className="text-xs font-semibold text-[var(--accent)]"
                              onClick={() => {
                                const next = new Set(readAlertIds);
                                alerts.forEach((alert) => next.add(alert.id));
                                writeAlertIds(next);
                                setReadAlertIds(next);
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
                                          <span className="h-2 w-2 shrink-0 rounded-full bg-rose-500" />
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
                      aria-expanded={isAccountOpen}
                      aria-haspopup="menu"
                      className={ghostButtonClass}
                      onClick={() => setIsAccountOpen((current) => !current)}
                      type="button"
                    >
                      <UserCircle className="h-4 w-4" />
                      <span className="hidden sm:inline">{copy.account}</span>
                    </button>

                    {isAccountOpen ? (
                      <div
                        className="absolute right-0 z-30 mt-2 w-[min(92vw,16rem)] rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_18px_40px_rgba(15,23,42,0.12)] sm:w-64"
                        role="menu"
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
                          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-rose-300/70 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
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
            </div>
          </header>

          <main className="app-scroll flex-1 px-4 pb-12 pt-6 sm:px-6 md:px-8 lg:min-h-0 lg:overflow-y-auto">
            <div className="mx-auto w-full max-w-screen-2xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>

      <div
        aria-hidden={!isSidebarOpen}
        className={`fixed inset-0 z-40 bg-slate-950/50 transition lg:hidden ${
          isSidebarOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        onClick={() => setIsSidebarOpen(false)}
      />

      <div
        className={`fixed inset-y-0 left-0 z-50 w-[min(86vw,304px)] transform transition duration-300 ease-out lg:hidden ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          <button
            aria-label={copy.closeNavigation}
            className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10 text-white"
            onClick={() => setIsSidebarOpen(false)}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
          {renderSidebar(true)}
        </div>
      </div>
    </div>
  );
}

export default AppLayoutRevamp;
