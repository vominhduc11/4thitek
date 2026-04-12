// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ResetPasswordPage from "./ResetPasswordPage";

const {
  validateAdminPasswordResetTokenMock,
  resetAdminPasswordMock,
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
    validateAdminPasswordResetTokenMock: vi.fn(),
    resetAdminPasswordMock: vi.fn(),
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
  validateAdminPasswordResetToken: validateAdminPasswordResetTokenMock,
  resetAdminPassword: resetAdminPasswordMock,
}));

const renderPage = (entry: string) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Routes>
    </MemoryRouter>,
  );

describe("ResetPasswordPage", () => {
  beforeEach(() => {
    validateAdminPasswordResetTokenMock.mockReset();
    resetAdminPasswordMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("shows the invalid state when the token is missing", async () => {
    renderPage("/reset-password");

    expect(await screen.findByRole("heading", { name: "Liên kết không hợp lệ" })).toBeTruthy();
  });

  it("shows the expired state for an expired token", async () => {
    validateAdminPasswordResetTokenMock.mockResolvedValue({
      valid: false,
      status: "expired",
      message: "Reset link has expired.",
    });

    renderPage("/reset-password?token=expired-token");

    expect(await screen.findByRole("heading", { name: "Liên kết đã hết hạn" })).toBeTruthy();
  });

  it("validates the token and submits a new password successfully", async () => {
    validateAdminPasswordResetTokenMock.mockResolvedValue({
      valid: true,
      status: "valid",
      message: "Reset link is valid.",
    });
    resetAdminPasswordMock.mockResolvedValue("Password reset successful");

    const user = userEvent.setup();
    renderPage("/reset-password?token=valid-token");

    expect(await screen.findByRole("heading", { name: "Đặt mật khẩu mới" })).toBeTruthy();

    await user.type(screen.getByPlaceholderText("Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và số"), "NewPass#456");
    await user.type(screen.getByPlaceholderText("Nhập lại mật khẩu mới"), "NewPass#456");
    await user.click(screen.getByRole("button", { name: "Cập nhật mật khẩu" }));

    await waitFor(() => {
      expect(resetAdminPasswordMock).toHaveBeenCalledWith("valid-token", "NewPass#456");
    });

    expect(await screen.findByRole("heading", { name: "Đặt lại mật khẩu thành công" })).toBeTruthy();
  });

  it("handles invalid tokens returned during submission", async () => {
    validateAdminPasswordResetTokenMock.mockResolvedValue({
      valid: true,
      status: "valid",
      message: "Reset link is valid.",
    });
    resetAdminPasswordMock.mockRejectedValue(
      new MockAuthApiError("Reset token is invalid", "RESET_TOKEN_INVALID"),
    );

    const user = userEvent.setup();
    renderPage("/reset-password?token=bad-token");

    await screen.findByRole("heading", { name: "Đặt mật khẩu mới" });
    await user.type(screen.getByPlaceholderText("Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và số"), "NewPass#456");
    await user.type(screen.getByPlaceholderText("Nhập lại mật khẩu mới"), "NewPass#456");
    await user.click(screen.getByRole("button", { name: "Cập nhật mật khẩu" }));

    expect(await screen.findByRole("heading", { name: "Liên kết không hợp lệ" })).toBeTruthy();
  });
});
