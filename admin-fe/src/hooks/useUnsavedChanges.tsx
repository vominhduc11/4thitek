import { useCallback, useEffect } from "react";
import { useConfirmDialog } from "./useConfirmDialog";
import {
  useDirtyGuard,
  useNavigationGuardBypass,
} from "../context/NavigationGuardContext";

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
 * Guards against losing unsaved form edits. Three layers:
 *   1. central in-app navigation guard — `useDirtyGuard` registers `isDirty`
 *      with `NavigationGuardRoot` (App.tsx), whose `useBlocker` intercepts
 *      Link/sidebar clicks, programmatic `navigate()` and browser back/forward;
 *   2. a `beforeunload` prompt on browser tab close / reload while `isDirty`;
 *   3. `confirmDiscard()` for the page's own Cancel / back controls to `await`
 *      before navigating — once approved, the central guard is bypassed so the
 *      user is not prompted twice for the same exit.
 *
 * After a successful save, `isDirty` becomes false so the guard clears itself
 * before any navigation.
 */
export function useUnsavedChanges(
  isDirty: boolean,
  copy: UnsavedChangesCopy = DEFAULT_COPY,
) {
  const { confirm, confirmDialog } = useConfirmDialog();
  const bypassNextNavigation = useNavigationGuardBypass();

  useDirtyGuard(isDirty);

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
    const approved = await confirm({
      title: copy.title,
      message: copy.message,
      tone: "warning",
      confirmLabel: copy.confirmLabel,
      cancelLabel: copy.cancelLabel,
    });
    if (approved) {
      // Người dùng đã đồng ý bỏ thay đổi — đừng để guard trung tâm hỏi lần nữa.
      bypassNextNavigation();
    }
    return approved;
  }, [
    bypassNextNavigation,
    confirm,
    isDirty,
    copy.title,
    copy.message,
    copy.confirmLabel,
    copy.cancelLabel,
  ]);

  return { confirmDiscard, confirmDialog };
}
