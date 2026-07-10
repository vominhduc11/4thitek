// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AppLayoutRevamp from "./AppLayoutRevamp";

const {
  ensureResourceLoadedMock,
  reloadResourceMock,
  notifyMock,
  toggleThemeMock,
  authState,
} = vi.hoisted(() => ({
  ensureResourceLoadedMock: vi.fn(),
  reloadResourceMock: vi.fn(),
  notifyMock: vi.fn(),
  toggleThemeMock: vi.fn(),
  authState: {
    superAdmin: false,
    permissions: new Set<string>(["*"]),
  },
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    accessToken: "admin-token",
    user: {
      username: "admin",
      role: authState.superAdmin ? "SUPER_ADMIN" : "ADMIN",
    },
    logout: vi.fn(),
    hasRole: (role: string) =>
      role === "SUPER_ADMIN" ? authState.superAdmin : role === "ADMIN",
    hasPermission: (code: string) =>
      authState.permissions.has("*") || authState.permissions.has(code),
  }),
}));

vi.mock("../context/AdminDataContext", () => ({
  useAdminData: () => ({
    orders: [],
    dealers: [],
    posts: [],
    discountRules: [],
    users: [],
    ensureResourceLoaded: ensureResourceLoadedMock,
    reloadResource: reloadResourceMock,
  }),
}));

vi.mock("../context/ProductsContext", () => ({
  useProducts: () => ({
    products: [],
  }),
}));

vi.mock("../context/LanguageContext", () => ({
  useLanguage: () => ({
    language: "vi",
    t: (value: string) => value,
  }),
}));

vi.mock("../context/ToastContext", () => ({
  useToast: () => ({
    notify: notifyMock,
  }),
}));

vi.mock("../components/LanguageSwitcher", () => ({
  default: () => <div>Language Switcher</div>,
}));

vi.mock("../hooks/useTheme", () => ({
  useTheme: () => ({
    theme: "light",
    toggleTheme: toggleThemeMock,
  }),
}));

vi.mock("../hooks/useBodyScrollLock", () => ({
  useBodyScrollLock: () => undefined,
}));

vi.mock("../hooks/useOverlaySurface", () => ({
  useOverlaySurface: () => undefined,
}));

vi.mock("../hooks/useAdminWebSocket", () => ({
  useAdminWebSocket: () => undefined,
}));

vi.mock("../lib/adminRealtime", () => ({
  emitAdminRealtimeNotification: vi.fn(),
}));

const renderLayout = () =>
  render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<AppLayoutRevamp />}>
          <Route index element={<div>Dashboard content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );

describe("AppLayoutRevamp", () => {
  beforeEach(() => {
    ensureResourceLoadedMock.mockReset();
    reloadResourceMock.mockReset();
    notifyMock.mockReset();
    toggleThemeMock.mockReset();
    authState.superAdmin = true;
    authState.permissions = new Set<string>(["*"]);
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("does not preload search resources until the operator opens search", async () => {
    renderLayout();

    expect(ensureResourceLoadedMock).not.toHaveBeenCalled();

    fireEvent.focus(
      screen.getByRole("combobox", {
        name: "Tìm đơn hàng, SKU, đại lý, bài viết...",
      }),
    );

    await waitFor(() => {
      expect(new Set(ensureResourceLoadedMock.mock.calls.map(([key]) => key))).toEqual(
        new Set(["orders", "dealers", "posts", "discountRules", "users"]),
      );
    });
  });

  it("loads only alert resources when the operational alerts popover opens", async () => {
    renderLayout();

    fireEvent.click(screen.getByRole("button", { name: "Cảnh báo vận hành" }));

    await waitFor(() => {
      expect(new Set(ensureResourceLoadedMock.mock.calls.map(([key]) => key))).toEqual(
        new Set(["orders", "dealers", "posts", "users"]),
      );
    });
  });

  it("shows only the nav modules a restricted (WAREHOUSE-like) role may access", () => {
    // A warehouse-scoped account: reads/serials/warranties/returns/orders — no products, discounts,
    // dealers, payments, or SUPER_ADMIN-only surfaces.
    authState.superAdmin = false;
    authState.permissions = new Set<string>([
      "dashboard.read",
      "orders.read",
      "orders.process",
      "serials.read",
      "serials.write",
      "serials.assign",
      "warranties.read",
      "warranties.write",
      "returns.read",
      "returns.write",
      "notifications.read",
    ]);

    renderLayout();

    // Permitted modules render (twice: desktop + mobile sidebar).
    expect(screen.getAllByText("Serial").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Bảo hành").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Đổi trả").length).toBeGreaterThan(0);

    // Modules the role cannot reach are hidden from the nav entirely.
    expect(screen.queryAllByText("Chiết khấu sỉ")).toHaveLength(0);
    expect(screen.queryAllByText("Thư viện media")).toHaveLength(0);
    expect(screen.queryAllByText("Người dùng")).toHaveLength(0);
    expect(screen.queryAllByText("Cài đặt")).toHaveLength(0);
  });
});
