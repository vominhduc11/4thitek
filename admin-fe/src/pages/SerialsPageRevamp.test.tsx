// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SerialsPageRevamp from "./SerialsPageRevamp";

const {
  fetchAdminSerialsPagedMock,
  fetchAllAdminSerialsMock,
  notifyMock,
} = vi.hoisted(() => ({
  fetchAdminSerialsPagedMock: vi.fn(),
  fetchAllAdminSerialsMock: vi.fn(),
  notifyMock: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ accessToken: "admin-token" }),
}));

vi.mock("../context/LanguageContext", () => ({
  useLanguage: () => ({ language: "vi", t: (value: string) => value }),
}));

vi.mock("../context/ToastContext", () => ({
  useToast: () => ({ notify: notifyMock }),
}));

vi.mock("../context/ProductsContext", () => ({
  useProducts: () => ({ products: [] }),
}));

vi.mock("../hooks/useConfirmDialog", () => ({
  useConfirmDialog: () => ({
    confirm: vi.fn().mockResolvedValue(true),
    confirmDialog: null,
  }),
}));

vi.mock("../hooks/useBodyScrollLock", () => ({
  useBodyScrollLock: () => {},
}));

vi.mock("../hooks/useOverlaySurface", () => ({
  useOverlaySurface: () => {},
}));

vi.mock("../lib/adminApi", async () => {
  const actual = await vi.importActual("../lib/adminApi");
  return {
    ...actual,
    fetchAdminSerialsPaged: fetchAdminSerialsPagedMock,
    fetchAllAdminSerials: fetchAllAdminSerialsMock,
  };
});

const serialPayload = {
  id: 501,
  serial: "SN-XYZ",
  productName: "Intercom Pro",
  productSku: "IC-PRO",
  dealerName: "Dealer A",
  customerName: null,
  pendingDealerName: null,
  orderCode: "DH-501",
  status: "AVAILABLE",
  importedAt: "2026-01-01T00:00:00Z",
} as const;

describe("SerialsPageRevamp", () => {
  beforeEach(() => {
    fetchAdminSerialsPagedMock.mockReset();
    fetchAllAdminSerialsMock.mockReset();
    notifyMock.mockReset();

    fetchAdminSerialsPagedMock.mockResolvedValue({
      items: [serialPayload],
      page: 0,
      totalPages: 1,
      totalElements: 1,
    });
    fetchAllAdminSerialsMock.mockResolvedValue([serialPayload]);
  });

  afterEach(() => {
    cleanup();
  });

  it("loads paged rows and a separate full dataset for global stats", async () => {
    render(<SerialsPageRevamp />);

    await waitFor(() => {
      expect(fetchAdminSerialsPagedMock).toHaveBeenCalledWith("admin-token", {
        page: 0,
        size: 25,
      });
    });
    expect(fetchAllAdminSerialsMock).toHaveBeenCalledWith("admin-token", 100);
    // Rendered once in the mobile card and once in the desktop table.
    expect(await screen.findAllByText("SN-XYZ")).toHaveLength(2);
  });
});
