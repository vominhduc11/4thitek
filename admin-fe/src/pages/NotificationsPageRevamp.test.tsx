// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import NotificationsPageRevamp from "./NotificationsPageRevamp";

const {
  fetchAdminNotificationsMock,
  fetchAllAdminNotificationsMock,
  createAdminNotificationDispatchMock,
  subscribeAdminRealtimeNotificationMock,
  notifyMock,
  hasPermissionMock,
} = vi.hoisted(() => ({
  fetchAdminNotificationsMock: vi.fn(),
  fetchAllAdminNotificationsMock: vi.fn(),
  createAdminNotificationDispatchMock: vi.fn(),
  subscribeAdminRealtimeNotificationMock: vi.fn(),
  notifyMock: vi.fn(),
  hasPermissionMock: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    accessToken: "admin-token",
    hasPermission: hasPermissionMock,
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

vi.mock("../lib/adminRealtime", () => ({
  subscribeAdminRealtimeNotification: subscribeAdminRealtimeNotificationMock,
}));

vi.mock("../lib/adminApi", async () => {
  const actual = await vi.importActual("../lib/adminApi");
  return {
    ...actual,
    fetchAdminNotifications: fetchAdminNotificationsMock,
    fetchAllAdminNotifications: fetchAllAdminNotificationsMock,
    createAdminNotificationDispatch: createAdminNotificationDispatchMock,
  };
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <NotificationsPageRevamp />
    </MemoryRouter>,
  );

const notificationPayload = {
  id: 101,
  accountId: 10,
  accountName: "Dealer A",
  accountType: "DEALER",
  title: "Warehouse update",
  body: "Serial batch is ready",
  isRead: false,
  type: "SYSTEM",
  link: "/orders/101",
  deepLink: null,
  createdAt: "2026-04-10T00:00:00Z",
} as const;

describe("NotificationsPageRevamp", () => {
  beforeEach(() => {
    fetchAdminNotificationsMock.mockReset();
    fetchAllAdminNotificationsMock.mockReset();
    createAdminNotificationDispatchMock.mockReset();
    subscribeAdminRealtimeNotificationMock.mockReset();
    notifyMock.mockReset();
    hasPermissionMock.mockReset();
    hasPermissionMock.mockReturnValue(true);

    fetchAdminNotificationsMock.mockResolvedValue({
      items: [notificationPayload],
      page: 0,
      totalPages: 1,
      totalElements: 1,
    });
    fetchAllAdminNotificationsMock.mockResolvedValue([notificationPayload]);
    createAdminNotificationDispatchMock.mockResolvedValue({
      audience: "DEALERS",
      type: "SYSTEM",
      recipientCount: 1,
      recipientIds: [10],
      dispatchedAt: "2026-04-10T00:00:00Z",
    });
    subscribeAdminRealtimeNotificationMock.mockReturnValue(() => {});
  });

  afterEach(() => {
    cleanup();
  });

  it("keeps the default list paged and subscribes to realtime invalidation", async () => {
    renderPage();

    await waitFor(() => {
      expect(fetchAdminNotificationsMock).toHaveBeenCalledWith("admin-token", {
        page: 0,
        size: 25,
      });
    });

    expect(fetchAllAdminNotificationsMock).not.toHaveBeenCalled();
    expect(subscribeAdminRealtimeNotificationMock).toHaveBeenCalledTimes(1);
    expect(await screen.findAllByText("Warehouse update")).toHaveLength(2);
    expect(
      screen.getByRole("heading", { name: "Trung tâm thông báo" }),
    ).toBeTruthy();
    expect(screen.getAllByRole("link", { name: "Mở liên kết" })).not.toHaveLength(0);
    expect(screen.queryByText(/Liên kết:/i)).toBeNull();
    expect(screen.queryByText(/Deep link:/i)).toBeNull();
  });

  it("disables the send button with a tooltip when notifications.write is missing", async () => {
    hasPermissionMock.mockImplementation(
      (code: string) => code !== "notifications.write",
    );

    renderPage();

    const sendButton = await screen.findByRole("button", {
      name: "Gửi thông báo",
    });
    expect(sendButton.hasAttribute("disabled")).toBe(true);
    expect(sendButton.getAttribute("title")).toBe(
      "Bạn không có quyền thực hiện thao tác này",
    );
  });

  it("keeps the send button enabled when notifications.write is granted", async () => {
    renderPage();

    const sendButton = await screen.findByRole("button", {
      name: "Gửi thông báo",
    });
    expect(sendButton.hasAttribute("disabled")).toBe(false);
    expect(sendButton.getAttribute("title")).toBeNull();
  });

  it("uses fetch-all only after a search query is entered", async () => {
    renderPage();

    await screen.findAllByText("Warehouse update");
    fireEvent.change(
      screen.getByRole("searchbox", { name: "Tìm trong trung tâm thông báo" }),
      { target: { value: "warehouse" } },
    );

    await waitFor(() => {
      expect(fetchAllAdminNotificationsMock).toHaveBeenCalledWith(
        "admin-token",
        100,
      );
    });
  });
});
