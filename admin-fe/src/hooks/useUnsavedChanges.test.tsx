// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const confirmMock = vi.fn();
vi.mock("./useConfirmDialog", () => ({
  useConfirmDialog: () => ({ confirm: confirmMock, confirmDialog: null }),
}));

import { useUnsavedChanges } from "./useUnsavedChanges";

describe("useUnsavedChanges", () => {
  afterEach(() => {
    confirmMock.mockReset();
  });

  it("registers a beforeunload guard only while dirty", () => {
    const addSpy = vi.spyOn(window, "addEventListener");
    const removeSpy = vi.spyOn(window, "removeEventListener");

    const { rerender, unmount } = renderHook(
      ({ dirty }) => useUnsavedChanges(dirty),
      { initialProps: { dirty: false } },
    );
    expect(addSpy).not.toHaveBeenCalledWith("beforeunload", expect.any(Function));

    rerender({ dirty: true });
    expect(addSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function));

    rerender({ dirty: false });
    expect(removeSpy).toHaveBeenCalledWith("beforeunload", expect.any(Function));

    unmount();
    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  it("confirmDiscard resolves true without prompting when not dirty", async () => {
    const { result } = renderHook(() => useUnsavedChanges(false));
    await expect(result.current.confirmDiscard()).resolves.toBe(true);
    expect(confirmMock).not.toHaveBeenCalled();
  });

  it("confirmDiscard delegates to the confirm dialog when dirty", async () => {
    confirmMock.mockResolvedValue(true);
    const { result } = renderHook(() => useUnsavedChanges(true));
    await expect(result.current.confirmDiscard()).resolves.toBe(true);
    expect(confirmMock).toHaveBeenCalledOnce();
  });
});
