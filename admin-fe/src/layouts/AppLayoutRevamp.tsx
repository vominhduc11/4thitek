import {
  BadgeAlert,
  Bell,
  BookOpenText,
  Boxes,
  CircleDollarSign,
  ClipboardList,
  FileText,
  FolderOpen,
  Landmark,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  Moon,
  Package,
  Percent,
  RotateCcw,
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
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import LanguageSwitcher from "../components/LanguageSwitcher";
import {
  ghostButtonClass,
  iconButtonClass,
  tableMetaClass,
} from "../components/ui-kit";
import { canAccessPath } from "../config/navPermissions";
import { useAdminData } from "../context/AdminDataContext";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { translateCopy } from "../lib/i18n";
import {
  emitAdminDashboardRefresh,
  emitAdminRealtimeNotification,
  emitAdminSupportRefresh,
} from "../lib/adminRealtime";
import { useProducts } from "../context/ProductsContext";
import { useToast } from "../context/ToastContext";
import { useBodyScrollLock } from "../hooks/useBodyScrollLock";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useLocalStorageSet } from "../hooks/useLocalStorageSet";
import { useOverlaySurface } from "../hooks/useOverlaySurface";
import { useTheme } from "../hooks/useTheme";
import { useAdminWebSocket } from "../hooks/useAdminWebSocket";
import { useNavBadges } from "../hooks/useNavBadges";

import {
  copyKeys,
  interpolate,
  buildAlertStateId,
  loadNavGroups,
  ALERT_READ_STORAGE_KEY,
  NAV_GROUP_STORAGE_KEY,
  SEARCH_RESULT_LIMIT,
  type NavGroupId,
  type NavItem,
  type SearchResult,
  type SearchIndexItem,
  type AlertItem,
} from "./layoutHelpers";

import { Sidebar } from "./Sidebar";
import { SearchOverlay } from "./SearchOverlay";
import { AlertsPopover } from "./AlertsPopover";

