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
  uploadSupportMediaAssetMock,
  notifyMock,
} = vi.hoisted(() => ({
  fetchAdminSupportTicketsMock: vi.fn(),
  fetchAllAdminSupportTicketsMock: vi.fn(),
  fetchAdminUsersMock: vi.fn(),
  updateAdminSupportTicketMock: vi.fn(),
  createAdminSupportTicketMessageMock: vi.fn(),
  uploadSupportMediaAssetMock: vi.fn(),
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

vi.mock("../lib/supportMediaUpload", () => ({
  uploadSupportMediaAsset: uploadSupportMediaAssetMock,
}));

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
    uploadSupportMediaAssetMock.mockReset();
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
    uploadSupportMediaAssetMock.mockResolvedValue({
      id: 909,
      downloadUrl: "https://api.example.com/api/v1/media/909/download",
      accessUrl:
        "https://api.example.com/api/v1/media/909/download?token=example",
      originalFileName: "evidence.mp4",
      mediaType: "video",
      contentType: "video/mp4",
      sizeBytes: 1234,
      createdAt: "2026-04-10T00:00:00Z",
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
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

  it("submits mediaAssetIds when reply includes uploaded media", async () => {
    const { container } = renderPage();
    await screen.findByText("TK-001");

    const input = container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement | null;
    expect(input).toBeTruthy();
    if (!input) return;

    const file = new File(["video-bytes"], "evidence.mp4", {
      type: "video/mp4",
    });
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(uploadSupportMediaAssetMock).toHaveBeenCalled();
    });

    const composer = container.querySelector("textarea") as HTMLTextAreaElement | null;
    expect(composer).toBeTruthy();
    if (!composer) return;
    fireEvent.change(composer, { target: { value: "Please see attached video." } });

    const sendButtons = screen.getAllByRole("button", { name: "Gửi cho đại lý" });
    fireEvent.click(sendButtons[sendButtons.length - 1]);

    await waitFor(() => {
      expect(createAdminSupportTicketMessageMock).toHaveBeenCalledWith(
        "admin-token",
        101,
        expect.objectContaining({
          message: "Please see attached video.",
          mediaAssetIds: [909],
        }),
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

  it("downloads private support image attachments with auth before rendering previews", async () => {
    const blobUrl = "blob:proof-image";
    const createObjectURLMock = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue(blobUrl);
    const revokeObjectURLMock = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(new Blob(["proof"], { type: "image/jpeg" }), {
          status: 200,
          headers: { "Content-Type": "image/jpeg" },
        }),
      );

    render(
      <SupportAttachmentView
        attachment={{
          url: "support/evidence/dealers/1/proof.jpg",
          resolvedUrl:
            "https://api.4thitek.vn/api/v1/upload/support/evidence/dealers/1/proof.jpg",
          fileName: "proof.jpg",
        }}
        accessToken="admin-token"
        t={(value) => value}
      />,
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.4thitek.vn/api/v1/upload/support/evidence/dealers/1/proof.jpg",
        {
          headers: {
            Authorization: "Bearer admin-token",
          },
        },
      );
    });

    const image = await screen.findByRole("img", { name: "proof.jpg" });
    expect(image.getAttribute("src")).toBe(blobUrl);
    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLMock).not.toHaveBeenCalled();
  });

  it("uses the direct URL for public attachments", () => {
    render(
      <SupportAttachmentView
        attachment={{
          url: "support/evidence/dealers/1/proof.jpg",
          resolvedUrl: "https://cdn.example.com/files/proof.jpg",
          fileName: "proof.jpg",
        }}
        t={(value) => value}
      />,
    );

    const link = screen.getByRole("link", { name: "proof.jpg" });
    expect(link.getAttribute("href")).toBe(
      "https://cdn.example.com/files/proof.jpg",
    );
    const image = screen.getByRole("img", { name: "proof.jpg" });
    expect(image.getAttribute("src")).toBe(
      "https://cdn.example.com/files/proof.jpg",
    );
  });

  it("downloads private support file attachments with auth before opening them", async () => {
    const blobUrl = "blob:proof-file";
    vi.spyOn(URL, "createObjectURL").mockReturnValue(blobUrl);
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(new Blob(["proof"], { type: "application/pdf" }), {
        status: 200,
        headers: { "Content-Type": "application/pdf" },
      }),
    );

    render(
      <SupportAttachmentView
        attachment={{
          url: "support/evidence/dealers/1/proof.pdf",
          resolvedUrl:
            "https://api.4thitek.vn/api/v1/upload/support/evidence/dealers/1/proof.pdf",
          fileName: "proof.pdf",
        }}
        accessToken="admin-token"
        t={(value) => value}
      />,
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.4thitek.vn/api/v1/upload/support/evidence/dealers/1/proof.pdf",
        {
          headers: {
            Authorization: "Bearer admin-token",
          },
        },
      );
    });

    const link = await screen.findByRole("link", { name: "proof.pdf" });
    expect(link.getAttribute("href")).toBe(blobUrl);
  });

  it("normalizes thread attachment URL and display name from legacy stored-path payload", async () => {
    const blobUrl = "blob:thread-proof";
    vi.spyOn(URL, "createObjectURL").mockReturnValue(blobUrl);
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(new Blob(["proof"], { type: "image/jpeg" }), {
        status: 200,
        headers: { "Content-Type": "image/jpeg" },
      }),
    );

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
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "https://api.4thitek.vn/api/v1/upload/support/evidence/dealers/1/9d0e914f-proof.jpg",
        {
          headers: {
            Authorization: "Bearer admin-token",
          },
        },
      );
    });
    const link = await screen.findByRole("link", { name: "9d0e914f-proof.jpg" });

    expect(link.getAttribute("href")).toBe(blobUrl);
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

  it("renders video attachments as video cards", () => {
    const { container } = render(
      <SupportAttachmentView
        attachment={{
          id: 44,
          url: "https://cdn.example.com/files/evidence.mp4",
          accessUrl: "https://cdn.example.com/files/evidence.mp4",
          resolvedUrl: "https://cdn.example.com/files/evidence.mp4",
          resolvedAccessUrl: "https://cdn.example.com/files/evidence.mp4",
          fileName: "evidence.mp4",
          mediaType: "video",
          contentType: "video/mp4",
          sizeBytes: 1000,
        }}
        t={(value) => value}
      />,
    );

    expect(container.querySelector("video")).toBeTruthy();
    expect(screen.getByRole("link", { name: /evidence.mp4/i })).toBeTruthy();
  });
});
