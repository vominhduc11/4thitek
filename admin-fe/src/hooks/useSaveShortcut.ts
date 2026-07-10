import { useEffect, useRef } from "react";

/**
 * Ctrl/Cmd+S submits the currently open form.
 *
 * Generalizes the ad-hoc keydown handler previously inlined in
 * BlogDetailPageRevamp: gate on `enabled` (e.g. only while editing) and call
 * `onSave` on Ctrl/Cmd+S, preventing the browser's default "save page" dialog.
 */
export function useSaveShortcut(enabled: boolean, onSave: () => void): void {
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const handler = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        !event.altKey &&
        (event.key === "s" || event.key === "S")
      ) {
        event.preventDefault();
        onSaveRef.current();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled]);
}