function AppLayoutRevamp() {
  const { language, t } = useLanguage();
  const copy = translateCopy(copyKeys, t);
  const { user, logout, hasRole, hasPermission, accessToken } = useAuth();
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

  // "Needs attention" nav badges: only query modules the user can see; failures
  // simply show no badge. Orders/users are derived from already-loaded context.
  const canSeeReturns = canAccessPath("/returns", hasPermission, hasRole);
  const fetchedNavBadges = useNavBadges({ accessToken, canSeeReturns });
  const navBadges = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = { ...fetchedNavBadges };
    if (canAccessPath("/orders", hasPermission, hasRole)) {
      const pendingOrders = orders.filter(
        (order) => order.status === "pending",
      ).length;
      if (pendingOrders > 0) {
        map["/orders"] = pendingOrders;
      }
    }
    if (hasRole("SUPER_ADMIN")) {
      const pendingUsers = users.filter(
        (user) => user.status === "pending",
      ).length;
      if (pendingUsers > 0) {
        map["/users"] = pendingUsers;
      }
    }
    return map;
  }, [fetchedNavBadges, orders, users, hasPermission, hasRole]);

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
      emitAdminDashboardRefresh();
      notify(interpolate(copy.ws.newOrder, { dealer: event.dealerName }), {
        title: copy.order,
        variant: "info",
      });
    },
    onNewDealer: (event) => {
      void reloadResource("dealers");
      emitAdminDashboardRefresh();
      notify(interpolate(copy.ws.newDealer, { username: event.username }), {
        title: copy.dealer,
        variant: "info",
      });
    },
    onNewSupportTicket: (event) => {
      emitAdminSupportRefresh(event);
      notify(interpolate(copy.ws.newTicket, { dealer: event.dealerName }), {
        title: copy.nav.support,
        variant: "info",
      });
    },
    onNotificationCreated: (event) => {
      emitAdminDashboardRefresh();
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
        to: "/media",
        label: copy.nav.media,
        icon: FolderOpen,
        group: "service",
      },
      {
        to: "/returns",
        label: copy.nav.returns,
        icon: RotateCcw,
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

    items.push(
      {
        to: "/users",
        label: copy.nav.users,
        icon: Users,
        group: "system",
      },
      {
        to: "/audit-logs",
        label: copy.nav.auditLogs,
        icon: ClipboardList,
        group: "system",
      },
      {
        to: "/settings",
        label: copy.nav.settings,
        icon: Settings,
        group: "system",
      },
    );

    // Show only modules the user is allowed to reach (permission code or SUPER_ADMIN-only role).
    return items.filter((item) => canAccessPath(item.to, hasPermission, hasRole));
  }, [copy.nav, hasPermission, hasRole]);

  const groupedNav = useMemo(
    () =>
      (["overview", "commerce", "service", "system"] as NavGroupId[]).map(
        (groupId) => ({
          id: groupId,
          label: copy.groups[groupId],
          items: navItems.filter((item) => item.group === groupId),
        }),
      ).filter((group) => group.items.length > 0),
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
    const pendingOrderIds = orders
      .filter((item) => item.status === "pending")
      .map((item) => item.id);
    const lowStockProductIds = products
      .filter(
        (item) =>
          !item.isDeleted && item.availableStock > 0 && item.availableStock <= 10,
      )
      .map((item) => item.sku);
    const scheduledPostIds = posts
      .filter((item) => item.status === "scheduled")
      .map((item) => item.id);
    const dealerAttentionIds = dealers
      .filter((item) => item.status === "suspended")
      .map((item) => item.id);
    const pendingUserIds = users
      .filter((item) => item.status === "pending")
      .map((item) => item.id);

    if (pendingOrderIds.length > 0) {
      items.push({
        id: buildAlertStateId("pending-orders", pendingOrderIds),
        title: interpolate(copy.alertTemplates.pendingOrders, {
          count: pendingOrderIds.length,
        }),
        description: copy.alertDescriptions.pendingOrders,
        to: "/orders",
        icon: ShoppingCart,
      });
    }
    if (lowStockProductIds.length > 0) {
      items.push({
        id: buildAlertStateId("low-stock", lowStockProductIds),
        title: interpolate(copy.alertTemplates.lowStock, {
          count: lowStockProductIds.length,
        }),
        description: copy.alertDescriptions.lowStock,
        to: "/products",
        icon: Boxes,
      });
    }
    if (scheduledPostIds.length > 0) {
      items.push({
        id: buildAlertStateId("scheduled-posts", scheduledPostIds),
        title: interpolate(copy.alertTemplates.scheduledPosts, {
          count: scheduledPostIds.length,
        }),
        description: copy.alertDescriptions.scheduledPosts,
        to: "/blogs",
        icon: BookOpenText,
      });
    }
    if (dealerAttentionIds.length > 0) {
      items.push({
        id: buildAlertStateId("dealer-attention", dealerAttentionIds),
        title: interpolate(copy.alertTemplates.dealerAttention, {
          count: dealerAttentionIds.length,
        }),
        description: copy.alertDescriptions.dealerAttention,
        to: "/dealers",
        icon: BadgeAlert,
      });
    }
    if (hasRole("SUPER_ADMIN") && pendingUserIds.length > 0) {
      items.push({
        id: buildAlertStateId("pending-users", pendingUserIds),
        title: interpolate(copy.alertTemplates.pendingUsers, {
          count: pendingUserIds.length,
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
          title: `${copy.discount} · ${item.rangeLabel}`,
          meta: `${item.fromQuantity} → ${item.toQuantity ?? "∞"} · ${item.percent}%`,
          to: "/discounts",
          icon: Percent,
        },
        item.id,
        item.rangeLabel,
        String(item.fromQuantity),
        item.toQuantity == null ? "" : String(item.toQuantity),
        String(item.percent),
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
    const handler = (e: KeyboardEvent) => {
      if (e.key !== "/") return;
      const target = e.target as HTMLElement;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target.isContentEditable
      ) return;
      e.preventDefault();
      openSearch();
      window.requestAnimationFrame(() => {
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      });
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [openSearch]);

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

  return (
    <div className="relative min-h-screen bg-[var(--app-bg)] text-[var(--ink)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-[18vmax] left-[8vmax] h-[34vmax] w-[34vmax] rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(41,171,226,0.06),transparent_65%)] animate-drift motion-reduce:animate-none" />
        <div className="absolute -bottom-[20vmax] right-[6vmax] h-[38vmax] w-[38vmax] rounded-full bg-[radial-gradient(circle_at_60%_40%,rgba(0,113,188,0.08),transparent_65%)] animate-drift-slow motion-reduce:animate-none" />
      </div>

      <div className="relative flex min-h-screen">
        <Sidebar
          copy={copy}
          groupedNav={groupedNav}
          mobileNavigationId={mobileNavigationId}
          navBadges={navBadges}
          openGroups={openGroups}
          toggleGroup={toggleGroup}
          user={user}
        />

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
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

                  <AlertsPopover
                    alertsRef={alertsRef}
                    alertsTriggerRef={alertsTriggerRef}
                    alertsPopoverId={alertsPopoverId}
                    isAlertsOpen={isAlertsOpen}
                    toggleAlerts={toggleAlerts}
                    unreadAlerts={unreadAlerts}
                    alerts={alerts}
                    readAlertIds={readAlertIds}
                    markAllAlertIds={markAllAlertIds}
                    markAlertRead={markAlertRead}
                    navigate={navigate}
                    copy={copy}
                  />

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
                        <Link
                          to="/profile"
                          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[18px] border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition hover:border-[var(--accent)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
                          onClick={() => setIsAccountOpen(false)}
                        >
                          <UserCircle className="h-4 w-4" />
                          {copy.profile}
                        </Link>
                        <button
                          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[18px] border border-[var(--destructive-border)] bg-[var(--destructive-soft)] px-4 py-2 text-sm font-semibold text-[var(--destructive-text)] transition hover:bg-[var(--destructive-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--destructive)]"
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
                <SearchOverlay
                  searchRef={searchRef}
                  searchInputRef={searchInputRef}
                  isSearchOpen={isSearchOpen}
                  globalQuery={globalQuery}
                  setGlobalQuery={setGlobalQuery}
                  openSearch={openSearch}
                  handleSearchKeyDown={handleSearchKeyDown}
                  handleGlobalSearch={handleGlobalSearch}
                  searchResults={searchResults}
                  visibleSearchResults={visibleSearchResults}
                  showAllSearchResults={showAllSearchResults}
                  setShowAllSearchResults={setShowAllSearchResults}
                  activeSearchIndex={activeSearchIndex}
                  setActiveSearchIndex={setActiveSearchIndex}
                  handleNavigate={handleNavigate}
                  copy={copy}
                  searchListboxId={searchListboxId}
                  interpolate={interpolate}
                />
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
          <Sidebar
            mobile
            copy={copy}
            groupedNav={groupedNav}
            mobileNavigationId={mobileNavigationId}
            navBadges={navBadges}
            openGroups={openGroups}
            toggleGroup={toggleGroup}
            user={user}
          />
        </div>
      </div>
    </div>
  );
}

export default AppLayoutRevamp;
