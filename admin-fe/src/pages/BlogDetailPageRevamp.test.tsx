// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import BlogDetailPageRevamp from "./BlogDetailPageRevamp";

const { previewAdminBlogMock, notifyMock } = vi.hoisted(() => ({
  previewAdminBlogMock: vi.fn(),
  notifyMock: vi.fn(),
}));

vi.mock("../context/AuthContext", () => ({
  useAuth: () => ({ accessToken: "admin-token" }),
}));

vi.mock("../context/LanguageContext", () => ({
  useLanguage: () => ({ language: "vi", t: (value: string) => value }),
}));

vi.mock("../context/ToastContext", () => ({
  useToast: () => ({ notify: notifyMock }),
}));

vi.mock("../hooks/useConfirmDialog", () => ({
  useConfirmDialog: () => ({
    confirm: vi.fn().mockResolvedValue(true),
    prompt: vi.fn().mockResolvedValue(""),
    confirmDialog: null,
    promptDialog: null,
  }),
}));

vi.mock("../lib/admin-api/blogs", async () => {
  const actual = await vi.importActual("../lib/admin-api/blogs");
  return {
    ...actual,
    previewAdminBlog: previewAdminBlogMock,
  };
});

const blogPost = {
  id: "1",
  title: "Hướng dẫn ghép nối SCS S-9",
  category: "Hướng dẫn",
  status: "published",
  updatedAt: "2026-07-01T00:00:00Z",
  excerpt: "Các bước ghép nối intercom SCS S-9 với điện thoại.",
  imageUrl: "/api/v1/media/12/download",
  showOnHomepage: true,
  content: "Nội dung bài viết đầy đủ.",
} as const;

// Giá trị trả về của useAdminData thay đổi được giữa các render — mô phỏng
// context chuyển từ loading sang loaded (kịch bản gây React #310 trước đây).
let adminData: Record<string, unknown>;

vi.mock("../context/AdminDataContext", () => ({
  useAdminData: () => adminData,
}));

function buildAdminData(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    posts: [blogPost],
    postsState: { status: "success", error: null, lastLoadedAt: Date.now() },
    updatePost: vi.fn(),
    updatePostStatus: vi.fn(),
    deletePost: vi.fn(),
    reloadResource: vi.fn(),
    ...overrides,
  };
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={["/blogs/1"]}>
      <Routes>
        <Route path="/blogs/:id" element={<BlogDetailPageRevamp />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("BlogDetailPageRevamp", () => {
  beforeEach(() => {
    notifyMock.mockReset();
    previewAdminBlogMock.mockReset();
    adminData = buildAdminData();
  });

  afterEach(() => {
    cleanup();
  });

  it("hiển thị chi tiết bài viết với record thật", () => {
    renderPage();

    expect(
      screen.getAllByText("Hướng dẫn ghép nối SCS S-9")[0],
    ).toBeTruthy();
  });

  it("không crash khi context chuyển từ loading sang loaded (React #310)", () => {
    adminData = buildAdminData({
      posts: [],
      postsState: { status: "loading", error: null, lastLoadedAt: null },
    });
    const view = renderPage();

    adminData = buildAdminData();
    view.rerender(
      <MemoryRouter initialEntries={["/blogs/1"]}>
        <Routes>
          <Route path="/blogs/:id" element={<BlogDetailPageRevamp />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      screen.getAllByText("Hướng dẫn ghép nối SCS S-9")[0],
    ).toBeTruthy();
  });

  it("hiển thị trạng thái không tìm thấy khi id không tồn tại", () => {
    adminData = buildAdminData({ posts: [] });
    renderPage();

    expect(screen.queryByText("Hướng dẫn ghép nối SCS S-9")).toBeNull();
  });
});
