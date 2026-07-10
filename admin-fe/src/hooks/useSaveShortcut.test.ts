// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useSaveShortcut } from "./useSaveShortcut";

const pressCtrlS = () =>
  window.dispatchEvent(
    new KeyboardEvent("keydown", { key: "s", ctrlKey: true, cancelable: true }),
  );

describe("useSaveShortcut", () => {
  it("calls onSave on Ctrl/Cmd+S when enabled", () => {
    const onSave = vi.fn();
    renderHook(() => useSaveShortcut(true, onSave));
    pressCtrlS();
    expect(onSave).toHaveBeenCalledOnce();
  });

  it("does nothing when disabled", () => {
    const onSave = vi.fn();
    renderHook(() => useSaveShortcut(false, onSave));
    pressCtrlS();
    expect(onSave).not.toHaveBeenCalled();
  });

  it("ignores a plain 's' without a modifier", () => {
    const onSave = vi.fn();
    renderHook(() => useSaveShortcut(true, onSave));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "s" }));
    expect(onSave).not.toHaveBeenCalled();
  });
});
