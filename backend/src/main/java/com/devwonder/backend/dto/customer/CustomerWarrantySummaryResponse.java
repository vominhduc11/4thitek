package com.devwonder.backend.dto.customer;

import com.devwonder.backend.entity.enums.WarrantyStatus;
import java.time.Instant;

public record CustomerWarrantySummaryResponse(
        Long id,
        String productName,
        String productImage,
        String serialNumber,
        WarrantyStatus status,
        Instant warrantyStart,
        Instant warrantyEnd,
        long remainingDays,
        String dealerName
) {
}
