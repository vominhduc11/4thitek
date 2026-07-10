// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminTable, type AdminTableColumn } from "./AdminTable";

vi.mock("../context/LanguageContext", () => ({
  useLanguage: () => ({ language: "vi", t: (value: string) => value }),
}));

type Row = { id: number; name: string; qty: number };

const columns: AdminTableColumn<Row>[] = [
  { key: "name", label: "Tên", sortable: true },
  { key: "qty", label: "Số lượng", align: "right", render: (row) => `${row.qty} cái` },
];

const rows: Row[] = [
  { id: 1, name: "Alpha", qty: 2 },
  { id: 2, name: "Beta", qty: 5 },
];

describe("AdminTable", () => {
  afterEach(() => cleanup());

  it("renders rows (desktop + mobile) with rendered cell values", () => {
    render(
      <AdminTable<Row> columns={columns} rows={rows} emptyTitle="trống" emptyMessage="rỗng" />,
    );
    // Desktop + mobile duplicate each label/value.
    expect(screen.getAllByText("Alpha").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2 cái").length).toBeGreaterThan(0);
  });

  it("shows the empty state when there are no rows", () => {
    render(
      <AdminTable<Row> columns={columns} rows={[]} emptyTitle="Không có dữ liệu" emptyMessage="Trống rỗng" />,
    );
    expect(screen.getByText("Không có dữ liệu")).toBeTruthy();
  });

  it("shows the error state with a retry handler", () => {
    const onRetry = vi.fn();
    render(
      <AdminTable<Row>
        columns={columns}
        rows={[]}
        error="lỗi tải"
        onRetry={onRetry}
        emptyTitle="trống"
        emptyMessage="rỗng"
      />,
    );
    const retry = screen.getByRole("button");
    fireEvent.click(retry);
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("renders the first-load skeleton while loading with no rows", () => {
    const { container } = render(
      <AdminTable<Row>
        columns={columns}
        rows={[]}
        isLoading
        emptyTitle="trống"
        emptyMessage="rỗng"
      />,
    );
    expect(container.querySelector('[role="status"]')).toBeTruthy();
  });

  it("emits sort changes toggling asc → desc", () => {
    const onSortChange = vi.fn();
    const { rerender } = render(
      <AdminTable<Row>
        columns={columns}
        rows={rows}
        onSortChange={onSortChange}
        emptyTitle="trống"
        emptyMessage="rỗng"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Tên/ }));
    expect(onSortChange).toHaveBeenLastCalledWith({ key: "name", direction: "asc" });

    rerender(
      <AdminTable<Row>
        columns={columns}
        rows={rows}
        sort={{ key: "name", direction: "asc" }}
        onSortChange={onSortChange}
        emptyTitle="trống"
        emptyMessage="rỗng"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Tên/ }));
    expect(onSortChange).toHaveBeenLastCalledWith({ key: "name", direction: "desc" });
  });

  it("toggles all rows via the header checkbox", () => {
    const onToggleAll = vi.fn();
    render(
      <AdminTable<Row>
        columns={columns}
        rows={rows}
        selection={{
          selectedIds: new Set<number>(),
          onToggle: vi.fn(),
          onToggleAll,
        }}
        emptyTitle="trống"
        emptyMessage="rỗng"
      />,
    );
    fireEvent.click(screen.getByLabelText("Chọn tất cả"));
    expect(onToggleAll).toHaveBeenCalledWith([1, 2]);
  });
});
