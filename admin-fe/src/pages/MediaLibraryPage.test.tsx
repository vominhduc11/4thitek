// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import MediaLibraryPage from "./MediaLibraryPage";

const {
  fetchAdminMediaListMock,
  fetchAdminMediaSummaryMock,
  fetchMediaAccessUrlMock,
  softDeleteAdminMediaMock,
  hardDeleteAdminMediaMock,
  notifyMock,
} = vi.hoisted(() => ({
  fetchAdminMediaListMock: vi.fn(),
  fetchAdminMediaSummaryMock: vi.fn(),
  fetchMediaAccessUrlMock: vi.fn(),
  softDeleteAdminMediaMock: vi.fn(),
  hardDeleteAdminMediaMock: vi.fn(),
  notifyMock: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ accessToken: "admin-token" }),
}));

vi.mock("../context/LanguageContext", () => ({
  useLanguage: () => ({ t: (value: string) => value }),
}));

vi.mock("../context/ToastContext", () => ({
  useToast: () => ({ notify: notifyMock }),
}));

vi.mock("../lib/adminApi", async () => {
  const actual = await vi.importActual("../lib/adminApi");
  return {
    ...actual,
    fetchAdminMediaList: fetchAdminMediaListMock,
    fetchAdminMediaSummary: fetchAdminMediaSummaryMock,
    fetchMediaAccessUrl: fetchMediaAccessUrlMock,
    softDeleteAdminMedia: softDeleteAdminMediaMock,
    hardDeleteAdminMedia: hardDeleteAdminMediaMock,
  };
});

describe("MediaLibraryPage", () => {
  beforeEach(() => {
    fetchAdminMediaListMock.mockReset();
    fetchAdminMediaSummaryMock.mockReset();
    fetchMediaAccessUrlMock.mockReset();
    softDeleteAdminMediaMock.mockReset();
    hardDeleteAdminMediaMock.mockReset();
    notifyMock.mockReset();

    fetchAdminMediaListMock.mockResolvedValue({
      items: [
        {
          id: 22,
          fileName: "evidence.mp4",
          mediaType: "video",
          contentType: "video/mp4",
          sizeBytes: 2048,
          category: "support_ticket",
          status: "active",
          linkedTicketId: 101,
          linkedTicketCode: "TK-001",
          linkedDealerName: "Dealer A",
          uploadedByName: "Admin",
        },
      ],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
      sortBy: "createdAt",
    });
    fetchAdminMediaSummaryMock.mockResolvedValue({
      totalFiles: 1,
      totalBytes: 2048,
      imageBytes: 0,
      videoBytes: 2048,
      documentBytes: 0,
      pendingBytes: 0,
      orphanedBytes: 0,
    });
    fetchMediaAccessUrlMock.mockResolvedValue({
      mediaAssetId: 22,
      accessUrl: "https://cdn.example.com/media/22.mp4",
    });
    softDeleteAdminMediaMock.mockResolvedValue({});
    hardDeleteAdminMediaMock.mockResolvedValue({ status: "deleted" });

    vi.spyOn(window, "open").mockImplementation(() => null);
    vi.spyOn(window, "confirm").mockReturnValue(true);
    vi.spyOn(window, "prompt").mockReturnValue("cleanup");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    cleanup();
  });

  it("renders list and applies query filter on reload", async () => {
    render(<MediaLibraryPage />);

    expect(await screen.findByText("evidence.mp4")).toBeTruthy();
    expect(fetchAdminMediaListMock).toHaveBeenCalledWith(
      "admin-token",
      expect.objectContaining({ page: 0, size: 20 }),
    );

    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "TK-001" },
    });

    await waitFor(() => {
      expect(fetchAdminMediaListMock).toHaveBeenLastCalledWith(
        "admin-token",
        expect.objectContaining({ query: "TK-001" }),
      );
    });
  });

  it("requests confirmation and archives active evidence", async () => {
    render(<MediaLibraryPage />);
    await screen.findByText("evidence.mp4");

    fireEvent.click(screen.getByRole("button", { name: "Archive" }));

    await waitFor(() => {
      expect(softDeleteAdminMediaMock).toHaveBeenCalledWith(
        "admin-token",
        22,
        expect.objectContaining({
          force: true,
          reason: "cleanup",
        }),
      );
    });
  });
});
