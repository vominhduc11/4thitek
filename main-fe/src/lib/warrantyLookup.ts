import { ERROR_MESSAGES } from '@/constants/warranty';
import { WarrantyCheckData, WarrantyInfo } from '@/types/warranty';
import { formatWarrantyBoundaryDate, formatWarrantyPurchaseDate } from '@/lib/warrantyDate';

const statusMapping: Record<string, WarrantyInfo['warrantyStatus']> = {
    ACTIVE: 'active',
    EXPIRED: 'expired',
    VOID: 'void',
    invalid: 'invalid'
};

export function toWarrantyInfo(apiData: WarrantyCheckData, locale: string): WarrantyInfo | null {
    if (apiData.status === 'invalid') {
        return null;
    }
    if (!apiData.purchaseDate) {
        throw new Error(ERROR_MESSAGES.PURCHASE_DATE_MISSING);
    }
    if (!apiData.warrantyEndDate) {
        throw new Error(ERROR_MESSAGES.WARRANTY_END_MISSING);
    }
    if (!apiData.productName) {
        throw new Error(ERROR_MESSAGES.SERIAL_MISSING);
    }

    return {
        serialNumber: apiData.serialNumber,
        productName: apiData.productName,
        purchaseDate: formatWarrantyPurchaseDate(apiData.purchaseDate, locale),
        warrantyStatus: statusMapping[apiData.status] || 'invalid',
        warrantyEndDate: formatWarrantyBoundaryDate(apiData.warrantyEndDate, locale),
        remainingDays: Math.max(0, apiData.remainingDays ?? 0),
        warrantyCode: apiData.warrantyCode ?? undefined
    };
}
