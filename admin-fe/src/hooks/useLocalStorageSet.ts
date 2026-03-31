import { useCallback, useState } from "react";

function loadSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? new Set(parsed.filter((item): item is string => typeof item === "string"))
      : new Set();
  } catch {
    return new Set();
  }
}

function writeSet(key: string, ids: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(Array.from(ids)));
  } catch {
    // ignore storage errors
  }
}

export function useLocalStorageSet(key: string) {
  const [values, setValues] = useState<Set<string>>(() => loadSet(key));

  const add = useCallback(
    (id: string) => {
      setValues((current) => {
        const next = new Set(current);
        next.add(id);
        writeSet(key, next);
        return next;
      });
    },
    [key],
  );

  const addAll = useCallback(
    (ids: string[]) => {
      setValues((current) => {
        const next = new Set(current);
        for (const id of ids) next.add(id);
        writeSet(key, next);
        return next;
      });
    },
    [key],
  );

  return { values, add, addAll } as const;
}
