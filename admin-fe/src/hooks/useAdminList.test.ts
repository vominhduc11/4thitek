// @vitest-environment jsdom
import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useAdminList, type AdminListPage } from "./useAdminList";

type Row = { id: number; name: string };

const pageOf = (page: number): AdminListPage<Row> => ({
  items: [{ id: page * 10 + 1, name: `row-${page}` }],
  page,
  totalPages: 3,
  totalElements: 3,
});

describe("useAdminList", () => {
  it("loads the first page and exposes pagination", async () => {
    const fetchPage = vi.fn().mockImplementation(({ page }) => Promise.resolve(pageOf(page)));

    const { result } = renderHook(() =>
      useAdminList<Row>({ fetchPage, pageSize: 25 }),
    );

    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(fetchPage).toHaveBeenCalledWith({ page: 0, size: 25 });
    expect(result.current.items).toEqual([{ id: 1, name: "row-0" }]);
    expect(result.current.pagination).toEqual({
      page: 0,
      totalPages: 3,
      totalItems: 3,
      pageSize: 25,
    });
  });

  it("does not fetch while disabled", async () => {
    const fetchPage = vi.fn().mockResolvedValue(pageOf(0));
    const { result } = renderHook(() => useAdminList<Row>({ fetchPage, enabled: false }));

    await Promise.resolve();
    expect(fetchPage).not.toHaveBeenCalled();
    expect(result.current.status).toBe("idle");
  });

  it("refetches the current page on demand", async () => {
    const fetchPage = vi.fn().mockImplementation(({ page }) => Promise.resolve(pageOf(page)));
    const { result } = renderHook(() => useAdminList<Row>({ fetchPage }));

    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(fetchPage).toHaveBeenCalledTimes(1);

    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => expect(fetchPage).toHaveBeenCalledTimes(2));
  });

  it("exposes setItems for optimistic in-place mutation", async () => {
    const fetchPage = vi.fn().mockImplementation(({ page }) => Promise.resolve(pageOf(page)));
    const { result } = renderHook(() => useAdminList<Row>({ fetchPage }));

    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(result.current.items).toEqual([{ id: 1, name: "row-0" }]);

    act(() => {
      result.current.setItems((current) =>
        current.map((row) => ({ ...row, name: "renamed" })),
      );
    });

    expect(result.current.items).toEqual([{ id: 1, name: "renamed" }]);
    // A local mutation must not trigger a refetch.
    expect(fetchPage).toHaveBeenCalledTimes(1);
  });

  it("reloads from page 0 when resetKey changes, and not when it is unchanged", async () => {
    const fetchPage = vi.fn().mockImplementation(({ page }) => Promise.resolve(pageOf(page)));
    const { result, rerender } = renderHook(
      ({ resetKey }) => useAdminList<Row>({ fetchPage, resetKey }),
      { initialProps: { resetKey: "a" } },
    );

    await waitFor(() => expect(result.current.status).toBe("success"));
    expect(fetchPage).toHaveBeenCalledTimes(1);

    // Move off page 0.
    act(() => result.current.setPage(2));
    await waitFor(() => expect(result.current.pagination.page).toBe(2));

    // Same resetKey across a re-render must NOT trigger a reload.
    const callsBefore = fetchPage.mock.calls.length;
    rerender({ resetKey: "a" });
    await Promise.resolve();
    expect(fetchPage.mock.calls.length).toBe(callsBefore);

    // A changed resetKey reloads from page 0.
    rerender({ resetKey: "b" });
    await waitFor(() => expect(result.current.pagination.page).toBe(0));
    expect(fetchPage).toHaveBeenLastCalledWith({ page: 0, size: 25 });
  });

  it("surfaces the error message and keeps status=error", async () => {
    const fetchPage = vi.fn().mockRejectedValue(new Error("boom"));
    const { result } = renderHook(() =>
      useAdminList<Row>({ fetchPage, fallbackError: "fallback" }),
    );

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error).toBe("boom");
  });

  it("uses the fallback message for non-Error throws", async () => {
    const fetchPage = vi.fn().mockRejectedValue("nope");
    const { result } = renderHook(() =>
      useAdminList<Row>({ fetchPage, fallbackError: "fallback" }),
    );

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error).toBe("fallback");
  });
});
