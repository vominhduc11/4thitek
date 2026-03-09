// Shared helpers for media parsing to avoid duplicated JSON parsing logic across pages

export function parseImageUrl(imageString: string, fallback: string = ''): string {
    if (!imageString) return fallback;

    try {
        const parsed = JSON.parse(imageString) as { imageUrl?: string };
        return parsed?.imageUrl || fallback;
    } catch {
        return fallback;
    }
}

export function parseJsonArray<T>(value: string | T[], fallback: T[] = []): T[] {
    if (Array.isArray(value)) return value;
    if (!value) return fallback;

    try {
        return JSON.parse(value) as T[];
    } catch {
        return fallback;
    }
}
