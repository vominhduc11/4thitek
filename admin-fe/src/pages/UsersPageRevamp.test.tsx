// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import UsersPageRevamp from "./UsersPageRevamp";

const {
  resetAdminUserPasswordMock,
  notifyMock,
  confirmMock,
  translateMock,
} = vi.hoisted(() => ({
  resetAdminUserPasswordMock: vi.fn(),
  notifyMock: vi.fn(),
  confirmMock: vi.fn(),
  translateMock: (key: string) => key,
}));

vi.mock("../context/AdminDataContext", () => ({
  useAdminData: () => ({
    users: [
      {
        id: "12",
        name: "Support Agent",
        email: "support@example.com",
        role: "Support",
        systemRole: "ADMIN",
        status: "active",
      },
    ],
    usersState: { status: "success" },
    addUser: vi.fn(),
    updateUserStatus: vi.fn(),
    reloadResource: vi.fn(),
  }),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    accessToken: "access-token",
  }),
}));

vi.mock("../context/LanguageContext", () => ({
  useLanguage: () => ({
    t: translateMock,
  }),
}));

vi.mock("../context/ToastContext", () => ({
  useToast: () => ({
    notify: notifyMock,
  }),
}));

vi.mock("../hooks/useConfirmDialog", () => ({
  useConfirmDialog: () => ({
    confirm: confirmMock,
    confirmDialog: null,
  }),
}));

vi.mock("../lib/adminApi", () => ({
  resetAdminUserPassword: resetAdminUserPasswordMock,
}));

describe("UsersPageRevamp", () => {
  beforeEach(() => {
    resetAdminUserPasswordMock.mockReset();
    notifyMock.mockReset();
    confirmMock.mockReset();
    confirmMock.mockResolvedValue(true);
  });

  afterEach(() => {
    cleanup();
  });

  it("shows a generic success message for manual reset without exposing a password", async () => {
    resetAdminUserPasswordMock.mockResolvedValue({ status: "reset_link_sent" });

    const user = userEvent.setup();
    render(<UsersPageRevamp />);

    await user.click(screen.getByRole("button", { name: /đặt lại mật khẩu/i }));

    await waitFor(() => {
      expect(resetAdminUserPasswordMock).toHaveBeenCalledWith("access-token", 12);
    });

    expect(notifyMock).toHaveBeenCalledWith(
      "Đã gửi liên kết đặt lại mật khẩu đến email của tài khoản.",
      expect.objectContaining({ variant: "success" }),
    );
    expect(JSON.stringify(notifyMock.mock.calls)).not.toContain("temporaryPassword");
  });
});
