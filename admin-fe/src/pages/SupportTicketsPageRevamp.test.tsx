// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SupportTicketsPageRevamp, {
  SupportAttachmentView,
} from "./SupportTicketsPageRevamp";

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

const renderPage = () =>
  render(
    <MemoryRouter>
      <SupportTicketsPageRevamp />
    </MemoryRouter>,
  );

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

  it("switches to fetch-all only when the operator activates search", async () => {
    renderPage();

    await screen.findByText("TK-001");
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "invoice" },
    });

    await waitFor(() => {
      expect(fetchAllAdminSupportTicketsMock).toHaveBeenCalledWith(
        "admin-token",
        100,
      );
    });
  });

  it("renders image attachments as thumbnails and falls back to a file link on load error", () => {
    render(
      <SupportAttachmentView
        attachment={{
          url: "https://cdn.example.com/files/proof.jpg",
          resolvedUrl: "https://cdn.example.com/files/proof.jpg",
          fileName: "proof.jpg",
        }}
        t={(value) => value}
      />,
    );

    const image = screen.getByRole("img", { name: "proof.jpg" });
    expect(image).toBeTruthy();

    fireEvent.error(image);

    expect(screen.queryByRole("img", { name: "proof.jpg" })).toBeNull();
    expect(screen.getByRole("link", { name: "proof.jpg" })).toBeTruthy();
  });

  it("uses the resolved attachment URL for links and previews", () => {
    render(
      <SupportAttachmentView
        attachment={{
          url: "support/evidence/dealers/1/proof.jpg",
          resolvedUrl:
            "https://api.4thitek.vn/api/v1/upload/support/evidence/dealers/1/proof.jpg",
          fileName: "proof.jpg",
        }}
        t={(value) => value}
      />,
    );

    const link = screen.getByRole("link", { name: "proof.jpg" });
    expect(link.getAttribute("href")).toBe(
      "https://api.4thitek.vn/api/v1/upload/support/evidence/dealers/1/proof.jpg",
    );
    const image = screen.getByRole("img", { name: "proof.jpg" });
    expect(image.getAttribute("src")).toBe(
      "https://api.4thitek.vn/api/v1/upload/support/evidence/dealers/1/proof.jpg",
    );
  });

  it("normalizes thread attachment URL and display name from legacy stored-path payload", async () => {
    fetchAdminSupportTicketsMock.mockResolvedValue({
      items: [
        {
          ...ticketPayload,
          messages: [
            ...ticketPayload.messages,
            {
              id: 2,
              authorRole: "ADMIN",
              authorName: "Agent",
              internalNote: false,
              message: "Attached evidence",
              attachments: [
                {
                  url: "support/evidence/dealers/1/9d0e914f-proof.jpg",
                  fileName: "support/evidence/dealers/1/9d0e914f-proof.jpg",
                },
              ],
              createdAt: "2026-04-10T01:00:00Z",
            },
          ],
        },
      ],
      page: 0,
      totalPages: 1,
      totalElements: 1,
    });

    renderPage();

    await screen.findByText("Attached evidence");
    const link = screen.getByRole("link", { name: "9d0e914f-proof.jpg" });

    expect(link.getAttribute("href")).toContain(
      "/api/v1/upload/support/evidence/dealers/1/9d0e914f-proof.jpg",
    );
  });

  it("keeps non-image attachments as file links", () => {
    render(
      <SupportAttachmentView
        attachment={{
          url: "https://cdn.example.com/files/reconciliation.xlsx",
          resolvedUrl: "https://cdn.example.com/files/reconciliation.xlsx",
          fileName: "reconciliation.xlsx",
        }}
        t={(value) => value}
      />,
    );

    expect(screen.queryByRole("img")).toBeNull();
    expect(
      screen.getByRole("link", { name: "reconciliation.xlsx" }),
    ).toBeTruthy();
  });
});
