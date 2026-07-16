// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DealersPageRevamp from "./DealersPageRevamp";

const {
  fetchAdminDealerAccountsPagedMock,
  fetchAdminDealerAccountSummaryMock,
  notifyMock,
} = vi.hoisted(() => ({
  fetchAdminDealerAccountsPagedMock: vi.fn(),
  fetchAdminDealerAccountSummaryMock: vi.fn(),
  notifyMock: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ accessToken: "admin-token", hasPermission: () => true }),
}));

vi.mock("../context/LanguageContext", () => ({
  useLanguage: () => ({ language: "vi", t: (value: string) => value }),
}));

vi.mock("../context/ToastContext", () => ({
  useToast: () => ({ notify: notifyMock }),
}));

vi.mock("../context/AdminDataContext", () => ({
  useAdminData: () => ({ updateDealerStatus: vi.fn() }),
}));

vi.mock("../hooks/useConfirmDialog", () => ({
  useConfirmDialog: () => ({
    confirm: vi.fn().mockResolvedValue(true),
    prompt: vi.fn().mockResolvedValue("reason"),
    confirmDialog: null,
    promptDialog: null,
  }),
}));

// Keep the real mappers except mapDealer, so the paged items can be provided in
// the already-mapped Dealer shape directly.
vi.mock("../lib/adminDataMappers", async () => {
  const actual = await vi.importActual<typeof import("../lib/adminDataMappers")>(
    "../lib/adminDataMappers",
  );
  return {
    ...actual,
    mapDealer: (dealer: unknown) => dealer,
  };
});

vi.mock("../lib/adminApi", async () => {
  const actual = await vi.importActual("../lib/adminApi");
  return {
    ...actual,
    fetchAdminDealerAccountsPaged: fetchAdminDealerAccountsPagedMock,
    fetchAdminDealerAccountSummary: fetchAdminDealerAccountSummaryMock,
  };
});

const dealerPayload = {
  id: "DL-1",
  name: "Dealer One",
  email: "dealer1@example.com",
  contactName: "Nguyen Van A",
  status: "active",
  orders: 12,
  revenue: 4500000,
  lastOrderAt: "2026-04-10T00:00:00Z",
  allowedTransitions: ["SUSPENDED"],
} as const;

describe("DealersPageRevamp", () => {
  beforeEach(() => {
    fetchAdminDealerAccountsPagedMock.mockReset();
    fetchAdminDealerAccountSummaryMock.mockReset();
    notifyMock.mockReset();

    fetchAdminDealerAccountsPagedMock.mockResolvedValue({
      items: [dealerPayload],
      page: 0,
      totalPages: 1,
      totalElements: 1,
    });
    fetchAdminDealerAccountSummaryMock.mockResolvedValue({
      total: 1,
      active: 1,
      underReview: 0,
      suspended: 0,
      totalRevenue: 4500000,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("loads dealers from the paged + summary endpoints (server-driven)", async () => {
    render(
      <MemoryRouter>
        <DealersPageRevamp />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(fetchAdminDealerAccountsPagedMock).toHaveBeenCalledWith("admin-token", {
        page: 0,
        size: 25,
        status: undefined,
        query: undefined,
      });
    });
    expect(fetchAdminDealerAccountSummaryMock).toHaveBeenCalledWith("admin-token");
    // Rendered once in the mobile card and once in the desktop table.
    expect(await screen.findAllByText("Dealer One")).toHaveLength(2);
  });
});
