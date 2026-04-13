// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ForgotPasswordPage from "./ForgotPasswordPage";

const { requestAdminPasswordResetMock, translateMock, setLanguageMock } = vi.hoisted(() => ({
  requestAdminPasswordResetMock: vi.fn(),
  translateMock: (key: string) => key,
  setLanguageMock: vi.fn(),
}));

vi.mock("../context/LanguageContext", () => ({
  useLanguage: () => ({
    language: "vi",
    setLanguage: setLanguageMock,
    t: translateMock,
  }),
}));

vi.mock("../lib/authApi", () => ({
  requestAdminPasswordReset: requestAdminPasswordResetMock,
}));

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/forgot-password"]}>
      <Routes>
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      </Routes>
    </MemoryRouter>,
  );

describe("ForgotPasswordPage", () => {
  beforeEach(() => {
    requestAdminPasswordResetMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("submits the email and shows the generic success state", async () => {
    requestAdminPasswordResetMock.mockResolvedValue(
      "If the email exists in our system, a password reset link has been sent.",
    );

    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText("admin@example.com"), "ops@example.com");
    await user.click(screen.getByRole("button", { name: "Gửi liên kết đặt lại" }));

    await waitFor(() => {
      expect(requestAdminPasswordResetMock).toHaveBeenCalledWith("ops@example.com");
    });

    expect(
      await screen.findByText("Nếu email tồn tại trong hệ thống, liên kết đặt lại mật khẩu đã được gửi."),
    ).toBeTruthy();
  });

  it("still shows the generic success state when the request fails", async () => {
    requestAdminPasswordResetMock.mockRejectedValue(new Error("Request failed"));

    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByPlaceholderText("admin@example.com"), "missing@example.com");
    await user.click(screen.getByRole("button", { name: "Gửi liên kết đặt lại" }));

    expect(
      await screen.findByText("Nếu email tồn tại trong hệ thống, liên kết đặt lại mật khẩu đã được gửi."),
    ).toBeTruthy();
  });
});
