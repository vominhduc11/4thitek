import { describe, expect, it } from 'vitest';
import { formatWarrantyBoundaryDate, formatWarrantyPurchaseDate } from './warrantyDate';

describe('warrantyDate', () => {
    it('formats purchase dates without timezone drift', () => {
        expect(formatWarrantyPurchaseDate('2024-01-01', 'en-US')).toBe('01/01/2024');
        expect(formatWarrantyPurchaseDate('2024-01-01', 'vi-VN')).toBe('01/01/2024');
    });

    it('rejects impossible purchase dates instead of normalizing them', () => {
        expect(() => formatWarrantyPurchaseDate('2024-13-32', 'vi-VN')).toThrow(
            'Invalid warranty purchase date: 2024-13-32'
        );
        expect(() => formatWarrantyPurchaseDate('2024-02-30', 'vi-VN')).toThrow(
            'Invalid warranty purchase date: 2024-02-30'
        );
    });

    it('formats warranty end dates using the application timezone', () => {
        expect(formatWarrantyBoundaryDate('2025-01-01T00:00:00Z', 'en-US')).toBe('01/01/2025');
        expect(formatWarrantyBoundaryDate('2025-01-01T00:00:00Z', 'vi-VN')).toBe('01/01/2025');
    });
});
