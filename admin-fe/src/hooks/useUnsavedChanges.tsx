import { useCallback, useEffect } from "react";
import { useConfirmDialog } from "./useConfirmDialog";

export type UnsavedChangesCopy = {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
};

const DEFAULT_COPY: UnsavedChangesCopy = {
  title: "Thay đổi chưa lưu",
  message:
    "Bạn có thay đổi chưa được lưu. Rời khỏi trang sẽ làm mất các thay đổi này. Bạn có chắc muốn tiếp tục?",
  confirmLabel: "Rời khỏi",
  cancelLabel: "Ở lại",
};

/**
 * Guards against losing unsaved form edits.
 *
 * NOTE: the app mounts a non-data `<BrowserRouter>`, where react-router's
 * `useBlocker` is unsupported — so this intentionally does NOT intercept in-app
 * `<Link>` / sidebar navigation. It covers the realistic exit vectors:
 *   1. a `beforeunload` prompt on browser tab close / reload while `isDirty`, and
 *   2. `confirmDiscard()` for the page's own Cancel / back controls to `await`
 *      before navigating.
 *
 * After a successful save, `isDirty` becomes false so the guard clears itself
 * before any navigation.
 */
export function useUnsavedChanges(
  isDirty: boolean,
  copy: UnsavedChangesCopy = DEFAULT_COPY,
) {
  const { confirm, confirmDialog } = useConfirmDialog();

  useEffect(() => {
    if (!isDirty) {
      return;
    }
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Legacy browsers require returnValue to be set to trigger the prompt.
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const confirmDiscard = useCallback(async () => {
    if (!isDirty) {
      return true;
    }
    return confirm({
      title: copy.title,
      message: copy.message,
      tone: "warning",
      confirmLabel: copy.confirmLabel,
      cancelLabel: copy.cancelLabel,
    });
  }, [
    confirm,
    isDirty,
    copy.title,
    copy.message,
    copy.confirmLabel,
    copy.cancelLabel,
  ]);

  return { confirmDiscard, confirmDialog };
}
