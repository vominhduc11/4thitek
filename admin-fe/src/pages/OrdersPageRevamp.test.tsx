// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import OrdersPageRevamp from "./OrdersPageRevamp";

const {
  fetchAdminOrdersPagedMock,
  fetchAdminOrderSummaryMock,
  notifyMock,
  deleteOrderMock,
  updateOrderStatusMock,
} = vi.hoisted(() => ({
  fetchAdminOrdersPagedMock: vi.fn(),
  fetchAdminOrderSummaryMock: vi.fn(),
  notifyMock: vi.fn(),
  deleteOrderMock: vi.fn(),
  updateOrderStatusMock: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    accessToken: "admin-token",
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

vi.mock("../context/AdminDataContext", () => ({
  useAdminData: () => ({
    deleteOrder: deleteOrderMock,
    updateOrderStatus: updateOrderStatusMock,
  }),
}));

vi.mock("../hooks/useConfirmDialog", () => ({
  useConfirmDialog: () => ({
    confirm: vi.fn().mockResolvedValue(true),
    confirmDialog: null,
  }),
}));

vi.mock("../lib/adminApi", async () => {
  const actual = await vi.importActual("../lib/adminApi");
  return {
    ...actual,
    fetchAdminOrdersPaged: fetchAdminOrdersPagedMock,
    fetchAdminOrderSummary: fetchAdminOrderSummaryMock,
  };
});

const renderPage = (initialEntry = "/orders") =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <OrdersPageRevamp />
    </MemoryRouter>,
  );

const orderPayload = {
  id: 101,
  orderCode: "DH-001",
  dealerName: "Dealer A",
  status: "PENDING",
  paymentMethod: "BANK_TRANSFER",
  paymentStatus: "PENDING",
  paidAmount: 0,
  totalAmount: 110000,
  outstandingAmount: 110000,
  itemCount: 1,
  address: "123 Duong A",
  note: null,
  createdAt: "2026-04-10T00:00:00Z",
  orderItems: [],
  staleReviewRequired: false,
  shippingOverdue: false,
  allowedTransitions: ["CONFIRMED", "CANCELLED"],
} as const;

describe("OrdersPageRevamp", () => {
  beforeEach(() => {
    fetchAdminOrdersPagedMock.mockReset();
    fetchAdminOrderSummaryMock.mockReset();
    notifyMock.mockReset();
    deleteOrderMock.mockReset();
    updateOrderStatusMock.mockReset();

    fetchAdminOrdersPagedMock.mockResolvedValue({
      items: [orderPayload],
      page: 0,
      totalPages: 1,
      totalElements: 1,
    });
    fetchAdminOrderSummaryMock.mockResolvedValue({
      total: 1,
      pending: 1,
      shipping: 0,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("loads the orders page from paged and summary endpoints", async () => {
    renderPage();

    await waitFor(() => {
      expect(fetchAdminOrdersPagedMock).toHaveBeenCalledWith("admin-token", {
        page: 0,
        size: 25,
        query: undefined,
        status: undefined,
      });
    });
    expect(fetchAdminOrderSummaryMock).toHaveBeenCalledWith("admin-token");
    expect(await screen.findAllByText("DH-001")).toHaveLength(2);
  });

  it("keeps search server-driven instead of filtering a preloaded full dataset", async () => {
    renderPage();

    await screen.findAllByText("DH-001");
    fireEvent.change(screen.getByRole("searchbox", { name: "Tìm đơn hàng" }), {
      target: { value: "DH-002" },
    });

    await waitFor(() => {
      expect(fetchAdminOrdersPagedMock).toHaveBeenLastCalledWith(
        "admin-token",
        {
          page: 0,
          size: 25,
          query: "DH-002",
          status: undefined,
        },
      );
    });
  });

  it("hydrates status filter from the URL query string", async () => {
    renderPage("/orders?status=confirmed");

    await waitFor(() => {
      expect(fetchAdminOrdersPagedMock).toHaveBeenCalledWith("admin-token", {
        page: 0,
        size: 25,
        query: undefined,
        status: "CONFIRMED",
      });
    });
  });
});
