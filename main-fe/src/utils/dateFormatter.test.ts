import { describe, expect, it } from 'vitest';
import { formatDate, formatDateSafe } from './dateFormatter';

describe('dateFormatter', () => {
    it('formats timestamps against the application timezone', () => {
        expect(formatDate('2026-03-13T23:30:00Z', 'vi-VN')).toBe('14/03/2026');
        expect(formatDate('2026-03-13T23:30:00Z', 'en-US')).toBe('03/14/2026');
    });

    it('keeps safe formatting stable before and after hydration', () => {
        expect(formatDateSafe('2026-03-13T23:30:00Z', false, 'vi-VN')).toBe('14/03/2026');
        expect(formatDateSafe('2026-03-13T23:30:00Z', true, 'vi-VN')).toBe('14/03/2026');
    });
});
