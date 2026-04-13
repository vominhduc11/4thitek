// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ReturnsPageRevamp from "./ReturnsPageRevamp";

const { fetchAdminReturnsPagedMock, notifyMock } = vi.hoisted(() => ({
  fetchAdminReturnsPagedMock: vi.fn(),
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

vi.mock("../lib/adminApi", async () => {
  const actual = await vi.importActual("../lib/adminApi");
  return {
    ...actual,
    fetchAdminReturnsPaged: fetchAdminReturnsPagedMock,
  };
});

const renderPage = (initialEntry = "/returns") =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/returns" element={<ReturnsPageRevamp />} />
        <Route path="/returns/:id" element={<div>Return detail route</div>} />
      </Routes>
    </MemoryRouter>,
  );

const returnPayload = {
  id: 11,
  requestCode: "RET-11",
  dealerId: 5,
  dealerName: "Dealer A",
  orderId: 101,
  orderCode: "DH-001",
  type: "DEFECTIVE_RETURN",
  status: "SUBMITTED",
  requestedResolution: "REPLACE",
  reasonCode: null,
  reasonDetail: null,
  supportTicketId: 3,
  requestedAt: "2026-04-12T09:30:00Z",
  reviewedAt: null,
  receivedAt: null,
  completedAt: null,
  createdAt: "2026-04-12T09:30:00Z",
  updatedAt: "2026-04-12T09:30:00Z",
  totalItems: 2,
  requestedItems: 2,
  approvedItems: 0,
  rejectedItems: 0,
  resolvedItems: 0,
} as const;

describe("ReturnsPageRevamp", () => {
  beforeEach(() => {
    fetchAdminReturnsPagedMock.mockReset();
    notifyMock.mockReset();
    fetchAdminReturnsPagedMock.mockResolvedValue({
      items: [returnPayload],
      page: 0,
      totalPages: 1,
      totalElements: 1,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("loads returns from the paged endpoint", async () => {
    renderPage();

    await waitFor(() => {
      expect(fetchAdminReturnsPagedMock).toHaveBeenCalledWith("admin-token", {
        page: 0,
        size: 20,
        sortBy: "createdAt",
        sortDir: "desc",
        status: undefined,
        type: undefined,
        dealer: undefined,
        orderCode: undefined,
        serial: undefined,
      });
    });

    expect(await screen.findAllByText("RET-11")).toHaveLength(2);
  });

  it("applies status filter using backend params", async () => {
    renderPage();
    await screen.findAllByText("RET-11");

    fireEvent.change(screen.getByLabelText("Return status filter"), {
      target: { value: "UNDER_REVIEW" },
    });

    await waitFor(() => {
      expect(fetchAdminReturnsPagedMock).toHaveBeenLastCalledWith(
        "admin-token",
        {
          page: 0,
          size: 20,
          sortBy: "createdAt",
          sortDir: "desc",
          status: "UNDER_REVIEW",
          type: undefined,
          dealer: undefined,
          orderCode: undefined,
          serial: undefined,
        },
      );
    });
  });
});
