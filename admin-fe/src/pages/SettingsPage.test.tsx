// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SettingsPage from "./SettingsPage";

const {
  notifyMock,
  updateSettingsMock,
  reloadResourceMock,
  testAdminEmailSettingsMock,
  mockSettings,
} = vi.hoisted(() => ({
  notifyMock: vi.fn(),
  updateSettingsMock: vi.fn(),
  reloadResourceMock: vi.fn(),
  testAdminEmailSettingsMock: vi.fn(),
  mockSettings: {
    emailConfirmation: true,
    sessionTimeoutMinutes: 30,
    orderAlerts: true,
    inventoryAlerts: true,
    vatPercent: 10,
    sepay: {
      enabled: false,
      webhookToken: "masked-token",
      bankName: "VCB",
      accountNumber: "123456789",
      accountHolder: "4T HITEK",
    },
    emailSettings: {
      enabled: true,
      from: "ops@4thitek.local",
      fromName: "Ops Team",
    },
    rateLimitOverrides: {
      enabled: true,
      auth: { requests: 10, windowSeconds: 60 },
      passwordReset: { requests: 5, windowSeconds: 300 },
      warrantyLookup: { requests: 30, windowSeconds: 60 },
      upload: { requests: 20, windowSeconds: 60 },
      webhook: { requests: 120, windowSeconds: 60 },
    },
  },
}));

vi.mock("../context/AdminDataContext", () => ({
  useAdminData: () => ({
    settings: mockSettings,
    settingsState: { status: "success", error: null, lastLoadedAt: Date.now() },
    isSettingsLoading: false,
    isSettingsSaving: false,
    updateSettings: updateSettingsMock,
    reloadResource: reloadResourceMock,
  }),
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
    testAdminEmailSettings: testAdminEmailSettingsMock,
  };
});

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/settings"]}>
      <SettingsPage />
    </MemoryRouter>,
  );

describe("SettingsPage", () => {
  beforeEach(() => {
    updateSettingsMock.mockReset();
    reloadResourceMock.mockReset();
    notifyMock.mockReset();
    testAdminEmailSettingsMock.mockReset();

    updateSettingsMock.mockResolvedValue(undefined);
    testAdminEmailSettingsMock.mockResolvedValue({ status: "queued" });
  });

  afterEach(() => {
    cleanup();
  });

  it("blocks saving when the sender email is invalid", async () => {
    const { container } = renderPage();
    const emailInput = container.querySelector("#settings-email-from") as HTMLInputElement;
    const saveButton = screen.getByRole("button", { name: "Lưu thay đổi" });

    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.blur(emailInput);

    expect(
      await screen.findByText("Email gửi đi không đúng định dạng."),
    ).toBeTruthy();
    expect((saveButton as HTMLButtonElement).disabled).toBe(true);
  });

  it("saves normalized settings changes", async () => {
    const user = userEvent.setup();
    const { container } = renderPage();
    const fromNameInput = container.querySelector("#settings-email-from-name") as HTMLInputElement;

    await user.clear(fromNameInput);
    await user.type(fromNameInput, "  Ops Team Updated  ");
    await user.click(screen.getByRole("button", { name: "Lưu thay đổi" }));

    await waitFor(() => {
      expect(updateSettingsMock).toHaveBeenCalledWith(
        expect.objectContaining({
          emailSettings: expect.objectContaining({
            fromName: "Ops Team Updated",
          }),
        }),
      );
    });

    expect(notifyMock).toHaveBeenCalledWith("Đã lưu cài đặt hệ thống.", {
      title: "Cài đặt hệ thống",
      variant: "success",
    });
  });

  it("sends a test email when email settings are enabled and clean", async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole("button", { name: "Kiểm tra email" }));

    await waitFor(() => {
      expect(testAdminEmailSettingsMock).toHaveBeenCalledWith("admin-token");
    });

    expect(notifyMock).toHaveBeenCalledWith("Email kiểm tra đã được gửi thành công.", {
      title: "Email",
      variant: "success",
    });
  });
});
