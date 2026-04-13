// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import LoginPage from "./LoginPage";

const {
  notifyMock,
  loginMock,
  resendAdminEmailVerificationMock,
  MockAuthApiError,
  translateMock,
  setLanguageMock,
} = vi.hoisted(() => {
  class HoistedAuthApiError extends Error {
    code?: string;

    constructor(message: string, code?: string) {
      super(message);
      this.name = "AuthApiError";
      this.code = code;
    }
  }

  return {
    notifyMock: vi.fn(),
    loginMock: vi.fn(),
    resendAdminEmailVerificationMock: vi.fn(),
    MockAuthApiError: HoistedAuthApiError,
    translateMock: (key: string) => key,
    setLanguageMock: vi.fn(),
  };
});

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    login: loginMock,
    isLoggingIn: false,
  }),
}));

vi.mock("../context/LanguageContext", () => ({
  useLanguage: () => ({
    language: "vi",
    setLanguage: setLanguageMock,
    t: translateMock,
  }),
}));

vi.mock("../context/ToastContext", () => ({
  useToast: () => ({
    notify: notifyMock,
  }),
}));

vi.mock("../lib/authApi", () => ({
  AuthApiError: MockAuthApiError,
  resendAdminEmailVerification: resendAdminEmailVerificationMock,
}));

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/login"]}>
      <LoginPage />
    </MemoryRouter>,
  );

describe("LoginPage", () => {
  beforeEach(() => {
    loginMock.mockReset();
    resendAdminEmailVerificationMock.mockReset();
    notifyMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows the unverified-email guidance and resend CTA when login is blocked", async () => {
    loginMock.mockResolvedValue({
      ok: false,
      code: "ADMIN_EMAIL_UNVERIFIED",
      message:
        "Admin email verification is required before sign in. Please check your inbox or request a new verification email.",
    });

    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText("Nhập tên đăng nhập"), "ops@example.com");
    await user.type(screen.getByPlaceholderText("Nhập mật khẩu"), "ChangedPass#456");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        username: "ops@example.com",
        password: "ChangedPass#456",
        remember: true,
      });
    });

    expect(
      screen.getByText("Email admin cần được xác thực trước khi bạn có thể đăng nhập."),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Kiểm tra hộp thư đến và thư rác để tìm email xác thực, sau đó thử đăng nhập lại.",
      ),
    ).toBeTruthy();
    expect(screen.getByRole("button", { name: "Gửi lại email xác thực" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Quên mật khẩu?" }).getAttribute("href")).toBe("/forgot-password");
  });

  it("resends the verification email for the entered identity", async () => {
    loginMock.mockResolvedValue({
      ok: false,
      code: "ADMIN_EMAIL_UNVERIFIED",
      message:
        "Admin email verification is required before sign in. Please check your inbox or request a new verification email.",
    });
    resendAdminEmailVerificationMock.mockResolvedValue({
      status: "queued",
      message:
        "If an unverified admin account exists for this identity, a verification email has been sent.",
    });

    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText("Nhập tên đăng nhập"), "ops@example.com");
    await user.type(screen.getByPlaceholderText("Nhập mật khẩu"), "ChangedPass#456");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));
    await screen.findByRole("button", { name: "Gửi lại email xác thực" });

    await user.click(screen.getByRole("button", { name: "Gửi lại email xác thực" }));

    await waitFor(() => {
      expect(resendAdminEmailVerificationMock).toHaveBeenCalledWith("ops@example.com");
    });

    expect(
      await screen.findByText(
        "Nếu định danh này tương ứng với một tài khoản admin chưa xác thực, email xác thực đã được gửi.",
      ),
    ).toBeTruthy();
  });

  it("shows contact guidance when login is blocked because the admin has no email", async () => {
    loginMock.mockResolvedValue({
      ok: false,
      code: "ADMIN_EMAIL_REQUIRED",
      message:
        "Admin email is required before sign in. Please contact your system owner.",
    });

    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText("Nhập tên đăng nhập"), "ops-no-email");
    await user.type(screen.getByPlaceholderText("Nhập mật khẩu"), "ChangedPass#456");
    await user.click(screen.getByRole("button", { name: "Đăng nhập" }));

    expect(
      await screen.findByText(
        "Tài khoản admin cần có email trước khi có thể tiếp tục đăng nhập. Vui lòng liên hệ chủ hệ thống.",
      ),
    ).toBeTruthy();
  });
});
