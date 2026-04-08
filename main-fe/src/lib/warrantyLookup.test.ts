import { describe, expect, it } from 'vitest';
import { toWarrantyInfo } from './warrantyLookup';

describe('warrantyLookup', () => {
    it('maps the flat backend payload into UI warranty info', () => {
        const mapped = toWarrantyInfo(
            {
                status: 'ACTIVE',
                productName: 'SCS Pro',
                serialNumber: 'SERIAL-001',
                purchaseDate: '2026-03-01',
                warrantyEndDate: '2027-03-01',
                remainingDays: 321,
                warrantyCode: 'WAR-001'
            },
            'vi'
        );

        expect(mapped).toMatchObject({
            serialNumber: 'SERIAL-001',
            productName: 'SCS Pro',
            warrantyStatus: 'active',
            remainingDays: 321,
            warrantyCode: 'WAR-001'
        });
    });

    it('returns null for invalid lookup payloads instead of throwing', () => {
        const mapped = toWarrantyInfo(
            {
                status: 'invalid',
                productName: null,
                serialNumber: 'SERIAL-404',
                purchaseDate: null,
                warrantyEndDate: null,
                remainingDays: 0,
                warrantyCode: null
            },
            'vi'
        );

        expect(mapped).toBeNull();
    });
});
