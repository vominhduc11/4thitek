import { useEffect, useRef, type RefObject } from "react";

export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  onClickOutside: () => void,
  enabled = true,
) {
  const callbackRef = useRef(onClickOutside);
  callbackRef.current = onClickOutside;

  useEffect(() => {
    if (!enabled) return;

    const handler = (event: Event) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callbackRef.current();
      }
    };

    document.addEventListener("pointerdown", handler, true);
    document.addEventListener("touchstart", handler, true);
    return () => {
      document.removeEventListener("pointerdown", handler, true);
      document.removeEventListener("touchstart", handler, true);
    };
  }, [ref, enabled]);
}
