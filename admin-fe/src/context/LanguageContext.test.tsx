// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LanguageProvider, useLanguage } from "./LanguageContext";

const SettingsTranslationProbe = () => {
  const { t } = useLanguage();

  return (
    <div>
      <p>{t("Cài đặt hệ thống")}</p>
      <p>
        {t(
          "Yêu cầu quản trị viên xác nhận email trước khi hoàn tất đăng nhập.",
        )}
      </p>
      <p>
        {t(
          "Block admin sign-in until the account has an email address and that email has been verified.",
        )}
      </p>
    </div>
  );
};

const renderWithLanguage = (language: "vi" | "en") => {
  window.localStorage.setItem("admin_language", language);

  return render(
    <LanguageProvider>
      <SettingsTranslationProbe />
    </LanguageProvider>,
  );
};

describe("LanguageContext settings translations", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders the admin email confirmation help in Vietnamese without mojibake", () => {
    renderWithLanguage("vi");

    expect(
      screen.getByText(
        "Chặn đăng nhập admin cho đến khi tài khoản có email và email đó đã được xác thực.",
      ),
    ).toBeTruthy();
  });

  it("renders the settings page copy in English when the active language is en", () => {
    renderWithLanguage("en");

    expect(screen.getByText("System settings")).toBeTruthy();
    expect(
      screen.getByText(
        "Require admins to confirm email before sign-in completes.",
      ),
    ).toBeTruthy();
  });
});
