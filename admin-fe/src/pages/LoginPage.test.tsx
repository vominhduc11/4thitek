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
      screen.getByText("Your admin email address must be verified before you can sign in."),
    ).toBeTruthy();
    expect(
      screen.getByText(
        "Check your inbox and spam folder for the verification email, then try signing in again.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Resend verification email" }),
    ).toBeTruthy();
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
    await screen.findByRole("button", { name: "Resend verification email" });

    await user.click(
      screen.getByRole("button", { name: "Resend verification email" }),
    );

    await waitFor(() => {
      expect(resendAdminEmailVerificationMock).toHaveBeenCalledWith(
        "ops@example.com",
      );
    });

    expect(
      await screen.findByText(
        "If an unverified admin account exists for this identity, a verification email has been sent.",
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
        "Your admin account needs an email address before sign-in can continue. Please contact your system owner.",
      ),
    ).toBeTruthy();
  });
});
