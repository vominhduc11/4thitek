import { useEffect, useRef, type RefObject } from "react";

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

const getFocusableElements = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) =>
      !element.hasAttribute("disabled") &&
      element.tabIndex !== -1 &&
      element.getAttribute("aria-hidden") !== "true",
  );

type UseOverlaySurfaceOptions = {
  isOpen: boolean;
  containerRef: RefObject<HTMLElement | null>;
  triggerRef?: RefObject<HTMLElement | null>;
  initialFocusRef?: RefObject<HTMLElement | null>;
  onClose: () => void;
  restoreFocus?: boolean;
};

export function useOverlaySurface({
  isOpen,
  containerRef,
  triggerRef,
  initialFocusRef,
  onClose,
  restoreFocus = true,
}: UseOverlaySurfaceOptions) {
  const closeRef = useRef(onClose);
  const restoreTargetRef = useRef<HTMLElement | null>(null);

  closeRef.current = onClose;

  useEffect(() => {
    if (!isOpen || typeof document === "undefined") {
      return;
    }

    restoreTargetRef.current =
      triggerRef?.current ?? (document.activeElement as HTMLElement | null);

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const focusInitialTarget = () => {
      const nextTarget =
        initialFocusRef?.current ??
        getFocusableElements(container)[0] ??
        container;

      if (document.activeElement !== nextTarget) {
        nextTarget.focus();
      }
    };

    const rafId = window.requestAnimationFrame(focusInitialTarget);

    const handlePointerDown = (event: PointerEvent) => {
      if (!container.contains(event.target as Node)) {
        closeRef.current();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRef.current();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = getFocusableElements(container);
      if (focusable.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (!active || active === first || !container.contains(active)) {
          event.preventDefault();
          last.focus();
        }
        return;
      }

      if (!active || active === last || !container.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      if (!container.contains(event.target as Node)) {
        focusInitialTarget();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("focusin", handleFocusIn);

    return () => {
      window.cancelAnimationFrame(rafId);
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("focusin", handleFocusIn);

      if (!restoreFocus) {
        return;
      }

      const restoreTarget = triggerRef?.current ?? restoreTargetRef.current;
      if (restoreTarget && document.contains(restoreTarget)) {
        window.requestAnimationFrame(() => {
          restoreTarget.focus();
        });
      }
    };
  }, [containerRef, initialFocusRef, isOpen, restoreFocus, triggerRef]);
}
