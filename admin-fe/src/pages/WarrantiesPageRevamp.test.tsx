// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import WarrantiesPageRevamp from "./WarrantiesPageRevamp";

const {
  fetchAdminWarrantiesMock,
  fetchAllAdminWarrantiesMock,
  updateAdminWarrantyStatusMock,
  notifyMock,
} = vi.hoisted(() => ({
  fetchAdminWarrantiesMock: vi.fn(),
  fetchAllAdminWarrantiesMock: vi.fn(),
  updateAdminWarrantyStatusMock: vi.fn(),
  notifyMock: vi.fn(),
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
    fetchAdminWarranties: fetchAdminWarrantiesMock,
    fetchAllAdminWarranties: fetchAllAdminWarrantiesMock,
    updateAdminWarrantyStatus: updateAdminWarrantyStatusMock,
  };
});

const renderPage = () => render(<WarrantiesPageRevamp />);

const warrantyPayload = {
  id: 101,
  warrantyCode: "WAR-001",
  serial: "SN-001",
  productName: "Router AX",
  productSku: "AX-1",
  dealerName: "Dealer A",
  customerName: "Nguyen Van A",
  customerEmail: "a@example.com",
  customerPhone: "0901234567",
  status: "ACTIVE",
  warrantyStart: "2026-01-01T00:00:00Z",
  warrantyEnd: "2027-01-01T00:00:00Z",
  remainingDays: 180,
  createdAt: "2026-01-01T00:00:00Z",
} as const;

describe("WarrantiesPageRevamp", () => {
  beforeEach(() => {
    fetchAdminWarrantiesMock.mockReset();
    fetchAllAdminWarrantiesMock.mockReset();
    updateAdminWarrantyStatusMock.mockReset();
    notifyMock.mockReset();

    fetchAdminWarrantiesMock.mockResolvedValue({
      items: [warrantyPayload],
      page: 0,
      totalPages: 1,
      totalElements: 1,
    });
    fetchAllAdminWarrantiesMock.mockResolvedValue([warrantyPayload]);
    updateAdminWarrantyStatusMock.mockResolvedValue({
      ...warrantyPayload,
      status: "VOID",
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("loads paged rows and a separate full dataset for current global stats", async () => {
    renderPage();

    await waitFor(() => {
      expect(fetchAdminWarrantiesMock).toHaveBeenCalledWith("admin-token", {
        page: 0,
        size: 25,
      });
    });
    expect(fetchAllAdminWarrantiesMock).toHaveBeenCalledWith(
      "admin-token",
      100,
    );
    expect(await screen.findAllByText("WAR-001")).toHaveLength(2);
  });
});
