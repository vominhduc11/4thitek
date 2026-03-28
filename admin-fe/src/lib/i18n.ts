export type TranslateFn = (
  key: string,
  vars?: Record<string, string | number>,
) => string;

export const translateCopy = <T>(value: T, t: TranslateFn): T => {
  if (typeof value === "string") {
    return t(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => translateCopy(entry, t)) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        translateCopy(entry, t),
      ]),
    ) as T;
  }

  return value;
};
