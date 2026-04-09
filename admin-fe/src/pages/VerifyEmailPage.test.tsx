// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import VerifyEmailPage from "./VerifyEmailPage";

const {
  verifyAdminEmailMock,
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
    verifyAdminEmailMock: vi.fn(),
    MockAuthApiError: HoistedAuthApiError,
    translateMock: (key: string) => key,
    setLanguageMock: vi.fn(),
  };
});

vi.mock("../context/LanguageContext", () => ({
  useLanguage: () => ({
    language: "vi",
    setLanguage: setLanguageMock,
    t: translateMock,
  }),
}));

vi.mock("../lib/authApi", () => ({
  AuthApiError: MockAuthApiError,
  verifyAdminEmail: verifyAdminEmailMock,
}));

const renderPage = (entry: string) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/verify-email" element={<VerifyEmailPage />} />
      </Routes>
    </MemoryRouter>,
  );

describe("VerifyEmailPage", () => {
  beforeEach(() => {
    verifyAdminEmailMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("verifies the token and shows the success state", async () => {
    verifyAdminEmailMock.mockResolvedValue({
      status: "verified",
      message: "Email verification successful. You can now sign in.",
    });

    renderPage("/verify-email?token=valid-token");

    expect(verifyAdminEmailMock).toHaveBeenCalledWith("valid-token");
    expect(await screen.findByRole("heading", { name: "Email đã được xác thực" })).toBeTruthy();
    expect(
      await screen.findByText("Xác thực email thành công. Bạn có thể đăng nhập ngay bây giờ."),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: "Tiếp tục đăng nhập" }).getAttribute("href")).toBe("/login");
  });

  it("shows an expired-token message when verification fails", async () => {
    verifyAdminEmailMock.mockRejectedValue(
      new MockAuthApiError(
        "Email verification token has expired",
        "EMAIL_VERIFICATION_TOKEN_EXPIRED",
      ),
    );

    renderPage("/verify-email?token=expired-token");

    expect(await screen.findByRole("heading", { name: "Xác thực thất bại" })).toBeTruthy();
    expect(
      await screen.findByText(
        "Liên kết xác thực này đã hết hạn. Hãy yêu cầu email xác thực mới từ trang đăng nhập.",
      ),
    ).toBeTruthy();
    expect(screen.getByRole("link", { name: "Quay lại đăng nhập" }).getAttribute("href")).toBe("/login");
  });
});
