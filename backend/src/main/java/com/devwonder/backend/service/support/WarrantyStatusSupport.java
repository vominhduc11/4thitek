package com.devwonder.backend.service.support;

import com.devwonder.backend.entity.WarrantyRegistration;
import com.devwonder.backend.entity.enums.WarrantyStatus;
import java.time.Instant;

public final class WarrantyStatusSupport {

    private WarrantyStatusSupport() {
    }

    public static WarrantyStatus resolveEffectiveStatus(WarrantyRegistration registration) {
        if (registration == null) {
            return null;
        }
        return resolveEffectiveStatus(registration.getStatus(), registration.getWarrantyEnd());
    }

    public static WarrantyStatus resolveEffectiveStatus(WarrantyStatus persistedStatus, Instant warrantyEnd) {
        if (persistedStatus == WarrantyStatus.VOID) {
            return WarrantyStatus.VOID;
        }
        if (WarrantyDateSupport.isExpired(warrantyEnd)) {
            return WarrantyStatus.EXPIRED;
        }
        if (persistedStatus == WarrantyStatus.EXPIRED) {
            return WarrantyStatus.EXPIRED;
        }
        return WarrantyStatus.ACTIVE;
    }
}
