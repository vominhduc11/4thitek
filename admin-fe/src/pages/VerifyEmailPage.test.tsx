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
    expect(
      await screen.findByRole("heading", { name: "Email verified" }),
    ).toBeTruthy();
    expect(
      await screen.findByText("Email verification successful. You can now sign in."),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Continue to sign in" }).getAttribute(
        "href",
      ),
    ).toBe("/login");
  });

  it("shows an expired-token message when verification fails", async () => {
    verifyAdminEmailMock.mockRejectedValue(
      new MockAuthApiError(
        "Email verification token has expired",
        "EMAIL_VERIFICATION_TOKEN_EXPIRED",
      ),
    );

    renderPage("/verify-email?token=expired-token");

    expect(
      await screen.findByRole("heading", { name: "Verification failed" }),
    ).toBeTruthy();
    expect(
      await screen.findByText(
        "This verification link has expired. Request a new verification email from the sign-in page.",
      ),
    ).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Back to sign in" }).getAttribute("href"),
    ).toBe("/login");
  });
});
