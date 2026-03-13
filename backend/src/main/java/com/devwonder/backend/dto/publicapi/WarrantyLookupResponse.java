package com.devwonder.backend.dto.publicapi;

import java.time.Instant;
import java.time.LocalDate;

public record WarrantyLookupResponse(
        Long id,
        Long idProductSerial,
        String warrantyCode,
        String status,
        LocalDate purchaseDate,
        Instant warrantyStart,
        Instant warrantyEnd,
        long remainingDays,
        Instant createdAt,
        String customerName,
        WarrantyLookupProductSerialResponse productSerial
) implements java.io.Serializable {
}
