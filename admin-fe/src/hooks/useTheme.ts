import { useEffect, useState } from "react";

export const ADMIN_THEME_EVENT = "admin-theme-change";

const getStoredTheme = (): "dark" | "light" | null => {
  if (typeof window === "undefined") return null;
  try {
    const stored = window.localStorage.getItem("theme");
    return stored === "dark" || stored === "light" ? stored : null;
  } catch {
    return null;
  }
};

const getPreferredTheme = (): "dark" | "light" => {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
};

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(
    getStoredTheme() ?? getPreferredTheme(),
  );

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.dispatchEvent(new Event(ADMIN_THEME_EVENT));
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      try {
        window.localStorage.setItem("theme", next);
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  return { theme, toggleTheme } as const;
}
