// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SupportTicketsPageRevamp from "./SupportTicketsPageRevamp";

const {
  fetchAdminSupportTicketsMock,
  fetchAllAdminSupportTicketsMock,
  fetchAdminUsersMock,
  updateAdminSupportTicketMock,
  createAdminSupportTicketMessageMock,
  notifyMock,
} = vi.hoisted(() => ({
  fetchAdminSupportTicketsMock: vi.fn(),
  fetchAllAdminSupportTicketsMock: vi.fn(),
  fetchAdminUsersMock: vi.fn(),
  updateAdminSupportTicketMock: vi.fn(),
  createAdminSupportTicketMessageMock: vi.fn(),
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
    fetchAdminSupportTickets: fetchAdminSupportTicketsMock,
    fetchAllAdminSupportTickets: fetchAllAdminSupportTicketsMock,
    fetchAdminUsers: fetchAdminUsersMock,
    updateAdminSupportTicket: updateAdminSupportTicketMock,
    createAdminSupportTicketMessage: createAdminSupportTicketMessageMock,
  };
});

const renderPage = () => render(<SupportTicketsPageRevamp />);

const ticketPayload = {
  id: 101,
  dealerName: "Dealer A",
  ticketCode: "TK-001",
  priority: "NORMAL",
  status: "OPEN",
  subject: "Need invoice",
  message: "Please resend invoice",
  assigneeId: null,
  assigneeName: null,
  messages: [
    {
      id: 1,
      authorRole: "DEALER",
      authorName: "Dealer A",
      internalNote: false,
      message: "Please resend invoice",
      createdAt: "2026-04-10T00:00:00Z",
    },
  ],
  createdAt: "2026-04-10T00:00:00Z",
  updatedAt: "2026-04-10T00:00:00Z",
  resolvedAt: null,
  closedAt: null,
} as const;

describe("SupportTicketsPageRevamp", () => {
  beforeEach(() => {
    fetchAdminSupportTicketsMock.mockReset();
    fetchAllAdminSupportTicketsMock.mockReset();
    fetchAdminUsersMock.mockReset();
    updateAdminSupportTicketMock.mockReset();
    createAdminSupportTicketMessageMock.mockReset();
    notifyMock.mockReset();

    fetchAdminSupportTicketsMock.mockResolvedValue({
      items: [ticketPayload],
      page: 0,
      totalPages: 1,
      totalElements: 1,
    });
    fetchAllAdminSupportTicketsMock.mockResolvedValue([ticketPayload]);
    fetchAdminUsersMock.mockResolvedValue([]);
    updateAdminSupportTicketMock.mockResolvedValue(ticketPayload);
    createAdminSupportTicketMessageMock.mockResolvedValue(ticketPayload);
  });

  afterEach(() => {
    cleanup();
  });

  it("keeps the default screen on paged loading", async () => {
    renderPage();

    await waitFor(() => {
      expect(fetchAdminSupportTicketsMock).toHaveBeenCalledWith("admin-token", {
        page: 0,
        size: 25,
      });
    });
    expect(fetchAllAdminSupportTicketsMock).not.toHaveBeenCalled();
    expect(fetchAdminUsersMock).toHaveBeenCalledWith("admin-token");
    expect(await screen.findByText("TK-001")).toBeTruthy();
  });

  it("switches to fetch-all only when the operator activates search or filters", async () => {
    renderPage();

    await screen.findByText("TK-001");
    fireEvent.change(screen.getByRole("searchbox", { name: "Tìm ticket" }), {
      target: { value: "invoice" },
    });

    await waitFor(() => {
      expect(fetchAllAdminSupportTicketsMock).toHaveBeenCalledWith(
        "admin-token",
        100,
      );
    });
  });
});
